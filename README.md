# Todo API

A RESTful Todo API built with Node.js, Express.js, MongoDB, JWT authentication, Todo assignment, comments, notifications, attachments, audit history, soft delete/restore, Cloudinary configuration management, a custom in-memory LFU cache, and AI-powered Todo creation using Google Gemini.

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
- Temporary password change protection
- Logout

---

## Todo Management

- Create Todo
- AI-powered Todo creation from natural language
- Get Todos
- Get single Todo
- Update Todo
- Delete Todo
- Restore Todo
- Assign Todo
- Change Todo status
- Change Todo priority
- Due date support
- Tags support
- Search
- Filtering
- Pagination
- Sorting

---

## AI-Powered Todo Creation

Users can create Todos using natural-language requests.

Example:

    Tomorrow at 5 PM remind me to call Rahul about the project. Make it high priority.

The AI extracts:

- Title
- Description
- Due date/time
- Priority
- Assigned user
- Tags

The extracted data is validated before the Todo is created.

The AI does not directly write to the database.

The extracted Todo is passed through the existing Todo creation flow so the same validation, authorization, activity logging, notifications, and cache invalidation rules are applied.

### Important Authorization Rule

AI Todo creation is restricted to the authenticated user.

If an AI request attempts to assign a Todo to another user:

    403 Forbidden

This prevents the AI endpoint from bypassing existing Todo permissions.

Examples:

    No assignee mentioned
        ↓
    Todo is assigned to logged-in user

    Logged-in user mentioned
        ↓
    Todo is assigned to logged-in user

    Different user mentioned
        ↓
    Request rejected with 403

    Unknown user mentioned
        ↓
    Request rejected with 404

---

## Collaboration

- Add comments
- Get comments
- Update comments
- Delete comments
- Todo activity history
- Audit logging
- Notifications
- Todo attachments

---

## Admin

- Get all users
- Get all Todos
- Get Todo by ID
- Update any Todo
- Delete any Todo
- View Trash
- Restore Todo
- Change user role
- Make user admin
- Remove admin privileges
- Change user password
- Enable/disable users
- Delete users

---

## Cloudinary

- Cloudinary configuration stored in MongoDB
- Encrypted Cloudinary credentials
- Secure credential management
- Attachment upload

---

## Custom In-Memory LFU Cache

- No Redis
- No external cache service
- Node.js memory only
- Configurable maximum cache size
- LFU eviction
- Access-frequency tracking
- TTL expiration
- Cache invalidation
- User-specific cache keys
- Query-specific cache keys
- Automatic expired-entry cleanup
- Cache failure does not break the API
- Server restart clears the cache

---

# Technologies

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- dotenv
- Nodemailer
- Cloudinary
- Multer
- Swagger UI
- Jest
- Supertest
- Nodemon
- Google Gemini API
- `@google/genai`

---

# Project Structure

    todo-api/
    │
    ├── config/
    │   ├── cloudinary.js
    │   ├── db.js
    │   ├── swagger.js
    │   └── ...
    │
    ├── controllers/
    │   ├── adminController.js
    │   ├── authController.js
    │   ├── cloudinaryAdminController.js
    │   ├── notificationController.js
    │   ├── todoController.js
    │   └── aiTodoController.js
    │
    ├── middleware/
    │   ├── authMiddleware.js
    │   ├── errorMiddleware.js
    │   ├── logger.js
    │   └── uploadMiddleware.js
    │
    ├── models/
    │   ├── Activity.js
    │   ├── CloudinaryConfig.js
    │   ├── Comment.js
    │   ├── Notification.js
    │   ├── Todo.js
    │   ├── TodoActivity.js
    │   └── User.js
    │
    ├── routes/
    │   ├── adminRoutes.js
    │   ├── authRoutes.js
    │   ├── notificationRoutes.js
    │   └── todoRoutes.js
    │
    ├── utils/
    │   ├── activityService.js
    │   ├── aiTodoService.js
    │   ├── attachmentService.js
    │   ├── cloudinaryConfigService.js
    │   ├── emailService.js
    │   ├── encryptionService.js
    │   ├── lfuCache.js
    │   ├── notificationService.js
    │   ├── passwordService.js
    │   └── trashCleanupService.js
    │
    ├── tests/
    │   ├── admin.test.js
    │   ├── adminActivity.test.js
    │   ├── auth.test.js
    │   ├── cloudinaryConfig.test.js
    │   ├── setup.js
    │   ├── todo.test.js
    │   ├── todoActivity.test.js
    │   ├── todoAttachmentActivity.test.js
    │   └── aiTodo.test.js
    │
    ├── public/
    │   └── uploads/
    │
    ├── .env
    ├── .gitignore
    ├── jest.config.js
    ├── package.json
    ├── package-lock.json
    ├── server.js
    └── README.md

---

# Installation

## 1. Install Dependencies

    npm install

The AI Todo feature requires the Google Gemini SDK:

    npm install @google/genai

---

# Environment Configuration

Create `.env` in the project root.

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

# Google Gemini / AI Studio Setup

The AI Todo feature uses Google Gemini.

Google AI Studio is used to create/manage the Gemini API key.

The backend uses the Gemini API through:

    @google/genai

The key must remain on the backend.

Never expose:

    GEMINI_API_KEY

in frontend JavaScript or browser code.

---

# AI Todo Creation

## Endpoint

    POST /api/todos/ai

This endpoint requires authentication.

Protected requests must include:

    Authorization: Bearer YOUR_JWT_TOKEN

---

## Request

Example:

    POST /api/todos/ai

    Content-Type: application/json

    Authorization: Bearer YOUR_JWT_TOKEN

Body:

    {
      "prompt": "Tomorrow at 5 PM remind me to call Rahul about the project. Make it high priority."
    }

---

## AI Extraction

The AI extracts:

    Title
    Description
    Due Date
    Priority
    Assigned User
    Tags

Example input:

    Complete the client report by Friday and assign it to me and mark it high priority.

Example extracted data:

    Title:
    Complete the client report

    Priority:
    high

    Due Date:
    Friday

    Assigned To:
    Logged-in user

---

# AI Todo Creation Flow

    POST /api/todos/ai
            ↓
    Authentication middleware
            ↓
    Validate prompt
            ↓
    Send prompt to Gemini
            ↓
    Gemini returns structured JSON
            ↓
    Validate AI-generated data
            ↓
    Resolve assigned user
            ↓
    Check assignment authorization
            ↓
    Existing Todo creation flow
            ↓
    Todo validation
            ↓
    Create Todo
            ↓
    Activity / notification / cache logic
            ↓
    Return created Todo

The AI controller must not bypass the existing Todo creation rules.

---

# AI Todo Security

AI-created Todos can only be assigned to the currently logged-in user.

### No assignment specified

The Todo is automatically assigned to:

    req.user

### Logged-in user specified

The Todo is created successfully.

### Different user specified

The request is rejected:

    403 Forbidden

Example:

    {
      "prompt": "Finish the report and assign it to John"
    }

If John is not the authenticated user:

    403 AI Todo creation can only assign the Todo to the logged-in user

### Unknown user

If a mentioned user cannot be found:

    404 Assigned user not found

### Unauthorized request

If the JWT is missing or invalid:

    401 Unauthorized

---

# AI Validation

AI-generated data is never trusted directly.

The server validates:

- Todo title
- Todo description
- Todo priority
- Todo due date
- Assigned user
- Tags
- Ambiguous date
- User permissions

Invalid AI output is rejected before database creation.

Supported priorities:

    low
    medium
    high

Any other value such as:

    urgent
    critical
    highest

is rejected unless it is mapped to one of the supported priorities.

---

# AI Date Handling

Relative dates are resolved using:

    AI_TODO_TIMEZONE

Default:

    Asia/Kolkata

Examples:

    tomorrow
    Friday
    next Monday
    tomorrow at 5 PM

If the AI determines that a date is genuinely ambiguous, the Todo is not created.

Example:

    "Finish this on 5/6"

If the date cannot safely be resolved, the endpoint returns:

    400 Bad Request

The response contains a clarification message.

---

# AI Failure Handling

If Gemini is unavailable or the API key is missing/invalid, the endpoint returns a controlled error.

Example:

    {
      "success": false,
      "message": "AI Todo creation is temporarily unavailable"
    }

The server does not create a Todo from incomplete or invalid AI output.

---

# Start the Application

## Development

    npm run dev

## Production

    npm start

Base URL:

    http://localhost:5000

---

# Authentication API

    POST /api/auth/register
    POST /api/auth/login
    POST /api/auth/forgot-password
    POST /api/auth/reset-password/:token
    POST /api/auth/change-password
    GET  /api/auth/me
    POST /api/auth/logout

Protected requests use:

    Authorization: Bearer YOUR_JWT_TOKEN

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

# AI Todo Testing

## 1. Start the server

    npm run dev

---

## 2. Login

Send:

    POST /api/auth/login

Example body:

    {
      "email": "your-user@example.com",
      "password": "your-password"
    }

Copy the returned JWT token.

---

## 3. Test AI Todo Creation

Send:

    POST /api/todos/ai

Headers:

    Authorization: Bearer YOUR_JWT_TOKEN
    Content-Type: application/json

Body:

    {
      "prompt": "Tomorrow at 5 PM remind me to call Rahul about the project. Make it high priority."
    }

Expected:

    201 Created

The resulting Todo should contain:

    priority = high

and a valid:

    dueDate

---

## 4. Test Simple Todo

Body:

    {
      "prompt": "Call Rahul about the project"
    }

Expected:

    201 Created

Default priority:

    medium

---

## 5. Test Priority

Body:

    {
      "prompt": "Finish the client report and make it high priority"
    }

Expected:

    priority = high

---

## 6. Test Due Date

Body:

    {
      "prompt": "Finish the client report tomorrow at 5 PM"
    }

Expected:

    dueDate = tomorrow at 5 PM

---

## 7. Test Assigned User

Body:

    {
      "prompt": "Finish the report and assign it to me"
    }

Expected:

    assignedTo = logged-in user

---

## 8. Test Unknown User

Body:

    {
      "prompt": "Finish the report and assign it to UnknownUser123"
    }

Expected:

    404 Not Found

---

## 9. Test Cross-User Assignment

Login as User A and send:

    {
      "prompt": "Finish the report and assign it to User B"
    }

Expected:

    403 Forbidden

This verifies that AI cannot bypass existing Todo permissions.

---

## 10. Test Without JWT

Remove:

    Authorization: Bearer YOUR_JWT_TOKEN

Send the AI Todo request.

Expected:

    401 Unauthorized

---

## 11. Test Invalid AI Output

The AI-generated priority must only be:

    low
    medium
    high

If the AI returns:

    urgent

the server must reject the request.

Expected:

    400 Bad Request

---

## 12. Test Ambiguous Date

Example:

    {
      "prompt": "Finish the report on 5/6"
    }

If the date cannot be safely determined, expected:

    400 Bad Request

No Todo should be created.

---

## 13. Test Gemini API Failure

Temporarily use an invalid key:

    GEMINI_API_KEY=invalid-key

Restart the server.

Send an AI Todo request.

Expected:

    503 Service Unavailable

Restore the real Gemini key afterward.

---

# Testing

Run all tests:

    npm test

Run Todo tests:

    npm run test:todo

Run AI Todo tests:

    npx jest tests/aiTodo.test.js --runInBand

Run Admin tests:

    npm run test:admin

Run Authentication tests:

    npm run test:auth

Run LFU cache tests:

    npm run test:lfu-cache

Run everything:

    npm run test:all

---

# AI Todo Testing Checklist

- [ ] Create Todo from a simple sentence
- [ ] Extract title
- [ ] Extract description
- [ ] Extract high priority
- [ ] Extract low priority
- [ ] Use medium as default priority
- [ ] Extract due date
- [ ] Extract due time
- [ ] Handle relative dates
- [ ] Handle ambiguous dates
- [ ] Extract assigned user
- [ ] Assign Todo to logged-in user
- [ ] Reject assignment to another user
- [ ] Reject unknown user
- [ ] Extract tags
- [ ] Handle missing information
- [ ] Reject invalid priority
- [ ] Reject invalid due date
- [ ] Validate AI-generated fields
- [ ] Require authentication
- [ ] Handle Gemini API failure
- [ ] Ensure no Todo is created when validation fails
- [ ] Ensure AI cannot bypass Todo permissions
- [ ] Ensure AI-created Todo follows the same creation rules as manually created Todo

---

# Custom In-Memory LFU Cache

Cache implementation:

    utils/lfuCache.js

The cache does not use Redis or any external service.

All cached data is stored inside the Node.js process memory.

Each cache entry contains:

    Cache Entry
    ├── key
    ├── data
    ├── frequency
    ├── createdAt
    └── expiresAt

---

# Cache Configuration

## Maximum Cache Size

    CACHE_MAX_SIZE=100

This controls the maximum number of cache entries.

For testing:

    CACHE_MAX_SIZE=3

## TTL

TTL is specified in milliseconds:

    CACHE_TTL=60000

Examples:

    60000    = 1 minute
    300000   = 5 minutes
    600000   = 10 minutes
    3600000  = 1 hour

---

# LFU Eviction

The cache uses Least Frequently Used eviction.

Example:

    Cache Capacity = 3

    A → accessed 10 times
    B → accessed 5 times
    C → accessed 1 time

Add D:

    A → Keep
    B → Keep
    C → Remove
    D → Add

The entry with the lowest frequency is removed first.

If multiple entries have the same frequency, the oldest entry is removed first.

---

# TTL Expiration

When an entry expires:

    GET cache
       ↓
    Entry exists?
       ↓
    Expired?
     ┌─┴─┐
    YES  NO
     ↓    ↓
    Delete Return data
     ↓
    Cache miss

Expired entries are never returned.

Expired entries are also cleaned periodically.

---

# Todo Cache

Caching is applied to:

    GET /api/todos

The cache key contains the authenticated user and the Todo query.

Example:

    todos:role:user:userId:123:search::status:pending:priority::dueDate::page:1:limit:10:sort:newest

This prevents cached data from being mixed between users or queries.

---

# Todo Cache Flow

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
    Frequency MongoDB
       +1     │
       │      ↓
       │   Store cache
       │      │
       └──┬───┘
          ↓
     Return response

---

# Cache Invalidation

Todo cache is automatically invalidated when Todo data changes.

The following operations invalidate the Todo cache:

- Todo created
- Todo updated
- Todo deleted
- Todo restored
- Todo assigned
- Todo reassigned
- Todo status changed
- Todo priority changed
- Todo due date changed
- Todo attachment changed

After a modification:

    Todo changed
        ↓
    Invalidate Todo cache
        ↓
    Next GET /api/todos
        ↓
    MongoDB
        ↓
    Fresh data
        ↓
    Store new cache

This guarantees that the next Todo list request does not return stale cached data.

AI-created Todos also use the existing Todo creation flow, so the normal Todo cache invalidation logic is preserved.

---

# Cache Failure Safety

The cache is isolated from the main API.

If a cache operation fails:

    Cache error
        ↓
    Ignore cache error
        ↓
    Continue database operation
        ↓
    Return API response

Therefore a cache failure does not break the Todo API.

---

# Server Restart

The cache is stored only in Node.js application memory.

Before restart:

    Application memory
    └── Cache entries

After restart:

    Application memory
    └── Empty cache

No cache data is stored permanently.

---

# Cache Statistics

For local testing, add:

    CACHE_DEBUG=true

Then use:

    GET /api/cache/stats

Example response:

    {
      "success": true,
      "cache": {
        "size": 2,
        "maxSize": 100,
        "ttl": 60000,
        "entries": [
          {
            "key": "todos:userId:123:status:pending",
            "frequency": 5,
            "createdAt": "2026-08-19T00:00:00.000Z",
            "expiresAt": "2026-08-19T00:01:00.000Z"
          }
        ]
      }
    }

This endpoint should only be enabled for local testing or protected appropriately.

---

# Admin API

    GET    /api/admin/users

    GET    /api/admin/todos
    GET    /api/admin/todos/trash
    GET    /api/admin/todos/:id

    PUT    /api/admin/todos/:id
    PATCH  /api/admin/todos/:id
    DELETE /api/admin/todos/:id
    PATCH  /api/admin/todos/:id/restore

    POST   /api/admin/users/:id/make-admin
    POST   /api/admin/users/:id/remove-admin
    PATCH  /api/admin/users/:id/role
    PATCH  /api/admin/users/:id/password
    PATCH  /api/admin/users/:id/status
    DELETE /api/admin/users/:id

---

# Trash Cleanup

Deleted Todos are soft deleted first.

Example:

    Todo deleted
         ↓
    isDeleted = true
         ↓
    deletedAt = current date
         ↓
    Trash

Retention is controlled by:

    TRASH_RETENTION_DAYS=30

After the configured retention period, old Trash records are permanently deleted.

When permanent Todo deletion occurs, the Todo cache is invalidated.

---

# LFU Important Test

Set:

    CACHE_MAX_SIZE=3

Use:

    A → 10 accesses
    B → 5 accesses
    C → 1 access

Then request:

    D

Expected:

    A → Keep
    B → Keep
    C → Remove
    D → Add

---

# LFU Testing Checklist

- [ ] Cache miss fetches data from MongoDB
- [ ] Cache hit returns cached data
- [ ] Cache hit increases frequency
- [ ] Frequency is tracked correctly
- [ ] Maximum cache size is respected
- [ ] LFU item is removed when cache is full
- [ ] Frequently accessed item remains in cache
- [ ] TTL expiration works
- [ ] Expired cache is not returned
- [ ] New data replaces least frequently used data
- [ ] Different users have separate cache entries
- [ ] Different query parameters create separate cache keys
- [ ] Todo creation invalidates relevant cache
- [ ] Todo update invalidates relevant cache
- [ ] Todo deletion invalidates relevant cache
- [ ] Todo restore invalidates relevant cache
- [ ] Todo assignment invalidates relevant cache
- [ ] Todo status change invalidates relevant cache
- [ ] Todo priority change invalidates relevant cache
- [ ] Todo attachment change invalidates relevant cache
- [ ] Cache failure does not break the API
- [ ] Server restart clears in-memory cache
- [ ] User cached data cannot be exposed to another user

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

Make sure `.env` is included in `.gitignore`.

The Gemini API key must only be used by the backend.

Do not expose the Gemini API key to the frontend.

---

# Multi-Process Note

The cache is process-local.

If multiple Node.js processes are running:

    Process 1
    └── Cache 1

    Process 2
    └── Cache 2

They do not share cache entries.

This is expected because the requirement is a custom in-memory cache with no Redis or external cache service.

---

# Cache Design Summary

The implemented cache follows this behavior:

    Request /api/todos
            ↓
    Build user/query-specific cache key
            ↓
    Search in-memory cache
            ↓
       ┌────┴────┐
       │         │
      HIT       MISS
       │         │
    frequency   MongoDB
       +1         │
       │          ↓
       │       Store result
       │          │
       └────┬─────┘
            ↓
       Return response

When the cache reaches its capacity:

    New cache entry
          ↓
    Cache full?
          ↓
       Find LFU
          ↓
    Remove least used
          ↓
       Add new entry

When TTL expires:

    Cached entry
          ↓
    TTL expired?
          ↓
        Delete
          ↓
      Cache miss
          ↓
       MongoDB

When Todo data changes:

    Create / Update / Delete / Restore /
    Assign / Status / Priority / Attachment
                  ↓
          Invalidate Todo cache
                  ↓
          Next request is fresh

---

# License

This project is for development and API implementation purposes.