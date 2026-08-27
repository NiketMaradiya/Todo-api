const mongoose = require("mongoose");

const User = require("../models/User");
const Todo = require("../models/Todo");
const todoCache = require("../utils/lfuCache");

const {
  createActivity,
} = require("../utils/activityService");

const {
  createNotification,
} = require("../utils/notificationService");

const {
  withTransaction,
} = require("../utils/transactionService");

// ==========================================
// Cache Helpers
// ==========================================

const invalidateTodoCache = () => {
  try {
    todoCache.invalidateTodos();
  } catch (error) {
    // Cache failure must never break Admin APIs
  }
};

// ==========================================
// Helpers
// ==========================================

const isValidId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

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

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(userResponse),
    });
  } catch (error) {
    return res.status(500).json({
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

    // Search
    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }

    // Status
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

    // Created By
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

    // Assigned To
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

    // Pagination
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

    // Sort
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

    return res.status(200).json({
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
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      data: todo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// PUT /api/admin/todos/:id
// PATCH /api/admin/todos/:id
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

    const updatedTodoId =
      await withTransaction(
        async (session) => {
          const todo =
            await Todo.findOne({
              _id: id,
              isDeleted: false,
            }).session(session);

          if (!todo) {
            const error =
              new Error(
                "Todo not found"
              );

            error.statusCode = 404;

            throw error;
          }

          // ==========================================
          // Store old values
          // ==========================================

          const oldTitle =
            todo.title;

          const oldDescription =
            todo.description;

          const oldStatus =
            todo.status;

          const oldPriority =
            todo.priority;

          const oldAssignedTo =
            todo.assignedTo
              ? todo.assignedTo.toString()
              : null;

          const oldDueDate =
            todo.dueDate
              ? todo.dueDate.toISOString()
              : null;

          // ==========================================
          // Update title
          // ==========================================

          if (title !== undefined) {
            if (
              typeof title !==
                "string" ||
              !title.trim()
            ) {
              const error =
                new Error(
                  "Title cannot be empty"
                );

              error.statusCode = 400;

              throw error;
            }

            todo.title =
              title.trim();
          }

          // ==========================================
          // Update description
          // ==========================================

          if (
            description !==
            undefined
          ) {
            if (
              typeof description !==
              "string"
            ) {
              const error =
                new Error(
                  "Description must be a string"
                );

              error.statusCode = 400;

              throw error;
            }

            todo.description =
              description.trim();
          }

          // ==========================================
          // Update status
          // ==========================================

          if (
            status !==
            undefined
          ) {
            if (
              ![
                "pending",
                "in-progress",
                "completed",
              ].includes(
                status
              )
            ) {
              const error =
                new Error(
                  "Status must be pending, in-progress or completed"
                );

              error.statusCode = 400;

              throw error;
            }

            todo.status =
              status;
          }

          // ==========================================
          // Update priority
          // ==========================================

          if (
            priority !==
            undefined
          ) {
            if (
              ![
                "low",
                "medium",
                "high",
              ].includes(
                priority
              )
            ) {
              const error =
                new Error(
                  "Priority must be low, medium or high"
                );

              error.statusCode = 400;

              throw error;
            }

            todo.priority =
              priority;
          }

          // ==========================================
          // Update due date
          // ==========================================

          if (
            dueDate !==
            undefined
          ) {
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
              const error =
                new Error(
                  "Invalid due date"
                );

              error.statusCode = 400;

              throw error;
            } else {
              todo.dueDate =
                new Date(
                  dueDate
                );
            }
          }

          // ==========================================
          // Update assignment
          // ==========================================

          if (
            assignedTo !==
            undefined
          ) {
            if (
              assignedTo ===
                null ||
              assignedTo ===
                ""
            ) {
              todo.assignedTo =
                null;
            } else {
              if (
                !isValidId(
                  assignedTo
                )
              ) {
                const error =
                  new Error(
                    "Invalid assigned user ID"
                  );

                error.statusCode = 400;

                throw error;
              }

              const assignedUser =
                await User.findById(
                  assignedTo
                ).session(
                  session
                );

              if (!assignedUser) {
                const error =
                  new Error(
                    "Assigned user not found"
                  );

                error.statusCode = 404;

                throw error;
              }

              todo.assignedTo =
                assignedTo;
            }
          }

          // ==========================================
          // SAVE TODO
          //
          // This write is part of the transaction.
          // ==========================================

          await todo.save({
            session,
          });

          // ==========================================
          // New values
          // ==========================================

          const newAssignedTo =
            todo.assignedTo
              ? todo.assignedTo.toString()
              : null;

          const newDueDate =
            todo.dueDate
              ? todo.dueDate.toISOString()
              : null;

          // ==========================================
          // AUDIT: General Update
          // ==========================================

          const updatedFieldsOld =
            {};

          const updatedFieldsNew =
            {};

          if (
            oldTitle !==
            todo.title
          ) {
            updatedFieldsOld.title =
              oldTitle;

            updatedFieldsNew.title =
              todo.title;
          }

          if (
            oldDescription !==
            todo.description
          ) {
            updatedFieldsOld.description =
              oldDescription;

            updatedFieldsNew.description =
              todo.description;
          }

          if (
            oldDueDate !==
            newDueDate
          ) {
            updatedFieldsOld.dueDate =
              oldDueDate;

            updatedFieldsNew.dueDate =
              newDueDate;
          }

          if (
            Object.keys(
              updatedFieldsOld
            ).length > 0
          ) {
            await createActivity({
              todoId:
                todo._id,

              userId:
                req.user._id,

              action:
                "updated",

              oldValue:
                updatedFieldsOld,

              newValue:
                updatedFieldsNew,

              session,
            });
          }

          // ==========================================
          // AUDIT: Status Changed
          // ==========================================

          if (
            oldStatus !==
            todo.status
          ) {
            await createActivity({
              todoId:
                todo._id,

              userId:
                req.user._id,

              action:
                "status_changed",

              oldValue:
                oldStatus,

              newValue:
                todo.status,

              session,
            });

            // ==========================================
            // STATUS NOTIFICATION
            // ==========================================

            const recipientIds =
              [
                todo.createdBy,
                todo.assignedTo,
              ]
                .filter(Boolean)
                .map(
                  (userId) =>
                    userId.toString()
                )
                .filter(
                  (userId) =>
                    userId !==
                    req.user._id.toString()
                );

            const uniqueRecipients =
              [
                ...new Set(
                  recipientIds
                ),
              ];

            for (
              const userId of
                uniqueRecipients
            ) {
              await createNotification({
                userId,

                todoId:
                  todo._id,

                type:
                  "todo_status_changed",

                message:
                  `Todo "${todo.title}" status changed from ${oldStatus} to ${todo.status}`,

                session,
              });
            }
          }

          // ==========================================
          // AUDIT: Priority Changed
          // ==========================================

          if (
            oldPriority !==
            todo.priority
          ) {
            await createActivity({
              todoId:
                todo._id,

              userId:
                req.user._id,

              action:
                "priority_changed",

              oldValue:
                oldPriority,

              newValue:
                todo.priority,

              session,
            });
          }

          // ==========================================
          // AUDIT: Assignment
          // ==========================================

          if (
            oldAssignedTo !==
            newAssignedTo
          ) {
            const action =
              oldAssignedTo ===
              null
                ? "assigned"
                : "reassigned";

            await createActivity({
              todoId:
                todo._id,

              userId:
                req.user._id,

              action,

              oldValue:
                oldAssignedTo,

              newValue:
                newAssignedTo,

              session,
            });

            // ==========================================
            // ASSIGNMENT NOTIFICATION
            // ==========================================

            if (
              newAssignedTo
            ) {
              await createNotification({
                userId:
                  newAssignedTo,

                todoId:
                  todo._id,

                type:
                  "todo_assigned",

                message:
                  `Todo "${todo.title}" has been assigned to you`,

                session,
              });
            }
          }

          return todo._id;
        }
      );

    // ==========================================
    // CACHE INVALIDATION
    //
    // Do this only AFTER transaction succeeds.
    // ==========================================

    invalidateTodoCache();

    const updatedTodo =
      await Todo.findById(
        updatedTodoId
      )
        .populate(
          "createdBy",
          "name email role"
        )
        .populate(
          "assignedTo",
          "name email role"
        );

    return res.status(200).json({
      success:
        true,

      message:
        "Todo updated successfully by admin",

      data:
        updatedTodo,
    });
  } catch (error) {
    return res.status(
      error.statusCode ||
        400
    ).json({
      success:
        false,

      message:
        error.message,
    });
  }
};

// ==========================================
// DELETE /api/admin/todos/:id
// ==========================================

const deleteAdminTodo =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid Todo ID",
        });
      }

      await withTransaction(
        async (session) => {
          const todo =
            await Todo.findOne({
              _id: id,

              isDeleted:
                false,
            }).session(
              session
            );

          if (!todo) {
            const error =
              new Error(
                "Todo not found"
              );

            error.statusCode =
              404;

            throw error;
          }

          // ==========================================
          // Store old value
          // ==========================================

          const oldDeletedValue =
            todo.isDeleted;

          // ==========================================
          // Soft Delete
          // ==========================================

          todo.isDeleted =
            true;

          todo.deletedAt =
            new Date();

          await todo.save({
            session,
          });

          // ==========================================
          // AUDIT: Soft Deleted
          //
          // Same transaction session
          // ==========================================

          await createActivity({
            todoId:
              todo._id,

            userId:
              req.user._id,

            action:
              "soft_deleted",

            oldValue:
              oldDeletedValue,

            newValue:
              true,

            session,
          });
        }
      );

      // ==========================================
      // CACHE INVALIDATION
      // Only after successful commit
      // ==========================================

      invalidateTodoCache();

      return res.status(200).json({
        success:
          true,

        message:
          "Todo moved to trash successfully by admin",
      });
    } catch (error) {
      return res.status(
        error.statusCode ||
          500
      ).json({
        success:
          false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// GET /api/admin/todos/trash
// ==========================================

const getTrashTodos =
  async (
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

      // ==========================================
      // Pagination Validation
      // ==========================================

      if (
        !Number.isInteger(
          pageNumber
        ) ||
        pageNumber <
          1
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Page must be a positive integer",
        });
      }

      if (
        !Number.isInteger(
          limitNumber
        ) ||
        limitNumber <
          1
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Limit must be a positive integer",
        });
      }

      if (
        limitNumber >
        100
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Limit cannot be greater than 100",
        });
      }

      // ==========================================
      // Status Validation
      // ==========================================

      if (
        status &&
        ![
          "pending",
          "in-progress",
          "completed",
        ].includes(status)
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Status must be pending, in-progress or completed",
        });
      }

      // ==========================================
      // Sort Validation
      // ==========================================

      if (
        ![
          "newest",
          "oldest",
        ].includes(sort)
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Sort must be newest or oldest",
        });
      }

      const filter = {
        isDeleted:
          true,
      };

      // ==========================================
      // Search
      // ==========================================

      if (
        search &&
        typeof search ===
          "string" &&
        search.trim()
      ) {
        filter.title = {
          $regex:
            search.trim(),

          $options:
            "i",
        };
      }

      // ==========================================
      // Status
      // ==========================================

      if (status) {
        filter.status =
          status;
      }

      // ==========================================
      // Created By
      // ==========================================

      if (
        createdBy !==
        undefined
      ) {
        if (
          !isValidId(
            createdBy
          )
        ) {
          return res.status(400).json({
            success:
              false,

            message:
              "Invalid createdBy user ID",
          });
        }

        filter.createdBy =
          createdBy;
      }

      // ==========================================
      // Assigned To
      // ==========================================

      if (
        assignedTo !==
        undefined
      ) {
        if (
          !isValidId(
            assignedTo
          )
        ) {
          return res.status(400).json({
            success:
              false,

            message:
              "Invalid assignedTo user ID",
          });
        }

        filter.assignedTo =
          assignedTo;
      }

      const skip =
        (pageNumber -
          1) *
        limitNumber;

      const sortOption =
        sort ===
        "oldest"
          ? {
              deletedAt:
                1,
            }
          : {
              deletedAt:
                -1,
            };

      const total =
        await Todo.countDocuments(
          filter
        );

      const todos =
        await Todo.find(
          filter
        )
          .populate(
            "createdBy",
            "name email role"
          )
          .populate(
            "assignedTo",
            "name email role"
          )
          .sort(
            sortOption
          )
          .skip(
            skip
          )
          .limit(
            limitNumber
          );

      return res.status(200).json({
        success:
          true,

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
      return res.status(500).json({
        success:
          false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// PATCH /api/admin/todos/:id/restore
// ==========================================

const restoreTodo =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid Todo ID",
        });
      }

      const restoredTodoId =
        await withTransaction(
          async (session) => {
            const todo =
              await Todo.findOne({
                _id: id,

                isDeleted:
                  true,
              }).session(
                session
              );

            if (!todo) {
              const error =
                new Error(
                  "Deleted Todo not found"
                );

              error.statusCode =
                404;

              throw error;
            }

            // ==========================================
            // Store old value
            // ==========================================

            const oldDeletedValue =
              todo.isDeleted;

            // ==========================================
            // Restore
            // ==========================================

            todo.isDeleted =
              false;

            todo.deletedAt =
              null;

            await todo.save({
              session,
            });

            // ==========================================
            // AUDIT: Restored
            // ==========================================

            await createActivity({
              todoId:
                todo._id,

              userId:
                req.user._id,

              action:
                "restored",

              oldValue:
                oldDeletedValue,

              newValue:
                false,

              session,
            });

            return todo._id;
          }
        );

      // ==========================================
      // CACHE INVALIDATION
      // Only after successful commit
      // ==========================================

      invalidateTodoCache();

      const restoredTodo =
        await Todo.findById(
          restoredTodoId
        )
          .populate(
            "createdBy",
            "name email role"
          )
          .populate(
            "assignedTo",
            "name email role"
          );

      return res.status(200).json({
        success:
          true,

        message:
          "Todo restored successfully",

        data:
          restoredTodo,
      });
    } catch (error) {
      return res.status(
        error.statusCode ||
          500
      ).json({
        success:
          false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// POST /api/admin/users/:id/make-admin
// ==========================================

const makeAdmin =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid user ID",
        });
      }

      const user =
        await User.findById(
          id
        );

      if (!user) {
        return res.status(404).json({
          success:
            false,

          message:
            "User not found",
        });
      }

      user.role =
        "admin";

      await user.save();

      return res.status(200).json({
        success:
          true,

        message:
          "User promoted to admin successfully",

        data:
          userResponse(user),
      });
    } catch (error) {
      return res.status(500).json({
        success:
          false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// POST /api/admin/users/:id/remove-admin
// ==========================================

const removeAdmin =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid user ID",
        });
      }

      const user =
        await User.findById(
          id
        );

      if (!user) {
        return res.status(404).json({
          success:
            false,

          message:
            "User not found",
        });
      }

      user.role =
        "user";

      await user.save();

      return res.status(200).json({
        success:
          true,

        message:
          "Admin privileges removed successfully",

        data:
          userResponse(user),
      });
    } catch (error) {
      return res.status(500).json({
        success:
          false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// PATCH /api/admin/users/:id/role
// ==========================================

const changeUserRole =
  async (
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
          success:
            false,

          message:
            "Invalid user ID",
        });
      }

      if (
        ![
          "user",
          "admin",
        ].includes(
          role
        )
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Role must be user or admin",
        });
      }

      const user =
        await User.findById(
          id
        );

      if (!user) {
        return res.status(404).json({
          success:
            false,

          message:
            "User not found",
        });
      }

      user.role =
        role;

      await user.save();

      return res.status(200).json({
        success:
          true,

        message:
          "User role updated successfully",

        data:
          userResponse(user),
      });
    } catch (error) {
      return res.status(500).json({
        success:
          false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// PATCH /api/admin/users/:id/password
// ==========================================

const changeUserPassword =
  async (
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
          success:
            false,

          message:
            "Invalid user ID",
        });
      }

      if (
        !password ||
        password.length < 6
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Password must be at least 6 characters",
        });
      }

      const user =
        await User.findById(
          id
        );

      if (!user) {
        return res.status(404).json({
          success:
            false,

          message:
            "User not found",
        });
      }

      user.password =
        password;

      await user.save();

      return res.status(200).json({
        success:
          true,

        message:
          "User password changed successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success:
          false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// PATCH /api/admin/users/:id/status
// ==========================================

const changeUserStatus =
  async (
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
          success:
            false,

          message:
            "Invalid user ID",
        });
      }

      if (
        typeof isActive !==
        "boolean"
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "isActive must be true or false",
        });
      }

      const user =
        await User.findById(
          id
        );

      if (!user) {
        return res.status(404).json({
          success:
            false,

          message:
            "User not found",
        });
      }

      user.isActive =
        isActive;

      await user.save();

      return res.status(200).json({
        success:
          true,

        message:
          isActive
            ? "User enabled successfully"
            : "User disabled successfully",

        data:
          userResponse(user),
      });
    } catch (error) {
      return res.status(500).json({
        success:
          false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// DELETE /api/admin/users/:id
// ==========================================

const deleteUser =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          success:
            false,

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
          success:
            false,

          message:
            "User not found",
        });
      }

      // ==========================================
      // CACHE INVALIDATION
      //
      // A user deletion can affect Todo visibility
      // and assignments, so invalidate Todo lists.
      // ==========================================

      invalidateTodoCache();

      return res.status(200).json({
        success:
          true,

        message:
          "User deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success:
          false,

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