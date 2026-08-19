const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const User = require("../models/User");
const Todo = require("../models/Todo");
const TodoActivity = require("../models/TodoActivity");

const todoCache =
  require("../utils/lfuCache");

describe(
  "Admin Todo Audit Activity",
  () => {
    let userToken;
    let adminToken;

    let userId;
    let adminId;
    let assignedUserId;

    let todoId;

    // ==========================================
    // TEST EMAILS FROM .ENV
    // ==========================================

    const userEmail =
      process.env.TEST_EMAIL_A;

    const adminEmail =
      process.env.TEST_EMAIL_ADMIN;

    const assignedEmail =
      process.env.TEST_EMAIL_B;

    const testPassword =
      "password123";

    // ==========================================
    // Validate Test Emails
    // ==========================================

    if (
      !userEmail ||
      !adminEmail ||
      !assignedEmail
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
        // CLEANUP
        // ========================================

        await TodoActivity.deleteMany({});
        await Todo.deleteMany({});

        await User.deleteMany({
          email: {
            $in: [
              userEmail,
              adminEmail,
              assignedEmail,
            ],
          },
        });

        // ========================================
        // CREATE NORMAL USER
        // ========================================

        const user =
          await User.create({
            name:
              "Admin Audit User",

            email:
              userEmail,

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

        userId =
          user._id.toString();

        // ========================================
        // CREATE ASSIGNED USER
        // ========================================

        const assignedUser =
          await User.create({
            name:
              "Admin Audit Assigned User",

            email:
              assignedEmail,

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

        assignedUserId =
          assignedUser._id.toString();

        // ========================================
        // CREATE ADMIN
        // ========================================

        const admin =
          await User.create({
            name:
              "Admin Audit Admin",

            email:
              adminEmail,

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

        adminId =
          admin._id.toString();

        // ========================================
        // LOGIN NORMAL USER
        // ========================================

        const userLogin =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                userEmail,

              password:
                testPassword,
            });

        expect(
          userLogin.statusCode
        ).toBe(200);

        expect(
          userLogin.body.token
        ).toBeDefined();

        userToken =
          userLogin.body.token;

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
                adminEmail,

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
        // CREATE TODO
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
                "Admin Audit Todo",

              description:
                "Admin audit testing",

              assignedTo:
                assignedUserId,

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
    // RESET CACHE BEFORE EACH TEST
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
              userEmail,
              adminEmail,
              assignedEmail,
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
    // ADMIN UPDATE
    // ==========================================

    test(
      "Admin update should create updated activity",
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
              title:
                "Admin Audit Todo Updated",
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "updated",

            userId:
              adminId,
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.oldValue.title
        ).toBe(
          "Admin Audit Todo"
        );

        expect(
          activity.newValue.title
        ).toBe(
          "Admin Audit Todo Updated"
        );
      }
    );

    // ==========================================
    // ADMIN STATUS CHANGE
    // ==========================================

    test(
      "Admin status change should create status_changed activity",
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
                "in-progress",
            });

        expect(
          response.statusCode
        ).toBe(200);

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "status_changed",

            userId:
              adminId,
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
          "in-progress"
        );
      }
    );

    // ==========================================
    // ADMIN PRIORITY CHANGE
    // ==========================================

    test(
      "Admin priority change should create priority_changed activity",
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

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "priority_changed",

            userId:
              adminId,
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
      "Admin reassignment should create reassigned activity",
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
                userId,
            });

        expect(
          response.statusCode
        ).toBe(200);

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "reassigned",

            userId:
              adminId,
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
          assignedUserId
        );

        expect(
          activity.newValue
        ).toBe(
          userId
        );
      }
    );

    // ==========================================
    // ADMIN SOFT DELETE
    // ==========================================

    test(
      "Admin soft delete should create soft_deleted activity",
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
          todoCache.size()
        ).toBe(0);

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "soft_deleted",

            userId:
              adminId,
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
    // ADMIN RESTORE
    // ==========================================

    test(
      "Admin restore should create restored activity",
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
          todoCache.size()
        ).toBe(0);

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "restored",

            userId:
              adminId,
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
    // ADMIN VIEW ACTIVITY
    // ==========================================

    test(
      "Admin should view complete Todo activity",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/todos/${todoId}/activity`
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

        expect(
          response.body.data.length
        ).toBeGreaterThan(0);
      }
    );
  }
);