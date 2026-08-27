const mongoose = require("mongoose");

const Todo = require("../models/Todo");
const User = require("../models/User");
const Comment = require("../models/Comment");

const todoCache = require("../utils/lfuCache");

const {
  uploadAttachmentFile,
} = require("../utils/attachmentService");

const {
  createActivity,
  getTodoActivities,
} = require("../utils/activityService");

const {
  createNotification,
} = require("../utils/notificationService");

const {
  withTransaction,
} = require("../utils/transactionService");

// ==========================================
// Allowed Status Values
// ==========================================

const allowedStatuses = [
  "pending",
  "in-progress",
  "completed",
];

// ==========================================
// Allowed Priority Values
// ==========================================

const allowedPriorities = [
  "low",
  "medium",
  "high",
];

// ==========================================
// Validate MongoDB ID
// ==========================================

const isValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// Validate Date
// ==========================================

const isValidDate = (value) => {
  return (
    value !== undefined &&
    value !== null &&
    value !== "" &&
    !Number.isNaN(new Date(value).getTime())
  );
};

// ==========================================
// Due Date Range
// ==========================================

const getDueDateRange = (value) => {
  if (!isValidDate(value)) {
    return null;
  }

  const start = new Date(value);

  start.setHours(0, 0, 0, 0);

  const end = new Date(start);

  end.setDate(end.getDate() + 1);

  return {
    start,
    end,
  };
};

// ==========================================
// CACHE HELPERS
// ==========================================

const buildTodoListCacheKey = (
  user,
  query
) => {
  const userId = user._id.toString();

  const keyParts = [
    "todos",
    `role:${user.role}`,
    `userId:${userId}`,
  ];

  const optionalParams = [
    "search",
    "status",
    "priority",
    "dueDate",
    "page",
    "limit",
    "sort",
  ];

  optionalParams.forEach((param) => {
    if (
      query[param] !== undefined &&
      query[param] !== null &&
      String(query[param]).trim() !== ""
    ) {
      keyParts.push(
        `${param}:${String(query[param]).trim()}`
      );
    }
  });

  return keyParts.join(":");
};

const invalidateTodoCache = () => {
  try {
    todoCache.invalidateTodos();
  } catch (error) {
    // Cache failure must never break Todo APIs
  }
};

// ==========================================
// Todo Permission
//
// Normal user:
// - creator
// - assigned user
//
// Admin:
// - every Todo
//
// This function includes deleted=false filtering
// for normal Todo operations.
// ==========================================

const getAccessibleTodo = async (
  todoId,
  user,
  session = null
) => {
  const filter = {
    _id: todoId,
    isDeleted: false,
  };

  if (user.role !== "admin") {
    filter.$or = [
      {
        createdBy: user._id,
      },
      {
        assignedTo: user._id,
      },
    ];
  }

  const query = Todo.findOne(filter);

  if (session) {
    query.session(session);
  }

  return query;
};

// ==========================================
// Create Todo
// POST /api/todos
// ==========================================

const createTodo = async (req, res) => {
  try {
    const {
      title,
      description = "",
      assignedTo,
      status = "pending",
      priority = "medium",
      dueDate,
    } = req.body;

    if (
      !title ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (typeof description !== "string") {
      return res.status(400).json({
        success: false,
        message:
          "Description must be a string",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be pending, in-progress or completed",
      });
    }

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message:
          "Priority must be low, medium or high",
      });
    }

    if (
      dueDate !== undefined &&
      dueDate !== null &&
      dueDate !== "" &&
      !isValidDate(dueDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date",
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message:
          "assignedTo is required",
      });
    }

    if (!isValidId(assignedTo)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid assigned user ID",
      });
    }

    const assignedUser =
      await User.findById(assignedTo);

    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message:
          "Assigned user not found",
      });
    }

    const todo = await withTransaction(
      async (session) => {
        const [todo] =
          await Todo.create(
            [
              {
                title:
                  title.trim(),

                description:
                  description.trim(),

                createdBy:
                  req.user._id,

                assignedTo,

                status,

                priority,

                dueDate:
                  dueDate &&
                  dueDate !== ""
                    ? new Date(
                        dueDate
                      )
                    : null,
              },
            ],
            { session }
          );

        await createActivity({
          todoId:
            todo._id,

          userId:
            req.user._id,

          action:
            "created",

          oldValue:
            null,

          newValue: {
            title:
              todo.title,

            description:
              todo.description,

            assignedTo:
              todo.assignedTo
                ? todo.assignedTo.toString()
                : null,

            status:
              todo.status,

            priority:
              todo.priority,

            dueDate:
              todo.dueDate
                ? todo.dueDate.toISOString()
                : null,
          },

          session,
        });

        await createActivity({
          todoId:
            todo._id,

          userId:
            req.user._id,

          action:
            "assigned",

          oldValue:
            null,

          newValue:
            todo.assignedTo
              ? todo.assignedTo.toString()
              : null,

          session,
        });

        if (
          todo.assignedTo &&
          todo.assignedTo.toString() !==
            req.user._id.toString()
        ) {
          await createNotification({
            userId:
              todo.assignedTo,

            todoId:
              todo._id,

            type:
              "todo_assigned",

            message:
              `Todo "${todo.title}" has been assigned to you`,

            session,
          });
        }

        return todo;
      }
    );

    invalidateTodoCache();

    const populatedTodo =
      await Todo.findById(
        todo._id
      )
        .populate(
          "createdBy",
          "name email role"
        )
        .populate(
          "assignedTo",
          "name email role"
        );

    return res.status(201).json({
      success: true,

      message:
        "Todo created successfully",

      data:
        populatedTodo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ==========================================
// Get All Todos
// GET /api/todos
// ==========================================

const getTodos = async (req, res) => {
  try {
    const {
      search,
      status,
      priority,
      dueDate,
      page = 1,
      limit = 10,
      sort = "newest",
    } = req.query;

    const cacheKey =
      buildTodoListCacheKey(
        req.user,
        req.query
      );

    try {
      const cachedResult =
        todoCache.get(cacheKey);

      if (cachedResult !== null) {
        return res.status(200).json({
          ...cachedResult,
          cache: {
            status: "HIT",
            key:
              cacheKey,
          },
        });
      }
    } catch (cacheError) {
      // Cache failure must never break API
    }

    const filter = {
      isDeleted: false,
    };

    if (req.user.role !== "admin") {
      filter.$or = [
        {
          createdBy:
            req.user._id,
        },
        {
          assignedTo:
            req.user._id,
        },
      ];
    }

    if (status) {
      if (
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be pending, in-progress or completed",
        });
      }

      filter.status =
        status;
    }

    if (priority) {
      if (
        !allowedPriorities.includes(
          priority
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Priority must be low, medium or high",
        });
      }

      filter.priority =
        priority;
    }

    if (
      search &&
      search.trim()
    ) {
      filter.$and = [
        {
          $or: [
            {
              title: {
                $regex:
                  search.trim(),
                $options: "i",
              },
            },
            {
              description: {
                $regex:
                  search.trim(),
                $options: "i",
              },
            },
          ],
        },
      ];
    }

    if (dueDate) {
      const range =
        getDueDateRange(dueDate);

      if (!range) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid due date",
        });
      }

      filter.dueDate = {
        $gte:
          range.start,
        $lt:
          range.end,
      };
    }

    const pageNumber =
      Math.max(
        Number(page) || 1,
        1
      );

    const limitNumber =
      Math.max(
        Number(limit) || 10,
        1
      );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    let sortOption = {
      createdAt: -1,
    };

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1,
      };
    }

    if (sort === "dueDate") {
      sortOption = {
        dueDate: 1,
      };
    }

    const todos =
      await Todo.find(filter)
        .populate(
          "createdBy",
          "name email role"
        )
        .populate(
          "assignedTo",
          "name email role"
        )
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber);

    const total =
      await Todo.countDocuments(
        filter
      );

    const responseData = {
      success:
        true,

      total,

      page:
        pageNumber,

      pages:
        Math.ceil(
          total /
            limitNumber
        ),

      data:
        todos,

      cache: {
        status:
          "MISS",

        key:
          cacheKey,
      },
    };

    try {
      todoCache.set(
        cacheKey,
        responseData
      );
    } catch (cacheError) {
      // Cache failure must never break API
    }

    return res.status(200).json(
      responseData
    );
  } catch (error) {
    return res.status(500).json({
      success:
        false,

      message:
        error.message,
    });
  }
};

// ==========================================
// Todo Statistics
// GET /api/todos/stats
// ==========================================

const getTodoStats = async (
  req,
  res
) => {
  try {
    const baseFilter = {
      isDeleted:
        false,
    };

    if (req.user.role !== "admin") {
      baseFilter.$or = [
        {
          createdBy:
            req.user._id,
        },
        {
          assignedTo:
            req.user._id,
        },
      ];
    }

    const [
      total,
      pending,
      inProgress,
      completed,
      highPriority,
      mediumPriority,
      lowPriority,
    ] =
      await Promise.all([
        Todo.countDocuments(
          baseFilter
        ),

        Todo.countDocuments({
          ...baseFilter,
          status:
            "pending",
        }),

        Todo.countDocuments({
          ...baseFilter,
          status:
            "in-progress",
        }),

        Todo.countDocuments({
          ...baseFilter,
          status:
            "completed",
        }),

        Todo.countDocuments({
          ...baseFilter,
          priority:
            "high",
        }),

        Todo.countDocuments({
          ...baseFilter,
          priority:
            "medium",
        }),

        Todo.countDocuments({
          ...baseFilter,
          priority:
            "low",
        }),
      ]);

    return res.status(200).json({
      success: true,

      data: {
        total,

        status: {
          pending,

          inProgress,

          completed,
        },

        priority: {
          low:
            lowPriority,

          medium:
            mediumPriority,

          high:
            highPriority,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success:
        false,

      message:
        error.message,
    });
  }
};

// ==========================================
// Get Single Todo
// GET /api/todos/:id
// ==========================================

const getTodoById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success:
          false,

        message:
          "Invalid Todo ID",
      });
    }

    const todo =
      await getAccessibleTodo(
        id,
        req.user
      );

    if (!todo) {
      return res.status(404).json({
        success:
          false,

        message:
          "Todo not found",
      });
    }

    const populatedTodo =
      await Todo.findById(
        todo._id
      )
        .populate(
          "createdBy",
          "name email role"
        )
        .populate(
          "assignedTo",
          "name email role"
        );

    return res.status(200).json({
      success:
        true,

      data:
        populatedTodo,
    });
  } catch (error) {
    return res.status(500).json({
      success:
        false,

      message:
        error.message,
    });
  }
};

// ==========================================
// Update Todo
// PUT /api/todos/:id
// PATCH /api/todos/:id
// ==========================================

const updateTodo = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success:
          false,

        message:
          "Invalid Todo ID",
      });
    }

    const todo =
      await getAccessibleTodo(
        id,
        req.user
      );

    if (!todo) {
      return res.status(404).json({
        success:
          false,

        message:
          "Todo not found",
      });
    }

    const {
      title,
      description,
      assignedTo,
      status,
      priority,
      dueDate,
    } = req.body;

    const oldTitle =
      todo.title;

    const oldDescription =
      todo.description;

    const oldAssignedTo =
      todo.assignedTo
        ? todo.assignedTo.toString()
        : null;

    const oldStatus =
      todo.status;

    const oldPriority =
      todo.priority;

    const oldDueDate =
      todo.dueDate
        ? todo.dueDate.toISOString()
        : null;

    if (title !== undefined) {
      if (
        typeof title !==
          "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Title cannot be empty",
        });
      }

      todo.title =
        title.trim();
    }

    if (
      description !==
      undefined
    ) {
      if (
        typeof description !==
        "string"
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Description must be a string",
        });
      }

      todo.description =
        description.trim();
    }

    if (
      status !==
      undefined
    ) {
      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Status must be pending, in-progress or completed",
        });
      }

      todo.status =
        status;
    }

    if (
      priority !==
      undefined
    ) {
      if (
        !allowedPriorities.includes(
          priority
        )
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Priority must be low, medium or high",
        });
      }

      todo.priority =
        priority;
    }

    if (
      dueDate !==
      undefined
    ) {
      if (
        dueDate ===
          null ||
        dueDate ===
          ""
      ) {
        todo.dueDate =
          null;
      } else if (
        !isValidDate(
          dueDate
        )
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid due date",
        });
      } else {
        todo.dueDate =
          new Date(
            dueDate
          );
      }
    }

    if (
      assignedTo !==
      undefined
    ) {
      if (!assignedTo) {
        return res.status(400).json({
          success:
            false,

          message:
            "assignedTo cannot be empty",
        });
      }

      if (
        !isValidId(
          assignedTo
        )
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid assigned user ID",
        });
      }

      const assignedUser =
        await User.findById(
          assignedTo
        );

      if (!assignedUser) {
        return res.status(404).json({
          success:
            false,

          message:
            "Assigned user not found",
        });
      }

      todo.assignedTo =
        assignedTo;
    }

    await withTransaction(
      async (session) => {
        await todo.save({
          session,
        });

        const newAssignedTo =
          todo.assignedTo
            ? todo.assignedTo.toString()
            : null;

        const newDueDate =
          todo.dueDate
            ? todo.dueDate.toISOString()
            : null;

        const oldUpdateValues =
          {};

        const newUpdateValues =
          {};

        if (
          oldTitle !==
          todo.title
        ) {
          oldUpdateValues.title =
            oldTitle;

          newUpdateValues.title =
            todo.title;
        }

        if (
          oldDescription !==
          todo.description
        ) {
          oldUpdateValues.description =
            oldDescription;

          newUpdateValues.description =
            todo.description;
        }

        if (
          oldDueDate !==
          newDueDate
        ) {
          oldUpdateValues.dueDate =
            oldDueDate;

          newUpdateValues.dueDate =
            newDueDate;
        }

        if (
          Object.keys(
            oldUpdateValues
          ).length >
          0
        ) {
          await createActivity({
            todoId:
              todo._id,

            userId:
              req.user._id,

            action:
              "updated",

            oldValue:
              oldUpdateValues,

            newValue:
              newUpdateValues,

            session,
          });
        }

        if (
          oldAssignedTo !==
          newAssignedTo
        ) {
          const action =
            oldAssignedTo
              ? "reassigned"
              : "assigned";

          await createActivity({
            todoId:
              todo._id,

            userId:
              req.user._id,

            action,

            oldValue:
              oldAssignedTo,

            newValue:
              newAssignedTo,

            session,
          });

          if (newAssignedTo) {
            await createNotification({
              userId:
                newAssignedTo,

              todoId:
                todo._id,

              type:
                "todo_assigned",

              message:
                `Todo "${todo.title}" has been assigned to you`,

              session,
            });
          }
        }

        if (
          oldStatus !==
          todo.status
        ) {
          await createActivity({
            todoId:
              todo._id,

            userId:
              req.user._id,

            action:
              "status_changed",

            oldValue:
              oldStatus,

            newValue:
              todo.status,

            session,
          });

          const recipientIds = [
            todo.createdBy,
            todo.assignedTo,
          ]
            .filter(Boolean)
            .map(
              (userId) =>
                userId.toString()
            )
            .filter(
              (userId) =>
                userId !==
                req.user._id.toString()
            );

          const uniqueRecipients =
            [
              ...new Set(
                recipientIds
              ),
            ];

          for (
            const userId of
            uniqueRecipients
          ) {
            await createNotification({
              userId,

              todoId:
                todo._id,

              type:
                "todo_status_changed",

              message:
                `Todo "${todo.title}" status changed from ${oldStatus} to ${todo.status}`,

              session,
            });
          }
        }

        if (
          oldPriority !==
          todo.priority
        ) {
          await createActivity({
            todoId:
              todo._id,

            userId:
              req.user._id,

            action:
              "priority_changed",

            oldValue:
              oldPriority,

            newValue:
              todo.priority,

            session,
          });
        }
      }
    );

    invalidateTodoCache();

    const updatedTodo =
      await Todo.findById(
        todo._id
      )
        .populate(
          "createdBy",
          "name email role"
        )
        .populate(
          "assignedTo",
          "name email role"
        );

    return res.status(200).json({
      success:
        true,

      message:
        "Todo updated successfully",

      data:
        updatedTodo,
    });
  } catch (error) {
    return res.status(500).json({
      success:
        false,

      message:
        error.message,
    });
  }
};

// ==========================================
// Update Todo Status
// PATCH /api/todos/:id/status
// ==========================================

const updateTodoStatus = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const { status } =
      req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success:
          false,

        message:
          "Invalid Todo ID",
      });
    }

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success:
          false,

        message:
          "Status must be pending, in-progress or completed",
      });
    }

    const todo =
      await getAccessibleTodo(
        id,
        req.user
      );

    if (!todo) {
      return res.status(404).json({
        success:
          false,

        message:
          "Todo not found",
      });
    }

    const oldStatus =
      todo.status;

    todo.status =
      status;

    await withTransaction(
      async (session) => {
        await todo.save({
          session,
        });

        if (
          oldStatus !==
          status
        ) {
          await createActivity({
            todoId:
              todo._id,

            userId:
              req.user._id,

            action:
              "status_changed",

            oldValue:
              oldStatus,

            newValue:
              status,

            session,
          });

          const recipientIds = [
            todo.createdBy,
            todo.assignedTo,
          ]
            .filter(Boolean)
            .map(
              (userId) =>
                userId.toString()
            )
            .filter(
              (userId) =>
                userId !==
                req.user._id.toString()
            );

          const uniqueRecipients =
            [
              ...new Set(
                recipientIds
              ),
            ];

          for (
            const userId of
            uniqueRecipients
          ) {
            await createNotification({
              userId,

              todoId:
                todo._id,

              type:
                "todo_status_changed",

              message:
                `Todo "${todo.title}" status changed from ${oldStatus} to ${status}`,

              session,
            });
          }
        }
      }
    );

    invalidateTodoCache();

    const updatedTodo =
      await Todo.findById(
        todo._id
      )
        .populate(
          "createdBy",
          "name email role"
        )
        .populate(
          "assignedTo",
          "name email role"
        );

    return res.status(200).json({
      success:
        true,

      message:
        "Todo status updated successfully",

      data:
        updatedTodo,
    });
  } catch (error) {
    return res.status(500).json({
      success:
        false,

      message:
        error.message,
    });
  }
};

// ==========================================
// Soft Delete Todo
// DELETE /api/todos/:id
// ==========================================

const deleteTodo = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success:
          false,

        message:
          "Invalid Todo ID",
      });
    }

    const todo =
      await getAccessibleTodo(
        id,
        req.user
      );

    if (!todo) {
      return res.status(404).json({
        success:
          false,

        message:
          "Todo not found",
      });
    }

    const isOwner =
      todo.createdBy.toString() ===
      req.user._id.toString();

    const isAdmin =
      req.user.role ===
      "admin";

    if (
      !isOwner &&
      !isAdmin
    ) {
      return res.status(403).json({
        success:
          false,

        message:
          "You are not authorized to delete this Todo",
      });
    }

    const oldDeletedValue =
      todo.isDeleted;

    todo.isDeleted =
      true;

    todo.deletedAt =
      new Date();

    await withTransaction(
      async (session) => {
        await todo.save({
          session,
        });

        await createActivity({
          todoId:
            todo._id,

          userId:
            req.user._id,

          action:
            "soft_deleted",

          oldValue:
            oldDeletedValue,

          newValue:
            true,

          session,
        });
      }
    );

    invalidateTodoCache();

    return res.status(200).json({
      success:
        true,

      message:
        "Todo moved to trash successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success:
        false,

      message:
        error.message,
    });
  }
};

// ==========================================
// Upload Todo Attachment
// POST /api/todos/:id/attachment
// ==========================================

const uploadTodoAttachment =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid Todo ID",
        });
      }

      const todo =
        await getAccessibleTodo(
          id,
          req.user
        );

      if (!todo) {
        return res.status(404).json({
          success:
            false,

          message:
            "Todo not found",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success:
            false,

          message:
            "Attachment file is required",
        });
      }

      const oldAttachmentUrl =
        todo.attachmentUrl ||
        null;

      const uploadResult =
        await uploadAttachmentFile(
          req.file
        );

      todo.attachmentUrl =
        uploadResult.url;

      todo.attachmentPublicId =
        uploadResult.public_id ||
        null;

      await todo.save();

      invalidateTodoCache();

      await createActivity({
        todoId:
          todo._id,

        userId:
          req.user._id,

        action:
          "attachment_added",

        oldValue:
          oldAttachmentUrl,

        newValue:
          todo.attachmentUrl,
      });

      return res.status(200).json({
        success:
          true,

        message:
          "Attachment uploaded successfully",

        data: {
          attachmentUrl:
            todo.attachmentUrl,

          attachmentPublicId:
            todo.attachmentPublicId,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success:
          false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// Add Comment
// POST /api/todos/:id/comments
// ==========================================

const addComment = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const {
      comment,
    } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success:
          false,

        message:
          "Invalid Todo ID",
      });
    }

    if (
      !comment ||
      typeof comment !==
        "string" ||
      !comment.trim()
    ) {
      return res.status(400).json({
        success:
          false,

        message:
          "Comment is required",
      });
    }

    const todo =
      await getAccessibleTodo(
        id,
        req.user
      );

    if (!todo) {
      return res.status(404).json({
        success:
          false,

        message:
          "Todo not found",
      });
    }

    const newComment =
      await Comment.create({
        todoId:
          todo._id,

        userId:
          req.user._id,

        comment:
          comment.trim(),
      });

    await createActivity({
      todoId:
        todo._id,

      userId:
        req.user._id,

      action:
        "comment_added",

      oldValue:
        null,

      newValue: {
        commentId:
          newComment._id,

        comment:
          newComment.comment,
      },
    });

    const recipientIds = [
      todo.createdBy,
      todo.assignedTo,
    ]
      .filter(Boolean)
      .map(
        (userId) =>
          userId.toString()
      )
      .filter(
        (userId) =>
          userId !==
          req.user._id.toString()
      );

    const uniqueRecipients =
      [
        ...new Set(
          recipientIds
        ),
      ];

    for (
      const userId of
      uniqueRecipients
    ) {
      await createNotification({
        userId,

        todoId:
          todo._id,

        type:
          "comment_added",

        message:
          `A new comment was added to Todo "${todo.title}"`,
      });
    }

    const populatedComment =
      await Comment.findById(
        newComment._id
      ).populate(
        "userId",
        "name email"
      );

    return res.status(201).json({
      success:
        true,

      message:
        "Comment added successfully",

      data:
        populatedComment,
    });
  } catch (error) {
    return res.status(500).json({
      success:
        false,

      message:
        error.message,
    });
  }
};

// ==========================================
// Get Todo Comments
// GET /api/todos/:id/comments
// ==========================================

const getTodoComments =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid Todo ID",
        });
      }

      const todo =
        await getAccessibleTodo(
          id,
          req.user
        );

      if (!todo) {
        return res.status(404).json({
          success:
            false,

          message:
            "Todo not found",
        });
      }

      const comments =
        await Comment.find({
          todoId:
            todo._id,
        })
          .populate(
            "userId",
            "name email role"
          )
          .sort({
            createdAt:
              -1,
          });

      return res.status(200).json({
        success:
          true,

        total:
          comments.length,

        data:
          comments,
      });
    } catch (error) {
      return res.status(500).json({
        success:
          false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// Update Comment
// PATCH /api/todos/:todoId/comments/:commentId
// ==========================================

const updateComment =
  async (
    req,
    res
  ) => {
    try {
      const {
        todoId,
        commentId,
      } = req.params;

      const {
        comment,
      } = req.body;

      if (
        !isValidId(
          todoId
        ) ||
        !isValidId(
          commentId
        )
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid ID",
        });
      }

      if (
        !comment ||
        typeof comment !==
          "string" ||
        !comment.trim()
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Comment is required",
        });
      }

      const todo =
        await getAccessibleTodo(
          todoId,
          req.user
        );

      if (!todo) {
        return res.status(404).json({
          success:
            false,

          message:
            "Todo not found",
        });
      }

      const existingComment =
        await Comment.findOne({
          _id:
            commentId,

          todoId:
            todo._id,
        });

      if (!existingComment) {
        return res.status(404).json({
          success:
            false,

          message:
            "Comment not found",
        });
      }

      const isOwner =
        existingComment.userId.toString() ===
        req.user._id.toString();

      const isAdmin =
        req.user.role ===
        "admin";

      if (
        !isOwner &&
        !isAdmin
      ) {
        return res.status(403).json({
          success:
            false,

          message:
            "You are not authorized to update this comment",
        });
      }

      existingComment.comment =
        comment.trim();

      await existingComment.save();

      const updatedComment =
        await Comment.findById(
          existingComment._id
        ).populate(
          "userId",
          "name email role"
        );

      return res.status(200).json({
        success:
          true,

        message:
          "Comment updated successfully",

        data:
          updatedComment,
      });
    } catch (error) {
      return res.status(500).json({
        success:
          false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// Delete Comment
// DELETE /api/todos/:todoId/comments/:commentId
// ==========================================

const deleteComment =
  async (
    req,
    res
  ) => {
    try {
      const {
        todoId,
        commentId,
      } = req.params;

      if (
        !isValidId(
          todoId
        ) ||
        !isValidId(
          commentId
        )
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid ID",
        });
      }

      const todo =
        await getAccessibleTodo(
          todoId,
          req.user
        );

      if (!todo) {
        return res.status(404).json({
          success:
            false,

          message:
            "Todo not found",
        });
      }

      const comment =
        await Comment.findOne({
          _id:
            commentId,

          todoId:
            todo._id,
        });

      if (!comment) {
        return res.status(404).json({
          success:
            false,

          message:
            "Comment not found",
        });
      }

      const isOwner =
        comment.userId.toString() ===
        req.user._id.toString();

      const isAdmin =
        req.user.role ===
        "admin";

      if (
        !isOwner &&
        !isAdmin
      ) {
        return res.status(403).json({
          success:
            false,

          message:
            "You are not authorized to delete this comment",
        });
      }

      await Comment.findByIdAndDelete(
        comment._id
      );

      return res.status(200).json({
        success:
          true,

        message:
          "Comment deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success:
          false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// Get Todo Activity History
// GET /api/todos/:id/activity
// ==========================================

const getTodoActivity =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid Todo ID",
        });
      }

      const todo =
        await Todo.findById(
          id
        );

      if (!todo) {
        return res.status(404).json({
          success:
            false,

          message:
            "Todo not found",
        });
      }

      const isAdmin =
        req.user.role ===
        "admin";

      const isCreator =
        todo.createdBy &&
        todo.createdBy.toString() ===
          req.user._id.toString();

      const isAssigned =
        todo.assignedTo &&
        todo.assignedTo.toString() ===
          req.user._id.toString();

      if (
        !isAdmin &&
        !isCreator &&
        !isAssigned
      ) {
        return res.status(403).json({
          success:
            false,

          message:
            "You are not authorized to view this Todo activity",
        });
      }

      const activities =
        await getTodoActivities(
          todo._id
        );

      return res.status(200).json({
        success:
          true,

        total:
          activities.length,

        data:
          activities,
      });
    } catch (error) {
      return res.status(500).json({
        success:
          false,

        message:
          error.message,
      });
    }
  };

module.exports = {
  createTodo,
  getTodos,
  getTodoStats,
  getTodoById,
  updateTodo,
  updateTodoStatus,
  deleteTodo,
  uploadTodoAttachment,
  addComment,
  getTodoComments,
  updateComment,
  deleteComment,
  getTodoActivity,
};