const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const Todo = require("../models/Todo");
const User = require("../models/User");
const TodoActivity = require("../models/TodoActivity");

describe("Todo Attachment Audit Log", () => {
  let userToken;
  let userId;

  let assignedUserId;

  let todoId;

  const userEmail =
    "attachment-audit-user@test.com";

  const assignedUserEmail =
    "attachment-audit-assigned@test.com";

  // ==========================================
  // Small valid PNG
  //
  // This is a real 1x1 PNG file represented
  // as a Buffer.
  // ==========================================

  const createTestPng = () => {
    return Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64"
    );
  };

  // ==========================================
  // Setup
  // ==========================================

  beforeAll(async () => {
    await TodoActivity.deleteMany({});

    await Todo.deleteMany({});

    await User.deleteMany({
      email: {
        $in: [
          userEmail,
          assignedUserEmail,
        ],
      },
    });

    // ==========================================
    // Create Main User
    // ==========================================

    const userResponse =
      await request(app)
        .post("/api/auth/register")
        .send({
          name:
            "Attachment Audit User",

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
            "Attachment Assigned User",

          email:
            assignedUserEmail,

          password:
            "password123",
        });

    expect(
      assignedResponse.statusCode
    ).toBe(201);

    assignedUserId =
      assignedResponse.body.data._id;

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
            "Attachment Audit Todo",

          description:
            "Attachment audit test",

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

  // ==========================================
  // Cleanup
  // ==========================================

  afterAll(async () => {
    await TodoActivity.deleteMany({});

    await Todo.deleteMany({});

    await User.deleteMany({
      email: {
        $in: [
          userEmail,
          assignedUserEmail,
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
  // TEST 1
  //
  // Attachment upload creates activity
  // ==========================================

  test(
    "Attachment upload should create attachment_added activity",
    async () => {
      const response =
        await request(app)
          .post(
            `/api/todos/${todoId}/attachment`
          )
          .set(
            "Authorization",
            `Bearer ${userToken}`
          )
          .attach(
            "attachment",
            createTestPng(),
            {
              filename:
                "audit-test.png",

              contentType:
                "image/png",
            }
          );

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
            "attachment_added",
        }).sort({
          createdAt:
            -1,
        });

      expect(
        activity
      ).not.toBeNull();

      // ========================================
      // Correct User
      // ========================================

      expect(
        activity.userId.toString()
      ).toBe(userId);

      // ========================================
      // Old Value
      //
      // There was no attachment before upload.
      // ========================================

      expect(
        activity.oldValue
      ).toBeNull();

      // ========================================
      // New Value
      // ========================================

      expect(
        activity.newValue
      ).toBeTruthy();

      expect(
        typeof activity.newValue
      ).toBe("string");

      expect(
        activity.newValue
      ).toContain("http");
    }
  );

  // ==========================================
  // TEST 2
  //
  // Attachment URL stored on Todo
  // ==========================================

  test(
    "Uploaded attachment URL should be stored on Todo",
    async () => {
      const todo =
        await Todo.findById(
          todoId
        );

      expect(
        todo
      ).not.toBeNull();

      expect(
        todo.attachmentUrl
      ).toBeTruthy();

      expect(
        typeof todo.attachmentUrl
      ).toBe("string");

      expect(
        todo.attachmentUrl
      ).toContain("http");
    }
  );

  // ==========================================
  // TEST 3
  //
  // Activity API returns attachment activity
  // ==========================================

  test(
    "Activity API should return attachment_added",
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

      const attachmentActivity =
        response.body.data.find(
          (activity) =>
            activity.action ===
            "attachment_added"
        );

      expect(
        attachmentActivity
      ).toBeDefined();

      // ========================================
      // Correct user
      // ========================================

      expect(
        attachmentActivity.userId
      ).toBeDefined();

      // ========================================
      // Old value
      // ========================================

      expect(
        attachmentActivity.oldValue
      ).toBeNull();

      // ========================================
      // New value
      // ========================================

      expect(
        attachmentActivity.newValue
      ).toBeTruthy();

      expect(
        attachmentActivity.newValue
      ).toContain("http");
    }
  );
});