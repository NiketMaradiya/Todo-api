const mongoose = require("mongoose");
const User = require("../models/User");
const Todo = require("../models/Todo");

const isValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const userResponse = (user) => {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
};

// ==========================================
// GET /api/admin/users
// Get all users
// ==========================================

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(userResponse),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET /api/admin/todos
// Get ALL todos
//
// Admin can see:
// - Who created the todo
// - Who is assigned
// - Status
// - Created date
// - Updated date
// ==========================================

const getAllTodos = async (req, res) => {
  try {
    const {
      search,
      status,
      createdBy,
      assignedTo,
      page = 1,
      limit = 10,
      sort = "newest",
    } = req.query;

    const filter = {};

    // Search by title
    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }

    // Filter by status
    if (status) {
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
            "Status must be todo, inprogress or complate",
        });
      }

      filter.status = status;
    }

    // Filter by creator
    if (createdBy !== undefined) {
      if (!isValidId(createdBy)) {
        return res.status(400).json({
          success: false,
          message: "Invalid createdBy user ID",
        });
      }

      filter.createdBy = createdBy;
    }

    // Filter by assigned user
    if (assignedTo !== undefined) {
      if (!isValidId(assignedTo)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assignedTo user ID",
        });
      }

      filter.assignedTo = assignedTo;
    }

    const pageNumber = Math.max(
      Number(page),
      1
    );

    const limitNumber = Math.max(
      Number(limit),
      1
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const sortOption =
      sort === "oldest"
        ? { createdAt: 1 }
        : { createdAt: -1 };

    const total =
      await Todo.countDocuments(filter);

    const todos = await Todo.find(filter)
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
// GET /api/admin/todos/:id
// Get any Todo by ID
// ==========================================

const getAdminTodoById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

    const todo = await Todo.findById(id)
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
// PUT /api/admin/todos/:id
// Admin can update ANY todo
//
// Admin can change:
// - title
// - description
// - status
// - assignedTo
//
// createdBy cannot be changed
// ==========================================

const updateAdminTodo = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      status,
      assignedTo,
    } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

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

    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
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
        ![
          "todo",
          "inprogress",
          "complate",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be todo, inprogress or complate",
        });
      }

      todo.status = status;
    }

    // Update assigned user
    if (assignedTo !== undefined) {
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

      todo.assignedTo = assignedTo;
    }

    // IMPORTANT:
    // Admin cannot change createdBy.
    // createdBy remains the original creator.

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
        "Todo updated successfully by admin",
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
// DELETE /api/admin/todos/:id
// Admin can delete ANY Todo
// ==========================================

const deleteAdminTodo = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Todo ID",
      });
    }

    const todo =
      await Todo.findByIdAndDelete(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Todo deleted successfully by admin",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// POST /api/admin/users/:id/make-admin
// ==========================================

const makeAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = "admin";

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "User promoted to admin successfully",
      data: userResponse(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// POST /api/admin/users/:id/remove-admin
// ==========================================

const removeAdmin = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = "user";

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Admin privileges removed successfully",
      data: userResponse(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// PATCH /api/admin/users/:id/role
// ==========================================

const changeUserRole = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (
      !["user", "admin"].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Role must be user or admin",
      });
    }

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = role;

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "User role updated successfully",
      data: userResponse(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// PATCH /api/admin/users/:id/password
// ==========================================

const changeUserPassword = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (
      !password ||
      password.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = password;

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "User password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// PATCH /api/admin/users/:id/status
// ==========================================

const changeUserStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (
      typeof isActive !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "isActive must be true or false",
      });
    }

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: isActive
        ? "User enabled successfully"
        : "User disabled successfully",
      data: userResponse(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE /api/admin/users/:id
// ==========================================

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user =
      await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  getAllUsers,

  // Admin Todo APIs
  getAllTodos,
  getAdminTodoById,
  updateAdminTodo,
  deleteAdminTodo,

  // Admin User APIs
  makeAdmin,
  removeAdmin,
  changeUserRole,
  changeUserPassword,
  changeUserStatus,
  deleteUser,
};