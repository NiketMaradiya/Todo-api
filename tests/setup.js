const path = require("path");
const fs = require("fs");
const net = require("net");
const { spawn } = require("child_process");

const dotenv = require("dotenv");
const mongoose = require("mongoose");

const todoCache = require("../utils/lfuCache");

// ==========================================
// Load project-root .env
// ==========================================

dotenv.config({
  path: path.join(
    __dirname,
    "..",
    ".env"
  ),
});

// ==========================================
// Test MongoDB Configuration
//
// A separate local MongoDB process is used
// only for Jest transaction tests.
//
// Existing MongoDB Windows service remains
// untouched.
// ==========================================

const TEST_MONGO_PORT = 27018;

const TEST_REPLICA_SET =
  "rs0test";

const TEST_DB_NAME =
  "todo-api-test";

const TEST_MONGO_URI =
  `mongodb://127.0.0.1:${TEST_MONGO_PORT}/${TEST_DB_NAME}?replicaSet=${TEST_REPLICA_SET}`;

const TEST_MONGO_DIRECT_URI =
  `mongodb://127.0.0.1:${TEST_MONGO_PORT}/admin?directConnection=true`;

const MONGOD_PATH =
  "C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe";

const TEST_DB_PATH =
  path.join(
    __dirname,
    ".mongodb-test-data"
  );

const TEST_LOG_PATH =
  path.join(
    TEST_DB_PATH,
    "mongod.log"
  );

let mongodProcess = null;

// ==========================================
// Sleep
// ==========================================

const sleep = (ms) =>
  new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );

// ==========================================
// Check TCP Port
// ==========================================

const isPortOpen = (
  port,
  host = "127.0.0.1"
) => {
  return new Promise(
    (resolve) => {
      const socket =
        new net.Socket();

      socket.setTimeout(500);

      socket.once(
        "connect",
        () => {
          socket.destroy();
          resolve(true);
        }
      );

      socket.once(
        "timeout",
        () => {
          socket.destroy();
          resolve(false);
        }
      );

      socket.once(
        "error",
        () => {
          resolve(false);
        }
      );

      socket.connect(
        port,
        host
      );
    }
  );
};

// ==========================================
// Wait for MongoDB Port
// ==========================================

const waitForMongo = async (
  timeoutMs = 15000
) => {
  const start =
    Date.now();

  while (
    Date.now() -
      start <
    timeoutMs
  ) {
    if (
      await isPortOpen(
        TEST_MONGO_PORT
      )
    ) {
      return true;
    }

    await sleep(250);
  }

  return false;
};

// ==========================================
// Wait for Replica Set Primary
// ==========================================

const waitForPrimary = async (
  connection,
  timeoutMs = 15000
) => {
  const start =
    Date.now();

  while (
    Date.now() -
      start <
    timeoutMs
  ) {
    try {
      const hello =
        await connection.db.admin().command(
          {
            hello: 1,
          }
        );

      if (
        hello.setName ===
          TEST_REPLICA_SET &&
        hello.isWritablePrimary
      ) {
        return true;
      }
    } catch (error) {
      // Replica set may still be starting.
    }

    await sleep(250);
  }

  return false;
};

// ==========================================
// Start Local MongoDB Replica Set
// ==========================================

const startTestMongo = async () => {
  if (!fs.existsSync(MONGOD_PATH)) {
    throw new Error(
      `mongod.exe was not found at:\n${MONGOD_PATH}\n\nUpdate MONGOD_PATH in tests/setup.js to your installed MongoDB Server path.`
    );
  }

  fs.mkdirSync(
    TEST_DB_PATH,
    {
      recursive: true,
    }
  );

  // If something is already running on the
  // test port, use it rather than starting
  // a second process.
  const alreadyRunning =
    await isPortOpen(
      TEST_MONGO_PORT
    );

  if (alreadyRunning) {
    return;
  }

  mongodProcess =
    spawn(
      MONGOD_PATH,
      [
        "--dbpath",
        TEST_DB_PATH,

        "--port",
        String(
          TEST_MONGO_PORT
        ),

        "--bind_ip",
        "127.0.0.1",

        "--replSet",
        TEST_REPLICA_SET,

        "--logpath",
        TEST_LOG_PATH,

        "--logappend",
      ],
      {
        windowsHide: true,

        stdio:
          "ignore",
      }
    );

  mongodProcess.on(
    "error",
    (error) => {
      console.error(
        "Test mongod process error:",
        error
      );
    }
  );

  const started =
    await waitForMongo(
      15000
    );

  if (!started) {
    throw new Error(
      `Test MongoDB did not start on port ${TEST_MONGO_PORT}.\nCheck:\n${TEST_LOG_PATH}`
    );
  }
};

// ==========================================
// Initialize Replica Set
// ==========================================

const initializeReplicaSet =
  async () => {
    const directConnection =
      await mongoose.createConnection(
        TEST_MONGO_DIRECT_URI,
        {
          serverSelectionTimeoutMS: 5000,
        }
      ).asPromise();

    try {
      const admin =
        directConnection.db.admin();

      const hello =
        await admin.command({
          hello: 1,
        });

      // Already running as a replica set.
      if (
        hello.setName ===
        TEST_REPLICA_SET
      ) {
        return;
      }

      try {
        await admin.command({
          replSetInitiate: {
            _id:
              TEST_REPLICA_SET,

            members: [
              {
                _id: 0,

                host:
                  `127.0.0.1:${TEST_MONGO_PORT}`,
              },
            ],
          },
        });
      } catch (error) {
        // "already initialized" is safe.
        if (
          !String(
            error.message
          ).toLowerCase()
            .includes(
              "already initialized"
            )
        ) {
          throw error;
        }
      }
    } finally {
      await directConnection.close();
    }

    // Wait for the PRIMARY state.
    const replicaConnection =
      await mongoose.createConnection(
        TEST_MONGO_URI,
        {
          serverSelectionTimeoutMS: 5000,

          directConnection:
            false,

          replicaSet:
            TEST_REPLICA_SET,
        }
      ).asPromise();

    const primaryReady =
      await waitForPrimary(
        replicaConnection
      );

    await replicaConnection.close();

    if (!primaryReady) {
      throw new Error(
        "Test MongoDB replica set did not become PRIMARY"
      );
    }
  };

// ==========================================
// Connect Mongoose to Test Replica Set
// ==========================================

const connectTestDatabase =
  async () => {
    // Make all application code and tests
    // use the isolated replica-set database.
    process.env.MONGO_URI =
      TEST_MONGO_URI;

    if (
      mongoose.connection.readyState !==
      0
    ) {
      await mongoose.connection.close();
    }

    await mongoose.connect(
      TEST_MONGO_URI,
      {
        serverSelectionTimeoutMS: 10000,

        replicaSet:
          TEST_REPLICA_SET,
      }
    );

    const hello =
      await mongoose.connection.db
        .admin()
        .command({
          hello: 1,
        });

    if (
      hello.setName !==
      TEST_REPLICA_SET
    ) {
      throw new Error(
        `Test MongoDB is not running as replica set ${TEST_REPLICA_SET}`
      );
    }

    if (
      !hello.isWritablePrimary
    ) {
      throw new Error(
        "Test MongoDB replica set is not PRIMARY"
      );
    }

    console.log(
      `✅ Test MongoDB replica set connected: ${TEST_MONGO_URI}`
    );
  };

// ==========================================
// Connect MongoDB Before Tests
// ==========================================

beforeAll(
  async () => {
    // Clear application cache.
    try {
      todoCache.clear();
    } catch (error) {
      // Cache cleanup must not prevent tests.
    }

    await startTestMongo();

    await initializeReplicaSet();

    await connectTestDatabase();
  },
  30000
);

// ==========================================
// Clear LFU Cache Before Each Test
// ==========================================

beforeEach(() => {
  try {
    todoCache.clear();
  } catch (error) {
    // Cache failure must never break tests.
  }
});

// ==========================================
// Close MongoDB After Tests
// ==========================================

afterAll(
  async () => {
    try {
      todoCache.clear();
    } catch (error) {
      // Ignore cache cleanup errors.
    }

    if (
      mongoose.connection.readyState !==
      0
    ) {
      await mongoose.connection.close();
    }

    // Stop only the temporary test mongod.
    // The normal Windows MongoDB service is
    // not touched.
    if (
      mongodProcess &&
      !mongodProcess.killed
    ) {
      mongodProcess.kill();
      mongodProcess =
        null;
    }
  },
  30000
);