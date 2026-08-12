const mongoose = require("mongoose");
const Todo = require("../models/Todo");

const VALID_STATUSES = [
  "todo",
  "inprogress",
  "complate",
];

// ==========================================
// Create Todo
// POST /api/todos
// ==========================================

const createTodo = async (req, res, next) => {
  try {
    const { title, status } = req.body || {};

    if (title === undefined) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (typeof title !== "string") {
      return res.status(400).json({
        success: false,
        message: "Title must be a string",
      });
    }

    if (!title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty",
      });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message:
          "Title cannot exceed 200 characters",
      });
    }

    if (
      status !== undefined &&
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be todo, inprogress or complate",
      });
    }

    const todo = await Todo.create({
      title: title.trim(),
      status: status ?? "todo",
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Todo created successfully",
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get All User Todos
// GET /api/todos
// ==========================================

const getTodos = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      status,
      sort = "newest",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    if (
      !Number.isInteger(page) ||
      page < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Page must be a positive number",
      });
    }

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Limit must be between 1 and 100",
      });
    }

    if (
      status !== undefined &&
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be todo, inprogress or complate",
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

    // Only logged-in user's todos
    const query = {
      user: req.user._id,
    };

    if (
      typeof search === "string" &&
      search.trim()
    ) {
      query.title = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    if (status !== undefined) {
      query.status = status;
    }

    const sortOption =
      sort === "oldest"
        ? { createdAt: 1 }
        : { createdAt: -1 };

    const skip = (page - 1) * limit;

    const totalTodos =
      await Todo.countDocuments(query);

    const todos = await Todo.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(
      totalTodos / limit
    );

    res.status(200).json({
      success: true,
      message: "Todos fetched successfully",

      pagination: {
        currentPage: page,
        limit,
        totalTodos,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },

      filters: {
        search:
          typeof search === "string"
            ? search.trim()
            : "",
        status: status ?? null,
        sort,
      },

      count: todos.length,
      data: todos,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Todo By ID
// GET /api/todos/:id
// ==========================================

const getTodoById = async (
  req,
  res,
  next
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

    // Find only if todo belongs to user
    const todo = await Todo.findOne({
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
      message: "Todo fetched successfully",
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Update Todo
// PUT /api/todos/:id
// ==========================================

const updateTodo = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { title, status } =
      req.body || {};

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

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

    if (title !== undefined) {
      if (typeof title !== "string") {
        return res.status(400).json({
          success: false,
          message:
            "Title must be a string",
        });
      }

      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Title cannot be empty",
        });
      }

      if (title.trim().length > 200) {
        return res.status(400).json({
          success: false,
          message:
            "Title cannot exceed 200 characters",
        });
      }
    }

    if (
      status !== undefined &&
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be todo, inprogress or complate",
      });
    }

    const updateData = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const todo =
      await Todo.findOneAndUpdate(
        {
          _id: id,
          user: req.user._id,
        },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Todo updated successfully",
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Change Todo Status
// PATCH /api/todos/:id/status
// ==========================================

const updateTodoStatus = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { status } =
      req.body || {};

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    if (
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be todo, inprogress or complate",
      });
    }

    const todo =
      await Todo.findOneAndUpdate(
        {
          _id: id,
          user: req.user._id,
        },
        { status },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Todo status updated successfully",
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Todo Statistics
// GET /api/todos/stats
// ==========================================

const getTodoStats = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user._id;

    const total =
      await Todo.countDocuments({
        user: userId,
      });

    const todo =
      await Todo.countDocuments({
        user: userId,
        status: "todo",
      });

    const inprogress =
      await Todo.countDocuments({
        user: userId,
        status: "inprogress",
      });

    const complate =
      await Todo.countDocuments({
        user: userId,
        status: "complate",
      });

    const completionPercentage =
      total === 0
        ? 0
        : Math.round(
            (complate / total) * 100
          );

    res.status(200).json({
      success: true,
      message:
        "Todo statistics fetched successfully",
      data: {
        total,
        todo,
        inprogress,
        complate,
        completionPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Delete Todo
// DELETE /api/todos/:id
// ==========================================

const deleteTodo = async (
  req,
  res,
  next
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

    // Delete only user's todo
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
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  updateTodoStatus,
  getTodoStats,
  deleteTodo,
};