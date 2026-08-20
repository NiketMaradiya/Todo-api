const mongoose = require("mongoose");

const User = require("../models/User");
const Todo = require("../models/Todo");
const {
  createTodo,
} = require("./todoController");
const {
  extractTodo,
} = require("../utils/aiTodoService");

const allowedPriorities = [
  "low",
  "medium",
  "high",
];

const normalize = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const resolveAssignedUser = async (
  assignedUserName
) => {
  const normalized = normalize(
    assignedUserName
  );

  if (!normalized) {
    return null;
  }

  if (
    mongoose.Types.ObjectId.isValid(
      normalized
    )
  ) {
    return User.findById(normalized);
  }

  const escaped = normalized.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const matches =
    await User.find({
      $or: [
        {
          email: {
            $regex: `^${escaped}$`,
            $options: "i",
          },
        },
        {
          name: {
            $regex: `^${escaped}$`,
            $options: "i",
          },
        },
      ],
      isActive: true,
    }).limit(2);

  if (matches.length > 1) {
    const error = new Error(
      "The assigned user name is ambiguous"
    );

    error.status = 400;
    error.code = "AMBIGUOUS_ASSIGNEE";

    throw error;
  }

  return matches[0] || null;
};

const createViaExistingTodoFlow = async (
  req,
  todoData
) => {
  let statusCode = 500;
  let body = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },

    json(payload) {
      body = payload;
      return this;
    },
  };

  await createTodo(
    {
      ...req,
      body: todoData,
    },
    res
  );

  return {
    statusCode,
    body,
  };
};

const createAiTodo = async (
  req,
  res
) => {
  try {
    const prompt = req.body?.prompt;

    if (
      typeof prompt !== "string" ||
      !prompt.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "prompt is required and must be a non-empty string",
      });
    }

    if (prompt.length > 4000) {
      return res.status(400).json({
        success: false,
        message:
          "prompt must be 4000 characters or fewer",
      });
    }

    const extracted =
      await extractTodo(
        prompt.trim()
      );

    if (
      !extracted.title ||
      typeof extracted.title !== "string" ||
      !extracted.title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "AI could not determine a Todo title",
        extracted,
      });
    }

    if (
      typeof extracted.description !==
      "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "AI returned an invalid description",
        extracted,
      });
    }

    if (
      !allowedPriorities.includes(
        extracted.priority
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "AI returned an invalid priority",
        extracted,
      });
    }

    if (!Array.isArray(extracted.tags)) {
      return res.status(400).json({
        success: false,
        message:
          "AI returned invalid tags",
        extracted,
      });
    }

    const tags =
      extracted.tags
        .filter(
          (tag) =>
            typeof tag === "string"
        )
        .map((tag) =>
          tag
            .trim()
            .toLowerCase()
        )
        .filter(Boolean);

    if (tags.length > 20) {
      return res.status(400).json({
        success: false,
        message:
          "AI returned too many tags",
        extracted,
      });
    }

    if (
      tags.some(
        (tag) => tag.length > 50
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "AI returned an invalid tag",
        extracted,
      });
    }

    if (extracted.dateAmbiguous) {
      return res.status(400).json({
        success: false,
        message:
          extracted.dateClarification ||
          "The due date is ambiguous. Please clarify it and try again.",
        extracted,
      });
    }

    let dueDate =
      extracted.dueDate;

    if (
      dueDate !== null &&
      dueDate !== undefined
    ) {
      if (
        typeof dueDate !== "string" ||
        Number.isNaN(
          new Date(dueDate).getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "AI returned an invalid due date",
          extracted,
        });
      }

      dueDate =
        new Date(
          dueDate
        ).toISOString();
    } else {
      dueDate = undefined;
    }

    const assignedUser =
      extracted.assignedUserName
        ? await resolveAssignedUser(
            extracted.assignedUserName
          )
        : req.user;

    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message:
          `Assigned user "${normalize(
            extracted.assignedUserName
          )}" not found`,
        extracted,
      });
    }

    /*
     * IMPORTANT:
     * AI creation is limited to the logged-in user.
     *
     * Even if the AI returns another user,
     * we reject the request instead of allowing
     * the AI layer to bypass Todo authorization.
     */
    if (
      assignedUser._id.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "AI Todo creation can only assign the Todo to the logged-in user",
        extracted,
      });
    }

    const todoData = {
      title:
        extracted.title.trim(),

      description:
        extracted.description.trim(),

      assignedTo:
        req.user._id.toString(),

      priority:
        extracted.priority,
    };

    if (
      dueDate !== undefined
    ) {
      todoData.dueDate =
        dueDate;
    }

    const result =
      await createViaExistingTodoFlow(
        req,
        todoData
      );

    if (
      result.statusCode >= 400
    ) {
      return res
        .status(
          result.statusCode
        )
        .json(
          result.body
        );
    }

    let createdTodo =
      result.body?.data;

    if (tags.length > 0) {
      const updatedTodo =
        await Todo.findByIdAndUpdate(
          createdTodo?._id,
          {
            $set: {
              tags,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        )
          .populate(
            "createdBy",
            "name email role"
          )
          .populate(
            "assignedTo",
            "name email role"
          );

      if (!updatedTodo) {
        return res.status(500).json({
          success: false,
          message:
            "Todo was created but its tags could not be saved",
        });
      }

      createdTodo =
        updatedTodo;
    }

    return res.status(201).json({
      success: true,

      message:
        "Todo created successfully from AI request",

      data:
        createdTodo,

      ai: {
        title:
          extracted.title,

        description:
          extracted.description,

        dueDate:
          dueDate || null,

        priority:
          extracted.priority,

        assignedTo:
          req.user._id,

        tags,
      },
    });
  } catch (error) {
    if (error.status) {
      return res
        .status(error.status)
        .json({
          success: false,
          message:
            error.message,
        });
    }

    if (
      error.code ===
        "AI_NOT_CONFIGURED" ||
      error.code ===
        "AI_PROVIDER_ERROR" ||
      error.code ===
        "AI_EMPTY_OUTPUT" ||
      error.code ===
        "AI_INVALID_OUTPUT"
    ) {
      return res.status(503).json({
        success: false,
        message:
          "AI Todo creation is temporarily unavailable",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to create Todo from AI request",
    });
  }
};

module.exports = {
  createAiTodo,
};