const mongoose = require("mongoose");

const Todo = require("../models/Todo");

const User = require("../models/User");

const Comment = require("../models/Comment");

const Activity = require("../models/Activity");

const {
  uploadAttachmentFile,
} = require("../utils/attachmentService");

const {
  createActivity,
} = require("../utils/activityService");

const {
  createNotification,
} = require("../utils/notificationService");

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
  return mongoose.Types.ObjectId.isValid(
    id
  );
};

// ==========================================
// Validate Due Date
// ==========================================

const isValidDate = (value) => {
  return (
    value !== undefined &&
    value !== null &&
    value !== "" &&
    !Number.isNaN(
      new Date(value).getTime()
    )
  );
};

// ==========================================
// Get Start and End of Due Date
// ==========================================

const getDueDateRange = (value) => {
  if (!isValidDate(value)) {
    return null;
  }

  const start = new Date(value);

  start.setHours(
    0,
    0,
    0,
    0
  );

  const end = new Date(start);

  end.setDate(
    end.getDate() + 1
  );

  return {
    start,
    end,
  };
};

// ==========================================
// Check Todo View Permission
//
// Normal User:
// - Creator
// - Assigned User
//
// Admin:
// - Any Todo
// ==========================================

const getAccessibleTodo = async (
  todoId,
  user
) => {
  const filter = {
    _id: todoId,
    isDeleted: false,
  };

  if (
    user.role !== "admin"
  ) {
    filter.$or = [
      {
        createdBy:
          user._id,
      },
      {
        assignedTo:
          user._id,
      },
    ];
  }

  return await Todo.findOne(
    filter
  );
};

// ==========================================
// Create Todo
// POST /api/todos
// ==========================================

const createTodo = async (
  req,
  res
) => {
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
        message:
          "Title is required",
      });
    }

    if (
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Description must be a string",
      });
    }

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be pending, in-progress or completed",
      });
    }

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

    if (
      dueDate !== undefined &&
      dueDate !== null &&
      dueDate !== "" &&
      !isValidDate(dueDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid due date",
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message:
          "assignedTo is required",
      });
    }

    if (
      !isValidId(assignedTo)
    ) {
      return res.status(400).json({
        success: false,
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
        success: false,
        message:
          "Assigned user not found",
      });
    }

    const todo =
      await Todo.create({
        title: title.trim(),

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
            ? new Date(dueDate)
            : null,
      });

    await createActivity({
      action:
        "Todo Created",

      performedBy:
        req.user._id,

      todoId:
        todo._id,

      metadata: {
        title:
          todo.title,
      },
    });

    await createActivity({
      action:
        "Todo Assigned",

      performedBy:
        req.user._id,

      todoId:
        todo._id,

      metadata: {
        assignedTo:
          todo.assignedTo,
      },
    });

    // ==========================================
    // Notification: Todo Assigned
    // ==========================================

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

    res.status(201).json({
      success: true,

      message:
        "Todo created successfully",

      data:
        populatedTodo,
    });
  } catch (error) {
    res.status(500).json({
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

const getTodos = async (
  req,
  res
) => {
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

    const filter = {
      isDeleted: false,
    };

    if (
      req.user.role !== "admin"
    ) {
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

    if (
      status &&
      allowedStatuses.includes(
        status
      )
    ) {
      filter.status = status;
    }

    if (
      priority &&
      allowedPriorities.includes(
        priority
      )
    ) {
      filter.priority = priority;
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
        getDueDateRange(
          dueDate
        );

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

    if (
      sort === "oldest"
    ) {
      sortOption = {
        createdAt: 1,
      };
    }

    if (
      sort === "dueDate"
    ) {
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

    res.status(200).json({
      success: true,

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
    });
  } catch (error) {
    res.status(500).json({
      success: false,
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

    if (
      !isValidId(id)
    ) {
      return res.status(400).json({
        success: false,
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
        success: false,
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

    res.status(200).json({
      success: true,
      data:
        populatedTodo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
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

    if (
      !isValidId(id)
    ) {
      return res.status(400).json({
        success: false,
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
        success: false,
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
      todo.dueDate;

    if (
      title !== undefined
    ) {
      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Title cannot be empty",
        });
      }

      todo.title =
        title.trim();
    }

    if (
      description !== undefined
    ) {
      if (
        typeof description !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Description must be a string",
        });
      }

      todo.description =
        description.trim();
    }

    if (
      status !== undefined
    ) {
      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be pending, in-progress or completed",
        });
      }

      todo.status =
        status;
    }

    if (
      priority !== undefined
    ) {
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

      todo.priority =
        priority;
    }

    if (
      dueDate !== undefined
    ) {
      if (
        dueDate === null ||
        dueDate === ""
      ) {
        todo.dueDate =
          null;
      } else if (
        !isValidDate(
          dueDate
        )
      ) {
        return res.status(400).json({
          success: false,
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
      assignedTo !== undefined
    ) {
      if (
        !assignedTo
      ) {
        return res.status(400).json({
          success: false,
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
          success: false,
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
          success: false,
          message:
            "Assigned user not found",
        });
      }

      todo.assignedTo =
        assignedTo;
    }

    await todo.save();

    const newAssignedTo =
      todo.assignedTo
        ? todo.assignedTo.toString()
        : null;

    if (
      oldTitle !==
      todo.title
    ) {
      await createActivity({
        action:
          "Todo Title Updated",

        performedBy:
          req.user._id,

        todoId:
          todo._id,

        metadata: {
          oldTitle,
          newTitle:
            todo.title,
        },
      });
    }

    if (
      oldDescription !==
      todo.description
    ) {
      await createActivity({
        action:
          "Todo Description Updated",

        performedBy:
          req.user._id,

        todoId:
          todo._id,
      });
    }

    if (
      oldAssignedTo !==
      newAssignedTo
    ) {
      await createActivity({
        action:
          "Todo Assigned",

        performedBy:
          req.user._id,

        todoId:
          todo._id,

        metadata: {
          oldAssignedTo,
          newAssignedTo,
        },
      });
    }

    if (
      oldStatus !==
      todo.status
    ) {
      await createActivity({
        action:
          "Todo Status Changed",

        performedBy:
          req.user._id,

        todoId:
          todo._id,

        metadata: {
          oldStatus,
          newStatus:
            todo.status,
        },
      });
    }

    if (
      oldPriority !==
      todo.priority
    ) {
      await createActivity({
        action:
          "Todo Priority Changed",

        performedBy:
          req.user._id,

        todoId:
          todo._id,

        metadata: {
          oldPriority,
          newPriority:
            todo.priority,
        },
      });
    }

    if (
      String(
        oldDueDate
      ) !==
      String(
        todo.dueDate
      )
    ) {
      await createActivity({
        action:
          "Todo Due Date Updated",

        performedBy:
          req.user._id,

        todoId:
          todo._id,

        metadata: {
          oldDueDate,
          newDueDate:
            todo.dueDate,
        },
      });
    }

    // ==========================================
    // Notification: Todo Assigned
    // ==========================================

    if (
      oldAssignedTo !==
        newAssignedTo &&
      newAssignedTo
    ) {
      await createNotification({
        userId:
          newAssignedTo,

        todoId:
          todo._id,

        type:
          "todo_assigned",

        message:
          `Todo "${todo.title}" has been assigned to you`,
      });
    }

    // ==========================================
    // Notification: Todo Status Changed
    // ==========================================

    if (
      oldStatus !==
      todo.status
    ) {
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
        });
      }
    }

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

    res.status(200).json({
      success: true,

      message:
        "Todo updated successfully",

      data:
        updatedTodo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ==========================================
// Update Todo Status
// PATCH /api/todos/:id/status
// ==========================================

const updateTodoStatus =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const { status } =
        req.body;

      if (
        !isValidId(id)
      ) {
        return res.status(400).json({
          success: false,
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
          success: false,
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
          success: false,
          message:
            "Todo not found",
        });
      }

      const oldStatus =
        todo.status;

      todo.status =
        status;

      await todo.save();

      if (
        oldStatus !==
        status
      ) {
        await createActivity({
          action:
            "Todo Status Changed",

          performedBy:
            req.user._id,

          todoId:
            todo._id,

          metadata: {
            oldStatus,
            newStatus:
              status,
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
              "todo_status_changed",

            message:
              `Todo "${todo.title}" status changed from ${oldStatus} to ${status}`,
          });
        }
      }

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

      res.status(200).json({
        success: true,

        message:
          "Todo status updated successfully",

        data:
          updatedTodo,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
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

    if (
      !isValidId(id)
    ) {
      return res.status(400).json({
        success: false,
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
        success: false,
        message:
          "Todo not found",
      });
    }

    const isOwner =
      todo.createdBy.toString() ===
      req.user._id.toString();

    const isAdmin =
      req.user.role === "admin";

    if (
      !isOwner &&
      !isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to delete this Todo",
      });
    }

    todo.isDeleted =
      true;

    todo.deletedAt =
      new Date();

    await todo.save();

    await createActivity({
      action:
        "Todo Deleted",

      performedBy:
        req.user._id,

      todoId:
        todo._id,

      metadata: {
        title:
          todo.title,
      },
    });

    res.status(200).json({
      success: true,

      message:
        "Todo moved to trash successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
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

      if (
        !isValidId(id)
      ) {
        return res.status(400).json({
          success: false,
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
          success: false,
          message:
            "Todo not found",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Attachment file is required",
        });
      }

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

      await createActivity({
        action:
          "Attachment Added",

        performedBy:
          req.user._id,

        todoId:
          todo._id,

        metadata: {
          attachmentUrl:
            todo.attachmentUrl,
        },
      });

      res.status(200).json({
        success: true,

        message:
          "Attachment uploaded successfully",

        data: {
          attachmentUrl:
            todo.attachmentUrl,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
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

    const { comment } =
      req.body;

    if (
      !isValidId(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Todo ID",
      });
    }

    if (
      !comment ||
      typeof comment !== "string" ||
      !comment.trim()
    ) {
      return res.status(400).json({
        success: false,
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
        success: false,
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
      action:
        "Comment Added",

      performedBy:
        req.user._id,

      todoId:
        todo._id,

      metadata: {
        commentId:
          newComment._id,

        comment:
          newComment.comment,
      },
    });

    // ==========================================
    // Notification: Comment Added
    // ==========================================

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

    res.status(201).json({
      success: true,

      message:
        "Comment added successfully",

      data:
        populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
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

      if (
        !isValidId(id)
      ) {
        return res.status(400).json({
          success: false,
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
          success: false,
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
            "name email"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,

        total:
          comments.length,

        data:
          comments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
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
      } =
        req.params;

      const { comment } =
        req.body;

      if (
        !isValidId(todoId) ||
        !isValidId(commentId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid ID",
        });
      }

      if (
        !comment ||
        typeof comment !== "string" ||
        !comment.trim()
      ) {
        return res.status(400).json({
          success: false,
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
          success: false,
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

      if (
        !existingComment
      ) {
        return res.status(404).json({
          success: false,
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
          success: false,
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
          "name email"
        );

      res.status(200).json({
        success: true,

        message:
          "Comment updated successfully",

        data:
          updatedComment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
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
      } =
        req.params;

      if (
        !isValidId(todoId) ||
        !isValidId(commentId)
      ) {
        return res.status(400).json({
          success: false,
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
          success: false,
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
          success: false,
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
          success: false,
          message:
            "You are not authorized to delete this comment",
        });
      }

      await Comment.findByIdAndDelete(
        comment._id
      );

      await createActivity({
        action:
          "Comment Deleted",

        performedBy:
          req.user._id,

        todoId:
          todo._id,

        metadata: {
          commentId:
            comment._id,
        },
      });

      res.status(200).json({
        success: true,

        message:
          "Comment deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
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

      if (
        !isValidId(id)
      ) {
        return res.status(400).json({
          success: false,
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
          success: false,
          message:
            "Todo not found",
        });
      }

      const activities =
        await Activity.find({
          todoId:
            todo._id,
        })
          .populate(
            "performedBy",
            "name email role"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,

        total:
          activities.length,

        data:
          activities,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ==========================================
// Export Controllers
// ==========================================

module.exports = {
  // Todo CRUD
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  updateTodoStatus,
  deleteTodo,

  // Attachment
  uploadTodoAttachment,

  // Comments
  addComment,
  getTodoComments,
  updateComment,
  deleteComment,

  // Activity
  getTodoActivity,

  // Common aliases for route compatibility
  getTodo: getTodoById,
  getSingleTodo: getTodoById,

  getActivityHistory: getTodoActivity,
  getTodoActivityHistory: getTodoActivity,

  getComments: getTodoComments,
};