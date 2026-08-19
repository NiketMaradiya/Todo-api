const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const Todo = require("../models/Todo");
const User = require("../models/User");
const TodoActivity = require("../models/TodoActivity");

const todoCache =
  require("../utils/lfuCache");

describe(
  "Todo Assignment, Visibility and Audit Compatibility API",
  () => {
    let userAToken;
    let userBToken;
    let userCToken;

    let userAId;
    let userBId;
    let userCId;

    let todo1Id;
    let todo2Id;

    // ==========================================
    // TEST EMAILS FROM .ENV
    // ==========================================

    const userAEmail =
      process.env.TEST_EMAIL_A;

    const userBEmail =
      process.env.TEST_EMAIL_B;

    const userCEmail =
      process.env.TEST_EMAIL_C;

    const testPassword =
      "password123";

    // ==========================================
    // Validate test emails
    // ==========================================

    if (
      !userAEmail ||
      !userBEmail ||
      !userCEmail
    ) {
      throw new Error(
        "TEST_EMAIL_A, TEST_EMAIL_B and TEST_EMAIL_C must be defined in .env"
      );
    }

    // ==========================================
    // SETUP
    // ==========================================

    beforeAll(
      async () => {
        todoCache.clear();

        await TodoActivity.deleteMany({});
        await Todo.deleteMany({});

        await User.deleteMany({
          email: {
            $in: [
              userAEmail,
              userBEmail,
              userCEmail,
            ],
          },
        });

        // ==========================================
        // CREATE USER A
        // ==========================================

        const userA =
          await User.create({
            name:
              "Todo User A",

            email:
              userAEmail,

            password:
              testPassword,

            role:
              "user",

            isActive:
              true,

            mustChangePassword:
              false,

            passwordChangedAt:
              new Date(),
          });

        userAId =
          userA._id.toString();

        // ==========================================
        // CREATE USER B
        // ==========================================

        const userB =
          await User.create({
            name:
              "Todo User B",

            email:
              userBEmail,

            password:
              testPassword,

            role:
              "user",

            isActive:
              true,

            mustChangePassword:
              false,

            passwordChangedAt:
              new Date(),
          });

        userBId =
          userB._id.toString();

        // ==========================================
        // CREATE USER C
        // ==========================================

        const userC =
          await User.create({
            name:
              "Todo User C",

            email:
              userCEmail,

            password:
              testPassword,

            role:
              "user",

            isActive:
              true,

            mustChangePassword:
              false,

            passwordChangedAt:
              new Date(),
          });

        userCId =
          userC._id.toString();

        // ==========================================
        // LOGIN USER A
        // ==========================================

        const loginA =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                userAEmail,

              password:
                testPassword,
            });

        expect(
          loginA.statusCode
        ).toBe(200);

        expect(
          loginA.body.token
        ).toBeDefined();

        userAToken =
          loginA.body.token;

        // ==========================================
        // LOGIN USER B
        // ==========================================

        const loginB =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                userBEmail,

              password:
                testPassword,
            });

        expect(
          loginB.statusCode
        ).toBe(200);

        expect(
          loginB.body.token
        ).toBeDefined();

        userBToken =
          loginB.body.token;

        // ==========================================
        // LOGIN USER C
        // ==========================================

        const loginC =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                userCEmail,

              password:
                testPassword,
            });

        expect(
          loginC.statusCode
        ).toBe(200);

        expect(
          loginC.body.token
        ).toBeDefined();

        userCToken =
          loginC.body.token;
      },
      30000
    );

    // ==========================================
    // CACHE RESET
    // ==========================================

    beforeEach(() => {
      todoCache.clear();
    });

    // ==========================================
    // CLEANUP
    // ==========================================

    afterAll(
      async () => {
        todoCache.clear();

        await TodoActivity.deleteMany({});
        await Todo.deleteMany({});

        await User.deleteMany({
          email: {
            $in: [
              userAEmail,
              userBEmail,
              userCEmail,
            ],
          },
        });

        if (
          mongoose.connection
            .readyState !== 0
        ) {
          await mongoose.connection.close();
        }
      },
      30000
    );

    // ==========================================
    // CREATE TODO 1
    // ==========================================

    test(
      "User A should create Todo 1 assigned to User B",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              title:
                "Todo 1",

              description:
                "Created by User A",

              assignedTo:
                userBId,

              status:
                "pending",

              priority:
                "medium",
            });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data.title
        ).toBe(
          "Todo 1"
        );

        todo1Id =
          response.body.data._id;
      }
    );

    // ==========================================
    // CREATE TODO 2
    // ==========================================

    test(
      "User A should create Todo 2 assigned to User C",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              title:
                "Todo 2",

              description:
                "Created by User A for User C",

              assignedTo:
                userCId,

              status:
                "pending",

              priority:
                "high",
            });

        expect(
          response.statusCode
        ).toBe(201);

        todo2Id =
          response.body.data._id;
      }
    );

    // ==========================================
    // CACHE MISS
    // ==========================================

    test(
      "GET /api/todos should populate cache on cache miss",
      async () => {
        const before =
          todoCache.stats();

        expect(
          before.size
        ).toBe(0);

        const response =
          await request(app)
            .get(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          todoCache.size()
        ).toBeGreaterThan(0);
      }
    );

    // ==========================================
    // CACHE HIT
    // ==========================================

    test(
      "GET /api/todos should return cached data on cache hit",
      async () => {
        const first =
          await request(app)
            .get(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        expect(
          first.statusCode
        ).toBe(200);

        const before =
          todoCache.stats();

        const entry =
          before.entries.find(
            (item) =>
              item.key.startsWith(
                "todos:"
              )
          );

        expect(
          entry
        ).toBeDefined();

        const frequency =
          entry.frequency;

        const second =
          await request(app)
            .get(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        expect(
          second.statusCode
        ).toBe(200);

        const after =
          todoCache.stats();

        const updated =
          after.entries.find(
            (item) =>
              item.key ===
              entry.key
          );

        expect(
          updated.frequency
        ).toBe(
          frequency + 1
        );
      }
    );

    // ==========================================
    // DIFFERENT USERS
    // ==========================================

    test(
      "different users should have separate cache entries",
      async () => {
        await request(app)
          .get(
            "/api/todos"
          )
          .set(
            "Authorization",
            `Bearer ${userAToken}`
          );

        await request(app)
          .get(
            "/api/todos"
          )
          .set(
            "Authorization",
            `Bearer ${userBToken}`
          );

        const keys =
          todoCache
            .stats()
            .entries
            .map(
              (entry) =>
                entry.key
            );

        expect(
          keys.some(
            (key) =>
              key.includes(
                `userId:${userAId}`
              )
          )
        ).toBe(true);

        expect(
          keys.some(
            (key) =>
              key.includes(
                `userId:${userBId}`
              )
          )
        ).toBe(true);
      }
    );

    // ==========================================
    // DIFFERENT QUERY PARAMETERS
    // ==========================================

    test(
      "different query parameters should create different cache entries",
      async () => {
        const pending =
          await request(app)
            .get(
              "/api/todos?status=pending&page=1&limit=10"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        const completed =
          await request(app)
            .get(
              "/api/todos?status=completed&page=1&limit=10"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        expect(
          pending.statusCode
        ).toBe(200);

        expect(
          completed.statusCode
        ).toBe(200);

        const entries =
          todoCache
            .stats()
            .entries
            .filter(
              (entry) =>
                entry.key.includes(
                  `userId:${userAId}`
                )
            );

        expect(
          entries.length
        ).toBeGreaterThanOrEqual(
          2
        );
      }
    );

    // ==========================================
    // CREATE INVALIDATES CACHE
    // ==========================================

    test(
      "creating a Todo should invalidate Todo list cache",
      async () => {
        await request(app)
          .get(
            "/api/todos"
          )
          .set(
            "Authorization",
            `Bearer ${userAToken}`
          );

        expect(
          todoCache.size()
        ).toBeGreaterThan(0);

        const response =
          await request(app)
            .post(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              title:
                "Cache Invalidation Todo",

              description:
                "Created for cache test",

              assignedTo:
                userBId,

              status:
                "pending",

              priority:
                "low",
            });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          todoCache.size()
        ).toBe(0);
      }
    );

    // ==========================================
    // UPDATE INVALIDATES CACHE
    // ==========================================

    test(
      "updating a Todo should invalidate Todo list cache",
      async () => {
        await request(app)
          .get(
            "/api/todos"
          )
          .set(
            "Authorization",
            `Bearer ${userAToken}`
          );

        expect(
          todoCache.size()
        ).toBeGreaterThan(0);

        const response =
          await request(app)
            .put(
              `/api/todos/${todo1Id}`
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              title:
                "Updated Todo 1",
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          todoCache.size()
        ).toBe(0);
      }
    );

    // ==========================================
    // STATUS INVALIDATES CACHE
    // ==========================================

    test(
      "changing Todo status should invalidate Todo list cache",
      async () => {
        await request(app)
          .get(
            "/api/todos"
          )
          .set(
            "Authorization",
            `Bearer ${userAToken}`
          );

        expect(
          todoCache.size()
        ).toBeGreaterThan(0);

        const response =
          await request(app)
            .patch(
              `/api/todos/${todo1Id}/status`
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              status:
                "completed",
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          todoCache.size()
        ).toBe(0);
      }
    );

    // ==========================================
    // DELETE INVALIDATES CACHE
    // ==========================================

    test(
      "deleting a Todo should invalidate Todo list cache",
      async () => {
        await request(app)
          .get(
            "/api/todos"
          )
          .set(
            "Authorization",
            `Bearer ${userAToken}`
          );

        expect(
          todoCache.size()
        ).toBeGreaterThan(0);

        const response =
          await request(app)
            .delete(
              `/api/todos/${todo2Id}`
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          todoCache.size()
        ).toBe(0);
      }
    );

    // ==========================================
    // LFU MAX SIZE
    // ==========================================

    test(
      "LFU cache should respect CACHE_MAX_SIZE",
      async () => {
        const oldMax =
          todoCache.maxSize;

        todoCache.clear();

        todoCache.maxSize =
          3;

        todoCache.set(
          "A",
          "A"
        );

        todoCache.set(
          "B",
          "B"
        );

        todoCache.set(
          "C",
          "C"
        );

        todoCache.set(
          "D",
          "D"
        );

        expect(
          todoCache.size()
        ).toBe(3);

        todoCache.maxSize =
          oldMax;
      }
    );

    // ==========================================
    // LFU EVICTION
    // ==========================================

    test(
      "LFU should remove the least frequently used entry",
      async () => {
        const oldMax =
          todoCache.maxSize;

        todoCache.clear();

        todoCache.maxSize =
          3;

        todoCache.set(
          "A",
          "Data A"
        );

        todoCache.set(
          "B",
          "Data B"
        );

        todoCache.set(
          "C",
          "Data C"
        );

        for (
          let i = 0;
          i < 10;
          i++
        ) {
          todoCache.get("A");
        }

        for (
          let i = 0;
          i < 5;
          i++
        ) {
          todoCache.get("B");
        }

        todoCache.get("C");

        todoCache.set(
          "D",
          "Data D"
        );

        expect(
          todoCache.get("A")
        ).toBe(
          "Data A"
        );

        expect(
          todoCache.get("B")
        ).toBe(
          "Data B"
        );

        expect(
          todoCache.get("C")
        ).toBeNull();

        expect(
          todoCache.get("D")
        ).toBe(
          "Data D"
        );

        todoCache.maxSize =
          oldMax;
      }
    );

    // ==========================================
    // TTL
    // ==========================================

    test(
      "TTL expiration should remove expired cache data",
      async () => {
        const oldTTL =
          todoCache.ttl;

        todoCache.clear();

        todoCache.ttl =
          30;

        todoCache.set(
          "ttl:key",
          "data"
        );

        expect(
          todoCache.get(
            "ttl:key"
          )
        ).toBe(
          "data"
        );

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              60
            )
        );

        expect(
          todoCache.get(
            "ttl:key"
          )
        ).toBeNull();

        todoCache.ttl =
          oldTTL;
      }
    );

    // ==========================================
    // DELETE CACHE ITEM
    // ==========================================

    test(
      "cache entry should be manually deletable",
      async () => {
        todoCache.set(
          "delete:key",
          "data"
        );

        expect(
          todoCache.has(
            "delete:key"
          )
        ).toBe(true);

        expect(
          todoCache.delete(
            "delete:key"
          )
        ).toBe(true);

        expect(
          todoCache.has(
            "delete:key"
          )
        ).toBe(false);
      }
    );

    // ==========================================
    // CACHE PREFIX INVALIDATION
    // ==========================================

    test(
      "Todo cache prefix invalidation should remove Todo entries",
      async () => {
        todoCache.set(
          "todos:user1:page1",
          "A"
        );

        todoCache.set(
          "todos:user2:page1",
          "B"
        );

        todoCache.set(
          "other:key",
          "C"
        );

        const removed =
          todoCache.invalidateTodos();

        expect(
          removed
        ).toBe(2);

        expect(
          todoCache.get(
            "todos:user1:page1"
          )
        ).toBeNull();

        expect(
          todoCache.get(
            "todos:user2:page1"
          )
        ).toBeNull();

        expect(
          todoCache.get(
            "other:key"
          )
        ).toBe(
          "C"
        );
      }
    );

    // ==========================================
    // USER B VISIBILITY
    // ==========================================

    test(
      "User B should see Todo 1 because it is assigned to User B",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userBToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        const ids =
          response.body.data.map(
            (todo) =>
              todo._id
          );

        expect(
          ids.includes(
            todo1Id
          )
        ).toBe(true);
      }
    );

    // ==========================================
    // USER ISOLATION
    // ==========================================

    test(
      "User B should not receive User C only data",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userBToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        for (
          const todo of
          response.body.data
        ) {
          const createdBy =
            todo.createdBy?._id ||
            todo.createdBy;

          const assignedTo =
            todo.assignedTo?._id ||
            todo.assignedTo;

          expect(
            createdBy ===
              userBId ||
            assignedTo ===
              userBId
          ).toBe(true);
        }
      }
    );

    // ==========================================
    // GET SINGLE TODO
    // ==========================================

    test(
      "User A should get Todo 1",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/todos/${todo1Id}`
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data._id
        ).toBe(
          todo1Id
        );
      }
    );

    // ==========================================
    // SEARCH
    // ==========================================

    test(
      "Todo search should return matching Todo",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/todos?search=Todo%201"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          Array.isArray(
            response.body.data
          )
        ).toBe(true);
      }
    );

    // ==========================================
    // STATUS FILTER
    // ==========================================

    test(
      "Todo status filter should work",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/todos?status=pending"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        for (
          const todo of
          response.body.data
        ) {
          expect(
            todo.status
          ).toBe(
            "pending"
          );
        }
      }
    );

    // ==========================================
    // PRIORITY FILTER
    // ==========================================

    test(
      "Todo priority filter should work",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/todos?priority=high"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        for (
          const todo of
          response.body.data
        ) {
          expect(
            todo.priority
          ).toBe(
            "high"
          );
        }
      }
    );

    // ==========================================
    // UPDATE TODO
    // ==========================================

    test(
      "User A should update Todo 1",
      async () => {
        const response =
          await request(app)
            .put(
              `/api/todos/${todo1Id}`
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              title:
                "Todo 1 Updated",
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data.title
        ).toBe(
          "Todo 1 Updated"
        );
      }
    );

    // ==========================================
    // UPDATE PRIORITY
    // ==========================================

    test(
      "User A should update Todo 1 priority",
      async () => {
        const response =
          await request(app)
            .put(
              `/api/todos/${todo1Id}`
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              priority:
                "high",
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data.priority
        ).toBe(
          "high"
        );
      }
    );

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    test(
      "User A should update Todo 1 status",
      async () => {
        const response =
          await request(app)
            .patch(
              `/api/todos/${todo1Id}/status`
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              status:
                "completed",
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data.status
        ).toBe(
          "completed"
        );
      }
    );

    // ==========================================
    // REASSIGN
    // ==========================================

    test(
      "User A should reassign Todo 1 to User C",
      async () => {
        const response =
          await request(app)
            .put(
              `/api/todos/${todo1Id}`
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              assignedTo:
                userCId,
            });

        expect(
          response.statusCode
        ).toBe(200);

        const assignedTo =
          response.body.data
            .assignedTo;

        const assignedToId =
          assignedTo?._id ||
          assignedTo;

        expect(
          assignedToId
        ).toBe(
          userCId
        );
      }
    );

    // ==========================================
    // COMMENT
    // ==========================================

    test(
      "User C should add a comment to Todo 1",
      async () => {
        const response =
          await request(app)
            .post(
              `/api/todos/${todo1Id}/comments`
            )
            .set(
              "Authorization",
              `Bearer ${userCToken}`
            )
            .send({
              comment:
                "Audit compatible comment",
            });

        expect(
          response.statusCode
        ).toBe(201);
      }
    );

    // ==========================================
    // GET COMMENTS
    // ==========================================

    test(
      "User C should get Todo comments",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/todos/${todo1Id}/comments`
            )
            .set(
              "Authorization",
              `Bearer ${userCToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          Array.isArray(
            response.body.data
          )
        ).toBe(true);
      }
    );

    // ==========================================
    // ACTIVITY
    // ==========================================

    test(
      "Todo activity should be visible to an authorized user",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/todos/${todo1Id}/activity`
            )
            .set(
              "Authorization",
              `Bearer ${userCToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          Array.isArray(
            response.body.data
          )
        ).toBe(true);
      }
    );

    // ==========================================
    // ACTIVITY ORDER
    // ==========================================

    test(
      "Todo activity should be newest first",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/todos/${todo1Id}/activity`
            )
            .set(
              "Authorization",
              `Bearer ${userCToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        const activities =
          response.body.data;

        for (
          let i = 0;
          i <
          activities.length - 1;
          i++
        ) {
          const current =
            new Date(
              activities[i]
                .createdAt
            ).getTime();

          const next =
            new Date(
              activities[
                i + 1
              ].createdAt
            ).getTime();

          expect(
            current
          ).toBeGreaterThanOrEqual(
            next
          );
        }
      }
    );

    // ==========================================
    // STATS
    // ==========================================

    test(
      "User C should get Todo statistics",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/todos/stats"
            )
            .set(
              "Authorization",
              `Bearer ${userCToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data.total
        ).toBeDefined();
      }
    );

    // ==========================================
    // FINAL DELETE
    // ==========================================

    test(
      "User A should delete a Todo because User A created it",
      async () => {
        const createResponse =
          await request(app)
            .post(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              title:
                "Todo Delete Final Test",

              description:
                "Fresh Todo for delete test",

              assignedTo:
                userBId,

              status:
                "pending",

              priority:
                "medium",
            });

        expect(
          createResponse.statusCode
        ).toBe(201);

        const deleteTodoId =
          createResponse.body.data._id;

        await request(app)
          .get(
            "/api/todos"
          )
          .set(
            "Authorization",
            `Bearer ${userAToken}`
          );

        expect(
          todoCache.size()
        ).toBeGreaterThan(0);

        const response =
          await request(app)
            .delete(
              `/api/todos/${deleteTodoId}`
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          todoCache.size()
        ).toBe(0);
      }
    );
  }
);