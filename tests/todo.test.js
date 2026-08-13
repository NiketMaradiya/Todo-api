const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const Todo = require("../models/Todo");
const User = require("../models/User");

describe(
  "Todo Assignment and User Tagging API",
  () => {
    let userAToken;
    let userBToken;
    let userCToken;

    let userAId;
    let userBId;
    let userCId;

    let todo1Id;
    let todo2Id;

    beforeAll(async () => {
      await Todo.deleteMany({});

      await User.deleteMany({
        email: {
          $in: [
            "todo-user-a@test.com",
            "todo-user-b@test.com",
            "todo-user-c@test.com",
          ],
        },
      });

      // ==========================================
      // CREATE USER A
      // ==========================================

      const userAResponse =
        await request(app)
          .post("/api/auth/register")
          .send({
            name: "Todo User A",
            email:
              "todo-user-a@test.com",
            password: "password123",
          });

      expect(
        userAResponse.statusCode
      ).toBe(201);

      userAId =
        userAResponse.body.data._id;

      // ==========================================
      // CREATE USER B
      // ==========================================

      const userBResponse =
        await request(app)
          .post("/api/auth/register")
          .send({
            name: "Todo User B",
            email:
              "todo-user-b@test.com",
            password: "password123",
          });

      expect(
        userBResponse.statusCode
      ).toBe(201);

      userBId =
        userBResponse.body.data._id;

      // ==========================================
      // CREATE USER C
      // ==========================================

      const userCResponse =
        await request(app)
          .post("/api/auth/register")
          .send({
            name: "Todo User C",
            email:
              "todo-user-c@test.com",
            password: "password123",
          });

      expect(
        userCResponse.statusCode
      ).toBe(201);

      userCId =
        userCResponse.body.data._id;

      // ==========================================
      // LOGIN USER A
      // ==========================================

      const loginA =
        await request(app)
          .post("/api/auth/login")
          .send({
            email:
              "todo-user-a@test.com",
            password: "password123",
          });

      expect(
        loginA.statusCode
      ).toBe(200);

      userAToken =
        loginA.body.token;

      // ==========================================
      // LOGIN USER B
      // ==========================================

      const loginB =
        await request(app)
          .post("/api/auth/login")
          .send({
            email:
              "todo-user-b@test.com",
            password: "password123",
          });

      expect(
        loginB.statusCode
      ).toBe(200);

      userBToken =
        loginB.body.token;

      // ==========================================
      // LOGIN USER C
      // ==========================================

      const loginC =
        await request(app)
          .post("/api/auth/login")
          .send({
            email:
              "todo-user-c@test.com",
            password: "password123",
          });

      expect(
        loginC.statusCode
      ).toBe(200);

      userCToken =
        loginC.body.token;
    });

    afterAll(async () => {
      await Todo.deleteMany({});

      await User.deleteMany({
        email: {
          $in: [
            "todo-user-a@test.com",
            "todo-user-b@test.com",
            "todo-user-c@test.com",
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
      "GET /api/todos without token should return 401",
      async () => {
        const response =
          await request(app)
            .get("/api/todos");

        expect(
          response.statusCode
        ).toBe(401);
      }
    );

    // ==========================================
    // CREATE TODO 1
    //
    // User A creates Todo 1
    // assignedTo = User B
    // ==========================================

    test(
      "User A should create Todo 1 assigned to User B",
      async () => {
        const response =
          await request(app)
            .post("/api/todos")
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              title: "Todo 1",
              description:
                "Created by User A",
              assignedTo: userBId,
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
        ).toBe("Todo 1");

        expect(
          response.body.data.createdBy._id
        ).toBe(userAId);

        expect(
          response.body.data.assignedTo._id
        ).toBe(userBId);

        todo1Id =
          response.body.data._id;
      }
    );

    // ==========================================
    // CREATED BY CANNOT BE MANUALLY CHANGED
    // ==========================================

    test(
      "createdBy should always come from logged-in user",
      async () => {
        const response =
          await request(app)
            .post("/api/todos")
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              title:
                "CreatedBy Security Test",
              description:
                "User A tries to fake User C",
              createdBy: userCId,
              assignedTo: userBId,
              status: "todo",
            });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          response.body.data.createdBy._id
        ).toBe(userAId);

        expect(
          response.body.data.createdBy._id
        ).not.toBe(userCId);

        await Todo.findByIdAndDelete(
          response.body.data._id
        );
      }
    );

    // ==========================================
    // INVALID ASSIGNED USER
    // ==========================================

    test(
      "should reject a non-existing assigned user",
      async () => {
        const fakeUserId =
          new mongoose.Types.ObjectId().toString();

        const response =
          await request(app)
            .post("/api/todos")
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              title:
                "Invalid Assignment",
              assignedTo: fakeUserId,
              status: "todo",
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
    // USER A CAN SEE TODO 1
    // ==========================================

    test(
      "User A should see Todo 1 because User A created it",
      async () => {
        const response =
          await request(app)
            .get("/api/todos")
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        const todoIds =
          response.body.data.map(
            (todo) => todo._id
          );

        expect(
          todoIds
        ).toContain(todo1Id);
      }
    );

    // ==========================================
    // USER B CAN SEE TODO 1
    // ==========================================

    test(
      "User B should see Todo 1 because it is assigned to User B",
      async () => {
        const response =
          await request(app)
            .get("/api/todos")
            .set(
              "Authorization",
              `Bearer ${userBToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        const todoIds =
          response.body.data.map(
            (todo) => todo._id
          );

        expect(
          todoIds
        ).toContain(todo1Id);
      }
    );

    // ==========================================
    // USER C CANNOT SEE TODO 1
    // ==========================================

    test(
      "User C should NOT see Todo 1",
      async () => {
        const response =
          await request(app)
            .get("/api/todos")
            .set(
              "Authorization",
              `Bearer ${userCToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        const todoIds =
          response.body.data.map(
            (todo) => todo._id
          );

        expect(
          todoIds
        ).not.toContain(todo1Id);
      }
    );

    // ==========================================
    // USER A GET TODO BY ID
    // ==========================================

    test(
      "User A should get Todo 1 by ID",
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
        ).toBe(todo1Id);
      }
    );

    // ==========================================
    // USER B GET TODO BY ID
    // ==========================================

    test(
      "User B should get Todo 1 by ID",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/todos/${todo1Id}`
            )
            .set(
              "Authorization",
              `Bearer ${userBToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data._id
        ).toBe(todo1Id);
      }
    );

    // ==========================================
    // USER C CANNOT GET TODO BY ID
    // ==========================================

    test(
      "User C should NOT get Todo 1 by ID",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/todos/${todo1Id}`
            )
            .set(
              "Authorization",
              `Bearer ${userCToken}`
            );

        expect(
          response.statusCode
        ).toBe(404);
      }
    );

    // ==========================================
    // CREATE TODO 2
    //
    // User A creates Todo 2
    // assignedTo = User A
    // ==========================================

    test(
      "User A should create Todo 2 assigned to User A",
      async () => {
        const response =
          await request(app)
            .post("/api/todos")
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              title: "Todo 2",
              description:
                "Created and assigned to User A",
              assignedTo: userAId,
              status: "inprogress",
            });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          response.body.data.createdBy._id
        ).toBe(userAId);

        expect(
          response.body.data.assignedTo._id
        ).toBe(userAId);

        todo2Id =
          response.body.data._id;
      }
    );

    // ==========================================
    // USER A SHOULD SEE TODO 1 + TODO 2
    // ==========================================

    test(
      "User A should see Todo 1 and Todo 2",
      async () => {
        const response =
          await request(app)
            .get("/api/todos")
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        const todoIds =
          response.body.data.map(
            (todo) => todo._id
          );

        expect(
          todoIds
        ).toContain(todo1Id);

        expect(
          todoIds
        ).toContain(todo2Id);
      }
    );

    // ==========================================
    // USER B SHOULD SEE ONLY TODO 1
    // ==========================================

    test(
      "User B should see Todo 1 but not Todo 2",
      async () => {
        const response =
          await request(app)
            .get("/api/todos")
            .set(
              "Authorization",
              `Bearer ${userBToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        const todoIds =
          response.body.data.map(
            (todo) => todo._id
          );

        expect(
          todoIds
        ).toContain(todo1Id);

        expect(
          todoIds
        ).not.toContain(todo2Id);
      }
    );

    // ==========================================
    // USER C SHOULD SEE NOTHING
    // ==========================================

    test(
      "User C should not see Todo 1 or Todo 2",
      async () => {
        const response =
          await request(app)
            .get("/api/todos")
            .set(
              "Authorization",
              `Bearer ${userCToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        const todoIds =
          response.body.data.map(
            (todo) => todo._id
          );

        expect(
          todoIds
        ).not.toContain(todo1Id);

        expect(
          todoIds
        ).not.toContain(todo2Id);
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
        ).toBe("Todo 1 Updated");
      }
    );

    // ==========================================
    // UPDATE ASSIGNED USER
    // ==========================================

    test(
      "User A should assign Todo 1 to User C",
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
              assignedTo: userCId,
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data.assignedTo._id
        ).toBe(userCId);
      }
    );

    // ==========================================
    // USER B SHOULD NO LONGER SEE TODO 1
    // ==========================================

    test(
      "User B should no longer see Todo 1 after reassignment",
      async () => {
        const response =
          await request(app)
            .get("/api/todos")
            .set(
              "Authorization",
              `Bearer ${userBToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        const todoIds =
          response.body.data.map(
            (todo) => todo._id
          );

        expect(
          todoIds
        ).not.toContain(todo1Id);
      }
    );

    // ==========================================
    // USER C SHOULD NOW SEE TODO 1
    // ==========================================

    test(
      "User C should see Todo 1 after reassignment",
      async () => {
        const response =
          await request(app)
            .get("/api/todos")
            .set(
              "Authorization",
              `Bearer ${userCToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        const todoIds =
          response.body.data.map(
            (todo) => todo._id
          );

        expect(
          todoIds
        ).toContain(todo1Id);
      }
    );

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    test(
      "Assigned User C should update Todo 1 status",
      async () => {
        const response =
          await request(app)
            .patch(
              `/api/todos/${todo1Id}/status`
            )
            .set(
              "Authorization",
              `Bearer ${userCToken}`
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
    // STATISTICS
    // ==========================================

    test(
      "User C should get Todo statistics",
      async () => {
        const response =
          await request(app)
            .get("/api/todos/stats")
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
    // DELETE TODO
    // ==========================================

    test(
      "User A should delete Todo 2 because User A created it",
      async () => {
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
          response.body.success
        ).toBe(true);
      }
    );
  }
);