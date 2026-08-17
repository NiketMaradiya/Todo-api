const Notification =
  require(
    "../models/Notification"
  );

const Todo =
  require(
    "../models/Todo"
  );

// ==========================================
// Create Notification
// ==========================================

const createNotification =
  async ({
    userId,
    todoId = null,
    type,
    message,
  }) => {
    return await Notification.create({
      userId,

      todoId,

      type,

      message,
    });
  };

// ==========================================
// Create Due Date Notifications
//
// Due Soon:
// Due within next 24 hours
//
// Overdue:
// Due date is before current time
// ==========================================

const createDueDateNotifications =
  async () => {
    const now =
      new Date();

    const soon =
      new Date(
        now.getTime() +
          24 * 60 * 60 * 1000
      );

    const todos =
      await Todo.find({
        isDeleted: false,

        assignedTo: {
          $ne: null,
        },

        dueDate: {
          $ne: null,
        },

        status: {
          $ne: "completed",
        },
      });

    let dueSoonCreated = 0;

    let overdueCreated = 0;

    for (
      const todo of todos
    ) {
      let type = null;

      if (
        todo.dueDate < now
      ) {
        type =
          "todo_overdue";
      } else if (
        todo.dueDate <= soon
      ) {
        type =
          "todo_due_soon";
      }

      if (!type) {
        continue;
      }

      // ==========================================
      // Prevent Duplicate Notification
      // ==========================================

      const exists =
        await Notification.exists({
          userId:
            todo.assignedTo,

          todoId:
            todo._id,

          type,
        });

      if (exists) {
        continue;
      }

      // ==========================================
      // Create Notification
      // ==========================================

      await createNotification({
        userId:
          todo.assignedTo,

        todoId:
          todo._id,

        type,

        message:
          type ===
          "todo_overdue"
            ? `Todo "${todo.title}" is overdue`
            : `Todo "${todo.title}" is due within 24 hours`,
      });

      if (
        type ===
        "todo_overdue"
      ) {
        overdueCreated++;
      } else {
        dueSoonCreated++;
      }
    }

    return {
      dueSoonCreated,

      overdueCreated,
    };
  };

module.exports = {
  createNotification,

  createDueDateNotifications,
};