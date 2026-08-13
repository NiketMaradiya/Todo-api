const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const User = require("../models/User");
const Todo = require("../models/Todo");

describe(
  "Admin Role and Todo Authorization API",
  () => {
    let userToken;
    let secondUserToken;
    let adminToken;

    let normalUserId;
    let secondUserId;

    let todoId;

    beforeAll(async () => {
      await Todo.deleteMany({
        title: {
          $in: [
            "Admin Todo Test",
            "Admin Todo Delete Test",
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
            password: "password123",
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
            password: "password123",
          });

      expect(
        secondUserResponse.statusCode
      ).toBe(201);

      secondUserId =
        secondUserResponse.body.data._id;

      secondUserToken =
        secondUserResponse.body.token;

      // ==========================================
      // CREATE ADMIN
      // ==========================================

      const admin =
        await User.create({
          name: "Admin User",
          email:
            "admin-user@test.com",
          password: "password123",
          role: "admin",
        });

      // ==========================================
      // LOGIN ADMIN
      // ==========================================

      const adminLoginResponse =
        await request(app)
          .post("/api/auth/login")
          .send({
            email: admin.email,
            password: "password123",
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
            status: "todo",
          });

      expect(
        todoResponse.statusCode
      ).toBe(201);

      todoId =
        todoResponse.body.data._id;
    });

    afterAll(async () => {
      await Todo.deleteMany({
        title: {
          $in: [
            "Admin Todo Test",
            "Admin Todo Delete Test",
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
        mongoose.connection.readyState !== 0
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
            .get("/api/admin/users");

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
            .get("/api/admin/users")
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
            .get("/api/admin/users")
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
            .get("/api/admin/users")
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
    // ADMIN CAN SEE ALL TODOS
    // ==========================================

    test(
      "Admin should get all todos",
      async () => {
        const response =
          await request(app)
            .get("/api/admin/todos")
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
              item._id === todoId
          );

        expect(todo).toBeDefined();

        expect(
          todo.createdBy._id
        ).toBe(normalUserId);

        expect(
          todo.assignedTo._id
        ).toBe(secondUserId);
      }
    );

    // ==========================================
    // NORMAL USER CANNOT SEE ADMIN TODOS
    // ==========================================

    test(
      "Normal user should receive 403 from admin todos API",
      async () => {
        const response =
          await request(app)
            .get("/api/admin/todos")
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
        ).toBe(todoId);

        expect(
          response.body.data.createdBy._id
        ).toBe(normalUserId);

        expect(
          response.body.data.assignedTo._id
        ).toBe(secondUserId);
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
              status: "inprogress",
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
        ).toBe("inprogress");

        // Creator must NOT change
        expect(
          response.body.data.createdBy._id
        ).toBe(normalUserId);
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
        ).toBe(normalUserId);
      }
    );

    // ==========================================
    // ADMIN CANNOT ASSIGN NON-EXISTING USER
    // ==========================================

    test(
      "Admin should reject invalid assigned user",
      async () => {
        const fakeUserId =
          new mongoose.Types.ObjectId().toString();

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
              assignedTo: fakeUserId,
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
    // ADMIN DELETE ANY TODO
    // ==========================================

    test(
      "Admin should delete any user's todo",
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
          "Todo deleted successfully by admin"
        );
      }
    );

    // ==========================================
    // ADMIN GET DELETED TODO
    // ==========================================

    test(
      "Deleted todo should no longer exist",
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
        ).toBe("admin");
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
        ).toBe("user");
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
              role: "admin",
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data.role
        ).toBe("admin");
      }
    );
  }
);