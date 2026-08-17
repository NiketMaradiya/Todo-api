const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const Todo = require("../models/Todo");
const User = require("../models/User");
const TodoActivity = require("../models/TodoActivity");

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

    const userAEmail =
      "todo-user-a@test.com";

    const userBEmail =
      "todo-user-b@test.com";

    const userCEmail =
      "todo-user-c@test.com";

    // ==========================================
    // Setup
    // ==========================================

    beforeAll(async () => {
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

      const userAResponse =
        await request(app)
          .post("/api/auth/register")
          .send({
            name: "Todo User A",
            email:
              userAEmail,
            password:
              "password123",
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
              userBEmail,
            password:
              "password123",
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
              userCEmail,
            password:
              "password123",
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
              userAEmail,
            password:
              "password123",
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
              userBEmail,
            password:
              "password123",
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
              userCEmail,
            password:
              "password123",
          });

      expect(
        loginC.statusCode
      ).toBe(200);

      userCToken =
        loginC.body.token;
    });

    // ==========================================
    // Cleanup
    // ==========================================

    afterAll(async () => {
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
        ).toBe("Todo 1");

        expect(
          response.body.data.createdBy._id
        ).toBe(userAId);

        expect(
          response.body.data.assignedTo._id
        ).toBe(userBId);

        expect(
          response.body.data.status
        ).toBe("pending");

        expect(
          response.body.data.priority
        ).toBe("medium");

        todo1Id =
          response.body.data._id;

        // ========================================
        // Audit activity should be created
        // ========================================

        const activity =
          await TodoActivity.findOne({
            todoId:
              todo1Id,

            action:
              "created",
          });

        expect(
          activity
        ).not.toBeNull();

        expect(
          activity.userId.toString()
        ).toBe(userAId);
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

              createdBy:
                userCId,

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
          response.body.data.createdBy._id
        ).toBe(userAId);

        expect(
          response.body.data.createdBy._id
        ).not.toBe(userCId);

        await Todo.findByIdAndDelete(
          response.body.data._id
        );

        // Remove its creation audit as well
        await TodoActivity.deleteMany({
          todoId:
            response.body.data._id,
        });
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

              assignedTo:
                fakeUserId,

              status:
                "pending",

              priority:
                "medium",
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
            (todo) =>
              todo._id
          );

        expect(
          todoIds
        ).toContain(
          todo1Id
        );
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
            (todo) =>
              todo._id
          );

        expect(
          todoIds
        ).toContain(
          todo1Id
        );
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
            (todo) =>
              todo._id
          );

        expect(
          todoIds
        ).not.toContain(
          todo1Id
        );
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
        ).toBe(
          todo1Id
        );
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
        ).toBe(
          todo1Id
        );
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
    // USER C CANNOT GET TODO ACTIVITY
    // ==========================================

    test(
      "User C should NOT get Todo 1 activity",
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
        ).toBe(403);
      }
    );

    // ==========================================
    // USER A CAN GET TODO ACTIVITY
    // ==========================================

    test(
      "User A should get Todo 1 activity",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/todos/${todo1Id}/activity`
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

        expect(
          response.body.data.length
        ).toBeGreaterThanOrEqual(
          1
        );
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
              title:
                "Todo 2",

              description:
                "Created and assigned to User A",

              assignedTo:
                userAId,

              status:
                "in-progress",

              priority:
                "medium",
            });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          response.body.data.createdBy._id
        ).toBe(
          userAId
        );

        expect(
          response.body.data.assignedTo._id
        ).toBe(
          userAId
        );

        expect(
          response.body.data.status
        ).toBe(
          "in-progress"
        );

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
            (todo) =>
              todo._id
          );

        expect(
          todoIds
        ).toContain(
          todo1Id
        );

        expect(
          todoIds
        ).toContain(
          todo2Id
        );
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
            (todo) =>
              todo._id
          );

        expect(
          todoIds
        ).toContain(
          todo1Id
        );

        expect(
          todoIds
        ).not.toContain(
          todo2Id
        );
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
            (todo) =>
              todo._id
          );

        expect(
          todoIds
        ).not.toContain(
          todo1Id
        );

        expect(
          todoIds
        ).not.toContain(
          todo2Id
        );
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

        // ========================================
        // Verify Audit
        // ========================================

        const activity =
          await TodoActivity.findOne({
            todoId:
              todo1Id,

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
          userAId
        );

        expect(
          activity.oldValue.title
        ).toBe(
          "Todo 1"
        );

        expect(
          activity.newValue.title
        ).toBe(
          "Todo 1 Updated"
        );
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
              assignedTo:
                userCId,
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data.assignedTo._id
        ).toBe(
          userCId
        );

        // ========================================
        // Verify Reassignment Audit
        // ========================================

        const activity =
          await TodoActivity.findOne({
            todoId:
              todo1Id,

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
          userAId
        );

        expect(
          activity.oldValue
        ).toBe(
          userBId
        );

        expect(
          activity.newValue
        ).toBe(
          userCId
        );
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
            (todo) =>
              todo._id
          );

        expect(
          todoIds
        ).not.toContain(
          todo1Id
        );
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
            (todo) =>
              todo._id
          );

        expect(
          todoIds
        ).toContain(
          todo1Id
        );
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

        // ========================================
        // Verify Audit
        // ========================================

        const activity =
          await TodoActivity.findOne({
            todoId:
              todo1Id,

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
          userCId
        );

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
    // PRIORITY UPDATE
    // ==========================================

    test(
      "User C should update Todo 1 priority",
      async () => {
        const response =
          await request(app)
            .patch(
              `/api/todos/${todo1Id}`
            )
            .set(
              "Authorization",
              `Bearer ${userCToken}`
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

        // ========================================
        // Verify Audit
        // ========================================

        const activity =
          await TodoActivity.findOne({
            todoId:
              todo1Id,

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
          userCId
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
    // ADD COMMENT
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

        // ========================================
        // Verify Audit
        // ========================================

        const activity =
          await TodoActivity.findOne({
            todoId:
              todo1Id,

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
          userCId
        );

        expect(
          activity.oldValue
        ).toBeNull();

        expect(
          activity.newValue.comment
        ).toBe(
          "Audit compatible comment"
        );
      }
    );

    // ==========================================
    // ACTIVITY NEWEST FIRST
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

        // ========================================
        // Verify Soft Delete Audit
        // ========================================

        const activity =
          await TodoActivity.findOne({
            todoId:
              todo2Id,

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
          userAId
        );

        expect(
          activity.oldValue
        ).toBe(false);

        expect(
          activity.newValue
        ).toBe(true);
      }
    );
  }
);