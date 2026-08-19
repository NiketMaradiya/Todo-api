require("dotenv").config();

const express =
  require("express");

const cors =
  require("cors");

const connectDB =
  require("./config/db");

const {
  setupSwagger,
} = require("./config/swagger");

const {
  validateEncryptionKey,
} = require(
  "./utils/encryptionService"
);

const {
  startTrashCleanup,
} = require(
  "./utils/trashCleanupService"
);

// ==========================================
// Custom In-Memory LFU Cache
// ==========================================
//
// The cache is created from:
// CACHE_MAX_SIZE
// CACHE_TTL
//
// Cache data exists only in Node.js memory.
//
// Server restart automatically clears it.
// ==========================================

const todoCache =
  require("./utils/lfuCache");

// ==========================================
// Routes
// ==========================================

const authRoutes =
  require("./routes/authRoutes");

const todoRoutes =
  require("./routes/todoRoutes");

const adminRoutes =
  require("./routes/adminRoutes");

const notificationRoutes =
  require(
    "./routes/notificationRoutes"
  );

// ==========================================
// Error Middleware
// ==========================================

const {
  notFound,
  errorHandler,
} = require(
  "./middleware/errorMiddleware"
);

// ==========================================
// Express App
// ==========================================

const app =
  express();

// ==========================================
// Global Middleware
// ==========================================

app.use(
  cors()
);

app.use(
  express.json()
);

// ==========================================
// Swagger API Documentation
// ==========================================

setupSwagger(
  app
);

// ==========================================
// Routes
// ==========================================

// ------------------------------------------
// Authentication
// ------------------------------------------

app.use(
  "/api/auth",
  authRoutes
);

// ------------------------------------------
// Todos
//
// Includes:
// - Todo CRUD
// - Todo list LFU cache
// - Comments
// - Attachments
// - Status
// - Activity / Audit Log
// ------------------------------------------

app.use(
  "/api/todos",
  todoRoutes
);

// ------------------------------------------
// Admin
// ------------------------------------------

app.use(
  "/api/admin",
  adminRoutes
);

// ------------------------------------------
// Notifications
// ------------------------------------------

app.use(
  "/api/notifications",
  notificationRoutes
);

// ==========================================
// Health Check
// ==========================================

app.get(
  "/",
  (req, res) => {
    return res
      .status(200)
      .json({
        success: true,

        message:
          "Todo API is running",
      });
  }
);

// ==========================================
// Cache Statistics
// ==========================================
//
// This endpoint is intentionally simple and
// useful during local testing.
//
// GET /api/cache/stats
//
// It shows:
// - current cache size
// - maximum cache size
// - TTL
// - cache keys
// - frequency
//
// No database is queried.
//
// NOTE:
// This endpoint is kept disabled by default.
// Set CACHE_DEBUG=true in .env if you want
// to expose it for testing.
//
// ==========================================

if (
  process.env.CACHE_DEBUG ===
  "true"
) {
  app.get(
    "/api/cache/stats",
    (req, res) => {
      try {
        return res
          .status(200)
          .json({
            success: true,

            cache:
              todoCache.stats(),
          });
      } catch (error) {
        return res
          .status(200)
          .json({
            success: false,

            message:
              "Unable to read cache statistics",

            cache: {
              size: 0,
              maxSize:
                Number(
                  process.env
                    .CACHE_MAX_SIZE
                ) || 100,

              ttl:
                Number(
                  process.env
                    .CACHE_TTL
                ) || 60000,

              entries: [],
            },
          });
      }
    }
  );
}

// ==========================================
// 404 Handler
// ==========================================

app.use(
  notFound
);

// ==========================================
// Global Error Handler
// ==========================================

app.use(
  errorHandler
);

// ==========================================
// Periodic Cache Cleanup
// ==========================================
//
// TTL entries are checked on GET/SET, but this
// interval also removes expired entries that
// are no longer being requested.
//
// Cleanup does NOT affect API behavior.
//
// The cache itself remains in-memory.
// No Redis or external service is used.
// ==========================================

const cacheCleanupInterval =
  setInterval(
    () => {
      try {
        todoCache.cleanupExpired();
      } catch (error) {
        // Cache cleanup failure must never
        // terminate the Node.js application.
      }
    },

    Math.max(
      Number(
        process.env.CACHE_TTL
      ) || 60000,

      1000
    )
  );

// ==========================================
// Do Not Keep Node Process Alive Only
// Because of Cache Cleanup Timer
// ==========================================

if (
  cacheCleanupInterval &&
  typeof cacheCleanupInterval.unref ===
    "function"
) {
  cacheCleanupInterval.unref();
}

// ==========================================
// Start Server
// ==========================================

if (
  require.main === module
) {
  const PORT =
    process.env.PORT ||
    5000;

  // ========================================
  // Validate Encryption Key
  // ========================================

  try {
    validateEncryptionKey();

    console.log(
      "✅ Configuration encryption key verified"
    );
  } catch (error) {
    console.error(
      "❌ Configuration encryption key validation failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }

  // ========================================
  // Display Cache Configuration
  // ========================================

  console.log(
    "=========================================="
  );

  console.log(
    "In-Memory LFU Cache Configuration"
  );

  console.log(
    "=========================================="
  );

  console.log(
    `Maximum entries: ${
      Number(
        process.env.CACHE_MAX_SIZE
      ) || 100
    }`
  );

  console.log(
    `TTL: ${
      Number(
        process.env.CACHE_TTL
      ) || 60000
    } ms`
  );

  console.log(
    "Eviction: LFU"
  );

  console.log(
    "Storage: Node.js application memory"
  );

  console.log(
    "=========================================="
  );

  // ========================================
  // Connect MongoDB
  // ========================================

  connectDB()
    .then(() => {
      // ======================================
      // Start automatic Trash cleanup
      //
      // Default:
      // 30 days
      //
      // Controlled by:
      // TRASH_RETENTION_DAYS
      // ======================================

      startTrashCleanup();

      // ======================================
      // Start Express Server
      // ======================================

      app.listen(
        PORT,
        () => {
          console.log(
            `Server running on port ${PORT}`
          );
        }
      );
    })
    .catch(
      (error) => {
        console.error(
          "Server startup failed:"
        );

        console.error(
          error.message
        );

        process.exit(1);
      }
    );
}

// ==========================================
// Export App
// ==========================================

module.exports =
  app;