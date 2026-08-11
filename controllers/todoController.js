const mongoose = require("mongoose");
const Todo = require("../models/Todo");

const VALID_STATUSES = [
  "todo",
  "inprogress",
  "complate",
];

// ==========================================
// Create Todo
// ==========================================

const createTodo = async (req, res, next) => {
  try {
    const { title, status } = req.body || {};

    // Validate title exists
    if (title === undefined) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Validate title type
    if (typeof title !== "string") {
      return res.status(400).json({
        success: false,
        message: "Title must be a string",
      });
    }

    // Validate empty title
    if (!title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty",
      });
    }

    // Validate title length
    if (title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: "Title cannot exceed 200 characters",
      });
    }

    // Validate status
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
// Get All Todos
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

    // Validate page
    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive number",
      });
    }

    // Validate limit
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 100",
      });
    }

    // Validate status filter
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

    // Validate sort
    if (sort !== "newest" && sort !== "oldest") {
      return res.status(400).json({
        success: false,
        message: "Sort must be newest or oldest",
      });
    }

    const query = {};

    // Search
    if (search.trim()) {
      query.title = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    // Status filter
    if (status !== undefined) {
      query.status = status;
    }

    // Sort
    const sortOption =
      sort === "oldest"
        ? { createdAt: 1 }
        : { createdAt: -1 };

    // Pagination
    const skip = (page - 1) * limit;

    const totalTodos = await Todo.countDocuments(query);

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
        search: search.trim(),
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
// ==========================================

const getTodoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

    const todo = await Todo.findById(id);

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
// ==========================================

const updateTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, status } = req.body || {};

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

    // Empty update
    if (
      title === undefined &&
      status === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide title or status",
      });
    }

    // Validate title
    if (title !== undefined) {
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
    }

    // Validate status
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

    const todo = await Todo.findByIdAndUpdate(
      id,
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
// ==========================================

const updateTodoStatus = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

    // Validate status exists
    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be todo, inprogress or complate",
      });
    }

    const todo = await Todo.findByIdAndUpdate(
      id,
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
      message: "Todo status updated successfully",
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Todo Statistics
// ==========================================

const getTodoStats = async (req, res, next) => {
  try {
    const total = await Todo.countDocuments();

    const todo = await Todo.countDocuments({
      status: "todo",
    });

    const inprogress = await Todo.countDocuments({
      status: "inprogress",
    });

    const complate = await Todo.countDocuments({
      status: "complate",
    });

    const completionPercentage =
      total === 0
        ? 0
        : Math.round((complate / total) * 100);

    res.status(200).json({
      success: true,
      message: "Todo statistics fetched successfully",
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
// ==========================================

const deleteTodo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

    const todo = await Todo.findByIdAndDelete(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Todo deleted successfully",
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