const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const User = require("../models/User");
const Todo = require("../models/Todo");
const TodoActivity = require("../models/TodoActivity");

const todoCache =
  require("../utils/lfuCache");

describe(
  "Todo Audit Log / Activity API",
  () => {
    let userToken;
    let adminToken;
    let unrelatedUserToken;

    let userId;
    let adminId;
    let assignedUserId;
    let unrelatedUserId;

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

    const unrelatedEmail =
      process.env.TEST_EMAIL_UNRELATED;

    const testPassword =
      "password123";

    // ==========================================
    // Validate Test Emails
    // ==========================================

    if (
      !userEmail ||
      !adminEmail ||
      !assignedEmail ||
      !unrelatedEmail
    ) {
      throw new Error(
        "TEST_EMAIL_A, TEST_EMAIL_B, TEST_EMAIL_ADMIN and TEST_EMAIL_UNRELATED must be defined in .env"
      );
    }

    // ==========================================
    // SETUP
    // ==========================================

    beforeAll(
      async () => {
        todoCache.clear();

        // ========================================
        // Cleanup
        // ========================================

        await TodoActivity.deleteMany({});
        await Todo.deleteMany({});

        await User.deleteMany({
          email: {
            $in: [
              userEmail,
              adminEmail,
              assignedEmail,
              unrelatedEmail,
            ],
          },
        });

        // ========================================
        // CREATE NORMAL USER
        // ========================================

        const user =
          await User.create({
            name:
              "Todo Audit User",

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
              "Todo Audit Assigned User",

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
              "Todo Audit Admin",

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
        // CREATE UNRELATED USER
        // ========================================

        const unrelatedUser =
          await User.create({
            name:
              "Todo Audit Unrelated User",

            email:
              unrelatedEmail,

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

        unrelatedUserId =
          unrelatedUser._id.toString();

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
        // LOGIN UNRELATED USER
        // ========================================

        const unrelatedLogin =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                unrelatedEmail,

              password:
                testPassword,
            });

        expect(
          unrelatedLogin.statusCode
        ).toBe(200);

        expect(
          unrelatedLogin.body.token
        ).toBeDefined();

        unrelatedUserToken =
          unrelatedLogin.body.token;

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
                "Todo Audit Test",

              description:
                "Todo created for audit tests",

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
              userEmail,
              adminEmail,
              assignedEmail,
              unrelatedEmail,
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
    // CREATION ACTIVITY
    // ==========================================

    test(
      "Todo creation should create created activity",
      async () => {
        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "created",
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.userId.toString()
        ).toBe(
          userId
        );
      }
    );

    // ==========================================
    // TITLE UPDATE
    // ==========================================

    test(
      "Todo title update should create updated activity",
      async () => {
        const response =
          await request(app)
            .put(
              `/api/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            )
            .send({
              title:
                "Todo Audit Test Updated",
            });

        expect(
          response.statusCode
        ).toBe(200);

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "updated",
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.userId.toString()
        ).toBe(
          userId
        );

        expect(
          activity.oldValue.title
        ).toBe(
          "Todo Audit Test"
        );

        expect(
          activity.newValue.title
        ).toBe(
          "Todo Audit Test Updated"
        );
      }
    );

    // ==========================================
    // ASSIGNMENT CHANGE
    // ==========================================

    test(
      "Changing assignment should create reassigned activity",
      async () => {
        const response =
          await request(app)
            .put(
              `/api/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
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
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.userId.toString()
        ).toBe(
          userId
        );

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
    // STATUS CHANGE
    // ==========================================

    test(
      "Status change should create status_changed activity",
      async () => {
        const response =
          await request(app)
            .patch(
              `/api/todos/${todoId}/status`
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
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
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.userId.toString()
        ).toBe(
          userId
        );

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
    // PRIORITY CHANGE
    // ==========================================

    test(
      "Priority change should create priority_changed activity",
      async () => {
        const response =
          await request(app)
            .put(
              `/api/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
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
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.userId.toString()
        ).toBe(
          userId
        );

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
    // COMMENT ACTIVITY
    // ==========================================

    test(
      "Adding comment should create comment_added activity",
      async () => {
        const response =
          await request(app)
            .post(
              `/api/todos/${todoId}/comments`
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            )
            .send({
              comment:
                "Audit test comment",
            });

        expect(
          response.statusCode
        ).toBe(201);

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "comment_added",
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.userId.toString()
        ).toBe(
          userId
        );

        expect(
          activity.newValue.comment
        ).toBe(
          "Audit test comment"
        );
      }
    );

    // ==========================================
    // PERFORMER USER
    // ==========================================

    test(
      "Audit activity should record the user who performed the action",
      async () => {
        const response =
          await request(app)
            .put(
              `/api/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            )
            .send({
              description:
                "Updated description",
            });

        expect(
          response.statusCode
        ).toBe(200);

        const activity =
          await TodoActivity.findOne({
            todoId,

            action:
              "updated",

            userId:
              userId,
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
    // ACTIVITY ORDER
    // ==========================================

    test(
      "Activity should be returned newest first",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/todos/${todoId}/activity`
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          Array.isArray(
            response.body.data
          )
        ).toBe(true);

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
    // UNRELATED USER ACCESS
    // ==========================================

    test(
      "Unrelated user should not access Todo activity",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/todos/${todoId}/activity`
            )
            .set(
              "Authorization",
              `Bearer ${unrelatedUserToken}`
            );

        expect(
          response.statusCode
        ).toBe(403);
      }
    );

    // ==========================================
    // ADMIN ACCESS
    // ==========================================

    test(
      "Admin should be able to view any Todo activity",
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
      }
    );

    // ==========================================
    // INVALID TODO ID
    // ==========================================

    test(
      "Invalid Todo ID should return 400",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/todos/not-a-valid-id/activity"
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(400);
      }
    );

    // ==========================================
    // NON EXISTING TODO ID
    // ==========================================

    test(
      "Non-existing Todo ID should return 404",
      async () => {
        const fakeId =
          new mongoose.Types.ObjectId()
            .toString();

        const response =
          await request(app)
            .get(
              `/api/todos/${fakeId}/activity`
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
    // SOFT DELETE
    // ==========================================

    test(
      "Soft delete should create soft_deleted activity",
      async () => {
        const response =
          await request(app)
            .delete(
              `/api/todos/${todoId}`
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
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
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.userId.toString()
        ).toBe(
          userId
        );

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
          }).sort({
            createdAt:
              -1,
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.userId.toString()
        ).toBe(
          adminId
        );

        expect(
          activity.oldValue
        ).toBe(true);

        expect(
          activity.newValue
        ).toBe(false);
      }
    );

    // ==========================================
    // REQUIRED ACTION TYPES
    // ==========================================

    test(
      "Todo should contain all required audit action types",
      async () => {
        const activities =
          await TodoActivity.find({
            todoId,
          });

        const actions =
          activities.map(
            (activity) =>
              activity.action
          );

        const requiredActions =
          [
            "created",
            "updated",
            "reassigned",
            "status_changed",
            "priority_changed",
            "comment_added",
            "soft_deleted",
            "restored",
          ];

        for (
          const action of
          requiredActions
        ) {
          expect(
            actions
          ).toContain(
            action
          );
        }
      }
    );
  }
);