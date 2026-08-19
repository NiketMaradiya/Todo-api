const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const User = require("../models/User");
const Todo = require("../models/Todo");
const TodoActivity = require("../models/TodoActivity");

const todoCache =
  require("../utils/lfuCache");

describe(
  "Admin Role and Todo Authorization API",
  () => {
    let userToken;
    let secondUserToken;
    let adminToken;

    let normalUserId;
    let secondUserId;
    let adminUserId;

    let todoId;

    // ==========================================
    // TEST EMAILS FROM .ENV
    // ==========================================

    const normalUserEmail =
      process.env.TEST_EMAIL_A;

    const secondUserEmail =
      process.env.TEST_EMAIL_B;

    const adminUserEmail =
      process.env.TEST_EMAIL_ADMIN;

    const testPassword =
      "password123";

    // ==========================================
    // VALIDATE TEST EMAILS
    // ==========================================

    if (
      !normalUserEmail ||
      !secondUserEmail ||
      !adminUserEmail
    ) {
      throw new Error(
        "TEST_EMAIL_A, TEST_EMAIL_B and TEST_EMAIL_ADMIN must be defined in .env"
      );
    }

    // ==========================================
    // SETUP
    // ==========================================

    beforeAll(
      async () => {
        todoCache.clear();

        // ========================================
        // CLEAN OLD TEST DATA
        // ========================================

        await TodoActivity.deleteMany({});
        await Todo.deleteMany({});

        await User.deleteMany({
          email: {
            $in: [
              normalUserEmail,
              secondUserEmail,
              adminUserEmail,
            ],
          },
        });

        // ========================================
        // CREATE NORMAL USER
        // ========================================

        const normalUser =
          await User.create({
            name:
              "Admin Test User",

            email:
              normalUserEmail,

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

        normalUserId =
          normalUser._id.toString();

        // ========================================
        // CREATE SECOND USER
        // ========================================

        const secondUser =
          await User.create({
            name:
              "Admin Test Second User",

            email:
              secondUserEmail,

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

        secondUserId =
          secondUser._id.toString();

        // ========================================
        // CREATE ADMIN USER
        // ========================================

        const adminUser =
          await User.create({
            name:
              "Admin Test Admin",

            email:
              adminUserEmail,

            password:
              testPassword,

            role:
              "admin",

            isActive:
              true,

            mustChangePassword:
              false,

            passwordChangedAt:
              new Date(),
          });

        adminUserId =
          adminUser._id.toString();

        // ========================================
        // LOGIN NORMAL USER
        // ========================================

        const normalLogin =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                normalUserEmail,

              password:
                testPassword,
            });

        expect(
          normalLogin.statusCode
        ).toBe(200);

        expect(
          normalLogin.body.token
        ).toBeDefined();

        userToken =
          normalLogin.body.token;

        // ========================================
        // LOGIN SECOND USER
        // ========================================

        const secondLogin =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                secondUserEmail,

              password:
                testPassword,
            });

        expect(
          secondLogin.statusCode
        ).toBe(200);

        expect(
          secondLogin.body.token
        ).toBeDefined();

        secondUserToken =
          secondLogin.body.token;

        // ========================================
        // LOGIN ADMIN
        // ========================================

        const adminLogin =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                adminUserEmail,

              password:
                testPassword,
            });

        expect(
          adminLogin.statusCode
        ).toBe(200);

        expect(
          adminLogin.body.token
        ).toBeDefined();

        adminToken =
          adminLogin.body.token;

        // ========================================
        // CREATE INITIAL TODO
        // ========================================

        const todoResponse =
          await request(app)
            .post(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            )
            .send({
              title:
                "Admin Todo Test",

              description:
                "Todo created for admin tests",

              assignedTo:
                secondUserId,

              status:
                "pending",

              priority:
                "medium",
            });

        expect(
          todoResponse.statusCode
        ).toBe(201);

        expect(
          todoResponse.body.success
        ).toBe(true);

        todoId =
          todoResponse.body.data._id;
      },
      30000
    );

    // ==========================================
    // CLEAR CACHE BEFORE EACH TEST
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
              normalUserEmail,
              secondUserEmail,
              adminUserEmail,
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
    // NO TOKEN
    // ==========================================

    test(
      "GET /api/admin/users without token should return 401",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/admin/users"
            );

        expect(
          response.statusCode
        ).toBe(401);
      }
    );

    // ==========================================
    // INVALID TOKEN
    // ==========================================

    test(
      "GET /api/admin/users with invalid token should return 401",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/admin/users"
            )
            .set(
              "Authorization",
              "Bearer invalid-token"
            );

        expect(
          response.statusCode
        ).toBe(401);
      }
    );

    // ==========================================
    // NORMAL USER CANNOT ACCESS ADMIN USERS
    // ==========================================

    test(
      "Normal user should receive 403 from admin users API",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/admin/users"
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            );

        expect(
          response.statusCode
        ).toBe(403);
      }
    );

    // ==========================================
    // ADMIN GET USERS
    // ==========================================

    test(
      "Admin should get all users",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/admin/users"
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          Array.isArray(
            response.body.data
          )
        ).toBe(true);
      }
    );

    // ==========================================
    // ADMIN GET TODOS
    // ==========================================

    test(
      "Admin should get all todos",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/admin/todos"
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          Array.isArray(
            response.body.data
          )
        ).toBe(true);

        const todo =
          response.body.data.find(
            (item) =>
              item._id ===
              todoId
          );

        expect(
          todo
        ).toBeDefined();
      }
    );

    // ==========================================
    // NORMAL USER CANNOT ACCESS ADMIN TODOS
    // ==========================================

    test(
      "Normal user should receive 403 from admin todos API",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/admin/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            );

        expect(
          response.statusCode
        ).toBe(403);
      }
    );

    // ==========================================
    // ADMIN GET TODO
    // ==========================================

    test(
      "Admin should get any todo by ID",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/admin/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data._id
        ).toBe(
          todoId
        );
      }
    );

    // ==========================================
    // ADMIN UPDATE TODO
    // ==========================================

    test(
      "Admin should update any user's todo",
      async () => {
        const cacheResponse =
          await request(app)
            .get(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            );

        expect(
          cacheResponse.statusCode
        ).toBe(200);

        expect(
          todoCache.size()
        ).toBeGreaterThan(0);

        const response =
          await request(app)
            .put(
              `/api/admin/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            )
            .send({
              title:
                "Admin Updated Todo",
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data.title
        ).toBe(
          "Admin Updated Todo"
        );

        expect(
          todoCache.size()
        ).toBe(0);

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "updated",

            userId:
              adminUserId,
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();
      }
    );

    // ==========================================
    // ADMIN STATUS UPDATE
    // ==========================================

    test(
      "Admin should update Todo status",
      async () => {
        const response =
          await request(app)
            .patch(
              `/api/admin/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
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

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "status_changed",

            userId:
              adminUserId,
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.oldValue
        ).toBe(
          "pending"
        );

        expect(
          activity.newValue
        ).toBe(
          "completed"
        );
      }
    );

    // ==========================================
    // ADMIN PRIORITY UPDATE
    // ==========================================

    test(
      "Admin should update Todo priority",
      async () => {
        const response =
          await request(app)
            .patch(
              `/api/admin/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
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

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "priority_changed",

            userId:
              adminUserId,
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.oldValue
        ).toBe(
          "medium"
        );

        expect(
          activity.newValue
        ).toBe(
          "high"
        );
      }
    );

    // ==========================================
    // ADMIN REASSIGNMENT
    // ==========================================

    test(
      "Admin should reassign Todo",
      async () => {
        const response =
          await request(app)
            .patch(
              `/api/admin/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            )
            .send({
              assignedTo:
                normalUserId,
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
          normalUserId
        );

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "reassigned",

            userId:
              adminUserId,
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.oldValue
        ).toBe(
          secondUserId
        );

        expect(
          activity.newValue
        ).toBe(
          normalUserId
        );
      }
    );

    // ==========================================
    // INVALID USER ASSIGNMENT
    // ==========================================

    test(
      "Admin should reject invalid assigned user",
      async () => {
        const fakeUserId =
          new mongoose.Types.ObjectId()
            .toString();

        const response =
          await request(app)
            .patch(
              `/api/admin/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            )
            .send({
              assignedTo:
                fakeUserId,
            });

        expect(
          response.statusCode
        ).toBe(404);

        expect(
          response.body.message
        ).toBe(
          "Assigned user not found"
        );
      }
    );

    // ==========================================
    // NORMAL USER CANNOT UPDATE ADMIN ROUTE
    // ==========================================

    test(
      "Normal user should not update through admin API",
      async () => {
        const response =
          await request(app)
            .put(
              `/api/admin/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            )
            .send({
              title:
                "Unauthorized Update",
            });

        expect(
          response.statusCode
        ).toBe(403);
      }
    );

    // ==========================================
    // NORMAL USER CANNOT DELETE ADMIN ROUTE
    // ==========================================

    test(
      "Normal user should not delete through admin API",
      async () => {
        const response =
          await request(app)
            .delete(
              `/api/admin/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            );

        expect(
          response.statusCode
        ).toBe(403);
      }
    );

    // ==========================================
    // ADMIN DELETE
    // ==========================================

    test(
      "Admin should soft delete any user's todo",
      async () => {
        const cacheResponse =
          await request(app)
            .get(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            );

        expect(
          cacheResponse.statusCode
        ).toBe(200);

        expect(
          todoCache.size()
        ).toBeGreaterThan(0);

        const response =
          await request(app)
            .delete(
              `/api/admin/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          todoCache.size()
        ).toBe(0);

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "soft_deleted",

            userId:
              adminUserId,
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.oldValue
        ).toBe(false);

        expect(
          activity.newValue
        ).toBe(true);
      }
    );

    // ==========================================
    // DELETED TODO NOT ACTIVE
    // ==========================================

    test(
      "Deleted todo should no longer exist in active admin API",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/admin/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(404);
      }
    );

    // ==========================================
    // ADMIN TRASH
    // ==========================================

    test(
      "Admin should see deleted Todo in trash",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/admin/todos/trash"
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          Array.isArray(
            response.body.data
          )
        ).toBe(true);

        const deletedTodo =
          response.body.data.find(
            (todo) =>
              todo._id ===
              todoId
          );

        expect(
          deletedTodo
        ).toBeDefined();
      }
    );

    // ==========================================
    // ADMIN RESTORE
    // ==========================================

    test(
      "Admin should restore deleted Todo",
      async () => {
        const response =
          await request(app)
            .patch(
              `/api/admin/todos/${todoId}/restore`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data._id
        ).toBe(
          todoId
        );

        expect(
          response.body.data.isDeleted
        ).toBe(false);

        expect(
          todoCache.size()
        ).toBe(0);

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "restored",

            userId:
              adminUserId,
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.oldValue
        ).toBe(true);

        expect(
          activity.newValue
        ).toBe(false);
      }
    );

    // ==========================================
    // ADMIN CACHE INVALIDATION
    // ==========================================

    test(
      "Admin Todo update should invalidate Todo list cache",
      async () => {
        const cacheResponse =
          await request(app)
            .get(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            );

        expect(
          cacheResponse.statusCode
        ).toBe(200);

        expect(
          todoCache.size()
        ).toBeGreaterThan(0);

        const response =
          await request(app)
            .patch(
              `/api/admin/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            )
            .send({
              title:
                "Admin Cache Update",
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
    // ADMIN DELETE + RESTORE CACHE
    // ==========================================

    test(
      "Admin delete and restore should invalidate Todo cache",
      async () => {
        const createResponse =
          await request(app)
            .post(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            )
            .send({
              title:
                "Admin Cache Delete Test",

              description:
                "Fresh Todo for admin cache test",

              assignedTo:
                secondUserId,

              status:
                "pending",

              priority:
                "low",
            });

        expect(
          createResponse.statusCode
        ).toBe(201);

        const freshTodoId =
          createResponse.body.data._id;

        const listResponse =
          await request(app)
            .get(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            );

        expect(
          listResponse.statusCode
        ).toBe(200);

        expect(
          todoCache.size()
        ).toBeGreaterThan(0);

        const deleteResponse =
          await request(app)
            .delete(
              `/api/admin/todos/${freshTodoId}`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          deleteResponse.statusCode
        ).toBe(200);

        expect(
          todoCache.size()
        ).toBe(0);

        const restoreResponse =
          await request(app)
            .patch(
              `/api/admin/todos/${freshTodoId}/restore`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          restoreResponse.statusCode
        ).toBe(200);

        expect(
          todoCache.size()
        ).toBe(0);
      }
    );

    // ==========================================
    // MAKE ADMIN
    // ==========================================

    test(
      "Admin should make user admin",
      async () => {
        const response =
          await request(app)
            .post(
              `/api/admin/users/${normalUserId}/make-admin`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data.role
        ).toBe(
          "admin"
        );

        await User.findByIdAndUpdate(
          normalUserId,
          {
            role:
              "user",
          }
        );
      }
    );

    // ==========================================
    // REMOVE ADMIN
    // ==========================================

    test(
      "Admin should remove admin privileges",
      async () => {
        await User.findByIdAndUpdate(
          normalUserId,
          {
            role:
              "admin",
          }
        );

        const response =
          await request(app)
            .post(
              `/api/admin/users/${normalUserId}/remove-admin`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data.role
        ).toBe(
          "user"
        );
      }
    );

    // ==========================================
    // CHANGE ROLE
    // ==========================================

    test(
      "Admin should change user role",
      async () => {
        const response =
          await request(app)
            .patch(
              `/api/admin/users/${normalUserId}/role`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            )
            .send({
              role:
                "admin",
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data.role
        ).toBe(
          "admin"
        );

        await User.findByIdAndUpdate(
          normalUserId,
          {
            role:
              "user",
          }
        );
      }
    );
  }
);