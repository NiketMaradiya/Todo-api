const mongoose =
  require("mongoose");

const {
  GoogleGenAI,
} = require("@google/genai");

const Todo =
  require("../models/Todo");

const User =
  require("../models/User");

const {
  createTodo,
} = require("./todoController");

const {
  updateTodo,
} = require("./todoController");

// ============================================================
// CONFIG
// ============================================================

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-3.6-flash";

const AI_TIMEZONE =
  process.env.AI_TODO_TIMEZONE ||
  "Asia/Kolkata";

const MAX_TODOS_FOR_AI =
  50;

const DUPLICATE_SIMILARITY_THRESHOLD =
  0.82;

const allowedPriorities = [
  "low",
  "medium",
  "high",
];

const allowedStatuses = [
  "pending",
  "in-progress",
  "completed",
];

// ============================================================
// GEMINI RESPONSE SCHEMA
//
// One endpoint supports:
// - create Todo
// - update Todo
// - count today's tasks
// - list today's tasks
// - recommend today's tasks
// - search user's tasks
// ============================================================

const aiCommandSchema = {
  type: "object",

  properties: {
    intent: {
      type: "string",

      enum: [
        "create",
        "update",
        "count_today",
        "list_today",
        "recommend_today",
        "search",
      ],
    },

    title: {
      type: "string",
    },

    description: {
      type: "string",
    },

    searchTitle: {
      type: "string",
    },

    dueDate: {
      type: [
        "string",
        "null",
      ],
    },

    priority: {
      type: "string",

      enum: [
        "low",
        "medium",
        "high",
      ],
    },

    status: {
      type: "string",

      enum: [
        "pending",
        "in-progress",
        "completed",
      ],
    },

    assignedUserName: {
      type: [
        "string",
        "null",
      ],
    },

    tags: {
      type: "array",

      items: {
        type: "string",
      },
    },

    durationMinutes: {
      type: "integer",
    },

    dateAmbiguous: {
      type: "boolean",
    },

    dateClarification: {
      type: [
        "string",
        "null",
      ],
    },

    schedulingRequested: {
      type: "boolean",
    },

    schedulingReason: {
      type: "string",
    },
  },

  required: [
    "intent",
    "title",
    "description",
    "searchTitle",
    "dueDate",
    "priority",
    "status",
    "assignedUserName",
    "tags",
    "durationMinutes",
    "dateAmbiguous",
    "dateClarification",
    "schedulingRequested",
    "schedulingReason",
  ],
};

// ============================================================
// GENERIC HELPERS
// ============================================================

const normalizeText = (
  value
) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      " "
    )
    .replace(
      /\s+/g,
      " "
    );
};

const tokenize = (
  value
) => {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter(
        (token) =>
          token.length > 1
      )
  );
};

const calculateSimilarity = (
  first,
  second
) => {
  const firstTokens =
    tokenize(first);

  const secondTokens =
    tokenize(second);

  if (
    firstTokens.size === 0 ||
    secondTokens.size === 0
  ) {
    return 0;
  }

  let intersection = 0;

  firstTokens.forEach(
    (token) => {
      if (
        secondTokens.has(token)
      ) {
        intersection += 1;
      }
    }
  );

  const union =
    new Set([
      ...firstTokens,
      ...secondTokens,
    ]).size;

  return union === 0
    ? 0
    : intersection / union;
};

const isValidObjectId = (
  value
) => {
  return mongoose.Types.ObjectId.isValid(
    value
  );
};

const isValidDate = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }

  return !Number.isNaN(
    new Date(
      value
    ).getTime()
  );
};

const getDateStart = (
  value = new Date()
) => {
  const date =
    new Date(value);

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
};

const getDateEnd = (
  value = new Date()
) => {
  const date =
    getDateStart(value);

  date.setDate(
    date.getDate() + 1
  );

  return date;
};

const isSameDay = (
  first,
  second
) => {
  if (
    !first ||
    !second
  ) {
    return false;
  }

  const firstDate =
    new Date(first);

  const secondDate =
    new Date(second);

  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth() &&
    firstDate.getDate() ===
      secondDate.getDate()
  );
};

// ============================================================
// ONLY LOGGED-IN USER'S TODOS
//
// This intentionally does NOT use:
// - req.body.userId
// - AI-generated userId
// - arbitrary user IDs
//
// The authenticated req.user is the only source of authority.
// ============================================================

const getUserTodoFilter = (
  user
) => {
  return {
    isDeleted: false,

    $or: [
      {
        createdBy:
          user._id,
      },

      {
        assignedTo:
          user._id,
      },
    ],
  };
};

const getUserTodos = async (
  user
) => {
  return Todo.find(
    getUserTodoFilter(user)
  )
    .sort({
      dueDate: 1,
      priority: -1,
      createdAt: 1,
    })
    .limit(
      MAX_TODOS_FOR_AI
    )
    .populate(
      "createdBy",
      "name email role"
    )
    .populate(
      "assignedTo",
      "name email role"
    );
};

// ============================================================
// USER RESOLUTION
//
// AI may mention a person, but assignment is still authorized
// by the application.
//
// This implementation only allows the logged-in user to be
// assigned through the AI endpoint.
// ============================================================

const resolveUser = async (
  assignedUserName
) => {
  const normalized =
    String(
      assignedUserName || ""
    )
      .trim();

  if (!normalized) {
    return null;
  }

  if (
    isValidObjectId(
      normalized
    )
  ) {
    return User.findById(
      normalized
    );
  }

  const escaped =
    normalized.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

  const users =
    await User.find({
      isActive: true,

      $or: [
        {
          email: {
            $regex:
              `^${escaped}$`,
            $options: "i",
          },
        },

        {
          name: {
            $regex:
              `^${escaped}$`,
            $options: "i",
          },
        },
      ],
    }).limit(2);

  if (
    users.length > 1
  ) {
    const error =
      new Error(
        "Assigned user is ambiguous"
      );

    error.status = 400;
    error.code =
      "AMBIGUOUS_USER";

    throw error;
  }

  return users[0] || null;
};

// ============================================================
// DURATION ESTIMATION
//
// AI provides durationMinutes.
// This fallback protects us if AI returns an unusable value.
// ============================================================

const normalizeDuration = (
  value
) => {
  const duration =
    Number(
      value
    );

  if (
    !Number.isFinite(
      duration
    ) ||
    duration <= 0
  ) {
    return 30;
  }

  return Math.min(
    Math.round(
      duration
    ),
    24 * 60
  );
};

// ============================================================
// AUTOMATIC DUE DATE
//
// If user asks to schedule based on estimated duration and no
// explicit due date exists, set dueDate from current time.
//
// Example:
// "I need to finish this today, estimate the time and set it."
//
// The application calculates the due date locally.
// ============================================================

const calculateAutomaticDueDate = (
  durationMinutes
) => {
  const now =
    new Date();

  return new Date(
    now.getTime() +
      normalizeDuration(
        durationMinutes
      ) *
        60 *
        1000
  );
};

// ============================================================
// DUPLICATE DETECTION
// ============================================================

const findPossibleDuplicates = async ({
  user,
  title,
  dueDate,
}) => {
  if (
    !title ||
    !title.trim()
  ) {
    return [];
  }

  const todos =
    await Todo.find(
      getUserTodoFilter(
        user
      )
    )
      .sort({
        createdAt: -1,
      })
      .limit(100);

  return todos
    .map((todo) => {
      const similarity =
        calculateSimilarity(
          title,
          todo.title
        );

      const sameDueDay =
        dueDate &&
        todo.dueDate
          ? isSameDay(
              dueDate,
              todo.dueDate
            )
          : false;

      const strongDuplicate =
        similarity >=
          DUPLICATE_SIMILARITY_THRESHOLD &&
        (
          sameDueDay ||
          !dueDate ||
          !todo.dueDate
        );

      return {
        todo,
        similarity,
        sameDueDay,
        strongDuplicate,
      };
    })
    .filter(
      (item) =>
        item.strongDuplicate
    )
    .sort(
      (a, b) =>
        b.similarity -
        a.similarity
    );
};

// ============================================================
// UPDATE MATCHING
// ============================================================

const findTodoForUpdate = async ({
  user,
  searchTitle,
  title,
  todoId,
}) => {
  const filter =
    getUserTodoFilter(
      user
    );

  // AI/user may provide an explicit Todo ID.
  if (
    todoId &&
    isValidObjectId(
      todoId
    )
  ) {
    return Todo.findOne({
      ...filter,
      _id: todoId,
    });
  }

  const searchValue =
    String(
      searchTitle ||
        title ||
        ""
    ).trim();

  if (!searchValue) {
    return null;
  }

  const todos =
    await Todo.find(
      filter
    )
      .sort({
        createdAt: -1,
      })
      .limit(100);

  const ranked =
    todos
      .map(
        (todo) => ({
          todo,

          similarity:
            calculateSimilarity(
              searchValue,
              todo.title
            ),
        })
      )
      .sort(
        (a, b) =>
          b.similarity -
          a.similarity
      );

  if (
    ranked.length === 0
  ) {
    return null;
  }

  const best =
    ranked[0];

  if (
    best.similarity <
    0.55
  ) {
    return null;
  }

  const second =
    ranked[1];

  if (
    second &&
    Math.abs(
      best.similarity -
        second.similarity
    ) <
      0.08
  ) {
    const error =
      new Error(
        "More than one Todo matches the requested update"
      );

    error.status = 409;

    error.code =
      "AMBIGUOUS_TODO";

    error.matches =
      ranked
        .slice(
          0,
          5
        )
        .map(
          (item) => ({
            id:
              item.todo._id,

            title:
              item.todo.title,

            similarity:
              item.similarity,
          })
        );

    throw error;
  }

  return best.todo;
};

// ============================================================
// GEMINI
// ============================================================

const buildGeminiPrompt = (
  prompt
) => {
  const now =
    new Date();

  return `
You are an AI Todo assistant for a backend application.

You MUST ONLY work with the authenticated user's Todo data.

The application, not the model, enforces authorization.

Never invent another user's Todo ID.
Never invent another user's identity.
Never return an arbitrary userId.

Current date/time:
${now.toISOString()}

Timezone:
${AI_TIMEZONE}

Your job is to classify and extract the user's requested action.

SUPPORTED INTENTS:

1. create
   User wants to create a new Todo.

2. update
   User wants to change an existing Todo.

3. count_today
   Examples:
   "aaj ke kitne task hain?"
   "how many tasks do I have today?"

4. list_today
   Examples:
   "aaj kisko call karna hai?"
   "what tasks do I have today?"
   "aaj ke tasks batao"

5. recommend_today
   Examples:
   "aaj kaunse task pehle karun?"
   "which tasks should I do first?"
   "aaj kya complete karna chahiye aur kitne time mein?"

6. search
   User wants to find their existing Todo(s).

CREATE RULES:

- Extract a concise title.
- Extract description.
- Extract priority.
- Extract due date/time.
- Extract assignee name only if explicitly mentioned.
- Extract tags.
- If priority is not specified, use medium.
- If duration is not specified, estimate a reasonable duration.
- If the user asks to automatically schedule based on duration, set schedulingRequested=true.
- If there is no explicit due date and the user asks to schedule based on estimated effort, the application will calculate the due date.
- Never invent a date when the user's request is genuinely ambiguous.

UPDATE RULES:

- Extract the existing Todo's title into searchTitle.
- Put the desired new values into title, description, dueDate, priority, status, etc.
- If the user only wants to update priority, title may remain empty.
- Do not invent a Todo ID.
- Never update a Todo outside the authenticated user's access.

TODAY RULES:

- "today" means the current calendar day in ${AI_TIMEZONE}.
- count_today means count only.
- list_today means return today's task list.
- recommend_today means rank today's tasks using:
  1. due date/time
  2. priority
  3. estimated duration
  4. overdue status

LANGUAGE:

Understand English, Hindi, Hinglish, and common conversational phrases such as:
- aaj
- kal
- kis ko call karna hai
- kitne task hain
- kaun sa task pehle karu
- kitne time mein ho payega

User request:

${prompt}
`;
};

const callGemini =
  async (
    prompt
  ) => {
    if (
      !process.env.GEMINI_API_KEY
    ) {
      const error =
        new Error(
          "Gemini API key is not configured"
        );

      error.code =
        "AI_NOT_CONFIGURED";

      throw error;
    }

    try {
      const ai =
        new GoogleGenAI({
          apiKey:
            process.env.GEMINI_API_KEY,
        });

      const response =
        await ai.models.generateContent(
          {
            model:
              GEMINI_MODEL,

            contents:
              buildGeminiPrompt(
                prompt
              ),

            config: {
              responseMimeType:
                "application/json",

              responseSchema:
                aiCommandSchema,
            },
          }
        );

      const text =
        response.text;

      if (
        !text ||
        typeof text !==
          "string"
      ) {
        const error =
          new Error(
            "Gemini returned no structured response"
          );

        error.code =
          "AI_EMPTY_OUTPUT";

        throw error;
      }

      let parsed;

      try {
        parsed =
          JSON.parse(
            text
          );
      } catch (
        parseError
      ) {
        const error =
          new Error(
            "Gemini returned invalid JSON"
          );

        error.code =
          "AI_INVALID_OUTPUT";

        throw error;
      }

      return parsed;
    } catch (error) {
      if (
        error.code ===
          "AI_NOT_CONFIGURED" ||
        error.code ===
          "AI_EMPTY_OUTPUT" ||
        error.code ===
          "AI_INVALID_OUTPUT"
      ) {
        throw error;
      }

      const providerError =
        new Error(
          error.message ||
            "Gemini API request failed"
        );

      providerError.code =
        "AI_PROVIDER_ERROR";

      throw providerError;
    }
  };

// ============================================================
// CALL EXISTING CREATE FLOW
//
// This does NOT write the Todo directly.
// It reuses the existing controller.
// ============================================================

const executeExistingCreateTodo =
  async (
    req,
    payload
  ) => {
    let statusCode = 500;
    let body = null;

    const fakeRes = {
      status(code) {
        statusCode =
          code;

        return this;
      },

      json(data) {
        body =
          data;

        return this;
      },
    };

    await createTodo(
      {
        ...req,

        body:
          payload,
      },

      fakeRes
    );

    return {
      statusCode,

      body,
    };
  };

// ============================================================
// CALL EXISTING UPDATE FLOW
//
// This reuses the existing controller so normal validation,
// activity logging, cache invalidation and notifications stay
// in the normal Todo path.
// ============================================================

const executeExistingUpdateTodo =
  async (
    req,
    todoId,
    payload
  ) => {
    let statusCode = 500;
    let body = null;

    const fakeRes = {
      status(code) {
        statusCode =
          code;

        return this;
      },

      json(data) {
        body =
          data;

        return this;
      },
    };

    await updateTodo(
      {
        ...req,

        params: {
          ...(req.params ||
            {}),
          id:
            todoId,
        },

        body:
          payload,
      },

      fakeRes
    );

    return {
      statusCode,

      body,
    };
  };

// ============================================================
// TODAY TASK FILTER
// ============================================================

const getTodayTodos = async (
  user
) => {
  const start =
    getDateStart();

  const end =
    getDateEnd();

  const filter =
    getUserTodoFilter(
      user
    );

  filter.$and = [
    {
      dueDate: {
        $gte: start,
        $lt: end,
      },
    },
  ];

  return Todo.find(
    filter
  )
    .sort({
      dueDate: 1,
      priority: -1,
      createdAt: 1,
    })
    .populate(
      "createdBy",
      "name email role"
    )
    .populate(
      "assignedTo",
      "name email role"
    );
};

// ============================================================
// TODAY CALL TASKS
//
// Used for questions like:
// "aaj kisko call karna hai"
// ============================================================

const getTodayCallTodos =
  async (
    user
  ) => {
    const todayTodos =
      await getTodayTodos(
        user
      );

    return todayTodos.filter(
      (todo) => {
        const text =
          normalizeText(
            `${todo.title} ${todo.description}`
          );

        return (
          text.includes(
            "call"
          ) ||
          text.includes(
            "phone"
          ) ||
          text.includes(
            "contact"
          ) ||
          text.includes(
            "ring"
          )
        );
      }
    );
  };

// ============================================================
// RECOMMENDATION
// ============================================================

const priorityWeight = {
  high: 3,
  medium: 2,
  low: 1,
};

const calculateRecommendationScore =
  (todo) => {
    let score =
      priorityWeight[
        todo.priority
      ] || 1;

    const now =
      new Date();

    if (
      todo.dueDate
    ) {
      const due =
        new Date(
          todo.dueDate
        );

      const minutesUntilDue =
        Math.round(
          (
            due.getTime() -
            now.getTime()
          ) /
            60000
        );

      // Overdue
      if (
        minutesUntilDue <
        0
      ) {
        score += 5;
      }

      // Due very soon
      else if (
        minutesUntilDue <=
        120
      ) {
        score += 4;
      }

      // Due today
      else if (
        minutesUntilDue <=
        480
      ) {
        score += 2;
      }
    }

    if (
      todo.status ===
      "in-progress"
    ) {
      score += 1;
    }

    return score;
  };

const getRecommendations =
  async (
    user
  ) => {
    const todos =
      await getTodayTodos(
        user
      );

    const pendingTodos =
      todos.filter(
        (todo) =>
          todo.status !==
          "completed"
      );

    const recommendations =
      pendingTodos
        .map(
          (todo) => ({
            todo,

            estimatedMinutes:
              normalizeDuration(
                estimateDurationFromTodo(
                  todo
                )
              ),

            score:
              calculateRecommendationScore(
                todo
              ),
          })
        )
        .sort(
          (a, b) => {
            if (
              b.score !==
              a.score
            ) {
              return (
                b.score -
                a.score
              );
            }

            return (
              a.estimatedMinutes -
              b.estimatedMinutes
            );
          }
        );

    let currentTime =
      new Date();

    return recommendations.map(
      (item) => {
        const start =
          new Date(
            currentTime
          );

        const end =
          new Date(
            currentTime.getTime() +
              item.estimatedMinutes *
                60000
          );

        currentTime =
          new Date(
            end
          );

        return {
          todo:
            item.todo,

          estimatedMinutes:
            item.estimatedMinutes,

          recommendedStart:
            start,

          recommendedFinish:
            end,

          score:
            item.score,
        };
      }
    );
  };

const estimateDurationFromTodo =
  (todo) => {
    const text =
      normalizeText(
        `${todo.title} ${todo.description}`
      );

    if (
      text.includes(
        "call"
      ) ||
      text.includes(
        "phone"
      )
    ) {
      return 20;
    }

    if (
      text.includes(
        "email"
      ) ||
      text.includes(
        "reply"
      )
    ) {
      return 15;
    }

    if (
      text.includes(
        "meeting"
      )
    ) {
      return 45;
    }

    if (
      text.includes(
        "report"
      ) ||
      text.includes(
        "document"
      )
    ) {
      return 60;
    }

    if (
      text.includes(
        "project"
      ) ||
      text.includes(
        "development"
      ) ||
      text.includes(
        "develop"
      )
    ) {
      return 120;
    }

    return 30;
  };

// ============================================================
// RESPONSE FORMAT HELPERS
// ============================================================

const serializeTodo =
  (todo) => {
    if (!todo) {
      return null;
    }

    return {
      _id:
        todo._id,

      title:
        todo.title,

      description:
        todo.description,

      status:
        todo.status,

      priority:
        todo.priority,

      dueDate:
        todo.dueDate,

      createdBy:
        todo.createdBy,

      assignedTo:
        todo.assignedTo,

      createdAt:
        todo.createdAt,

      updatedAt:
        todo.updatedAt,
    };
  };

// ============================================================
// MAIN CONTROLLER
//
// POST /api/todos/ai
//
// Supported conversational commands:
//
// Create:
// "Tomorrow at 5 call Rahul and make it high priority"
//
// Update:
// "Change the Rahul call to 6 PM"
//
// Count:
// "Aaj ke kitne task hain?"
//
// List:
// "Aaj kisko call karna hai?"
//
// Recommend:
// "Aaj kaunse task pehle karun aur kitne time mein ho payega?"
//
// Search:
// "Mera client report wala task dikhao"
// ============================================================

const createAiTodo =
  async (
    req,
    res
  ) => {
    try {
      const prompt =
        req.body?.prompt;

      // --------------------------------------------------------
      // Prompt validation
      // --------------------------------------------------------

      if (
        typeof prompt !==
          "string" ||
        !prompt.trim()
      ) {
        return res.status(400).json({
          success: false,

          message:
            "prompt is required and must be a non-empty string",
        });
      }

      if (
        prompt.length >
        4000
      ) {
        return res.status(400).json({
          success: false,

          message:
            "prompt must be 4000 characters or fewer",
        });
      }

      // --------------------------------------------------------
      // Gemini intent extraction
      // --------------------------------------------------------

      const command =
        await callGemini(
          prompt.trim()
        );

      // --------------------------------------------------------
      // General AI validation
      // --------------------------------------------------------

      if (
        !command.intent
      ) {
        return res.status(400).json({
          success: false,

          message:
            "AI could not determine the requested Todo action",
        });
      }

      if (
        command.dateAmbiguous
      ) {
        return res.status(400).json({
          success: false,

          message:
            command.dateClarification ||
            "The requested date is ambiguous. Please clarify it.",
        });
      }

      // --------------------------------------------------------
      // COUNT TODAY
      // --------------------------------------------------------

      if (
        command.intent ===
        "count_today"
      ) {
        const todos =
          await getTodayTodos(
            req.user
          );

        return res.status(200).json({
          success: true,

          type:
            "count_today",

          count:
            todos.length,

          data:
            todos.map(
              serializeTodo
            ),
        });
      }

      // --------------------------------------------------------
      // LIST TODAY
      // --------------------------------------------------------

      if (
        command.intent ===
        "list_today"
      ) {
        let todos =
          await getTodayTodos(
            req.user
          );

        const callTodos =
          await getTodayCallTodos(
            req.user
          );

        // If the user's request mentions call/phone/contact,
        // return the relevant call tasks first.
        const lowerPrompt =
          prompt
            .toLowerCase();

        if (
          lowerPrompt.includes(
            "call"
          ) ||
          lowerPrompt.includes(
            "phone"
          ) ||
          lowerPrompt.includes(
            "kisko"
          )
        ) {
          todos =
            callTodos;
        }

        return res.status(200).json({
          success: true,

          type:
            "list_today",

          count:
            todos.length,

          data:
            todos.map(
              serializeTodo
            ),
        });
      }

      // --------------------------------------------------------
      // RECOMMEND TODAY
      // --------------------------------------------------------

      if (
        command.intent ===
        "recommend_today"
      ) {
        const recommendations =
          await getRecommendations(
            req.user
          );

        const totalMinutes =
          recommendations.reduce(
            (
              total,
              item
            ) =>
              total +
              item.estimatedMinutes,
            0
          );

        return res.status(200).json({
          success: true,

          type:
            "recommend_today",

          totalTasks:
            recommendations.length,

          estimatedTotalMinutes:
            totalMinutes,

          estimatedTotalHours:
            Number(
              (
                totalMinutes /
                60
              ).toFixed(2)
            ),

          data:
            recommendations.map(
              (item) => ({
                todo:
                  serializeTodo(
                    item.todo
                  ),

                estimatedMinutes:
                  item.estimatedMinutes,

                recommendedStart:
                  item.recommendedStart,

                recommendedFinish:
                  item.recommendedFinish,

                score:
                  item.score,
              })
            ),
        });
      }

      // --------------------------------------------------------
      // SEARCH
      // --------------------------------------------------------

      if (
        command.intent ===
        "search"
      ) {
        const search =
          normalizeText(
            command.searchTitle ||
              command.title ||
              prompt
          );

        if (!search) {
          return res.status(400).json({
            success: false,

            message:
              "Please provide something to search for",
          });
        }

        const todos =
          await getUserTodos(
            req.user
          );

        const results =
          todos
            .map(
              (todo) => ({
                todo,

                similarity:
                  calculateSimilarity(
                    search,
                    todo.title
                  ),
              })
            )
            .filter(
              (item) =>
                item.similarity >
                0.2
            )
            .sort(
              (a, b) =>
                b.similarity -
                a.similarity
            )
            .slice(
              0,
              20
            );

        return res.status(200).json({
          success: true,

          type:
            "search",

          count:
            results.length,

          data:
            results.map(
              (item) => ({
                todo:
                  serializeTodo(
                    item.todo
                  ),

                similarity:
                  Number(
                    item.similarity.toFixed(
                      2
                    )
                  ),
              })
            ),
        });
      }

      // --------------------------------------------------------
      // CREATE
      // --------------------------------------------------------

      if (
        command.intent ===
        "create"
      ) {
        if (
          !command.title ||
          !command.title.trim()
        ) {
          return res.status(400).json({
            success: false,

            message:
              "AI could not determine a Todo title",
          });
        }

        if (
          !allowedPriorities.includes(
            command.priority
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "AI returned an invalid priority",
          });
        }

        let dueDate =
          command.dueDate;

        // ------------------------------------------------------
        // Explicit date
        // ------------------------------------------------------

        if (
          dueDate !== null &&
          dueDate !== undefined &&
          dueDate !== ""
        ) {
          if (
            !isValidDate(
              dueDate
            )
          ) {
            return res.status(400).json({
              success: false,

              message:
                "AI returned an invalid due date",
            });
          }

          dueDate =
            new Date(
              dueDate
            );
        }

        // ------------------------------------------------------
        // Automatic scheduling
        //
        // "estimate the time and set due date"
        // ------------------------------------------------------

        if (
          !dueDate &&
          command.schedulingRequested
        ) {
          dueDate =
            calculateAutomaticDueDate(
              command.durationMinutes
            );
        }

        // ------------------------------------------------------
        // Only logged-in user can be assigned
        // ------------------------------------------------------

        let assignedUser =
          req.user;

        if (
          command.assignedUserName
        ) {
          assignedUser =
            await resolveUser(
              command.assignedUserName
            );

          if (
            !assignedUser
          ) {
            return res.status(404).json({
              success: false,

              message:
                `Assigned user "${command.assignedUserName}" not found`,
            });
          }

          if (
            assignedUser._id.toString() !==
            req.user._id.toString()
          ) {
            return res.status(403).json({
              success: false,

              message:
                "AI Todo creation can only assign the Todo to the logged-in user",
            });
          }
        }

        // ------------------------------------------------------
        // Duplicate detection
        // ------------------------------------------------------

        const duplicates =
          await findPossibleDuplicates(
            {
              user:
                req.user,

              title:
                command.title,

              dueDate,
            }
          );

        if (
          duplicates.length >
          0
        ) {
          const duplicate =
            duplicates[0];

          return res.status(409).json({
            success: false,

            duplicate: true,

            message:
              "A similar Todo already exists",

            similarity:
              Number(
                duplicate.similarity.toFixed(
                  2
                )
              ),

            existingTodo:
              serializeTodo(
                duplicate.todo
              ),

            suggestion:
              "Use an update request if you want to modify the existing Todo.",
          });
        }

        // ------------------------------------------------------
        // Use existing Todo creation flow
        // ------------------------------------------------------

        const payload = {
          title:
            command.title.trim(),

          description:
            String(
              command.description ||
                ""
            ).trim(),

          assignedTo:
            req.user._id.toString(),

          status:
            allowedStatuses.includes(
              command.status
            )
              ? command.status
              : "pending",

          priority:
            command.priority,

          dueDate:
            dueDate
              ? new Date(
                  dueDate
                ).toISOString()
              : null,
        };

        const result =
          await executeExistingCreateTodo(
            req,
            payload
          );

        if (
          result.statusCode >=
          400
        ) {
          return res
            .status(
              result.statusCode
            )
            .json(
              result.body
            );
        }

        return res.status(201).json({
          success: true,

          type:
            "create",

          message:
            "Todo created successfully from AI request",

          data:
            result.body?.data,

          ai: {
            title:
              command.title,

            description:
              command.description,

            priority:
              command.priority,

            dueDate:
              dueDate || null,

            assignedTo:
              req.user._id,

            estimatedDurationMinutes:
              normalizeDuration(
                command.durationMinutes
              ),

            automaticScheduling:
              Boolean(
                command.schedulingRequested
              ),

            tags:
              Array.isArray(
                command.tags
              )
                ? command.tags
                : [],
          },
        });
      }

      // --------------------------------------------------------
      // UPDATE
      // --------------------------------------------------------

      if (
        command.intent ===
        "update"
      ) {
        const todo =
          await findTodoForUpdate(
            {
              user:
                req.user,

              searchTitle:
                command.searchTitle,

              title:
                command.title,
            }
          );

        if (!todo) {
          return res.status(404).json({
            success: false,

            message:
              "I could not find the Todo you want to update",
          });
        }

        const payload =
          {};

        if (
          command.title &&
          command.title.trim()
        ) {
          payload.title =
            command.title.trim();
        }

        if (
          typeof command.description ===
          "string" &&
          command.description.trim()
        ) {
          payload.description =
            command.description.trim();
        }

        if (
          allowedPriorities.includes(
            command.priority
          ) &&
          command.priority !==
            "medium"
        ) {
          payload.priority =
            command.priority;
        }

        if (
          allowedStatuses.includes(
            command.status
          ) &&
          command.status !==
            "pending"
        ) {
          payload.status =
            command.status;
        }

        if (
          command.dueDate !==
            null &&
          command.dueDate !==
            undefined &&
          command.dueDate !==
            ""
        ) {
          if (
            !isValidDate(
              command.dueDate
            )
          ) {
            return res.status(400).json({
              success: false,

              message:
                "AI returned an invalid due date",
            });
          }

          payload.dueDate =
            new Date(
              command.dueDate
            ).toISOString();
        }

        // ------------------------------------------------------
        // IMPORTANT:
        // AI is NOT allowed to update assignedTo to somebody
        // else.
        // ------------------------------------------------------

        if (
          command.assignedUserName
        ) {
          const assignedUser =
            await resolveUser(
              command.assignedUserName
            );

          if (
            !assignedUser
          ) {
            return res.status(404).json({
              success: false,

              message:
                `Assigned user "${command.assignedUserName}" not found`,
            });
          }

          if (
            assignedUser._id.toString() !==
            req.user._id.toString()
          ) {
            return res.status(403).json({
              success: false,

              message:
                "AI Todo updates can only assign the Todo to the logged-in user",
            });
          }

          payload.assignedTo =
            req.user._id.toString();
        }

        if (
          Object.keys(
            payload
          ).length === 0
        ) {
          return res.status(400).json({
            success: false,

            message:
              "No valid Todo changes were found in the request",
          });
        }

        const result =
          await executeExistingUpdateTodo(
            req,
            todo._id.toString(),
            payload
          );

        if (
          result.statusCode >=
          400
        ) {
          return res
            .status(
              result.statusCode
            )
            .json(
              result.body
            );
        }

        return res.status(200).json({
          success: true,

          type:
            "update",

          message:
            "Todo updated successfully from AI request",

          matchedTodo:
            serializeTodo(
              todo
            ),

          data:
            result.body?.data,
        });
      }

      // --------------------------------------------------------
      // UNKNOWN INTENT
      // --------------------------------------------------------

      return res.status(400).json({
        success: false,

        message:
          "Unsupported AI Todo action",
      });
    } catch (error) {
      // --------------------------------------------------------
      // Known application errors
      // --------------------------------------------------------

      if (
        error.status
      ) {
        const response = {
          success: false,

          message:
            error.message,
        };

        if (
          error.matches
        ) {
          response.matches =
            error.matches;
        }

        return res
          .status(
            error.status
          )
          .json(
            response
          );
      }

      // --------------------------------------------------------
      // Gemini/API failures
      // --------------------------------------------------------

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
            "AI Todo assistant is temporarily unavailable",
        });
      }

      // --------------------------------------------------------
      // Unexpected failures
      // --------------------------------------------------------

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to process AI Todo request",
      });
    }
  };

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  createAiTodo,
};