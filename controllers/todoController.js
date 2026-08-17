const mongoose = require("mongoose");

const Todo =
  require("../models/Todo");

const User =
  require("../models/User");

const Comment =
  require("../models/Comment");

const Activity =
  require("../models/Activity");

const {
  uploadAttachmentFile,
} = require("../utils/attachmentService");

const {
  createActivity,
} = require("../utils/activityService");

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

  const start =
    new Date(value);

  start.setHours(
    0,
    0,
    0,
    0
  );

  const end =
    new Date(start);

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
  let filter = {
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

    // Validate title
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

    // Validate description
    if (
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Description must be a string",
      });
    }

    // Validate status
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

    // Validate priority
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

    // Validate due date
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

    // Validate assignedTo
    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message:
          "assignedTo is required",
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

    // Upload attachment
    const attachmentUrl =
      await uploadAttachmentFile(
        req.file
      );

    // Create Todo
    const todo =
      await Todo.create({
        title:
          title.trim(),

        description:
          description.trim(),

        status,

        priority,

        dueDate:
          dueDate === undefined ||
          dueDate === null ||
          dueDate === ""
            ? null
            : new Date(dueDate),

        createdBy:
          req.user._id,

        assignedTo,

        attachmentUrl,
      });

    // ==========================================
    // Activity: Todo Created
    // ==========================================

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

        assignedTo:
          todo.assignedTo,

        status:
          todo.status,

        priority:
          todo.priority,
      },
    });

    // ==========================================
    // Activity: Todo Assigned
    // ==========================================

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
    res.status(400).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ==========================================
// Get Todos
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
      overdue,
      page = 1,
      limit = 10,
      sort = "newest",
    } = req.query;

    const pageNumber =
      Number(page);

    if (
      !Number.isInteger(
        pageNumber
      ) ||
      pageNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Page must be a positive integer",
      });
    }

    const limitNumber =
      Number(limit);

    if (
      !Number.isInteger(
        limitNumber
      ) ||
      limitNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Limit must be a positive integer",
      });
    }

    if (
      limitNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Limit cannot be greater than 100",
      });
    }

    if (
      status &&
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
      priority &&
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
      dueDate &&
      !getDueDateRange(
        dueDate
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid due date",
      });
    }

    if (
      overdue !== undefined &&
      overdue !== "true" &&
      overdue !== "false"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Overdue must be true or false",
      });
    }

    if (
      sort !== "newest" &&
      sort !== "oldest"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sort must be newest or oldest",
      });
    }

    let filter = {
      isDeleted: false,
    };

    // Normal user scope
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

    // Search
    if (
      search &&
      typeof search === "string" &&
      search.trim()
    ) {
      const searchFilter = {
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
      };

      if (filter.$or) {
        filter = {
          $and: [
            {
              isDeleted: false,
            },
            {
              $or:
                filter.$or,
            },
            searchFilter,
          ],
        };
      } else {
        filter = {
          isDeleted: false,
          ...searchFilter,
        };
      }
    }

    // Status filter
    if (status) {
      if (filter.$and) {
        filter.$and.push({
          status,
        });
      } else {
        filter.status =
          status;
      }
    }

    // Priority filter
    if (priority) {
      if (filter.$and) {
        filter.$and.push({
          priority,
        });
      } else {
        filter.priority =
          priority;
      }
    }

    // Due date filter
    if (dueDate) {
      const dateRange =
        getDueDateRange(
          dueDate
        );

      const dueDateFilter = {
        dueDate: {
          $gte:
            dateRange.start,

          $lt:
            dateRange.end,
        },
      };

      if (filter.$and) {
        filter.$and.push(
          dueDateFilter
        );
      } else {
        filter.dueDate =
          dueDateFilter.dueDate;
      }
    }

    // Overdue filter
    if (
      overdue === "true"
    ) {
      const overdueFilter = {
        dueDate: {
          $ne: null,
          $lt:
            new Date(),
        },

        status: {
          $ne:
            "completed",
        },
      };

      if (filter.$and) {
        filter.$and.push(
          overdueFilter
        );
      } else if (
        filter.dueDate ||
        filter.status
      ) {
        const existingFilter = {
          ...filter,
        };

        filter = {
          $and: [
            existingFilter,
            overdueFilter,
          ],
        };
      } else {
        filter.dueDate =
          overdueFilter.dueDate;

        filter.status =
          overdueFilter.status;
      }
    }

    const sortOption =
      sort === "oldest"
        ? {
            createdAt: 1,
          }
        : {
            createdAt: -1,
          };

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const total =
      await Todo.countDocuments(
        filter
      );

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

    res.status(200).json({
      success: true,

      data:
        todos,

      pagination: {
        page:
          pageNumber,

        limit:
          limitNumber,

        total,

        totalPages:
          Math.ceil(
            total / limitNumber
          ),
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
// Get Todo Statistics
// GET /api/todos/stats
// ==========================================

const getTodoStats = async (
  req,
  res
) => {
  try {
    let matchStage = {
      isDeleted: false,
    };

    if (
      req.user.role !== "admin"
    ) {
      matchStage.$or = [
        {
          createdBy:
            new mongoose.Types.ObjectId(
              req.user._id
            ),
        },
        {
          assignedTo:
            new mongoose.Types.ObjectId(
              req.user._id
            ),
        },
      ];
    }

    const stats =
      await Todo.aggregate([
        {
          $match:
            matchStage,
        },

        {
          $group: {
            _id:
              "$status",

            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const result = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
    };

    stats.forEach(
      (item) => {
        result.total +=
          item.count;

        if (
          item._id ===
          "pending"
        ) {
          result.pending =
            item.count;
        }

        if (
          item._id ===
          "in-progress"
        ) {
          result.inProgress =
            item.count;
        }

        if (
          item._id ===
          "completed"
        ) {
          result.completed =
            item.count;
        }
      }
    );

    res.status(200).json({
      success: true,
      data: result,
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
// Get Todo By ID
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
// PUT/PATCH /api/todos/:id
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
        success: false,
        message:
          "Invalid Todo ID",
      });
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
    } = req.body;

    if (
      title === undefined &&
      description === undefined &&
      status === undefined &&
      priority === undefined &&
      dueDate === undefined &&
      assignedTo === undefined &&
      !req.file
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide title, description, status, priority, dueDate, assignedTo or attachment",
      });
    }

    let filter = {
      _id: id,
      isDeleted: false,
    };

    // Normal user can update
    // only own created Todo
    if (
      req.user.role !== "admin"
    ) {
      filter.createdBy =
        req.user._id;
    }

    const todo =
      await Todo.findOne(
        filter
      );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message:
          "Todo not found or you are not the creator",
      });
    }

    // Store old values
    const oldStatus =
      todo.status;

    const oldPriority =
      todo.priority;

    const oldAssignedTo =
      todo.assignedTo
        ? todo.assignedTo.toString()
        : null;

    const changes = {};

    // Update title
    if (
      title !== undefined
    ) {
      if (
        typeof title !==
          "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Title cannot be empty",
        });
      }

      if (
        todo.title !==
        title.trim()
      ) {
        changes.title = {
          from:
            todo.title,

          to:
            title.trim(),
        };
      }

      todo.title =
        title.trim();
    }

    // Update description
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

      if (
        todo.description !==
        description.trim()
      ) {
        changes.description = {
          from:
            todo.description,

          to:
            description.trim(),
        };
      }

      todo.description =
        description.trim();
    }

    // Update status
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

    // Update priority
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

      if (
        oldPriority !==
        priority
      ) {
        changes.priority = {
          from:
            oldPriority,

          to:
            priority,
        };
      }

      todo.priority =
        priority;
    }

    // Update due date
    if (
      dueDate !== undefined
    ) {
      const oldDueDate =
        todo.dueDate;

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
          new Date(dueDate);
      }

      changes.dueDate = {
        from:
          oldDueDate,

        to:
          todo.dueDate,
      };
    }

    // Update assigned user
    if (
      assignedTo !== undefined
    ) {
      if (
        assignedTo === null
      ) {
        todo.assignedTo =
          null;
      } else {
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
    }

    // Attachment
    if (req.file) {
      todo.attachmentUrl =
        await uploadAttachmentFile(
          req.file
        );

      changes.attachment =
        "updated";
    }

    await todo.save();

    // ==========================================
    // Activity: Todo Updated
    // ==========================================

    if (
      Object.keys(changes).length > 0
    ) {
      await createActivity({
        action:
          "Todo Updated",

        performedBy:
          req.user._id,

        todoId:
          todo._id,

        metadata:
          changes,
      });
    }

    // ==========================================
    // Activity: Status Changed
    // ==========================================

    if (
      status !== undefined &&
      oldStatus !== status
    ) {
      await createActivity({
        action:
          "Todo Status Changed",

        performedBy:
          req.user._id,

        todoId:
          todo._id,

        metadata: {
          from:
            oldStatus,

          to:
            status,
        },
      });
    }

    // ==========================================
    // Activity: Todo Assigned
    // ==========================================

    const newAssignedTo =
      todo.assignedTo
        ? todo.assignedTo.toString()
        : null;

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
          from:
            oldAssignedTo,

          to:
            newAssignedTo,
        },
      });
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
    res.status(400).json({
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

    let filter = {
      _id: id,
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

    const todo =
      await Todo.findOne(
        filter
      );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message:
          "Todo not found or you do not have permission",
      });
    }

    const oldStatus =
      todo.status;

    todo.status =
      status;

    await todo.save();

    if (
      oldStatus !== status
    ) {
      await createActivity({
        action:
          "Todo Status Changed",

        performedBy:
          req.user._id,

        todoId:
          todo._id,

        metadata: {
          from:
            oldStatus,

          to:
            status,
        },
      });
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
    res.status(400).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ==========================================
// Delete Todo
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
        success: false,
        message:
          "Invalid Todo ID",
      });
    }

    let filter = {
      _id: id,
      isDeleted: false,
    };

    // Normal user only creator
    if (
      req.user.role !== "admin"
    ) {
      filter.createdBy =
        req.user._id;
    }

    const todo =
      await Todo.findOne(
        filter
      );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message:
          "Todo not found or you are not the creator",
      });
    }

    todo.isDeleted =
      true;

    todo.deletedAt =
      new Date();

    await todo.save();

    // ==========================================
    // Activity: Todo Deleted
    // ==========================================

    await createActivity({
      action:
        "Todo Deleted",

      performedBy:
        req.user._id,

      todoId:
        todo._id,

      metadata: {
        deletedAt:
          todo.deletedAt,
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
// Add Comment
// POST /api/todos/:id/comments
//
// Normal User:
// Creator OR Assigned User
//
// Admin:
// Any Todo
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
          "Todo not found or you do not have permission",
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

    // ==========================================
    // Activity: Comment Added
    // ==========================================

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

    const populatedComment =
      await Comment.findById(
        newComment._id
      ).populate(
        "userId",
        "name email role"
      );

    res.status(201).json({
      success: true,

      message:
        "Comment added successfully",

      data:
        populatedComment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ==========================================
// Get Todo Comments
// GET /api/todos/:id/comments
//
// Normal User:
// Creator OR Assigned User
//
// Admin:
// Any Todo
// ==========================================

const getTodoComments = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (!isValidId(id)) {
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
          "Todo not found or you do not have permission",
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
          createdAt: 1,
        });

    res.status(200).json({
      success: true,

      count:
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
// Get Todo Activity
// GET /api/todos/:id/activity
//
// Normal User:
// Creator OR Assigned User
//
// Admin:
// Any Todo
// ==========================================

const getTodoActivity = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (!isValidId(id)) {
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
          "Todo not found or you do not have permission",
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
          createdAt: 1,
        });

    res.status(200).json({
      success: true,

      count:
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
// EXPORT
// ==========================================

module.exports = {
  createTodo,
  getTodos,
  getTodoStats,
  getTodoById,
  updateTodo,
  updateTodoStatus,
  deleteTodo,

  // Comments
  addComment,
  getTodoComments,

  // Activity
  getTodoActivity,
};