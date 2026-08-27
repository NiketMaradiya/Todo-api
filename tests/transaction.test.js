const request = require("supertest");
const mongoose = require("mongoose");

jest.mock(
  "../utils/activityService",
  () => {
    const actual =
      jest.requireActual(
        "../utils/activityService"
      );

    return {
      ...actual,

      createActivity:
        jest.fn(
          actual.createActivity
        ),
    };
  }
);

jest.mock(
  "../utils/notificationService",
  () => {
    const actual =
      jest.requireActual(
        "../utils/notificationService"
      );

    return {
      ...actual,

      createNotification:
        jest.fn(
          actual.createNotification
        ),
    };
  }
);

const {
  createActivity,
} = require(
  "../utils/activityService"
);

const {
  createNotification,
} = require(
  "../utils/notificationService"
);

const User =
  require(
    "../models/User"
  );

const Todo =
  require(
    "../models/Todo"
  );

const TodoActivity =
  require(
    "../models/TodoActivity"
  );

const Notification =
  require(
    "../models/Notification"
  );

const app =
  require("../server");

describe(
  "Todo MongoDB Transactions",
  () => {
    const userAEmail =
      process.env.TEST_EMAIL_A ||
      `transaction-a-${Date.now()}@example.com`;

    const userBEmail =
      process.env.TEST_EMAIL_B ||
      `transaction-b-${Date.now()}@example.com`;

    const adminEmail =
      process.env.TEST_EMAIL_ADMIN ||
      `transaction-admin-${Date.now()}@example.com`;

    const password =
      "password123";

    let userA;
    let userB;
    let admin;

    let userAToken;
    let userBToken;
    let adminToken;

    const activityImplementation =
      createActivity.getMockImplementation();

    const notificationImplementation =
      createNotification.getMockImplementation();

    beforeAll(
      async () => {
        const hello =
          await mongoose.connection.db
            .admin()
            .command({
              hello: 1,
            });

        if (!hello.setName) {
          throw new Error(
            "MongoDB replica set is required for transaction tests"
          );
        }

        await Promise.all([
          Todo.deleteMany({}),
          TodoActivity.deleteMany({}),
          Notification.deleteMany({}),
          User.deleteMany({
            email: {
              $in: [
                userAEmail,
                userBEmail,
                adminEmail,
              ],
            },
          }),
        ]);

        userA =
          await User.create({
            name:
              "Transaction User A",

            email:
              userAEmail,

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

        userB =
          await User.create({
            name:
              "Transaction User B",

            email:
              userBEmail,

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

        admin =
          await User.create({
            name:
              "Transaction Admin",

            email:
              adminEmail,

            password,

            role:
              "admin",

            isActive:
              true,

            mustChangePassword:
              false,

            passwordChangedAt:
              new Date(),
          });

        const loginA =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                userAEmail,

              password,
            });

        const loginB =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                userBEmail,

              password,
            });

        const loginAdmin =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                adminEmail,

              password,
            });

        expect(
          loginA.statusCode
        ).toBe(200);

        expect(
          loginB.statusCode
        ).toBe(200);

        expect(
          loginAdmin.statusCode
        ).toBe(200);

        userAToken =
          loginA.body.token;

        userBToken =
          loginB.body.token;

        adminToken =
          loginAdmin.body.token;
      },
      30000
    );

    afterEach(() => {
      createActivity.mockImplementation(
        activityImplementation
      );

      createNotification.mockImplementation(
        notificationImplementation
      );
    });

    afterAll(
      async () => {
        await Promise.all([
          TodoActivity.deleteMany({}),

          Notification.deleteMany({}),

          Todo.deleteMany({}),

          User.deleteMany({
            email: {
              $in: [
                userAEmail,
                userBEmail,
                adminEmail,
              ],
            },
          }),
        ]);
      },
      30000
    );

    test(
      "creates Todo, activity and assignment notification in one committed transaction",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              title:
                "Transaction Commit Test",

              description:
                "All writes should commit",

              assignedTo:
                userB._id.toString(),

              status:
                "pending",

              priority:
                "medium",
            });

        expect(
          response.statusCode
        ).toBe(201);

        const todoId =
          response.body
            .data._id;

        expect(
          await Todo.exists({
            _id:
              todoId,
          })
        ).toBeTruthy();

        expect(
          await TodoActivity.countDocuments({
            todoId,

            action:
              "created",
          })
        ).toBe(1);

        expect(
          await TodoActivity.countDocuments({
            todoId,

            action:
              "assigned",
          })
        ).toBe(1);

        expect(
          await Notification.countDocuments({
            todoId,

            userId:
              userB._id,

            type:
              "todo_assigned",
          })
        ).toBe(1);

        const activityCall =
          createActivity.mock.calls.find(
            (args) =>
              args[0] &&
              args[0].action ===
                "created"
          );

        expect(
          activityCall
        ).toBeDefined();

        expect(
          activityCall[0].session
        ).toBeDefined();

        const notificationCall =
          createNotification.mock.calls.find(
            (args) =>
              args[0] &&
              args[0].type ===
                "todo_assigned"
          );

        expect(
          notificationCall
        ).toBeDefined();

        expect(
          notificationCall[0].session
        ).toBeDefined();
      }
    );

    test(
      "activity failure rolls back Todo creation",
      async () => {
        createActivity.mockRejectedValueOnce(
          new Error(
            "forced activity failure"
          )
        );

        const response =
          await request(app)
            .post(
              "/api/todos"
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              title:
                "Transaction Activity Rollback",

              assignedTo:
                userB._id.toString(),
            });

        expect(
          response.statusCode
        ).toBe(500);

        expect(
          await Todo.findOne({
            title:
              "Transaction Activity Rollback",
          })
        ).toBeNull();
      }
    );

    test(
      "notification failure rolls back Todo assignment and activity",
      async () => {
        const todo =
          await Todo.create({
            title:
              "Transaction Assignment Rollback",

            createdBy:
              userA._id,

            assignedTo:
              userA._id,

            status:
              "pending",
          });

        const activityBefore =
          await TodoActivity.countDocuments({
            todoId:
              todo._id,
          });

        createNotification.mockRejectedValueOnce(
          new Error(
            "forced notification failure"
          )
        );

        const response =
          await request(app)
            .patch(
              `/api/todos/${todo._id}`
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            )
            .send({
              assignedTo:
                userB._id.toString(),
            });

        expect(
          response.statusCode
        ).toBe(500);

        const storedTodo =
          await Todo.findById(
            todo._id
          );

        expect(
          storedTodo.assignedTo.toString()
        ).toBe(
          userA._id.toString()
        );

        expect(
          await TodoActivity.countDocuments({
            todoId:
              todo._id,
          })
        ).toBe(
          activityBefore
        );

        expect(
          await Notification.countDocuments({
            todoId:
              todo._id,

            userId:
              userB._id,

            type:
              "todo_assigned",
          })
        ).toBe(0);
      }
    );

    test(
      "status activity failure rolls back Todo status",
      async () => {
        const todo =
          await Todo.create({
            title:
              "Transaction Status Rollback",

            createdBy:
              userA._id,

            assignedTo:
              userB._id,

            status:
              "pending",
          });

        createActivity.mockRejectedValueOnce(
          new Error(
            "forced status activity failure"
          )
        );

        const response =
          await request(app)
            .patch(
              `/api/todos/${todo._id}/status`
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
        ).toBe(500);

        const storedTodo =
          await Todo.findById(
            todo._id
          );

        expect(
          storedTodo.status
        ).toBe(
          "pending"
        );
      }
    );

    test(
      "delete activity failure rolls back soft delete",
      async () => {
        const todo =
          await Todo.create({
            title:
              "Transaction Delete Rollback",

            createdBy:
              userA._id,

            assignedTo:
              userA._id,
          });

        createActivity.mockRejectedValueOnce(
          new Error(
            "forced delete activity failure"
          )
        );

        const response =
          await request(app)
            .delete(
              `/api/todos/${todo._id}`
            )
            .set(
              "Authorization",
              `Bearer ${userAToken}`
            );

        expect(
          response.statusCode
        ).toBe(500);

        const storedTodo =
          await Todo.findById(
            todo._id
          );

        expect(
          storedTodo.isDeleted
        ).toBe(false);

        expect(
          storedTodo.deletedAt
        ).toBeNull();
      }
    );

    test(
      "restore activity failure rolls back restore",
      async () => {
        const todo =
          await Todo.create({
            title:
              "Transaction Restore Rollback",

            createdBy:
              userA._id,

            assignedTo:
              userA._id,

            isDeleted:
              true,

            deletedAt:
              new Date(),
          });

        createActivity.mockRejectedValueOnce(
          new Error(
            "forced restore activity failure"
          )
        );

        const response =
          await request(app)
            .patch(
              `/api/admin/todos/${todo._id}/restore`
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(500);

        const storedTodo =
          await Todo.findById(
            todo._id
          );

        expect(
          storedTodo.isDeleted
        ).toBe(true);

        expect(
          storedTodo.deletedAt
        ).not.toBeNull();
      }
    );

    test(
      "concurrent status updates leave the database consistent",
      async () => {
        const todo =
          await Todo.create({
            title:
              "Transaction Concurrent Test",

            createdBy:
              userA._id,

            assignedTo:
              userB._id,

            status:
              "pending",
          });

        const [
          first,
          second,
        ] =
          await Promise.all([
            request(app)
              .patch(
                `/api/todos/${todo._id}/status`
              )
              .set(
                "Authorization",
                `Bearer ${userAToken}`
              )
              .send({
                status:
                  "in-progress",
              }),

            request(app)
              .patch(
                `/api/todos/${todo._id}/status`
              )
              .set(
                "Authorization",
                `Bearer ${userBToken}`
              )
              .send({
                status:
                  "completed",
              }),
          ]);

        expect(
          [
            first.statusCode,
            second.statusCode,
          ].every(
            (statusCode) =>
              [200, 500].includes(
                statusCode
              )
          )
        ).toBe(true);

        const storedTodo =
          await Todo.findById(
            todo._id
          );

        expect(
          [
            "pending",
            "in-progress",
            "completed",
          ].includes(
            storedTodo.status
          )
        ).toBe(true);

        const activities =
          await TodoActivity.find({
            todoId:
              todo._id,

            action:
              "status_changed",
          });

        expect(
          activities.length
        ).toBeLessThanOrEqual(
          2
        );
      }
    );
  }
);