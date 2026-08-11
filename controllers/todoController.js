const mongoose = require("mongoose");
const Todo = require("../models/Todo");

// Create Todo
const createTodo = async (req, res, next) => {
  try {
    const { title, completed } = req.body || {};

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
        message: "Title cannot exceed 200 characters",
      });
    }

    if (completed !== undefined && typeof completed !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Completed must be true or false",
      });
    }

    const todo = await Todo.create({
      title: title.trim(),
      completed: completed ?? false,
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

// Get All Todos
const getTodos = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      completed,
      sort = "newest",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive number",
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 100",
      });
    }

    if (
      completed !== undefined &&
      completed !== "true" &&
      completed !== "false"
    ) {
      return res.status(400).json({
        success: false,
        message: "Completed must be true or false",
      });
    }

    if (sort !== "newest" && sort !== "oldest") {
      return res.status(400).json({
        success: false,
        message: "Sort must be newest or oldest",
      });
    }

    const query = {};

    if (search.trim()) {
      query.title = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    if (completed !== undefined) {
      query.completed = completed === "true";
    }

    const sortOption =
      sort === "oldest"
        ? { createdAt: 1 }
        : { createdAt: -1 };

    const skip = (page - 1) * limit;

    const totalTodos = await Todo.countDocuments(query);

    const todos = await Todo.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalTodos / limit);

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
        completed:
          completed !== undefined
            ? completed === "true"
            : null,
        sort,
      },

      count: todos.length,
      data: todos,
    });
  } catch (error) {
    next(error);
  }
};

// Get Todo By ID
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

// Update Todo
const updateTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

    if (title === undefined && completed === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide title or completed",
      });
    }

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
          message: "Title cannot exceed 200 characters",
        });
      }
    }

    if (completed !== undefined && typeof completed !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Completed must be true or false",
      });
    }

    const updateData = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (completed !== undefined) {
      updateData.completed = completed;
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

// Toggle Todo
const toggleTodo = async (req, res, next) => {
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

    todo.completed = !todo.completed;

    await todo.save();

    res.status(200).json({
      success: true,
      message: todo.completed
        ? "Todo marked as completed"
        : "Todo marked as incomplete",
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

// Get Todo Statistics
const getTodoStats = async (req, res, next) => {
  try {
    const total = await Todo.countDocuments();

    const completed = await Todo.countDocuments({
      completed: true,
    });

    const pending = await Todo.countDocuments({
      completed: false,
    });

    const completionPercentage =
      total === 0
        ? 0
        : Math.round((completed / total) * 100);

    res.status(200).json({
      success: true,
      message: "Todo statistics fetched successfully",
      data: {
        total,
        completed,
        pending,
        completionPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete Todo
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
  toggleTodo,
  getTodoStats,
  deleteTodo,
};