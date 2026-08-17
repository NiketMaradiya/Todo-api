const mongoose = require("mongoose");
const Todo = require("../models/Todo");
const User = require("../models/User");
const {
  uploadAttachmentFile,
} = require("../utils/attachmentService");

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

    // Check valid MongoDB ID
    if (
      !mongoose.Types.ObjectId.isValid(
        assignedTo
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid assigned user ID",
      });
    }

    // Check assigned user exists
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

    // Upload attachment after all Todo input validation succeeds.
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

    // Populate user information
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
//
// Supports:
// Search
// Status Filter
// Priority Filter
// Due Date Filter
// Overdue Filter
// Pagination
// Sorting
// Combined Filters
//
// Normal User:
// Own created todos
// +
// Todos assigned to them
//
// Admin:
// All todos
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

    // ==========================================
    // Validate Page
    // ==========================================

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

    // ==========================================
    // Validate Limit
    // ==========================================

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

    // ==========================================
    // Validate Status
    // ==========================================

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

    // ==========================================
    // Validate Priority
    // ==========================================

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

    // ==========================================
    // Validate Due Date
    // ==========================================

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

    // ==========================================
    // Validate Overdue
    // ==========================================

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

    // ==========================================
    // Validate Sorting
    // ==========================================

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

    // ==========================================
    // Authorization / User Scope
    // ==========================================

    let filter = {
      isDeleted: false,
    };

    // Admin can see all active todos
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

    // ==========================================
    // Search
    // Search by title OR description
    // ==========================================

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

    // ==========================================
    // Status Filter
    // ==========================================

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

    // ==========================================
    // Priority Filter
    // ==========================================

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

    // ==========================================
    // Due Date Filter
    // ==========================================

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

    // ==========================================
    // Overdue Filter
    // ==========================================

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

    // ==========================================
    // Sorting
    // ==========================================

    const sortOption =
      sort === "oldest"
        ? {
            createdAt: 1,
          }
        : {
            createdAt: -1,
          };

    // ==========================================
    // Pagination
    // ==========================================

    const skip =
      (pageNumber - 1) *
      limitNumber;

    // ==========================================
    // MongoDB
    // ==========================================

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

    // ==========================================
    // Response
    // ==========================================

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
//
// Normal User:
// Own created todos
// +
// Assigned todos
//
// Admin:
// All todos
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

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
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
      )
        .populate(
          "createdBy",
          "name email role"
        )
        .populate(
          "assignedTo",
          "name email role"
        );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message:
          "Todo not found",
      });
    }

    res.status(200).json({
      success: true,
      data: todo,
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
//
// Normal User:
// Only creator can update
//
// Admin:
// Can update any Todo
// ==========================================

const updateTodo = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
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

    // Normal user can update only own created todo
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

      todo.priority =
        priority;
    }

    // Update due date
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
        !isValidDate(dueDate)
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
          !mongoose.Types.ObjectId.isValid(
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

    // Replace attachment only when new file is provided
    if (req.file) {
      todo.attachmentUrl =
        await uploadAttachmentFile(
          req.file
        );
    }

    await todo.save();

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
//
// Normal User:
// Creator OR assigned user
//
// Admin:
// Can update any todo
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

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
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

    todo.status =
      status;

    await todo.save();

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
//
// Normal User:
// Only creator can delete
//
// Admin:
// Can delete any todo
// ==========================================

const deleteTodo = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
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

module.exports = {
  createTodo,
  getTodos,
  getTodoStats,
  getTodoById,
  updateTodo,
  updateTodoStatus,
  deleteTodo,
};