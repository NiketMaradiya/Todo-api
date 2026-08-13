const mongoose = require("mongoose");
const Todo = require("../models/Todo");
const User = require("../models/User");

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
      status = "todo",
    } = req.body;

    // Validate title
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
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
        message: "Assigned user not found",
      });
    }

    // Create Todo
    // createdBy always comes from logged-in user
    const todo = await Todo.create({
      title: title.trim(),
      description: description.trim(),
      status,

      // IMPORTANT:
      // Never use createdBy from req.body
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
// Get User Todos
// GET /api/todos
//
// User can see:
// 1. Todos created by them
// 2. Todos assigned to them
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

    // User can see:
    // createdBy = logged-in user
    // OR
    // assignedTo = logged-in user
    const filter = {
      $or: [
        {
          createdBy: req.user._id,
        },
        {
          assignedTo: req.user._id,
        },
      ],
    };

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Search by title
    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }

    const pageNumber =
      Math.max(Number(page), 1);

    const limitNumber =
      Math.max(Number(limit), 1);

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const sortOption =
      sort === "oldest"
        ? { createdAt: 1 }
        : { createdAt: -1 };

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

    res.status(200).json({
      success: true,
      count: todos.length,

      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(
          total / limitNumber
        ),
      },

      data: todos,
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
// Statistics for:
// created by me + assigned to me
// ==========================================

const getTodoStats = async (
  req,
  res
) => {
  try {
    const userId =
      new mongoose.Types.ObjectId(
        req.user._id
      );

    const result =
      await Todo.aggregate([
        {
          $match: {
            $or: [
              {
                createdBy: userId,
              },
              {
                assignedTo: userId,
              },
            ],
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: 1,
            },

            todo: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "todo",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            inprogress: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "inprogress",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            complate: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "complate",
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
        todo: 0,
        inprogress: 0,
        complate: 0,
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
// User can access if:
// createdBy = logged-in user
// OR
// assignedTo = logged-in user
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

    const todo =
      await Todo.findOne({
        _id: id,

        $or: [
          {
            createdBy: req.user._id,
          },
          {
            assignedTo: req.user._id,
          },
        ],
      })
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
// Only creator can update todo details
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

    // Only creator can update
    const todo =
      await Todo.findOne({
        _id: id,
        createdBy: req.user._id,
      });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message:
          "Todo not found or you are not the creator",
      });
    }

    // Update title
    if (title !== undefined) {
      if (!title.trim()) {
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
      todo.description =
        description.trim();
    }

    // Update status
    if (status !== undefined) {
      todo.status = status;
    }

    // Update assigned user
    if (assignedTo !== undefined) {
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
// Creator OR assigned user can update status
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
      ![
        "todo",
        "inprogress",
        "complate",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Creator OR assigned user
    const todo =
      await Todo.findOne({
        _id: id,

        $or: [
          {
            createdBy: req.user._id,
          },
          {
            assignedTo: req.user._id,
          },
        ],
      });

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
// Normal user can delete only
// todos created by themselves
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

    const todo =
      await Todo.findOneAndDelete({
        _id: id,
        createdBy: req.user._id,
      });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message:
          "Todo not found or you are not the creator",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Todo deleted successfully",
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