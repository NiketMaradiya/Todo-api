const mongoose = require("mongoose");
const Todo = require("../models/Todo");

// ==========================================
// Create Todo
// POST /api/todos
// ==========================================

const createTodo = async (req, res) => {
  try {
    const {
      title,
      status = "todo",
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const todo = await Todo.create({
      title: title.trim(),
      status,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message:
        "Todo created successfully",
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
// Get User Todos
// GET /api/todos
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

    const filter = {
      user: req.user._id,
    };

    if (status) {
      filter.status = status;
    }

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

    const todos = await Todo.find(filter)
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
// ==========================================

const getTodoStats = async (req, res) => {
  try {
    const userId =
      new mongoose.Types.ObjectId(
        req.user._id
      );

    const result =
      await Todo.aggregate([
        {
          $match: {
            user: userId,
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
        user: req.user._id,
      });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
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
      status,
    } = req.body;

    if (
      title === undefined &&
      status === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide title or status",
      });
    }

    const todo =
      await Todo.findOne({
        _id: id,
        user: req.user._id,
      });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

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

    if (status !== undefined) {
      todo.status = status;
    }

    await todo.save();

    res.status(200).json({
      success: true,
      message:
        "Todo updated successfully",
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
// Update Todo Status
// PATCH /api/todos/:id/status
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
        message:
          "Invalid status",
      });
    }

    const todo =
      await Todo.findOne({
        _id: id,
        user: req.user._id,
      });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
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
        user: req.user._id,
      });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
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

module.exports = {
  createTodo,
  getTodos,
  getTodoStats,
  getTodoById,
  updateTodo,
  updateTodoStatus,
  deleteTodo,
};