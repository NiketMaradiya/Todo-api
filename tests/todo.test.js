const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const Todo = require("../models/Todo");
const User = require("../models/User");

describe(
  "Todo API With JWT Authentication",
  () => {
    let token;
    let todoId;

    beforeAll(async () => {
      await Todo.deleteMany({});
      await User.deleteMany({});

      // Register
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Todo User",
          email: "todo@example.com",
          password: "password123",
        });

      // Login
      const loginResponse =
        await request(app)
          .post("/api/auth/login")
          .send({
            email: "todo@example.com",
            password: "password123",
          });

      token =
        loginResponse.body.token;
    });

    afterAll(async () => {
      await Todo.deleteMany({});
      await User.deleteMany({});

      if (
        mongoose.connection.readyState !== 0
      ) {
        await mongoose.connection.close();
      }
    });

    // ==========================================
    // No Token
    // ==========================================

    test(
      "GET /api/todos without token should return 401",
      async () => {
        const response = await request(app)
          .get("/api/todos");

        expect(
          response.statusCode
        ).toBe(401);
      }
    );

    // ==========================================
    // Create Todo
    // ==========================================

    test(
      "POST /api/todos should create Todo",
      async () => {
        const response = await request(app)
          .post("/api/todos")
          .set(
            "Authorization",
            `Bearer ${token}`
          )
          .send({
            title: "Learn JWT",
            status: "todo",
          });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data.title
        ).toBe("Learn JWT");

        todoId =
          response.body.data._id;
      }
    );

    // ==========================================
    // Get Todos
    // ==========================================

    test(
      "GET /api/todos should return user todos",
      async () => {
        const response = await request(app)
          .get("/api/todos")
          .set(
            "Authorization",
            `Bearer ${token}`
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
    // Get Todo By ID
    // ==========================================

    test(
      "GET /api/todos/:id should return Todo",
      async () => {
        const response = await request(app)
          .get(
            `/api/todos/${todoId}`
          )
          .set(
            "Authorization",
            `Bearer ${token}`
          );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data._id
        ).toBe(todoId);
      }
    );

    // ==========================================
    // Update Todo
    // ==========================================

    test(
      "PUT /api/todos/:id should update Todo",
      async () => {
        const response = await request(app)
          .put(
            `/api/todos/${todoId}`
          )
          .set(
            "Authorization",
            `Bearer ${token}`
          )
          .send({
            title:
              "Learn JWT Authentication",
          });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data.title
        ).toBe(
          "Learn JWT Authentication"
        );
      }
    );

    // ==========================================
    // Update Status
    // ==========================================

    test(
      "PATCH /api/todos/:id/status should update status",
      async () => {
        const response = await request(app)
          .patch(
            `/api/todos/${todoId}/status`
          )
          .set(
            "Authorization",
            `Bearer ${token}`
          )
          .send({
            status: "complate",
          });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data.status
        ).toBe("complate");
      }
    );

    // ==========================================
    // Get Statistics
    // ==========================================

    test(
      "GET /api/todos/stats should return statistics",
      async () => {
        const response = await request(app)
          .get("/api/todos/stats")
          .set(
            "Authorization",
            `Bearer ${token}`
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
    // Delete Todo
    // ==========================================

    test(
      "DELETE /api/todos/:id should delete Todo",
      async () => {
        const response = await request(app)
          .delete(
            `/api/todos/${todoId}`
          )
          .set(
            "Authorization",
            `Bearer ${token}`
          );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);
      }
    );
  }
);