const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const User = require("../models/User");
const Todo = require("../models/Todo");
const TodoActivity = require("../models/TodoActivity");

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

    beforeAll(async () => {
      // ==========================================
      // Cleanup old test data
      // ==========================================

      await TodoActivity.deleteMany({});

      await Todo.deleteMany({
        title: {
          $in: [
            "Admin Todo Test",
            "Admin Todo Delete Test",
            "Admin Updated Todo",
            "Unauthorized Update",
          ],
        },
      });

      await User.deleteMany({
        email: {
          $in: [
            "normal-user@test.com",
            "second-user@test.com",
            "admin-user@test.com",
          ],
        },
      });

      // ==========================================
      // CREATE NORMAL USER
      // ==========================================

      const userResponse =
        await request(app)
          .post("/api/auth/register")
          .send({
            name: "Normal User",

            email:
              "normal-user@test.com",

            password:
              "password123",
          });

      expect(
        userResponse.statusCode
      ).toBe(201);

      userToken =
        userResponse.body.token;

      normalUserId =
        userResponse.body.data._id;

      // ==========================================
      // CREATE SECOND USER
      // ==========================================

      const secondUserResponse =
        await request(app)
          .post("/api/auth/register")
          .send({
            name: "Second User",

            email:
              "second-user@test.com",

            password:
              "password123",
          });

      expect(
        secondUserResponse.statusCode
      ).toBe(201);

      secondUserId =
        secondUserResponse.body.data._id;

      secondUserToken =
        secondUserResponse.body.token;

      // ==========================================
      // CREATE ADMIN USER
      // ==========================================

      const adminResponse =
        await request(app)
          .post("/api/auth/register")
          .send({
            name:
              "Admin User",

            email:
              "admin-user@test.com",

            password:
              "password123",
          });

      expect(
        adminResponse.statusCode
      ).toBe(201);

      adminUserId =
        adminResponse.body.data._id;

      // ==========================================
      // Make registered user admin
      // ==========================================

      await User.findByIdAndUpdate(
        adminUserId,
        {
          role: "admin",
        }
      );

      // ==========================================
      // LOGIN ADMIN
      //
      // Important:
      // Login again after changing the role
      // so JWT contains role=admin.
      // ==========================================

      const adminLoginResponse =
        await request(app)
          .post("/api/auth/login")
          .send({
            email:
              "admin-user@test.com",

            password:
              "password123",
          });

      expect(
        adminLoginResponse.statusCode
      ).toBe(200);

      adminToken =
        adminLoginResponse.body.token;

      // ==========================================
      // CREATE TODO FOR ADMIN TESTS
      // ==========================================

      const todoResponse =
        await request(app)
          .post("/api/todos")
          .set(
            "Authorization",
            `Bearer ${userToken}`
          )
          .send({
            title:
              "Admin Todo Test",

            description:
              "Todo created by normal user",

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

      todoId =
        todoResponse.body.data._id;

      expect(
        todoResponse.body.data.status
      ).toBe("pending");

      expect(
        todoResponse.body.data.priority
      ).toBe("medium");
    });

    // ==========================================
    // CLEANUP
    // ==========================================

    afterAll(async () => {
      if (
        todoId
      ) {
        await TodoActivity.deleteMany({
          todoId,
        });
      }

      await Todo.deleteMany({
        title: {
          $in: [
            "Admin Todo Test",
            "Admin Updated Todo",
            "Unauthorized Update",
          ],
        },
      });

      await User.deleteMany({
        email: {
          $in: [
            "normal-user@test.com",
            "second-user@test.com",
            "admin-user@test.com",
          ],
        },
      });

      if (
        mongoose.connection.readyState !==
        0
      ) {
        await mongoose.connection.close();
      }
    });

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
    // NORMAL USER CANNOT ACCESS ADMIN
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
    // ADMIN CAN SEE USERS
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
          Array.isArray(
            response.body.data
          )
        ).toBe(true);
      }
    );

    // ==========================================
    // ADMIN CAN SEE TODOS
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

        expect(
          todo.createdBy._id
        ).toBe(
          normalUserId
        );

        expect(
          todo.assignedTo._id
        ).toBe(
          secondUserId
        );
      }
    );

    // ==========================================
    // NORMAL USER CANNOT ADMIN TODO API
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
    // ADMIN GET TODO BY ID
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
          response.body.data._id
        ).toBe(
          todoId
        );

        expect(
          response.body.data.createdBy._id
        ).toBe(
          normalUserId
        );

        expect(
          response.body.data.assignedTo._id
        ).toBe(
          secondUserId
        );
      }
    );

    // ==========================================
    // ADMIN UPDATE TODO
    // ==========================================

    test(
      "Admin should update any user's todo",
      async () => {
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

              status:
                "in-progress",
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data.title
        ).toBe(
          "Admin Updated Todo"
        );

        expect(
          response.body.data.status
        ).toBe(
          "in-progress"
        );

        // Creator must NOT change
        expect(
          response.body.data.createdBy._id
        ).toBe(
          normalUserId
        );

        // ========================================
        // Audit should record admin
        // ========================================

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
          "in-progress"
        );
      }
    );

    // ==========================================
    // ADMIN REASSIGN TODO
    // ==========================================

    test(
      "Admin should assign todo to another user",
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

        expect(
          response.body.data.assignedTo._id
        ).toBe(
          normalUserId
        );

        // ========================================
        // Audit
        // ========================================

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
    // ADMIN PRIORITY CHANGE
    // ==========================================

    test(
      "Admin should change todo priority",
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
    // INVALID ASSIGNED USER
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
    // NORMAL USER CANNOT ADMIN UPDATE
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
    // NORMAL USER CANNOT ADMIN DELETE
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
          response.body.message
        ).toBe(
          "Todo moved to trash successfully by admin"
        );

        // ========================================
        // Verify soft_deleted audit
        // ========================================

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
    // ADMIN GET ACTIVE TODO
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

        // ========================================
        // Verify restore audit
        // ========================================

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
    // ADMIN ROLE TESTS
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
          response.body.data.role
        ).toBe(
          "admin"
        );
      }
    );

    test(
      "Admin should remove admin privileges",
      async () => {
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
      }
    );
  }
);