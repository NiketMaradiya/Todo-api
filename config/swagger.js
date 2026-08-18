const swaggerUi =
  require("swagger-ui-express");

const swaggerDocument = {
  openapi: "3.0.3",

  info: {
    title: "Todo API",

    version: "1.0.0",

    description:
      "REST API for Todo management with JWT authentication, role-based authorization, password reset, notifications, attachments, audit logs, database indexing and optimized MongoDB queries.",
  },

  servers: [
    {
      url: "/",

      description:
        "Current server (local or ngrok)",
    },
  ],

  tags: [
    {
      name: "Health",
      description:
        "API health check",
    },

    {
      name: "Authentication",
      description:
        "Registration, login and password management",
    },

    {
      name: "Todos",
      description:
        "Todo CRUD, filters, statistics and audit history",
    },

    {
      name: "Comments",
      description:
        "Todo comments",
    },

    {
      name: "Attachments",
      description:
        "Todo file attachments",
    },

    {
      name: "Notifications",
      description:
        "User notifications",
    },

    {
      name: "Admin",
      description:
        "Administrator-only operations",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",

        scheme: "bearer",

        bearerFormat: "JWT",
      },
    },

    schemas: {
      User: {
        type: "object",

        properties: {
          _id: {
            type: "string",

            example:
              "66c000000000000000000001",
          },

          name: {
            type: "string",

            example:
              "Test User",
          },

          email: {
            type: "string",

            format: "email",

            example:
              "test@example.com",
          },

          role: {
            type: "string",

            enum: [
              "user",
              "admin",
            ],

            example:
              "user",
          },

          isActive: {
            type: "boolean",

            example: true,
          },

          mustChangePassword: {
            type: "boolean",

            example: false,
          },

          lastLoginAt: {
            type: "string",

            format: "date-time",

            nullable: true,
          },

          lastLoginIp: {
            type: "string",

            nullable: true,
          },

          createdAt: {
            type: "string",

            format: "date-time",
          },
        },
      },

      Todo: {
        type: "object",

        properties: {
          _id: {
            type: "string",
          },

          title: {
            type: "string",

            example:
              "Complete Todo API",
          },

          description: {
            type: "string",

            example:
              "Build the API documentation",
          },

          createdBy: {
            type: "string",
          },

          assignedTo: {
            type: "string",

            nullable: true,
          },

          attachmentUrl: {
            type: "string",

            nullable: true,
          },

          attachmentPublicId: {
            type: "string",

            nullable: true,
          },

          status: {
            type: "string",

            enum: [
              "pending",
              "in-progress",
              "completed",
            ],
          },

          priority: {
            type: "string",

            enum: [
              "low",
              "medium",
              "high",
            ],
          },

          dueDate: {
            type: "string",

            format: "date-time",

            nullable: true,
          },

          isDeleted: {
            type: "boolean",
          },

          deletedAt: {
            type: "string",

            format: "date-time",

            nullable: true,
          },

          createdAt: {
            type: "string",

            format: "date-time",
          },

          updatedAt: {
            type: "string",

            format: "date-time",
          },
        },
      },

      Comment: {
        type: "object",

        properties: {
          _id: {
            type: "string",
          },

          todoId: {
            type: "string",
          },

          userId: {
            type: "string",
          },

          comment: {
            type: "string",

            example:
              "Started working on this Todo.",
          },

          createdAt: {
            type: "string",

            format: "date-time",
          },

          updatedAt: {
            type: "string",

            format: "date-time",
          },
        },
      },

      Notification: {
        type: "object",

        properties: {
          _id: {
            type: "string",
          },

          userId: {
            type: "string",
          },

          todoId: {
            type: "string",

            nullable: true,
          },

          type: {
            type: "string",

            enum: [
              "todo_assigned",
              "todo_due_soon",
              "todo_overdue",
              "todo_status_changed",
              "comment_added",
            ],
          },

          message: {
            type: "string",
          },

          isRead: {
            type: "boolean",
          },

          createdAt: {
            type: "string",

            format: "date-time",
          },
        },
      },

      Activity: {
        type: "object",

        properties: {
          _id: {
            type: "string",
          },

          todoId: {
            type: "string",
          },

          userId: {
            type: "string",
          },

          action: {
            type: "string",

            enum: [
              "created",
              "updated",
              "assigned",
              "reassigned",
              "status_changed",
              "priority_changed",
              "comment_added",
              "soft_deleted",
              "restored",
              "attachment_added",
            ],
          },

          oldValue: {
            nullable: true,
          },

          newValue: {
            nullable: true,
          },

          createdAt: {
            type: "string",

            format: "date-time",
          },
        },
      },

      Error: {
        type: "object",

        properties: {
          success: {
            type: "boolean",

            example: false,
          },

          message: {
            type: "string",

            example:
              "Validation failed",
          },
        },
      },
    },
  },

  paths: {
    "/": {
      get: {
        tags: ["Health"],

        summary:
          "Health check",

        responses: {
          200: {
            description:
              "API is running",

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  properties: {
                    success: {
                      type: "boolean",
                    },

                    message: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/auth/register": {
      post: {
        tags: [
          "Authentication",
        ],

        summary:
          "Register a new user",

        description:
          "Creates a user with a generated temporary password and sends it by email. The user must change the password after first login.",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: [
                  "name",
                  "email",
                ],

                properties: {
                  name: {
                    type: "string",

                    example:
                      "Test User",
                  },

                  email: {
                    type: "string",

                    format: "email",

                    example:
                      "test@example.com",
                  },
                },
              },
            },
          },
        },

        responses: {
          201: {
            description:
              "User created",
          },

          400: {
            description:
              "Invalid input or user already exists",
          },

          500: {
            description:
              "Registration/email failure",
          },
        },
      },
    },

    "/api/auth/login": {
      post: {
        tags: [
          "Authentication",
        ],

        summary: "Login",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: [
                  "email",
                  "password",
                ],

                properties: {
                  email: {
                    type: "string",

                    format: "email",

                    example:
                      "test@example.com",
                  },

                  password: {
                    type: "string",

                    format: "password",

                    example:
                      "Password@123",
                  },
                },
              },
            },
          },
        },

        responses: {
          200: {
            description:
              "Login successful and JWT returned",
          },

          401: {
            description:
              "Invalid credentials",
          },

          403: {
            description:
              "Account disabled",
          },
        },
      },
    },

    "/api/auth/forgot-password": {
      post: {
        tags: [
          "Authentication",
        ],

        summary:
          "Request password reset",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: [
                  "email",
                ],

                properties: {
                  email: {
                    type: "string",

                    format: "email",

                    example:
                      "test@example.com",
                  },
                },
              },
            },
          },
        },

        responses: {
          200: {
            description:
              "Password reset request processed",
          },
        },
      },
    },

    "/api/auth/reset-password": {
      post: {
        tags: [
          "Authentication",
        ],

        summary:
          "Reset password using token",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: [
                  "token",
                  "newPassword",
                ],

                properties: {
                  token: {
                    type: "string",
                  },

                  newPassword: {
                    type: "string",

                    format: "password",

                    minLength: 6,

                    example:
                      "NewPassword@123",
                  },
                },
              },
            },
          },
        },

        responses: {
          200: {
            description:
              "Password reset successful",
          },

          400: {
            description:
              "Invalid or expired reset token",
          },
        },
      },
    },

    "/api/auth/change-password": {
      post: {
        tags: [
          "Authentication",
        ],

        summary:
          "Change password",

        security: [
          {
            bearerAuth: [],
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: [
                  "currentPassword",
                  "newPassword",
                ],

                properties: {
                  currentPassword: {
                    type: "string",

                    format: "password",
                  },

                  newPassword: {
                    type: "string",

                    format: "password",

                    minLength: 6,
                  },
                },
              },
            },
          },
        },

        responses: {
          200: {
            description:
              "Password changed successfully",
          },

          400: {
            description:
              "Current password is incorrect",
          },
        },
      },
    },

    "/api/auth/me": {
      get: {
        tags: [
          "Authentication",
        ],

        summary:
          "Get current user",

        security: [
          {
            bearerAuth: [],
          },
        ],

        responses: {
          200: {
            description:
              "Current user returned",
          },

          401: {
            description:
              "Authentication required",
          },
        },
      },
    },

    "/api/todos": {
      get: {
        tags: ["Todos"],

        summary:
          "List Todos",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "search",

            in: "query",

            schema: {
              type: "string",
            },
          },

          {
            name: "status",

            in: "query",

            schema: {
              type: "string",

              enum: [
                "pending",
                "in-progress",
                "completed",
              ],
            },
          },

          {
            name: "priority",

            in: "query",

            schema: {
              type: "string",

              enum: [
                "low",
                "medium",
                "high",
              ],
            },
          },

          {
            name: "page",

            in: "query",

            schema: {
              type: "integer",

              minimum: 1,

              default: 1,
            },
          },

          {
            name: "limit",

            in: "query",

            schema: {
              type: "integer",

              minimum: 1,

              maximum: 100,

              default: 10,
            },
          },

          {
            name: "sort",

            in: "query",

            schema: {
              type: "string",

              enum: [
                "newest",
                "oldest",
              ],

              default:
                "newest",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Todos returned",
          },

          401: {
            description:
              "Authentication required",
          },
        },
      },

      post: {
        tags: ["Todos"],

        summary:
          "Create Todo",

        security: [
          {
            bearerAuth: [],
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: [
                  "title",
                ],

                properties: {
                  title: {
                    type: "string",

                    example:
                      "Complete project",
                  },

                  description: {
                    type: "string",

                    example:
                      "Finish the Todo API project",
                  },

                  assignedTo: {
                    type: "string",

                    nullable: true,
                  },

                  status: {
                    type: "string",

                    enum: [
                      "pending",
                      "in-progress",
                      "completed",
                    ],

                    default:
                      "pending",
                  },

                  priority: {
                    type: "string",

                    enum: [
                      "low",
                      "medium",
                      "high",
                    ],

                    default:
                      "medium",
                  },

                  dueDate: {
                    type: "string",

                    format: "date-time",

                    nullable: true,
                  },
                },
              },
            },
          },
        },

        responses: {
          201: {
            description:
              "Todo created",
          },

          400: {
            description:
              "Invalid Todo data",
          },

          401: {
            description:
              "Authentication required",
          },
        },
      },
    },

    "/api/todos/{id}": {
      get: {
        tags: ["Todos"],

        summary:
          "Get Todo by ID",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Todo returned",
          },

          404: {
            description:
              "Todo not found",
          },
        },
      },

      put: {
        tags: ["Todos"],

        summary:
          "Update Todo",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                properties: {
                  title: {
                    type: "string",
                  },

                  description: {
                    type: "string",
                  },

                  assignedTo: {
                    type: "string",

                    nullable: true,
                  },

                  status: {
                    type: "string",

                    enum: [
                      "pending",
                      "in-progress",
                      "completed",
                    ],
                  },

                  priority: {
                    type: "string",

                    enum: [
                      "low",
                      "medium",
                      "high",
                    ],
                  },

                  dueDate: {
                    type: "string",

                    format: "date-time",

                    nullable: true,
                  },
                },
              },
            },
          },
        },

        responses: {
          200: {
            description:
              "Todo updated",
          },

          404: {
            description:
              "Todo not found",
          },
        },
      },

      patch: {
        tags: ["Todos"],

        summary:
          "Partially update Todo",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                additionalProperties: true,
              },
            },
          },
        },

        responses: {
          200: {
            description:
              "Todo updated",
          },

          404: {
            description:
              "Todo not found",
          },
        },
      },

      delete: {
        tags: ["Todos"],

        summary:
          "Soft-delete Todo",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Todo deleted",
          },

          404: {
            description:
              "Todo not found",
          },
        },
      },
    },

    "/api/todos/{id}/restore": {
      patch: {
        tags: ["Todos"],

        summary:
          "Restore deleted Todo",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Todo restored",
          },

          404: {
            description:
              "Deleted Todo not found",
          },
        },
      },
    },

    "/api/todos/{id}/comments": {
      get: {
        tags: ["Comments"],

        summary:
          "Get Todo comments",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Comments returned",
          },
        },
      },

      post: {
        tags: ["Comments"],

        summary:
          "Add comment to Todo",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: [
                  "comment",
                ],

                properties: {
                  comment: {
                    type: "string",

                    example:
                      "Started working on this Todo.",
                  },
                },
              },
            },
          },
        },

        responses: {
          201: {
            description:
              "Comment added",
          },
        },
      },
    },

    "/api/todos/{id}/attachments": {
      post: {
        tags: [
          "Attachments",
        ],

        summary:
          "Upload Todo attachment",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        requestBody: {
          required: true,

          content: {
            "multipart/form-data": {
              schema: {
                type: "object",

                properties: {
                  file: {
                    type: "string",

                    format: "binary",
                  },
                },

                required: [
                  "file",
                ],
              },
            },
          },
        },

        responses: {
          200: {
            description:
              "Attachment uploaded",
          },
        },
      },
    },

    "/api/notifications": {
      get: {
        tags: [
          "Notifications",
        ],

        summary:
          "Get current user notifications",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "page",

            in: "query",

            schema: {
              type: "integer",

              minimum: 1,

              default: 1,
            },
          },

          {
            name: "limit",

            in: "query",

            schema: {
              type: "integer",

              minimum: 1,

              maximum: 100,

              default: 10,
            },
          },
        ],

        responses: {
          200: {
            description:
              "Notifications returned",
          },
        },
      },
    },

    "/api/notifications/{id}/read": {
      patch: {
        tags: [
          "Notifications",
        ],

        summary:
          "Mark notification as read",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Notification marked as read",
          },
        },
      },
    },

    "/api/admin/users": {
      get: {
        tags: ["Admin"],

        summary:
          "List all users",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "search",

            in: "query",

            schema: {
              type: "string",
            },
          },

          {
            name: "role",

            in: "query",

            schema: {
              type: "string",

              enum: [
                "user",
                "admin",
              ],
            },
          },

          {
            name: "isActive",

            in: "query",

            schema: {
              type: "boolean",
            },
          },

          {
            name: "page",

            in: "query",

            schema: {
              type: "integer",

              minimum: 1,

              default: 1,
            },
          },

          {
            name: "limit",

            in: "query",

            schema: {
              type: "integer",

              minimum: 1,

              maximum: 100,

              default: 10,
            },
          },
        ],

        responses: {
          200: {
            description:
              "Users returned",
          },

          403: {
            description:
              "Admin role required",
          },
        },
      },
    },

    "/api/admin/users/{id}/password": {
      patch: {
        tags: ["Admin"],

        summary:
          "Admin reset user password",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: [
                  "newPassword",
                ],

                properties: {
                  newPassword: {
                    type: "string",

                    format: "password",

                    minLength: 6,
                  },
                },
              },
            },
          },
        },

        responses: {
          200: {
            description:
              "Password changed",
          },
        },
      },
    },

    "/api/admin/users/{id}/status": {
      patch: {
        tags: ["Admin"],

        summary:
          "Enable or disable a user",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: [
                  "isActive",
                ],

                properties: {
                  isActive: {
                    type: "boolean",
                  },
                },
              },
            },
          },
        },

        responses: {
          200: {
            description:
              "User status changed",
          },
        },
      },
    },

    "/api/admin/users/{id}": {
      delete: {
        tags: ["Admin"],

        summary:
          "Delete a user",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          200: {
            description:
              "User deleted",
          },
        },
      },
    },

    "/api/admin/todos": {
      get: {
        tags: ["Admin"],

        summary:
          "List all active Todos",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "search",

            in: "query",

            schema: {
              type: "string",
            },
          },

          {
            name: "status",

            in: "query",

            schema: {
              type: "string",

              enum: [
                "pending",
                "in-progress",
                "completed",
              ],
            },
          },

          {
            name: "createdBy",

            in: "query",

            schema: {
              type: "string",
            },
          },

          {
            name: "assignedTo",

            in: "query",

            schema: {
              type: "string",
            },
          },

          {
            name: "page",

            in: "query",

            schema: {
              type: "integer",

              minimum: 1,

              default: 1,
            },
          },

          {
            name: "limit",

            in: "query",

            schema: {
              type: "integer",

              minimum: 1,

              maximum: 100,

              default: 10,
            },
          },

          {
            name: "sort",

            in: "query",

            schema: {
              type: "string",

              enum: [
                "newest",
                "oldest",
              ],

              default:
                "newest",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Active Todos returned",
          },

          403: {
            description:
              "Admin role required",
          },
        },
      },
    },

    "/api/admin/todos/trash": {
      get: {
        tags: ["Admin"],

        summary:
          "List soft-deleted Todos",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "page",

            in: "query",

            schema: {
              type: "integer",

              minimum: 1,

              default: 1,
            },
          },

          {
            name: "limit",

            in: "query",

            schema: {
              type: "integer",

              minimum: 1,

              maximum: 100,

              default: 10,
            },
          },

          {
            name: "sort",

            in: "query",

            schema: {
              type: "string",

              enum: [
                "newest",
                "oldest",
              ],

              default:
                "newest",
            },
          },

          {
            name: "createdBy",

            in: "query",

            schema: {
              type: "string",
            },
          },

          {
            name: "assignedTo",

            in: "query",

            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Deleted Todos returned",
          },

          403: {
            description:
              "Admin role required",
          },
        },
      },
    },

    "/api/admin/todos/{id}": {
      get: {
        tags: ["Admin"],

        summary:
          "Get any active Todo",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Todo returned",
          },

          404: {
            description:
              "Todo not found",
          },
        },
      },

      put: {
        tags: ["Admin"],

        summary:
          "Update any active Todo",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                additionalProperties: true,
              },
            },
          },
        },

        responses: {
          200: {
            description:
              "Todo updated",
          },

          404: {
            description:
              "Todo not found",
          },
        },
      },

      patch: {
        tags: ["Admin"],

        summary:
          "Partially update any active Todo",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                additionalProperties: true,
              },
            },
          },
        },

        responses: {
          200: {
            description:
              "Todo updated",
          },
        },
      },

      delete: {
        tags: ["Admin"],

        summary:
          "Soft-delete any active Todo",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Todo soft-deleted",
          },
        },
      },
    },

    "/api/admin/todos/{id}/restore": {
      patch: {
        tags: ["Admin"],

        summary:
          "Restore a deleted Todo",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Todo restored",
          },

          404: {
            description:
              "Deleted Todo not found",
          },
        },
      },
    },
  },
};

// ==========================================
// Swagger Setup
// ==========================================

const setupSwagger =
  (app) => {
    // OpenAPI JSON
    app.get(
      "/api-docs.json",
      (req, res) => {
        res.json(
          swaggerDocument
        );
      }
    );

    // Swagger UI
    app.use(
      "/api-docs",
      swaggerUi.serve,

      swaggerUi.setup(
        swaggerDocument,
        {
          explorer: true,

          customSiteTitle:
            "Todo API Swagger Documentation",
        }
      )
    );
  };

module.exports = {
  swaggerDocument,
  setupSwagger,
};