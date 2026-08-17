const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const User = require("../models/User");
const Todo = require("../models/Todo");
const TodoActivity = require("../models/TodoActivity");

describe("Admin Todo Audit Activity", () => {
  let userToken;
  let adminToken;

  let userId;
  let adminId;

  let assignedUserId;

  let todoId;

  const userEmail =
    "admin-audit-user@test.com";

  const adminEmail =
    "admin-audit-admin@test.com";

  const assignedEmail =
    "admin-audit-assigned@test.com";

  beforeAll(async () => {
    // ==========================================
    // Cleanup
    // ==========================================

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

    // ==========================================
    // Create Normal User
    // ==========================================

    const userResponse =
      await request(app)
        .post("/api/auth/register")
        .send({
          name:
            "Admin Audit User",

          email:
            userEmail,

          password:
            "password123",
        });

    expect(
      userResponse.statusCode
    ).toBe(201);

    userId =
      userResponse.body.data._id;

    userToken =
      userResponse.body.token;

    // ==========================================
    // Create Assigned User
    // ==========================================

    const assignedResponse =
      await request(app)
        .post("/api/auth/register")
        .send({
          name:
            "Admin Audit Assigned",

          email:
            assignedEmail,

          password:
            "password123",
        });

    expect(
      assignedResponse.statusCode
    ).toBe(201);

    assignedUserId =
      assignedResponse.body.data._id;

    // ==========================================
    // Create Admin
    // ==========================================

    const adminResponse =
      await request(app)
        .post("/api/auth/register")
        .send({
          name:
            "Admin Audit Admin",

          email:
            adminEmail,

          password:
            "password123",
        });

    expect(
      adminResponse.statusCode
    ).toBe(201);

    adminId =
      adminResponse.body.data._id;

    // ==========================================
    // Promote to Admin
    // ==========================================

    await User.findByIdAndUpdate(
      adminId,
      {
        role:
          "admin",
      }
    );

    // ==========================================
    // Login Again
    // ==========================================

    const loginResponse =
      await request(app)
        .post("/api/auth/login")
        .send({
          email:
            adminEmail,

          password:
            "password123",
        });

    expect(
      loginResponse.statusCode
    ).toBe(200);

    adminToken =
      loginResponse.body.token;

    // ==========================================
    // Create Todo
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

    todoId =
      todoResponse.body.data._id;
  });

  afterAll(async () => {
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
      mongoose.connection.readyState !==
      0
    ) {
      await mongoose.connection.close();
    }
  });

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
  // ADMIN STATUS
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
  // ADMIN PRIORITY
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
  // ADMIN CAN VIEW ACTIVITY
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
        Array.isArray(
          response.body.data
        )
      ).toBe(true);

      expect(
        response.body.data.length
      ).toBeGreaterThan(0);
    }
  );
});