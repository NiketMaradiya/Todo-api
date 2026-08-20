const request =
  require("supertest");

const mongoose =
  require("mongoose");

const app =
  require("../server");

const Todo =
  require("../models/Todo");

const User =
  require("../models/User");

const originalFetch =
  global.fetch;

describe(
  "AI Todo creation API",
  () => {
    let token;
    let user;

    const email =
      process.env.TEST_EMAIL_A;

    const password =
      "password123";

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

    beforeEach(() => {
      process.env.OPENAI_API_KEY =
        "test-key";
    });

    afterEach(() => {
      global.fetch =
        originalFetch;
    });

    afterAll(
      async () => {
        await Todo.deleteMany({
          createdBy:
            user._id,
        });

        await User.deleteOne({
          _id:
            user._id,
        });

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

    const mockAI = (
      payload
    ) => {
      global.fetch =
        jest
          .fn()
          .mockResolvedValue({
            ok: true,

            json:
              async () => ({
                output_text:
                  JSON.stringify(
                    payload
                  ),
              }),
          });
    };

    test(
      "creates a Todo from a simple sentence",
      async () => {
        mockAI({
          title:
            "Call Rahul about the project",

          description:
            "",

          dueDate:
            null,

          priority:
            "medium",

          assignedUserName:
            null,

          tags: [],

          dateAmbiguous:
            false,

          dateClarification:
            null,
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
      }
    );

    test(
      "extracts priority and due date correctly",
      async () => {
        const dueDate =
          "2026-08-21T17:00:00+05:30";

        mockAI({
          title:
            "Call Rahul about the project",

          description:
            "",

          dueDate,

          priority:
            "high",

          assignedUserName:
            null,

          tags: [
            "project",
          ],

          dateAmbiguous:
            false,

          dateClarification:
            null,
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
                "Tomorrow at 5 PM remind me to call Rahul about the project. Make it high priority.",
            });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          response.body.data
            .priority
        ).toBe(
          "high"
        );

        expect(
          response.body.data.tags
        ).toEqual([
          "project",
        ]);

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

    test(
      "resolves the logged-in user when explicitly assigned to them",
      async () => {
        mockAI({
          title:
            "Finish the client report",

          description:
            "",

          dueDate:
            null,

          priority:
            "high",

          assignedUserName:
            "AI Todo User",

          tags: [],

          dateAmbiguous:
            false,

          dateClarification:
            null,
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

    test(
      "handles missing prompt information without creating a Todo",
      async () => {
        mockAI({
          title:
            "",

          description:
            "",

          dueDate:
            null,

          priority:
            "medium",

          assignedUserName:
            null,

          tags: [],

          dateAmbiguous:
            false,

          dateClarification:
            null,
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

        expect(
          response.statusCode
        ).toBe(400);

        expect(
          response.body.success
        ).toBe(false);
      }
    );

    test(
      "handles ambiguous dates",
      async () => {
        mockAI({
          title:
            "Finish report",

          description:
            "",

          dueDate:
            null,

          priority:
            "medium",

          assignedUserName:
            null,

          tags: [],

          dateAmbiguous:
            true,

          dateClarification:
            "Which Friday do you mean?",
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

    test(
      "rejects an invalid AI priority",
      async () => {
        mockAI({
          title:
            "Invalid priority task",

          description:
            "",

          dueDate:
            null,

          priority:
            "urgent",

          assignedUserName:
            null,

          tags: [],

          dateAmbiguous:
            false,

          dateClarification:
            null,
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

    test(
      "handles an unknown assigned user",
      async () => {
        mockAI({
          title:
            "Finish report",

          description:
            "",

          dueDate:
            null,

          priority:
            "medium",

          assignedUserName:
            "Definitely Unknown User",

          tags: [],

          dateAmbiguous:
            false,

          dateClarification:
            null,
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

        expect(
          response.statusCode
        ).toBe(404);

        expect(
          response.body.message
        ).toMatch(
          /not found/i
        );
      }
    );

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

        mockAI({
          title:
            "Finish report",

          description:
            "",

          dueDate:
            null,

          priority:
            "high",

          assignedUserName:
            otherUser.email,

          tags: [],

          dateAmbiguous:
            false,

          dateClarification:
            null,
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

        await User.deleteOne({
          _id:
            otherUser._id,
        });
      }
    );

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
      }
    );

    test(
      "handles AI provider failure gracefully",
      async () => {
        global.fetch =
          jest
            .fn()
            .mockResolvedValue({
              ok: false,

              status:
                500,

              json:
                async () => ({
                  error: {
                    message:
                      "Provider unavailable",
                  },
                }),
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