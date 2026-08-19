// ==========================================
// MOCK ATTACHMENT SERVICE
//
// The attachment API uses Cloudinary in the
// real application.
//
// For Jest tests we should NOT upload files to
// the real Cloudinary service.
//
// This mock returns a fake successful upload
// result so we can test:
// - authentication
// - Todo attachment update
// - cache invalidation
// - audit activity
// ==========================================

jest.mock(
  "../utils/attachmentService",
  () => ({
    uploadAttachmentFile:
      jest.fn(
        async (file) => ({
          url:
            "https://res.cloudinary.com/test-cloud/image/upload/v1/todo-api/test-attachment.pdf",

          public_id:
            "todo-api/attachments/test-attachment",

          resource_type:
            "raw",

          format:
            "pdf",

          original_filename:
            file &&
            file.originalname
              ? file.originalname
              : "test-attachment.pdf",
        })
      ),
  })
);

// ==========================================
// Imports
// ==========================================

const request =
  require("supertest");

const mongoose =
  require("mongoose");

const app =
  require("../server");

const User =
  require("../models/User");

const Todo =
  require("../models/Todo");

const TodoActivity =
  require("../models/TodoActivity");

const todoCache =
  require("../utils/lfuCache");

const {
  uploadAttachmentFile,
} = require("../utils/attachmentService");

describe(
  "Todo Attachment Audit Log",
  () => {
    let userToken;
    let userId;
    let todoId;

    // ==========================================
    // TEST EMAIL FROM .ENV
    // ==========================================

    const userEmail =
      process.env.TEST_EMAIL_A;

    const testPassword =
      "password123";

    // ==========================================
    // Validate Test Email
    // ==========================================

    if (!userEmail) {
      throw new Error(
        "TEST_EMAIL_A must be defined in .env"
      );
    }

    // ==========================================
    // SETUP
    // ==========================================

    beforeAll(
      async () => {
        todoCache.clear();

        // ----------------------------------------
        // Cleanup old data
        // ----------------------------------------

        await TodoActivity.deleteMany({});

        await Todo.deleteMany({});

        await User.deleteMany({
          email:
            userEmail,
        });

        // ========================================
        // CREATE TEST USER
        // ========================================

        const user =
          await User.create({
            name:
              "Todo Attachment Test User",

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
        // LOGIN
        // ========================================

        const loginResponse =
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
          loginResponse.statusCode
        ).toBe(200);

        expect(
          loginResponse.body.token
        ).toBeDefined();

        userToken =
          loginResponse.body.token;

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
                "Todo Attachment Test",

              description:
                "Todo created for attachment tests",

              assignedTo:
                userId,

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
    // RESET CACHE + MOCK BEFORE EACH TEST
    // ==========================================

    beforeEach(() => {
      todoCache.clear();

      uploadAttachmentFile.mockClear();
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
          email:
            userEmail,
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
    // UPLOAD ATTACHMENT
    // ==========================================

    test(
      "Attachment upload should create attachment_added activity",
      async () => {
        const pdfBuffer =
          Buffer.from(
            "%PDF-1.4\n%Test PDF attachment\n"
          );

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
              pdfBuffer,
              {
                filename:
                  "test-attachment.pdf",

                contentType:
                  "application/pdf",
              }
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data.attachmentUrl
        ).toBe(
          "https://res.cloudinary.com/test-cloud/image/upload/v1/todo-api/test-attachment.pdf"
        );

        expect(
          uploadAttachmentFile
        ).toHaveBeenCalledTimes(1);

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

        expect(
          activity.userId.toString()
        ).toBe(
          userId
        );

        expect(
          activity.newValue
        ).toBe(
          "https://res.cloudinary.com/test-cloud/image/upload/v1/todo-api/test-attachment.pdf"
        );

        // ========================================
        // Cache must be invalidated
        // ========================================

        expect(
          todoCache.size()
        ).toBe(0);
      }
    );

    // ==========================================
    // ATTACHMENT URL STORED
    // ==========================================

    test(
      "Uploaded attachment URL should be stored on Todo",
      async () => {
        const pdfBuffer =
          Buffer.from(
            "%PDF-1.4\n%Second Test PDF attachment\n"
          );

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
              pdfBuffer,
              {
                filename:
                  "second-attachment.pdf",

                contentType:
                  "application/pdf",
              }
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        const updatedTodo =
          await Todo.findById(
            todoId
          );

        expect(
          updatedTodo
        ).not.toBeNull();

        expect(
          updatedTodo.attachmentUrl
        ).toBeDefined();

        expect(
          updatedTodo.attachmentUrl
        ).not.toBeNull();

        expect(
          typeof updatedTodo.attachmentUrl
        ).toBe("string");

        expect(
          updatedTodo.attachmentUrl.length
        ).toBeGreaterThan(0);

        expect(
          updatedTodo.attachmentUrl
        ).toBe(
          "https://res.cloudinary.com/test-cloud/image/upload/v1/todo-api/test-attachment.pdf"
        );

        expect(
          updatedTodo.attachmentPublicId
        ).toBe(
          "todo-api/attachments/test-attachment"
        );
      }
    );

    // ==========================================
    // ACTIVITY API
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
          response.body.success
        ).toBe(true);

        expect(
          Array.isArray(
            response.body.data
          )
        ).toBe(true);

        // ----------------------------------------
        // Find attachment activity
        // ----------------------------------------

        const attachmentActivity =
          response.body.data.find(
            (activity) =>
              activity.action ===
              "attachment_added"
          );

        expect(
          attachmentActivity
        ).toBeDefined();

        expect(
          attachmentActivity.userId
        ).toBeDefined();

        const activityUserId =
          attachmentActivity.userId?._id ||
          attachmentActivity.userId;

        expect(
          activityUserId.toString()
        ).toBe(
          userId
        );

        expect(
          attachmentActivity.newValue
        ).toBe(
          "https://res.cloudinary.com/test-cloud/image/upload/v1/todo-api/test-attachment.pdf"
        );
      }
    );
  }
);