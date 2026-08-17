const mongoose = require("mongoose");
const User = require("../models/User");
const Todo = require("../models/Todo");
const { createActivity } = require("../utils/activityService");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const userResponse = (user) => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

// ==========================================
// GET /api/admin/users
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

    const filter = {
      isDeleted: false,
    };

    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }

    if (status) {
      if (
        ![
          "pending",
          "in-progress",
          "completed",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be pending, in-progress or completed",
        });
      }

      filter.status = status;
    }

    if (createdBy !== undefined) {
      if (!isValidId(createdBy)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid createdBy user ID",
        });
      }

      filter.createdBy = createdBy;
    }

    if (assignedTo !== undefined) {
      if (!isValidId(assignedTo)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assignedTo user ID",
        });
      }

      filter.assignedTo = assignedTo;
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

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

    if (
      ![
        "newest",
        "oldest",
      ].includes(sort)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sort must be newest or oldest",
      });
    }

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const sortOption =
      sort === "oldest"
        ? {
            createdAt: 1,
          }
        : {
            createdAt: -1,
          };

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
        totalPages:
          Math.ceil(
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
        message:
          "Invalid Todo ID",
      });
    }

    const todo =
      await Todo.findOne({
        _id: id,
        isDeleted: false,
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
      message: error.message,
    });
  }
};

// ==========================================
// PUT /api/admin/todos/:id
// ==========================================

const updateAdminTodo = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
    } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Todo ID",
      });
    }

    if (
      [
        title,
        description,
        status,
        priority,
        dueDate,
        assignedTo,
      ].every(
        (value) =>
          value === undefined
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide title, description, status, priority, dueDate or assignedTo",
      });
    }

    const todo =
      await Todo.findOne({
        _id: id,
        isDeleted: false,
      });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message:
          "Todo not found",
      });
    }

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
      description !==
      undefined
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
        ![
          "pending",
          "in-progress",
          "completed",
        ].includes(status)
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
        ![
          "low",
          "medium",
          "high",
        ].includes(priority)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Priority must be low, medium or high",
        });
      }

      if (
        todo.priority !==
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
        Number.isNaN(
          new Date(
            dueDate
          ).getTime()
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
      assignedTo !==
      undefined
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

    // Admin cannot change createdBy.
    // createdBy remains unchanged.

    await todo.save();

    // ==========================================
    // Activity: Todo Updated
    // ==========================================

    await createActivity({
      action:
        "Todo Updated",

      performedBy:
        req.user._id,

      todoId:
        todo._id,

      metadata: {
        ...changes,
        updatedByAdmin:
          true,
      },
    });

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

          updatedByAdmin:
            true,
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

          updatedByAdmin:
            true,
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
        "Todo updated successfully by admin",

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
// DELETE /api/admin/todos/:id
// ==========================================

const deleteAdminTodo = async (
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
      await Todo.findOne({
        _id: id,
        isDeleted: false,
      });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message:
          "Todo not found",
      });
    }

    // Soft delete
    todo.isDeleted = true;
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

        deletedByAdmin:
          true,
      },
    });

    res.status(200).json({
      success: true,
      message:
        "Todo moved to trash successfully by admin",
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
// GET /api/admin/todos/trash
// ==========================================

const getTrashTodos = async (
  req,
  res
) => {
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

    const pageNumber =
      Number(page);

    const limitNumber =
      Number(limit);

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
      ![
        "pending",
        "in-progress",
        "completed",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be pending, in-progress or completed",
      });
    }

    if (
      ![
        "newest",
        "oldest",
      ].includes(sort)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sort must be newest or oldest",
      });
    }

    const filter = {
      isDeleted: true,
    };

    if (
      search &&
      typeof search === "string" &&
      search.trim()
    ) {
      filter.title = {
        $regex:
          search.trim(),
        $options: "i",
      };
    }

    if (status) {
      filter.status =
        status;
    }

    if (
      createdBy !== undefined
    ) {
      if (
        !isValidId(
          createdBy
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid createdBy user ID",
        });
      }

      filter.createdBy =
        createdBy;
    }

    if (
      assignedTo !== undefined
    ) {
      if (
        !isValidId(
          assignedTo
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assignedTo user ID",
        });
      }

      filter.assignedTo =
        assignedTo;
    }

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const sortOption =
      sort === "oldest"
        ? {
            deletedAt: 1,
          }
        : {
            deletedAt: -1,
          };

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
      count:
        todos.length,

      pagination: {
        total,
        page:
          pageNumber,
        limit:
          limitNumber,
        totalPages:
          Math.ceil(
            total /
              limitNumber
          ),
      },

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
// PATCH /api/admin/todos/:id/restore
// ==========================================

const restoreTodo = async (
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
      await Todo.findOne({
        _id: id,
        isDeleted: true,
      });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message:
          "Deleted Todo not found",
      });
    }

    todo.isDeleted = false;
    todo.deletedAt =
      null;

    await todo.save();

    // ==========================================
    // Activity: Todo Restored
    // ==========================================

    await createActivity({
      action:
        "Todo Restored",

      performedBy:
        req.user._id,

      todoId:
        todo._id,

      metadata: {
        restoredAt:
          new Date(),

        restoredByAdmin:
          true,
      },
    });

    const restoredTodo =
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
        "Todo restored successfully",

      data:
        restoredTodo,
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
// POST /api/admin/users/:id/make-admin
// ==========================================

const makeAdmin = async (
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
          "Invalid user ID",
      });
    }

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    user.role =
      "admin";

    await user.save();

    res.status(200).json({
      success: true,

      message:
        "User promoted to admin successfully",

      data:
        userResponse(user),
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
// POST /api/admin/users/:id/remove-admin
// ==========================================

const removeAdmin = async (
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
          "Invalid user ID",
      });
    }

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    user.role =
      "user";

    await user.save();

    res.status(200).json({
      success: true,

      message:
        "Admin privileges removed successfully",

      data:
        userResponse(user),
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
// PATCH /api/admin/users/:id/role
// ==========================================

const changeUserRole = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const { role } =
      req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID",
      });
    }

    if (
      ![
        "user",
        "admin",
      ].includes(role)
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
        message:
          "User not found",
      });
    }

    user.role =
      role;

    await user.save();

    res.status(200).json({
      success: true,

      message:
        "User role updated successfully",

      data:
        userResponse(user),
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
// PATCH /api/admin/users/:id/password
// ==========================================

const changeUserPassword = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const { password } =
      req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID",
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
        message:
          "User not found",
      });
    }

    user.password =
      password;

    await user.save();

    res.status(200).json({
      success: true,

      message:
        "User password changed successfully",
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
// PATCH /api/admin/users/:id/status
// ==========================================

const changeUserStatus = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const { isActive } =
      req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID",
      });
    }

    if (
      typeof isActive !==
      "boolean"
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
        message:
          "User not found",
      });
    }

    user.isActive =
      isActive;

    await user.save();

    res.status(200).json({
      success: true,

      message: isActive
        ? "User enabled successfully"
        : "User disabled successfully",

      data:
        userResponse(user),
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
// DELETE /api/admin/users/:id
// ==========================================

const deleteUser = async (
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
          "Invalid user ID",
      });
    }

    const user =
      await User.findByIdAndDelete(
        id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
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
      message:
        error.message,
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
  getTrashTodos,
  restoreTodo,

  // Admin User APIs
  makeAdmin,
  removeAdmin,
  changeUserRole,
  changeUserPassword,
  changeUserStatus,
  deleteUser,
};