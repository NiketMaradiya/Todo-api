# Todo API

A RESTful Todo API built with Node.js, Express.js, MongoDB, Mongoose, JWT authentication, Todo assignment, comments, notifications, attachments, audit history, soft delete/restore, Cloudinary integration, in-memory LFU caching, and an AI-powered Todo Assistant using Google Gemini.

---

# Features

## Authentication

- User registration
- User login
- JWT authentication
- Protected routes
- Password hashing
- Get current user
- Change password
- Forgot password
- Reset password
- Temporary password protection
- Logout

---

# Todo Management

- Create Todo
- Update Todo
- Delete Todo
- Restore Todo
- Get Todos
- Get Todo by ID
- Assign Todo
- Update Todo status
- Update Todo priority
- Due date/time
- Tags
- Search
- Filtering
- Pagination
- Sorting

---

# AI Todo Assistant

The API supports natural-language Todo commands using Google Gemini.

The assistant can understand English, Hindi, and Hinglish requests.

Examples:

    Tomorrow at 5 PM remind me to call Rahul about the project and make it high priority.

    Rahul wale task ko 6 PM kar do.

    aaj ke kitne task hain?

    aaj kisko call karna hai?

    aaj ke saare tasks batao.

    aaj kaunse task pehle karne chahiye?

    aaj ke saare task complete karne mein kitna time lagega?

    aaj ke saare tasks ka priority wise plan bana do.

---

# AI Features

## Natural-Language Todo Creation

Example:

    POST /api/todos/ai

Request:

    {
      "prompt": "Tomorrow at 5 PM remind me to call Rahul about the project. Make it high priority."
    }

The AI extracts:

- Title
- Description
- Due date
- Due time
- Priority
- Assigned user
- Tags
- Estimated duration
- Scheduling requirements

---

## Todo Update

The AI can find an existing Todo belonging to the logged-in user and update it.

Example:

    {
      "prompt": "Rahul wale call ko 6 PM kar do"
    }

The system:

1. Finds the matching Todo
2. Checks that it belongs to the authenticated user
3. Validates the update
4. Uses the existing Todo update flow
5. Returns the updated Todo

---

## Duplicate Detection

Before creating a new AI Todo, the system checks the logged-in user's existing Todos for similar titles.

Example:

Existing:

    Call Rahul about the project

New request:

    Tomorrow call Rahul about project

The API can return:

    409 Conflict

with:

    duplicate: true

instead of silently creating a duplicate Todo.

The response includes the matching Todo so the client can decide whether to update it.

---

# Today's Tasks

The AI can answer questions about today's Todos.

## Count Today's Tasks

Request:

    {
      "prompt": "aaj ke kitne task hain?"
    }

Response contains:

    type: count_today

and the number of today's tasks.

---

## List Today's Tasks

Request:

    {
      "prompt": "aaj ke saare tasks batao"
    }

Response contains:

    type: list_today

with today's tasks.

---

## Today's Call Tasks

Request:

    {
      "prompt": "aaj kisko call karna hai?"
    }

The system searches today's tasks belonging to the authenticated user and returns relevant call-related tasks.

---

# Today's Task Recommendations

The AI assistant can recommend the best order for today's work.

Example:

    {
      "prompt": "aaj kaunse task pehle karne chahiye?"
    }

Recommendations consider:

1. Priority
2. Due date
3. Overdue status
4. Tasks due soon
5. Estimated task duration
6. In-progress status

---

# All-Today Duration Estimation

The assistant can estimate the time required for all pending tasks today.

Example:

    {
      "prompt": "aaj ke saare task complete karne mein kitna time lagega?"
    }

The response can include:

- Total tasks
- Completed tasks
- Pending tasks
- Estimated duration for every task
- Total estimated minutes
- Total estimated hours
- Estimated completion time

Example:

    Call Rahul
    20 minutes

    Reply to client emails
    15 minutes

    Complete client report
    60 minutes

    Attend team meeting
    45 minutes

    Total:
    140 minutes
    = 2 hours 20 minutes

---

# Full Daily Planning

The assistant can combine task listing, prioritization, duration estimation, and scheduling.

Example:

    {
      "prompt": "aaj ke saare tasks batao, kaunsa pehle karna chahiye, har task ko kitna time lagega aur sab kab tak complete honge?"
    }

The application should return:

- Today's tasks
- Priority
- Due time
- Recommended order
- Estimated duration per task
- Total estimated duration
- Estimated completion time

---

# Logged-in User Security

All AI Todo operations are restricted to the authenticated user.

The AI does not decide which user's data it can access.

The server always gets the user identity from:

    req.user

and not from:

    req.body.userId

or an AI-generated user ID.

---

# Assignment Security

AI Todo creation and updates are restricted to the logged-in user.

## No assignee specified

The Todo is assigned to:

    Logged-in user

## Logged-in user specified

The request is allowed.

## Another user specified

The request is rejected:

    403 Forbidden

Example:

    {
      "prompt": "Create a Todo and assign it to John"
    }

If John is another user:

    403 AI Todo creation can only assign the Todo to the logged-in user

## Unknown user

If the mentioned user cannot be found:

    404 Not Found

---

# Authorization Rules

AI cannot bypass existing Todo permissions.

Every request must pass:

    Authentication
        ↓
    AI extraction
        ↓
    Server-side validation
        ↓
    User authorization
        ↓
    Existing Todo validation
        ↓
    Todo creation/update

The AI is never trusted as an authorization source.

---

# Existing Todo Flow

AI-created Todos are passed through the existing Todo creation logic.

The AI layer does not directly bypass the normal Todo service/controller.

This keeps the same:

- Validation
- Authentication
- Authorization
- Activity logging
- Notifications
- Cache invalidation
- Database rules

used by manually created Todos.

---

# Google Gemini / Google AI Studio

The AI Todo assistant uses Google Gemini.

Google AI Studio is used to create and manage the Gemini API key.

The backend uses:

    @google/genai

Install:

    npm install @google/genai

---

# Environment Configuration

Create a `.env` file in the project root.

Example:

    PORT=5000

    MONGO_URI=mongodb://127.0.0.1:27017/todo-api

    JWT_SECRET=your_super_secret_jwt_key
    JWT_EXPIRES_IN=1d

    CLIENT_URL=http://localhost:3000

    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_SECURE=false
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASSWORD=your_gmail_app_password
    EMAIL_FROM="Todo API <your_email@gmail.com>"

    TRASH_RETENTION_DAYS=30

    CONFIG_ENCRYPTION_KEY=your_64_character_hex_encryption_key

    CACHE_MAX_SIZE=100
    CACHE_TTL=60000

    GEMINI_API_KEY=your_google_ai_studio_api_key
    GEMINI_MODEL=gemini-3.6-flash
    AI_TODO_TIMEZONE=Asia/Kolkata

---

# Gemini API Key

Use a Gemini API key generated through Google AI Studio.

Set:

    GEMINI_API_KEY=your_google_ai_studio_api_key

Do not expose this key in the frontend.

Do not commit `.env` to Git.

---

# AI Model

The model is configured using:

    GEMINI_MODEL=gemini-3.6-flash

The code reads the model from the environment so it can be changed without modifying application code.

---

# AI Timezone

Relative dates are interpreted using:

    AI_TODO_TIMEZONE

Example:

    AI_TODO_TIMEZONE=Asia/Kolkata

This supports requests such as:

    today
    tomorrow
    Friday
    tomorrow at 5 PM
    aaj
    kal

---

# Installation

Install dependencies:

    npm install

Install Gemini SDK:

    npm install @google/genai

---

# Start the Server

Development:

    npm run dev

Production:

    npm start

Default API:

    http://localhost:5000

---

# AI Todo API

## Endpoint

    POST /api/todos/ai

Authentication:

    Authorization: Bearer YOUR_JWT_TOKEN

Content-Type:

    application/json

---

# AI Create Example

Request:

    POST /api/todos/ai

Body:

    {
      "prompt": "Tomorrow at 5 PM remind me to call Rahul about the project. Make it high priority."
    }

Expected:

    201 Created

The response contains the created Todo.

---

# AI Update Example

Request:

    {
      "prompt": "Rahul wale call ko 6 PM kar do"
    }

Expected:

    200 OK

The system finds the matching Todo belonging to the logged-in user and updates it.

---

# AI Count Example

Request:

    {
      "prompt": "aaj ke kitne task hain?"
    }

Expected:

    type: count_today

---

# AI List Example

Request:

    {
      "prompt": "aaj ke saare tasks batao"
    }

Expected:

    type: list_today

---

# AI Call Search Example

Request:

    {
      "prompt": "aaj kisko call karna hai?"
    }

Returns relevant call-related tasks scheduled for today for the authenticated user.

---

# AI Recommendation Example

Request:

    {
      "prompt": "aaj kaunse task pehle karne chahiye?"
    }

Returns today's pending tasks ordered by recommendation score.

---

# AI Full-Day Estimate Example

Request:

    {
      "prompt": "aaj ke saare task complete karne mein kitna time lagega?"
    }

Returns:

    totalTasks
    completedTasks
    pendingTasks
    estimatedTotalMinutes
    estimatedTotalHours
    estimatedCompletionTime
    task-by-task estimated duration

---

# AI Full-Day Planning Example

Request:

    {
      "prompt": "aaj ke saare tasks batao, kaunsa pehle karna chahiye, har task ko kitna time lagega aur sab kab tak complete honge?"
    }

Expected information:

    Task
    Priority
    Due Time
    Estimated Duration
    Recommended Order
    Recommended Start
    Recommended Finish
    Total Duration
    Estimated Completion

---

# Request Validation

The AI endpoint validates the request before processing.

Invalid:

    {}
    
or:

    {
      "prompt": ""
    }

Response:

    {
      "success": false,
      "message": "prompt is required and must be a non-empty string"
    }

Maximum prompt length:

    4000 characters

---

# AI Output Validation

AI output is validated by the backend.

Validated fields include:

- Title
- Description
- Priority
- Due date
- Status
- Assigned user
- Tags
- Ambiguous dates
- Estimated duration

Supported priorities:

    low
    medium
    high

Supported statuses:

    pending
    in-progress
    completed

---

# Ambiguous Dates

If the AI determines that a requested date is ambiguous, the Todo is not created.

Example:

    "Finish it on 5/6"

If the system cannot safely determine the date:

    400 Bad Request

The user should clarify the date.

---

# AI Failure Handling

If Gemini is unavailable, incorrectly configured, or returns invalid structured data:

    503 Service Unavailable

Example:

    {
      "success": false,
      "message": "AI Todo assistant is temporarily unavailable"
    }

AI failure must never result in an invalid Todo being saved.

---

# Duplicate Handling

When AI creation is requested, the application compares the new Todo title with the authenticated user's existing Todos.

If a strong duplicate is detected:

    409 Conflict

Example:

    {
      "success": false,
      "duplicate": true,
      "message": "A similar Todo already exists"
    }

The existing Todo is returned so the client can decide whether to update it.

---

# Todo API

    POST   /api/todos
    POST   /api/todos/ai

    GET    /api/todos
    GET    /api/todos/stats
    GET    /api/todos/:id

    PUT    /api/todos/:id
    PATCH  /api/todos/:id

    PATCH  /api/todos/:id/status

    DELETE /api/todos/:id

    POST   /api/todos/:id/comments
    GET    /api/todos/:id/comments

    PATCH  /api/todos/:todoId/comments/:commentId
    DELETE /api/todos/:todoId/comments/:commentId

    GET    /api/todos/:id/activity

    POST   /api/todos/:id/attachment

---

# Authentication API

    POST /api/auth/register
    POST /api/auth/login
    POST /api/auth/forgot-password
    POST /api/auth/reset-password/:token
    POST /api/auth/change-password
    GET  /api/auth/me
    POST /api/auth/logout

---

# Collaboration

The API supports:

- Comments
- Todo activity
- Audit logging
- Notifications
- Attachments
- Assignment
- Status updates

---

# Admin

Admin functionality includes:

- Get all users
- Get all Todos
- Get Todo by ID
- Update any Todo
- Delete Todo
- Restore Todo
- View Trash
- Change user role
- Make user admin
- Remove admin privileges
- Change user password
- Enable/disable users
- Delete users

---

# Cloudinary

Cloudinary is used for Todo attachments.

Capabilities include:

- Upload attachments
- Store attachment URL
- Store Cloudinary public ID
- Secure Cloudinary configuration
- Cloudinary credentials stored securely

---

# In-Memory LFU Cache

The project includes a custom in-memory Least Frequently Used cache.

No Redis or external cache service is required.

Features:

- In-memory storage
- Maximum cache size
- Frequency tracking
- LFU eviction
- TTL expiration
- Cache invalidation
- User-specific cache keys
- Query-specific cache keys
- Expired entry cleanup
- Cache failure isolation

---

# Cache Configuration

Example:

    CACHE_MAX_SIZE=100
    CACHE_TTL=60000

TTL is in milliseconds.

Examples:

    60000
    1 minute

    300000
    5 minutes

    600000
    10 minutes

---

# Cache Flow

    GET /api/todos
          ↓
    Create cache key
          ↓
    Check cache
          ↓
       ┌──┴──┐
       │     │
      HIT   MISS
       │     │
    frequency MongoDB
       +1     │
       │      ↓
       │   Store result
       │      │
       └──┬───┘
          ↓
      Response

---

# Cache Invalidation

Todo cache is invalidated when Todo data changes.

Operations include:

- Todo creation
- Todo update
- Todo deletion
- Todo restore
- Todo assignment
- Status change
- Priority change
- Due date change
- Attachment changes

AI-created and AI-updated Todos also use the existing Todo flow so normal cache invalidation is preserved.

---

# Todo Trash

Todos are soft deleted.

When deleted:

    isDeleted = true
    deletedAt = current date

Retention is controlled using:

    TRASH_RETENTION_DAYS=30

After the retention period, old deleted Todos can be permanently removed.

---

# Testing

Install dependencies:

    npm install

Run all tests:

    npm test

Run AI Todo tests:

    npx jest tests/aiTodo.test.js --runInBand

Run Todo tests:

    npm run test:todo

Run Authentication tests:

    npm run test:auth

Run Admin tests:

    npm run test:admin

Run all test suites:

    npm run test:all

---

# Manual AI Testing

## 1. Login

Request:

    POST /api/auth/login

Body:

    {
      "email": "your-user@example.com",
      "password": "your-password"
    }

Copy the JWT token.

---

## 2. Test AI Endpoint

Request:

    POST http://localhost:5000/api/todos/ai

Headers:

    Authorization: Bearer YOUR_JWT_TOKEN
    Content-Type: application/json

Body:

    {
      "prompt": "Tomorrow at 5 PM remind me to call Rahul about the project. Make it high priority."
    }

Expected:

    201 Created

---

## 3. Create Today's Test Todos

Create several Todos for today's date.

Example:

    Call Rahul about the project
    Priority: high
    Due: 2:00 PM

    Complete client report
    Priority: high
    Due: 5:00 PM

    Reply to client emails
    Priority: medium
    Due: 3:00 PM

    Attend team meeting
    Priority: medium
    Due: 4:00 PM

    Update project documentation
    Priority: low
    Due: 7:00 PM

---

## 4. Test Today's Count

    {
      "prompt": "aaj ke kitne task hain?"
    }

Expected:

    count_today

---

## 5. Test Today's Tasks

    {
      "prompt": "aaj ke saare tasks batao"
    }

Expected:

    list_today

---

## 6. Test Today's Calls

    {
      "prompt": "aaj kisko call karna hai?"
    }

Expected:

    Call Rahul about the project

---

## 7. Test Recommendation

    {
      "prompt": "aaj kaunse task pehle karne chahiye?"
    }

Expected:

    Recommended order based on:
    priority
    due time
    urgency
    status
    estimated duration

---

## 8. Test All-Task Duration

    {
      "prompt": "aaj ke saare task complete karne mein kitna time lagega?"
    }

Expected:

    All pending tasks
    Individual duration
    Total duration
    Total hours
    Estimated completion time

---

## 9. Test Full Schedule

    {
      "prompt": "aaj ke saare tasks batao, kaunsa pehle karna chahiye, har task ko kitna time lagega aur sab kab tak complete honge?"
    }

Expected:

    Task list
    Priority
    Due time
    Estimated duration
    Recommended order
    Start time
    Finish time
    Total duration
    Estimated completion

---

## 10. Test Update

First create:

    {
      "prompt": "Tomorrow at 10 AM call Amit about the proposal"
    }

Then:

    {
      "prompt": "Amit wale call ko 6 PM kar do"
    }

Expected:

    Existing Todo updated

No duplicate Todo should be created.

---

## 11. Test Duplicate Detection

Create:

    {
      "prompt": "Tomorrow at 10 AM call Amit about the proposal"
    }

Send the same request again.

Expected:

    409 Conflict

and:

    duplicate = true

---

## 12. Test Unknown User

    {
      "prompt": "Create a task and assign it to UnknownUser123"
    }

Expected:

    404 Not Found

---

## 13. Test Cross-User Assignment

Login as User A.

Send:

    {
      "prompt": "Create a task and assign it to User B"
    }

Expected:

    403 Forbidden

No Todo should be created for User B.

---

## 14. Test Authentication

Remove:

    Authorization: Bearer YOUR_JWT_TOKEN

Send:

    {
      "prompt": "aaj ke saare tasks batao"
    }

Expected:

    401 Unauthorized

---

# AI Testing Checklist

- [ ] Create Todo from simple sentence
- [ ] Extract title
- [ ] Extract description
- [ ] Extract high priority
- [ ] Extract low priority
- [ ] Default to medium priority
- [ ] Extract due date
- [ ] Extract due time
- [ ] Handle tomorrow
- [ ] Handle today
- [ ] Handle Friday
- [ ] Handle ambiguous dates
- [ ] Extract assignee
- [ ] Allow logged-in user only
- [ ] Reject another user
- [ ] Reject unknown user
- [ ] Extract tags
- [ ] Detect duplicates
- [ ] Update existing Todo
- [ ] Count today's tasks
- [ ] List today's tasks
- [ ] Find today's call tasks
- [ ] Recommend task order
- [ ] Estimate duration for every task
- [ ] Calculate total estimated time
- [ ] Calculate estimated completion time
- [ ] Handle Hindi requests
- [ ] Handle Hinglish requests
- [ ] Handle Gemini API failure
- [ ] Validate AI output
- [ ] Require authentication
- [ ] Prevent cross-user data access
- [ ] Ensure AI cannot bypass Todo permissions
- [ ] Ensure AI uses existing Todo creation/update logic

---

# Security

Never commit secrets to Git.

Keep sensitive configuration in `.env`.

Sensitive values include:

    GEMINI_API_KEY
    JWT_SECRET
    MONGO_URI
    EMAIL_PASSWORD
    CONFIG_ENCRYPTION_KEY
    Cloudinary credentials

The `.env` file should be included in `.gitignore`.

The Gemini API key must only be used on the backend.

Never expose the Gemini API key in frontend code.

---

# Multi-Process Cache Note

The custom cache is process-local.

If multiple Node.js processes run:

    Process 1
    └── Cache 1

    Process 2
    └── Cache 2

The caches are not shared.

This is expected because the cache is intentionally implemented using application memory instead of Redis or another external cache.

---

# Project Structure

    todo-api/
    │
    ├── config/
    │
    ├── controllers/
    │   ├── adminController.js
    │   ├── authController.js
    │   ├── todoController.js
    │   └── aiTodoController.js
    │
    ├── middleware/
    │
    ├── models/
    │   ├── Todo.js
    │   ├── User.js
    │   ├── Comment.js
    │   ├── Activity.js
    │   └── Notification.js
    │
    ├── routes/
    │   ├── adminRoutes.js
    │   ├── authRoutes.js
    │   ├── notificationRoutes.js
    │   └── todoRoutes.js
    │
    ├── utils/
    │   ├── aiTodoService.js
    │   ├── lfuCache.js
    │   ├── activityService.js
    │   ├── notificationService.js
    │   └── ...
    │
    ├── tests/
    │   ├── aiTodo.test.js
    │   ├── auth.test.js
    │   ├── todo.test.js
    │   └── ...
    │
    ├── .env
    ├── .gitignore
    ├── package.json
    ├── package-lock.json
    ├── server.js
    └── README.md

---

# License

This project is intended for application development, testing, and API implementation purposes.