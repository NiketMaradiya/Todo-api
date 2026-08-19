# Todo API

A RESTful Todo API built with Node.js, Express.js, MongoDB, JWT authentication, Todo assignment, comments, notifications, attachments, audit history, soft delete/restore, Cloudinary configuration management, and a custom in-memory LFU cache.

## Features

### Authentication

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

### Todo Management

- Create Todo
- Get Todos
- Get single Todo
- Update Todo
- Delete Todo
- Restore Todo
- Assign Todo
- Change Todo status
- Change Todo priority
- Due date support
- Search
- Filtering
- Pagination
- Sorting

### Collaboration

- Add comments
- Get comments
- Update comments
- Delete comments
- Todo activity history
- Audit logging
- Notifications
- Todo attachments

### Admin

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

### Cloudinary

- Cloudinary configuration stored in MongoDB
- Encrypted Cloudinary credentials
- Secure credential management
- Attachment upload

### Custom In-Memory LFU Cache

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
    │   └── todoController.js
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
    │   └── todoAttachmentActivity.test.js
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

## 2. Configure Environment

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

---

# Start the Application

## Development

    npm run dev

## Production

    npm start

Base URL:

    http://localhost:5000

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

The entry with the lowest frequency is removed.

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

For example:

    User 1 + pending + page 1

is different from:

    User 1 + completed + page 1

and:

    User 2 + pending + page 1

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

# Testing

Run all tests:

    npm test

Run Todo tests:

    npm run test:todo

Run Admin tests:

    npm run test:admin

Run Authentication tests:

    npm run test:auth

Run LFU cache tests:

    npm run test:lfu-cache

Run everything:

    npm run test:all

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

    JWT_SECRET
    MONGO_URI
    EMAIL_PASSWORD
    CONFIG_ENCRYPTION_KEY
    Cloudinary credentials

Make sure `.env` is included in `.gitignore`.

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