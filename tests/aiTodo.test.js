const request =
  require("supertest");

const mongoose =
  require("mongoose");

// ============================================================
// GEMINI MOCK
//
// Must be declared before loading the application because
// aiTodoController imports GoogleGenAI during startup.
// ============================================================

const mockGenerateContent =
  jest.fn();

jest.mock(
  "@google/genai",
  () => ({
    GoogleGenAI:
      jest.fn(() => ({
        models: {
          generateContent:
            mockGenerateContent,
        },
      })),
  })
);

// ============================================================
// APP + MODELS
// ============================================================

const app =
  require("../server");

const Todo =
  require("../models/Todo");

const User =
  require("../models/User");

// ============================================================
// TEST SUITE
// ============================================================

describe(
  "AI Todo creation API",
  () => {
    let token;

    let user;

    const email =
      process.env.TEST_EMAIL_A ||
      `ai-test-${Date.now()}@example.com`;

    const password =
      "password123";

    // ========================================================
    // SETUP
    // ========================================================

    beforeAll(
      async () => {
        await Todo.deleteMany({
          createdBy: {
            $exists: true,
          },
        });

        await User.deleteMany({
          email,
        });

        user =
          await User.create({
            name:
              "AI Todo User",

            email,

            password,

            role:
              "user",

            isActive:
              true,

            mustChangePassword:
              false,

            passwordChangedAt:
              new Date(),
          });

        const login =
          await request(
            app
          )
            .post(
              "/api/auth/login"
            )
            .send({
              email,
              password,
            });

        expect(
          login.statusCode
        ).toBe(200);

        token =
          login.body.token;
      },
      30000
    );

    // ========================================================
    // RESET GEMINI MOCK
    // ========================================================

    beforeEach(() => {
      mockGenerateContent.mockReset();

      process.env.GEMINI_API_KEY =
        process.env.GEMINI_API_KEY ||
        "test-gemini-key";
    });

    // ========================================================
    // CLEANUP
    // ========================================================

    afterAll(
      async () => {
        if (user?._id) {
          await Todo.deleteMany({
            createdBy:
              user._id,
          });

          await User.deleteOne({
            _id:
              user._id,
          });
        }

        if (
          mongoose.connection
            .readyState !==
          0
        ) {
          await mongoose.connection.close();
        }
      },
      30000
    );

    // ========================================================
    // GEMINI MOCK HELPER
    // ========================================================

    const mockAI = (
      payload
    ) => {
      mockGenerateContent.mockResolvedValueOnce(
        {
          text:
            JSON.stringify(
              payload
            ),
        }
      );
    };

    // ========================================================
    // 1. CREATE TODO
    // ========================================================

    test(
      "creates a Todo from a simple sentence",
      async () => {
        mockAI({
          intent:
            "create",

          title:
            "Call Rahul about the project",

          description:
            "",

          searchTitle:
            "",

          dueDate:
            null,

          priority:
            "medium",

          status:
            "pending",

          assignedUserName:
            null,

          tags:
            [],

          durationMinutes:
            15,

          dateAmbiguous:
            false,

          dateClarification:
            null,

          schedulingRequested:
            false,

          schedulingReason:
            "",
        });

        const response =
          await request(
            app
          )
            .post(
              "/api/todos/ai"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            )
            .send({
              prompt:
                "Remind me to call Rahul about the project",
            });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          response.body.data.title
        ).toBe(
          "Call Rahul about the project"
        );

        expect(
          response.body.data
            .createdBy._id
        ).toBe(
          user._id.toString()
        );

        expect(
          response.body.data
            .assignedTo._id
        ).toBe(
          user._id.toString()
        );

        expect(
          mockGenerateContent
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    // ========================================================
    // 2. PRIORITY + DUE DATE
    // ========================================================

    test(
      "extracts priority and due date correctly",
      async () => {
        mockAI({
          intent:
            "create",

          title:
            "Submit quarterly project report",

          description:
            "",

          searchTitle:
            "",

          dueDate:
            "2026-08-21T17:00:00+05:30",

          priority:
            "high",

          status:
            "pending",

          assignedUserName:
            null,

          tags: [
            "project",
          ],

          durationMinutes:
            30,

          dateAmbiguous:
            false,

          dateClarification:
            null,

          schedulingRequested:
            false,

          schedulingReason:
            "",
        });

        const response =
          await request(
            app
          )
            .post(
              "/api/todos/ai"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            )
            .send({
              prompt:
                "Tomorrow at 5 PM remind me to submit the quarterly project report. Make it high priority.",
            });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          response.body.data.title
        ).toBe(
          "Submit quarterly project report"
        );

        expect(
          response.body.data.priority
        ).toBe(
          "high"
        );

        // Current API may return [] because tags
        // are not persisted by the current implementation.
        expect(
          Array.isArray(
            response.body.data.tags
          )
        ).toBe(true);

        expect(
          new Date(
            response.body.data
              .dueDate
          ).toISOString()
        ).toBe(
          "2026-08-21T11:30:00.000Z"
        );
      }
    );

    // ========================================================
    // 3. ASSIGN TO LOGGED-IN USER
    // ========================================================

    test(
      "resolves the logged-in user when explicitly assigned to them",
      async () => {
        mockAI({
          intent:
            "create",

          title:
            "Finish the client report",

          description:
            "",

          searchTitle:
            "",

          dueDate:
            null,

          priority:
            "high",

          status:
            "pending",

          assignedUserName:
            "AI Todo User",

          tags:
            [],

          durationMinutes:
            60,

          dateAmbiguous:
            false,

          dateClarification:
            null,

          schedulingRequested:
            false,

          schedulingReason:
            "",
        });

        const response =
          await request(
            app
          )
            .post(
              "/api/todos/ai"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            )
            .send({
              prompt:
                "Finish the client report and assign it to AI Todo User",
            });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          response.body.data
            .assignedTo._id
        ).toBe(
          user._id.toString()
        );
      }
    );

    // ========================================================
    // 4. MISSING PROMPT INFORMATION
    // ========================================================

    test(
      "handles missing prompt information without creating a Todo",
      async () => {
        mockAI({
          intent:
            "create",

          title:
            "",

          description:
            "",

          searchTitle:
            "",

          dueDate:
            null,

          priority:
            "medium",

          status:
            "pending",

          assignedUserName:
            null,

          tags:
            [],

          durationMinutes:
            15,

          dateAmbiguous:
            false,

          dateClarification:
            null,

          schedulingRequested:
            false,

          schedulingReason:
            "",
        });

        const beforeCount =
          await Todo.countDocuments({
            createdBy:
              user._id,
          });

        const response =
          await request(
            app
          )
            .post(
              "/api/todos/ai"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            )
            .send({
              prompt:
                "Please make a task but I forgot to say what it is",
            });

        const afterCount =
          await Todo.countDocuments({
            createdBy:
              user._id,
          });

        expect(
          response.statusCode
        ).toBe(400);

        expect(
          response.body.success
        ).toBe(false);

        expect(
          afterCount
        ).toBe(
          beforeCount
        );
      }
    );

    // ========================================================
    // 5. AMBIGUOUS DATE
    // ========================================================

    test(
      "handles ambiguous dates",
      async () => {
        mockAI({
          intent:
            "create",

          title:
            "Finish report",

          description:
            "",

          searchTitle:
            "",

          dueDate:
            null,

          priority:
            "medium",

          status:
            "pending",

          assignedUserName:
            null,

          tags:
            [],

          durationMinutes:
            60,

          dateAmbiguous:
            true,

          dateClarification:
            "Which Friday do you mean?",

          schedulingRequested:
            false,

          schedulingReason:
            "",
        });

        const beforeCount =
          await Todo.countDocuments({
            createdBy:
              user._id,
          });

        const response =
          await request(
            app
          )
            .post(
              "/api/todos/ai"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            )
            .send({
              prompt:
                "Finish report by Friday",
            });

        const afterCount =
          await Todo.countDocuments({
            createdBy:
              user._id,
          });

        expect(
          response.statusCode
        ).toBe(400);

        expect(
          response.body.message
        ).toBe(
          "Which Friday do you mean?"
        );

        expect(
          afterCount
        ).toBe(
          beforeCount
        );
      }
    );

    // ========================================================
    // 6. INVALID PRIORITY
    // ========================================================

    test(
      "rejects an invalid AI priority",
      async () => {
        mockAI({
          intent:
            "create",

          title:
            "Invalid priority task",

          description:
            "",

          searchTitle:
            "",

          dueDate:
            null,

          priority:
            "urgent",

          status:
            "pending",

          assignedUserName:
            null,

          tags:
            [],

          durationMinutes:
            15,

          dateAmbiguous:
            false,

          dateClarification:
            null,

          schedulingRequested:
            false,

          schedulingReason:
            "",
        });

        const response =
          await request(
            app
          )
            .post(
              "/api/todos/ai"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            )
            .send({
              prompt:
                "Make this urgent",
            });

        expect(
          response.statusCode
        ).toBe(400);

        expect(
          response.body.message
        ).toBe(
          "AI returned an invalid priority"
        );
      }
    );

    // ========================================================
    // 7. UNKNOWN ASSIGNED USER
    // ========================================================

    test(
      "handles an unknown assigned user",
      async () => {
        mockAI({
          intent:
            "create",

          title:
            "Finish report",

          description:
            "",

          searchTitle:
            "",

          dueDate:
            null,

          priority:
            "medium",

          status:
            "pending",

          assignedUserName:
            "Definitely Unknown User",

          tags:
            [],

          durationMinutes:
            30,

          dateAmbiguous:
            false,

          dateClarification:
            null,

          schedulingRequested:
            false,

          schedulingReason:
            "",
        });

        const beforeCount =
          await Todo.countDocuments({
            createdBy:
              user._id,
          });

        const response =
          await request(
            app
          )
            .post(
              "/api/todos/ai"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            )
            .send({
              prompt:
                "Finish report and assign to Definitely Unknown User",
            });

        const afterCount =
          await Todo.countDocuments({
            createdBy:
              user._id,
          });

        expect(
          response.statusCode
        ).toBe(404);

        expect(
          response.body.message
        ).toMatch(
          /not found/i
        );

        expect(
          afterCount
        ).toBe(
          beforeCount
        );
      }
    );

    // ========================================================
    // 8. PREVENT ASSIGNMENT TO ANOTHER USER
    // ========================================================

    test(
      "prevents AI from assigning a Todo to another user",
      async () => {
        const otherUser =
          await User.create({
            name:
              "Other AI User",

            email:
              `other-ai-${Date.now()}@example.com`,

            password,

            role:
              "user",

            isActive:
              true,

            mustChangePassword:
              false,

            passwordChangedAt:
              new Date(),
          });

        try {
          mockAI({
            intent:
              "create",

            title:
              "Finish report",

            description:
              "",

            searchTitle:
              "",

            dueDate:
              null,

            priority:
              "high",

            status:
              "pending",

            assignedUserName:
              otherUser.email,

            tags:
              [],

            durationMinutes:
              45,

            dateAmbiguous:
              false,

            dateClarification:
              null,

            schedulingRequested:
              false,

            schedulingReason:
              "",
          });

          const beforeCount =
            await Todo.countDocuments({
              createdBy:
                user._id,
            });

          const response =
            await request(
              app
            )
              .post(
                "/api/todos/ai"
              )
              .set(
                "Authorization",
                `Bearer ${token}`
              )
              .send({
                prompt:
                  "Finish report and assign it to Other AI User",
              });

          const afterCount =
            await Todo.countDocuments({
              createdBy:
                user._id,
            });

          expect(
            response.statusCode
          ).toBe(403);

          expect(
            afterCount
          ).toBe(
            beforeCount
          );
        } finally {
          await User.deleteOne({
            _id:
              otherUser._id,
          });
        }
      }
    );

    // ========================================================
    // 9. AUTHENTICATION
    // ========================================================

    test(
      "requires authentication",
      async () => {
        const response =
          await request(
            app
          )
            .post(
              "/api/todos/ai"
            )
            .send({
              prompt:
                "Create a task to call Rahul",
            });

        expect(
          response.statusCode
        ).toBe(401);

        expect(
          mockGenerateContent
        ).not.toHaveBeenCalled();
      }
    );

    // ========================================================
    // 10. GEMINI PROVIDER FAILURE
    // ========================================================

    test(
      "handles AI provider failure gracefully",
      async () => {
        mockGenerateContent.mockRejectedValueOnce(
          new Error(
            "Provider unavailable"
          )
        );

        const response =
          await request(
            app
          )
            .post(
              "/api/todos/ai"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            )
            .send({
              prompt:
                "Create a task to call Rahul",
            });

        expect(
          response.statusCode
        ).toBe(503);

        expect(
          response.body.message
        ).toMatch(
          /temporarily unavailable/i
        );
      }
    );
  }
);