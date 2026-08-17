const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const Todo = require("../models/Todo");
const User = require("../models/User");
const Comment = require("../models/Comment");
const TodoActivity = require("../models/TodoActivity");

describe("Todo Audit Log / Activity API", () => {
  let userAToken;
  let userBToken;
  let userCToken;
  let adminToken;

  let userAId;
  let userBId;
  let userCId;
  let adminId;

  let todoId;

  const userAEmail =
    "activity-user-a@test.com";

  const userBEmail =
    "activity-user-b@test.com";

  const userCEmail =
    "activity-user-c@test.com";

  const adminEmail =
    "activity-admin@test.com";

  // ==========================================
  // Setup
  // ==========================================

  beforeAll(async () => {
    await TodoActivity.deleteMany({});
    await Comment.deleteMany({});
    await Todo.deleteMany({});

    await User.deleteMany({
      email: {
        $in: [
          userAEmail,
          userBEmail,
          userCEmail,
          adminEmail,
        ],
      },
    });

    // ==========================================
    // User A
    // ==========================================

    const userAResponse =
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Activity User A",
          email: userAEmail,
          password: "password123",
        });

    expect(
      userAResponse.statusCode
    ).toBe(201);

    userAId =
      userAResponse.body.data._id;

    userAToken =
      userAResponse.body.token;

    // ==========================================
    // User B
    // ==========================================

    const userBResponse =
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Activity User B",
          email: userBEmail,
          password: "password123",
        });

    expect(
      userBResponse.statusCode
    ).toBe(201);

    userBId =
      userBResponse.body.data._id;

    userBToken =
      userBResponse.body.token;

    // ==========================================
    // User C
    // ==========================================

    const userCResponse =
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Activity User C",
          email: userCEmail,
          password: "password123",
        });

    expect(
      userCResponse.statusCode
    ).toBe(201);

    userCId =
      userCResponse.body.data._id;

    userCToken =
      userCResponse.body.token;

    // ==========================================
    // Admin
    // ==========================================

    const adminResponse =
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Activity Admin",
          email: adminEmail,
          password: "password123",
        });

    expect(
      adminResponse.statusCode
    ).toBe(201);

    adminId =
      adminResponse.body.data._id;

    await User.findByIdAndUpdate(
      adminId,
      {
        role: "admin",
      }
    );

    const adminLogin =
      await request(app)
        .post("/api/auth/login")
        .send({
          email: adminEmail,
          password: "password123",
        });

    expect(
      adminLogin.statusCode
    ).toBe(200);

    adminToken =
      adminLogin.body.token;
  });

  // ==========================================
  // Cleanup
  // ==========================================

  afterAll(async () => {
    await TodoActivity.deleteMany({});
    await Comment.deleteMany({});
    await Todo.deleteMany({});

    await User.deleteMany({
      email: {
        $in: [
          userAEmail,
          userBEmail,
          userCEmail,
          adminEmail,
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
  // CREATE TODO
  // ==========================================

  test(
    "Todo creation should create created activity",
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
              "Audit Test Todo",

            description:
              "Audit Log Test",

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

      todoId =
        response.body.data._id;

      const activity =
        await TodoActivity.findOne({
          todoId,

          action:
            "created",
        });

      expect(activity).not.toBeNull();

      expect(
        activity.userId.toString()
      ).toBe(userAId);

      expect(
        activity.oldValue
      ).toBeNull();

      expect(
        activity.newValue
      ).not.toBeNull();
    }
  );

  // ==========================================
  // UPDATED
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
            `Bearer ${userAToken}`
          )
          .send({
            title:
              "Audit Test Todo Updated",
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
          createdAt: -1,
        });

      expect(
        activity
      ).not.toBeNull();

      expect(
        activity.userId.toString()
      ).toBe(userAId);

      expect(
        activity.oldValue.title
      ).toBe(
        "Audit Test Todo"
      );

      expect(
        activity.newValue.title
      ).toBe(
        "Audit Test Todo Updated"
      );
    }
  );

  // ==========================================
  // REASSIGN
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
            `Bearer ${userAToken}`
          )
          .send({
            assignedTo:
              userCId,
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
          createdAt: -1,
        });

      expect(
        activity
      ).not.toBeNull();

      expect(
        activity.userId.toString()
      ).toBe(userAId);

      expect(
        activity.oldValue
      ).toBe(userBId);

      expect(
        activity.newValue
      ).toBe(userCId);
    }
  );

  // ==========================================
  // STATUS
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
            `Bearer ${userAToken}`
          )
          .send({
            status:
              "completed",
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
          createdAt: -1,
        });

      expect(
        activity
      ).not.toBeNull();

      expect(
        activity.userId.toString()
      ).toBe(userAId);

      expect(
        activity.oldValue
      ).toBe("pending");

      expect(
        activity.newValue
      ).toBe("completed");
    }
  );

  // ==========================================
  // PRIORITY
  // ==========================================

  test(
    "Priority change should create priority_changed activity",
    async () => {
      const response =
        await request(app)
          .patch(
            `/api/todos/${todoId}`
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

      const activity =
        await TodoActivity.findOne({
          todoId,

          action:
            "priority_changed",
        }).sort({
          createdAt: -1,
        });

      expect(
        activity
      ).not.toBeNull();

      expect(
        activity.userId.toString()
      ).toBe(userAId);

      expect(
        activity.oldValue
      ).toBe("medium");

      expect(
        activity.newValue
      ).toBe("high");
    }
  );

  // ==========================================
  // COMMENT BY ASSIGNED USER
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
            `Bearer ${userCToken}`
          )
          .send({
            comment:
              "This is an audit test comment.",
          });

      expect(
        response.statusCode
      ).toBe(201);

      const activity =
        await TodoActivity.findOne({
          todoId,

          action:
            "comment_added",

          userId:
            userCId,
        }).sort({
          createdAt: -1,
        });

      expect(
        activity
      ).not.toBeNull();

      expect(
        activity.userId.toString()
      ).toBe(userCId);

      expect(
        activity.oldValue
      ).toBeNull();

      expect(
        activity.newValue.comment
      ).toBe(
        "This is an audit test comment."
      );
    }
  );

  // ==========================================
  // CORRECT USER
  // ==========================================

  test(
    "Audit activity should record the user who performed the action",
    async () => {
      // User C is currently assigned to the Todo,
      // so User C is authorized to add another comment.

      const response =
        await request(app)
          .post(
            `/api/todos/${todoId}/comments`
          )
          .set(
            "Authorization",
            `Bearer ${userCToken}`
          )
          .send({
            comment:
              "Comment by User C",
          });

      expect(
        response.statusCode
      ).toBe(201);

      const activity =
        await TodoActivity.findOne({
          todoId,

          action:
            "comment_added",

          userId:
            userCId,
        }).sort({
          createdAt: -1,
        });

      expect(
        activity
      ).not.toBeNull();

      expect(
        activity.userId.toString()
      ).toBe(userCId);
    }
  );

  // ==========================================
  // NEWEST FIRST
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

      expect(
        activities.length
      ).toBeGreaterThan(1);

      for (
        let i = 0;
        i <
        activities.length - 1;
        i++
      ) {
        const current =
          new Date(
            activities[i].createdAt
          ).getTime();

        const next =
          new Date(
            activities[i + 1]
              .createdAt
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
  // UNAUTHORIZED USER
  //
  // User B was replaced by User C,
  // so User B is no longer allowed to access.
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
            `Bearer ${userBToken}`
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
            "/api/todos/invalid-todo-id/activity"
          )
          .set(
            "Authorization",
            `Bearer ${userAToken}`
          );

      expect(
        response.statusCode
      ).toBe(400);

      expect(
        response.body.message
      ).toBe(
        "Invalid Todo ID"
      );
    }
  );

  // ==========================================
  // NON EXISTING TODO
  // ==========================================

  test(
    "Non-existing Todo ID should return 404",
    async () => {
      const fakeTodoId =
        new mongoose.Types.ObjectId()
          .toString();

      const response =
        await request(app)
          .get(
            `/api/todos/${fakeTodoId}/activity`
          )
          .set(
            "Authorization",
            `Bearer ${userAToken}`
          );

      expect(
        response.statusCode
      ).toBe(404);

      expect(
        response.body.message
      ).toBe(
        "Todo not found"
      );
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
            `Bearer ${userAToken}`
          );

      expect(
        response.statusCode
      ).toBe(200);

      const activity =
        await TodoActivity.findOne({
          todoId,

          action:
            "soft_deleted",
        }).sort({
          createdAt: -1,
        });

      expect(
        activity
      ).not.toBeNull();

      expect(
        activity.userId.toString()
      ).toBe(userAId);

      expect(
        activity.oldValue
      ).toBe(false);

      expect(
        activity.newValue
      ).toBe(true);
    }
  );

  // ==========================================
  // RESTORE
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

      const activity =
        await TodoActivity.findOne({
          todoId,

          action:
            "restored",
        }).sort({
          createdAt: -1,
        });

      expect(
        activity
      ).not.toBeNull();

      expect(
        activity.userId.toString()
      ).toBe(adminId);

      expect(
        activity.oldValue
      ).toBe(true);

      expect(
        activity.newValue
      ).toBe(false);
    }
  );

  // ==========================================
  // REQUIRED ACTIONS
  // ==========================================

  test(
    "Todo should contain all required audit action types",
    async () => {
      const actions =
        await TodoActivity.distinct(
          "action",
          {
            todoId,
          }
        );

      expect(
        actions
      ).toEqual(
        expect.arrayContaining([
          "created",
          "updated",
          "assigned",
          "reassigned",
          "status_changed",
          "priority_changed",
          "comment_added",
          "soft_deleted",
          "restored",
        ])
      );
    }
  );
});