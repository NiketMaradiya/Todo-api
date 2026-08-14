const mongoose = require("mongoose");
const Todo = require("../models/Todo");
const User = require("../models/User");

// ==========================================
// Allowed Status Values
// ==========================================

const allowedStatuses = [
  "pending",
  "in-progress",
  "completed",
];

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
    } = req.body;

    // Validate title
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

    // Validate description
    if (typeof description !== "string") {
      return res.status(400).json({
        success: false,
        message:
          "Description must be a string",
      });
    }

    // Validate status
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be pending, in-progress or completed",
      });
    }

    // Validate assignedTo
    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: "assignedTo is required",
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
        message: "Invalid assigned user ID",
      });
    }

    // Check assigned user exists
    const assignedUser =
      await User.findById(assignedTo);

    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message:
          "Assigned user not found",
      });
    }

    // Create Todo
    const todo = await Todo.create({
      title: title.trim(),
      description: description.trim(),
      status,
      createdBy: req.user._id,
      assignedTo,
    });

    // Populate user information
    const populatedTodo =
      await Todo.findById(todo._id)
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
      data: populatedTodo,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
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

const getTodos = async (req, res) => {
  try {
    const {
      search,
      status,
      page = 1,
      limit = 10,
      sort = "newest",
    } = req.query;

    // ==========================================
    // Validate Page
    // ==========================================

    const pageNumber = Number(page);

    if (
      !Number.isInteger(pageNumber) ||
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

    const limitNumber = Number(limit);

    if (
      !Number.isInteger(limitNumber) ||
      limitNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Limit must be a positive integer",
      });
    }

    if (limitNumber > 100) {
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
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be pending, in-progress or completed",
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

    // Normal Todo APIs must exclude soft-deleted todos.
    let filter = {
      isDeleted: false,
    };

    // Admin can see all active todos
    if (req.user.role !== "admin") {
      filter.$or = [
        {
          createdBy: req.user._id,
        },
        {
          assignedTo: req.user._id,
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
              $regex: search.trim(),
              $options: "i",
            },
          },
          {
            description: {
              $regex: search.trim(),
              $options: "i",
            },
          },
        ],
      };

      // Add search after authorization scope
      if (filter.$or) {
        filter = {
          $and: [
            {
              isDeleted: false,
            },
            {
              $or: filter.$or,
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
        filter.status = status;
      }
    }

    // ==========================================
    // Sorting
    // ==========================================

    const sortOption =
      sort === "oldest"
        ? { createdAt: 1 }
        : { createdAt: -1 };

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
      await Todo.countDocuments(filter);

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
      data: todos,

      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(
          total / limitNumber
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
    // Soft-deleted todos are excluded from normal statistics.
    let matchFilter = {
      isDeleted: false,
    };

    // Normal user scope
    if (req.user.role !== "admin") {
      const userId =
        new mongoose.Types.ObjectId(
          req.user._id
        );

      matchFilter.$or = [
        {
          createdBy: userId,
        },
        {
          assignedTo: userId,
        },
      ];
    }

    const result =
      await Todo.aggregate([
        {
          $match: matchFilter,
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: 1,
            },

            pending: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "pending",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            inProgress: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "in-progress",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            completed: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "completed",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

    const stats =
      result[0] || {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
      };

    delete stats._id;

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Todo By ID
// GET /api/todos/:id
//
// Normal User:
// Own created todo
// OR assigned todo
//
// Admin:
// Any todo
// ==========================================

const getTodoById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

    let filter = {
      _id: id,
      isDeleted: false,
    };

    if (req.user.role !== "admin") {
      filter.$or = [
        {
          createdBy: req.user._id,
        },
        {
          assignedTo: req.user._id,
        },
      ];
    }

    const todo =
      await Todo.findOne(filter)
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
          "Todo not found or access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: todo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Update Todo
// PUT /api/todos/:id
// PATCH /api/todos/:id
//
// Normal User:
// Only creator can update
//
// Admin:
// Can update any todo
// ==========================================

const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

    const {
      title,
      description,
      status,
      assignedTo,
    } = req.body;

    if (
      title === undefined &&
      description === undefined &&
      status === undefined &&
      assignedTo === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide title, description, status or assignedTo",
      });
    }

    let filter = {
      _id: id,
      isDeleted: false,
    };

    // Normal user can update only own created todo
    if (req.user.role !== "admin") {
      filter.createdBy =
        req.user._id;
    }

    const todo =
      await Todo.findOne(filter);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message:
          "Todo not found or you are not the creator",
      });
    }

    // Update title
    if (title !== undefined) {
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

      todo.title = title.trim();
    }

    // Update description
    if (description !== undefined) {
      if (
        typeof description !== "string"
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
    if (status !== undefined) {
      if (
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be pending, in-progress or completed",
        });
      }

      todo.status = status;
    }

    // Update assigned user
    if (assignedTo !== undefined) {
      if (
        assignedTo === null
      ) {
        todo.assignedTo = null;
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

        todo.assignedTo = assignedTo;
      }
    }

    await todo.save();

    const updatedTodo =
      await Todo.findById(todo._id)
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
      data: updatedTodo,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
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
    const { id } = req.params;

    const { status } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

    if (
      !allowedStatuses.includes(status)
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

    if (req.user.role !== "admin") {
      filter.$or = [
        {
          createdBy: req.user._id,
        },
        {
          assignedTo: req.user._id,
        },
      ];
    }

    const todo =
      await Todo.findOne(filter);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message:
          "Todo not found or access denied",
      });
    }

    todo.status = status;

    await todo.save();

    res.status(200).json({
      success: true,
      message:
        "Todo status updated successfully",
      data: todo,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Delete Todo
// DELETE /api/todos/:id
//
// Normal User:
// Only own created todos
//
// Admin:
// Can delete any todo
// ==========================================

const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

    let filter = {
      _id: id,
      isDeleted: false,
    };

    if (req.user.role !== "admin") {
      filter.createdBy =
        req.user._id;
    }

    const todo =
      await Todo.findOne(filter);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message:
          "Todo not found or you are not the creator",
      });
    }

    // Soft Delete
    todo.isDeleted = true;
    todo.deletedAt = new Date();

    await todo.save();

    res.status(200).json({
      success: true,
      message:
        "Todo moved to trash successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Export All Functions
// ==========================================

module.exports = {
  createTodo,
  getTodos,
  getTodoStats,
  getTodoById,
  updateTodo,
  updateTodoStatus,
  deleteTodo,
};