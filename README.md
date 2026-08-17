# 🚀 Todo API – Advanced Task Management System

A complete and advanced **RESTful Todo API** built using **Node.js, Express.js, MongoDB, and Mongoose**.

This project started as a basic Todo CRUD application and was extended with professional backend features such as authentication, role-based authorization, task assignment, due dates, priorities, comments, Cloudinary attachments, notifications, soft delete, admin management, activity history, and a complete audit log system.

The project is designed to demonstrate how a real-world backend application can manage users, tasks, permissions, notifications, file uploads, and complete action history.

---

# 📌 Table of Contents

* [Features](#-features)
* [Technology Stack](#-technology-stack)
* [Project Structure](#-project-structure)
* [Installation](#-installation)
* [Environment Variables](#-environment-variables)
* [Running the Project](#-running-the-project)
* [Authentication](#-authentication)
* [User Roles](#-user-roles)
* [Todo Features](#-todo-features)
* [Todo Assignment](#-todo-assignment)
* [Due Date and Priority](#-due-date-and-priority)
* [Comments System](#-comments-system)
* [File Attachments](#-file-attachments)
* [Notification System](#-notification-system)
* [Soft Delete and Trash](#-soft-delete-and-trash)
* [Admin Features](#-admin-features)
* [Activity History and Audit Logs](#-activity-history-and-audit-logs)
* [API Endpoints](#-api-endpoints)
* [Postman Testing Flow](#-postman-testing-flow)
* [Testing](#-testing)
* [Database Models](#-database-models)
* [Authorization Rules](#-authorization-rules)
* [Error Handling](#-error-handling)
* [Project Flow](#-project-flow)
* [Future Improvements](#-future-improvements)

---

# ✨ Features

The Todo API currently supports the following features:

## 🔐 Authentication

* User registration
* User login
* JWT authentication
* Protected routes
* User profile API
* Logout API
* Password hashing using bcryptjs

---

## 👥 Role-Based Authorization

The application supports different user roles.

### User

A normal user can:

* Register and login
* Create Todos
* View accessible Todos
* Update allowed Todos
* Delete their allowed Todos
* Add comments
* View comments
* Upload attachments
* View notifications
* Mark notifications as read
* View Todo activity history

### Admin

An admin has additional permissions.

Admin can:

* View all users
* View all active Todos
* View any Todo
* Update any active Todo
* Soft delete any Todo
* View deleted Todos in Trash
* Restore deleted Todos
* Make a user admin
* Remove admin role
* Change user roles
* Change user passwords
* Enable or disable users
* Delete users
* Access Todo activity history

---

# 📝 Todo Features

Each Todo supports the following fields:

```json
{
  "title": "Complete Todo API",
  "description": "Build advanced backend features",
  "createdBy": "USER_ID",
  "assignedTo": "USER_ID",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-08-20T00:00:00.000Z",
  "attachmentUrl": "FILE_URL",
  "isDeleted": false
}
```

Main Todo features include:

* Create Todo
* Get all accessible Todos
* Get single Todo
* Update Todo
* Update Todo using PUT
* Update Todo using PATCH
* Update Todo status
* Assign Todo
* Reassign Todo
* Set priority
* Set due date
* Upload attachment
* Soft delete Todo
* Get Todo statistics
* Search Todos
* Filter Todos
* Pagination
* Sorting
* Activity history

---

# 🛠 Technology Stack

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose

## Authentication

* JSON Web Token (JWT)
* bcryptjs

## File Upload

* Multer
* Cloudinary

## Testing

* Jest
* Supertest

## Development

* Nodemon
* dotenv
* CORS

---

# 📁 Project Structure

```text
todo-api/
│
├── config/
│   ├── cloudinary.js
│   └── db.js
│
├── controllers/
│   ├── adminController.js
│   ├── authController.js
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
├── tests/
│   ├── admin.test.js
│   ├── adminActivity.test.js
│   ├── auth.test.js
│   ├── setup.js
│   ├── todo.test.js
│   ├── todoActivity.test.js
│   └── todoAttachmentActivity.test.js
│
├── utils/
│   ├── activityService.js
│   ├── attachmentService.js
│   └── notificationService.js
│
├── public/
│   └── uploads/
│
├── server.js
├── package.json
├── jest.config.js
├── .env
└── README.md
```

---

# ⚙️ Installation

## 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
```

## 2. Move into the project folder

```bash
cd todo-api
```

## 3. Install dependencies

```bash
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file in the root directory.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Do not upload your real `.env` file to GitHub.

Make sure `.env` is included in `.gitignore`.

Example:

```text
.env
node_modules
```

---

# ▶️ Running the Project

## Development Mode

```bash
npm run dev
```

The server will start using Nodemon.

Example:

```text
Server running on port 5000
```

## Production Mode

```bash
npm start
```

The default API URL is:

```text
http://localhost:5000
```

---

# ❤️ Health Check

## Endpoint

```http
GET /
```

## Example Response

```json
{
  "success": true,
  "message": "Todo API is running"
}
```

---

# 🔐 Authentication

The API uses JWT authentication.

The authentication flow is:

```text
Register
   ↓
Login
   ↓
Receive JWT Token
   ↓
Add Token to Authorization Header
   ↓
Access Protected APIs
```

For protected APIs, add:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

---

# 👤 Register User

## Endpoint

```http
POST /api/auth/register
```

## Request Body

```json
{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "123456"
}
```

---

# 🔑 Login User

## Endpoint

```http
POST /api/auth/login
```

## Request Body

```json
{
  "email": "testuser@example.com",
  "password": "123456"
}
```

After successful login, copy the JWT token.

Use this token for protected APIs.

---

# 👤 Get User Profile

## Endpoint

```http
GET /api/auth/profile
```

Authentication required.

---

# 🚪 Logout

## Endpoint

```http
POST /api/auth/logout
```

Authentication required.

---

# 📝 Create Todo

## Endpoint

```http
POST /api/todos
```

Authentication required.

## Request Body

```json
{
  "title": "Complete Audit Log System",
  "description": "Add complete activity tracking",
  "assignedTo": "USER_ID",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-08-20"
}
```

The authenticated user automatically becomes the Todo creator.

---

# 📋 Get Todos

## Endpoint

```http
GET /api/todos
```

Authentication required.

The API can support searching, filtering, sorting, and pagination.

Example:

```http
GET /api/todos?page=1&limit=10
```

Example search:

```http
GET /api/todos?search=API
```

Example status filter:

```http
GET /api/todos?status=pending
```

Example priority filter:

```http
GET /api/todos?priority=high
```

---

# 🔍 Get Single Todo

## Endpoint

```http
GET /api/todos/:id
```

Authentication required.

Example:

```http
GET /api/todos/TODO_ID
```

---

# ✏️ Update Todo

The API supports both PUT and PATCH requests.

## PUT

```http
PUT /api/todos/:id
```

## PATCH

```http
PATCH /api/todos/:id
```

Authentication required.

Example request:

```json
{
  "title": "Updated Todo Title",
  "description": "Updated Todo description",
  "priority": "medium"
}
```

---

# 🔄 Update Todo Status

## Endpoint

```http
PATCH /api/todos/:id/status
```

Authentication required.

Example request:

```json
{
  "status": "in-progress"
}
```

Supported status values:

```text
pending
in-progress
completed
```

---

# 📊 Todo Statistics

## Endpoint

```http
GET /api/todos/stats
```

Authentication required.

This API provides Todo-related statistics.

---

# 👥 Todo Assignment

Todos can be assigned to users.

Example:

```json
{
  "assignedTo": "USER_ID"
}
```

The backend validates the assigned user.

The assignment activity is also recorded.

Example:

```text
Action: assigned
```

If the Todo was already assigned to another user:

```text
Action: reassigned
```

Example:

```text
User A
   ↓
User B
```

The audit log stores the previous user and new user information.

---

# 📅 Due Date

Todos support due dates.

Example:

```json
{
  "dueDate": "2026-08-25"
}
```

This helps users track task deadlines.

---

# 🚨 Priority

Supported priority values:

```text
low
medium
high
```

Example:

```json
{
  "priority": "high"
}
```

If the priority changes, an activity is recorded.

Example:

```text
medium → high
```

Action:

```text
priority_changed
```

---

# 💬 Comments System

Users can add comments to a Todo.

Each comment contains:

* Todo ID
* User ID
* Comment text
* Created date
* Updated date

---

# ➕ Add Comment

## Endpoint

```http
POST /api/todos/:id/comments
```

Authentication required.

## Request Body

```json
{
  "comment": "I have started working on this task."
}
```

When a comment is added, the system can record:

```text
comment_added
```

in the Todo activity history.

---

# 📖 Get Todo Comments

## Endpoint

```http
GET /api/todos/:id/comments
```

Authentication required.

---

# ✏️ Update Comment

## Endpoint

```http
PATCH /api/todos/:todoId/comments/:commentId
```

Authentication required.

Example request:

```json
{
  "comment": "Updated comment text"
}
```

---

# 🗑 Delete Comment

## Endpoint

```http
DELETE /api/todos/:todoId/comments/:commentId
```

Authentication required.

---

# 📎 File Attachments

The Todo API supports file attachments.

The project uses:

```text
Multer
+
Cloudinary
```

A Todo can store:

```text
attachmentUrl
attachmentPublicId
```

The file is uploaded and the file URL is associated with the Todo.

---

# ⬆️ Upload Todo Attachment

## Endpoint

```http
POST /api/todos/:id/attachment
```

Authentication required.

In Postman:

1. Select `POST`.
2. Enter:

```text
/api/todos/TODO_ID/attachment
```

3. Go to `Body`.
4. Select `form-data`.
5. Add the key:

```text
attachment
```

6. Change the key type from:

```text
Text
```

to:

```text
File
```

7. Select a file.
8. Send the request.

The attachment information is associated with the Todo.

The activity system can record:

```text
attachment_added
```

---

# 🔔 Notification System

The project includes a notification system.

Notifications can be associated with:

* Todo assignment
* Due soon reminders
* Overdue Todos
* Todo status changes
* Comments

Supported notification types include:

```text
todo_assigned
todo_due_soon
todo_overdue
todo_status_changed
comment_added
```

Each notification contains:

```text
userId
todoId
type
message
isRead
createdAt
```

---

# 🔔 Get Notifications

## Endpoint

```http
GET /api/notifications
```

Authentication required.

This endpoint returns notifications for the currently logged-in user.

---

# ✅ Mark One Notification as Read

## Endpoint

```http
PATCH /api/notifications/:id/read
```

Authentication required.

---

# ✅ Mark All Notifications as Read

## Endpoint

```http
PATCH /api/notifications/read-all
```

Authentication required.

---

# 🗑 Soft Delete

The application uses soft delete instead of immediately removing Todo documents from the database.

When a Todo is deleted:

```text
isDeleted = true
deletedAt = current date
```

The Todo remains in MongoDB but is hidden from normal Todo queries.

---

# 🗑 Delete Todo

## Endpoint

```http
DELETE /api/todos/:id
```

Authentication required.

The Todo is soft deleted.

The activity system records:

```text
soft_deleted
```

---

# 🗑 Admin Trash

Admins can view all deleted Todos.

## Endpoint

```http
GET /api/admin/todos/trash
```

Admin authentication required.

---

# ♻️ Restore Todo

An admin can restore a soft-deleted Todo.

## Endpoint

```http
PATCH /api/admin/todos/:id/restore
```

When restored:

```text
isDeleted: true → false
```

The activity system records:

```text
restored
```

---

# 👑 Admin Features

All admin routes require:

```text
Authentication
+
Admin Role
```

The admin route middleware flow is:

```text
Request
   ↓
JWT Authentication
   ↓
Role Authorization
   ↓
Admin Controller
   ↓
Database
   ↓
Response
```

---

# 👥 Get All Users

## Endpoint

```http
GET /api/admin/users
```

Admin only.

---

# 🛡 Make User Admin

## Endpoint

```http
POST /api/admin/users/:id/make-admin
```

Admin only.

---

# 👤 Remove Admin Role

## Endpoint

```http
POST /api/admin/users/:id/remove-admin
```

Admin only.

---

# 🔄 Change User Role

## Endpoint

```http
PATCH /api/admin/users/:id/role
```

Admin only.

---

# 🔑 Change User Password

## Endpoint

```http
PATCH /api/admin/users/:id/password
```

Admin only.

---

# 🚦 Change User Status

## Endpoint

```http
PATCH /api/admin/users/:id/status
```

Admin only.

This can be used to update the user's active status depending on the application's user model and controller logic.

---

# ❌ Delete User

## Endpoint

```http
DELETE /api/admin/users/:id
```

Admin only.

---

# 📋 Admin Get All Todos

## Endpoint

```http
GET /api/admin/todos
```

Admin can view all active Todos.

---

# 🔍 Admin Get Any Todo

## Endpoint

```http
GET /api/admin/todos/:id
```

Admin can access any active Todo.

---

# ✏️ Admin Update Todo

## PUT

```http
PUT /api/admin/todos/:id
```

## PATCH

```http
PATCH /api/admin/todos/:id
```

Admin can update any active Todo.

---

# 🗑 Admin Delete Todo

## Endpoint

```http
DELETE /api/admin/todos/:id
```

Admin only.

The Todo is soft deleted.

---

# 📜 Activity History and Audit Log

One of the main advanced features of this project is the Todo Activity and Audit Log system.

The system tracks important actions performed on a Todo.

The `TodoActivity` model stores:

```text
todoId
userId
action
oldValue
newValue
createdAt
```

---

# 🔄 Supported Activity Actions

The system supports the following actions:

```text
created
updated
assigned
reassigned
status_changed
priority_changed
comment_added
soft_deleted
restored
attachment_added
```

---

# 📝 Example Activity

When a Todo is created:

```json
{
  "action": "created",
  "oldValue": null,
  "newValue": {
    "title": "Complete Todo API"
  }
}
```

---

# 👥 Assignment Activity

Example:

```text
Todo assigned to User A
```

Activity:

```text
assigned
```

If the Todo is changed from User A to User B:

```text
User A
   ↓
User B
```

Activity:

```text
reassigned
```

---

# 🔄 Status Change Activity

Example:

```text
pending
   ↓
in-progress
```

Activity:

```text
status_changed
```

The activity can store:

```json
{
  "oldValue": {
    "status": "pending"
  },
  "newValue": {
    "status": "in-progress"
  }
}
```

---

# 🚨 Priority Change Activity

Example:

```text
medium
   ↓
high
```

Activity:

```text
priority_changed
```

---

# 💬 Comment Activity

When a user adds a comment:

```text
comment_added
```

is recorded in the activity history.

---

# 📎 Attachment Activity

When an attachment is uploaded:

```text
attachment_added
```

can be recorded.

---

# 🗑 Delete Activity

When a Todo is soft deleted:

```text
soft_deleted
```

is recorded.

---

# ♻️ Restore Activity

When an admin restores a Todo:

```text
restored
```

is recorded.

Example:

```text
isDeleted
true
↓
false
```

---

# 📜 Get Todo Activity History

## Endpoint

```http
GET /api/todos/:id/activity
```

Authentication required.

The activity history is connected to the specific Todo.

Example response structure:

```json
{
  "success": true,
  "activities": [
    {
      "todoId": "TODO_ID",
      "userId": "USER_ID",
      "action": "created",
      "oldValue": null,
      "newValue": {
        "title": "Complete Todo API"
      },
      "createdAt": "2026-08-17T10:00:00.000Z"
    },
    {
      "action": "assigned",
      "createdAt": "2026-08-17T10:05:00.000Z"
    },
    {
      "action": "status_changed",
      "oldValue": {
        "status": "pending"
      },
      "newValue": {
        "status": "in-progress"
      }
    }
  ]
}
```

---

# 🔒 Authorization Rules

## Normal User

A normal user can access Todos according to the application's authorization rules.

The Todo system uses ownership and assignment information.

Users can work with Todos they are authorized to access, including:

* Todos created by them
* Todos assigned to them

---

## Admin

An admin can:

```text
View all Todos
Update all Todos
Delete all Todos
View deleted Todos
Restore Todos
Manage users
Manage roles
```

---

# 📡 API Endpoints Summary

## Authentication

| Method | Endpoint             | Description      |
| ------ | -------------------- | ---------------- |
| POST   | `/api/auth/register` | Register user    |
| POST   | `/api/auth/login`    | Login user       |
| POST   | `/api/auth/logout`   | Logout user      |
| GET    | `/api/auth/profile`  | Get user profile |

---

## Todo

| Method | Endpoint                    | Description          |
| ------ | --------------------------- | -------------------- |
| POST   | `/api/todos`                | Create Todo          |
| GET    | `/api/todos`                | Get Todos            |
| GET    | `/api/todos/stats`          | Get Todo statistics  |
| GET    | `/api/todos/:id`            | Get single Todo      |
| PUT    | `/api/todos/:id`            | Update Todo          |
| PATCH  | `/api/todos/:id`            | Update Todo          |
| PATCH  | `/api/todos/:id/status`     | Update Todo status   |
| DELETE | `/api/todos/:id`            | Soft delete Todo     |
| POST   | `/api/todos/:id/attachment` | Upload attachment    |
| GET    | `/api/todos/:id/activity`   | Get activity history |

---

## Comments

| Method | Endpoint                                 | Description    |
| ------ | ---------------------------------------- | -------------- |
| POST   | `/api/todos/:id/comments`                | Add comment    |
| GET    | `/api/todos/:id/comments`                | Get comments   |
| PATCH  | `/api/todos/:todoId/comments/:commentId` | Update comment |
| DELETE | `/api/todos/:todoId/comments/:commentId` | Delete comment |

---

## Notifications

| Method | Endpoint                      | Description       |
| ------ | ----------------------------- | ----------------- |
| GET    | `/api/notifications`          | Get notifications |
| PATCH  | `/api/notifications/read-all` | Mark all as read  |
| PATCH  | `/api/notifications/:id/read` | Mark one as read  |

---

## Admin Todos

| Method | Endpoint                       | Description          |
| ------ | ------------------------------ | -------------------- |
| GET    | `/api/admin/todos`             | Get all active Todos |
| GET    | `/api/admin/todos/trash`       | Get deleted Todos    |
| GET    | `/api/admin/todos/:id`         | Get any Todo         |
| PUT    | `/api/admin/todos/:id`         | Update Todo          |
| PATCH  | `/api/admin/todos/:id`         | Update Todo          |
| DELETE | `/api/admin/todos/:id`         | Soft delete Todo     |
| PATCH  | `/api/admin/todos/:id/restore` | Restore Todo         |

---

## Admin Users

| Method | Endpoint                            | Description          |
| ------ | ----------------------------------- | -------------------- |
| GET    | `/api/admin/users`                  | Get all users        |
| POST   | `/api/admin/users/:id/make-admin`   | Make user admin      |
| POST   | `/api/admin/users/:id/remove-admin` | Remove admin role    |
| PATCH  | `/api/admin/users/:id/role`         | Change user role     |
| PATCH  | `/api/admin/users/:id/password`     | Change user password |
| PATCH  | `/api/admin/users/:id/status`       | Change user status   |
| DELETE | `/api/admin/users/:id`              | Delete user          |

---

# 🧪 Postman Testing Flow

Follow this order when testing the API.

---

## Step 1: Start MongoDB

Make sure MongoDB is running.

---

## Step 2: Start Server

```bash
npm run dev
```

Expected output:

```text
Server running on port 5000
```

---

## Step 3: Register User

```http
POST /api/auth/register
```

Create at least two users.

Example:

```text
User 1 = Todo Creator
User 2 = Assigned User
```

---

## Step 4: Login

```http
POST /api/auth/login
```

Copy the JWT token.

---

## Step 5: Set Authorization

In Postman:

```text
Authorization
↓
Bearer Token
↓
Paste JWT Token
```

---

## Step 6: Create Todo

```http
POST /api/todos
```

Example:

```json
{
  "title": "Build Audit Log System",
  "description": "Track important Todo actions",
  "assignedTo": "USER_2_ID",
  "priority": "high",
  "dueDate": "2026-08-25"
}
```

Copy the Todo ID.

---

## Step 7: Get Todos

```http
GET /api/todos
```

---

## Step 8: Get Single Todo

```http
GET /api/todos/TODO_ID
```

---

## Step 9: Update Todo

```http
PATCH /api/todos/TODO_ID
```

Example:

```json
{
  "title": "Updated Audit Log System",
  "priority": "medium"
}
```

---

## Step 10: Change Status

```http
PATCH /api/todos/TODO_ID/status
```

Example:

```json
{
  "status": "in-progress"
}
```

---

## Step 11: Add Comment

```http
POST /api/todos/TODO_ID/comments
```

Example:

```json
{
  "comment": "Started working on the audit log feature."
}
```

---

## Step 12: Upload Attachment

```http
POST /api/todos/TODO_ID/attachment
```

Use:

```text
Body
↓
form-data
↓
attachment
↓
File
```

Select a file and send the request.

---

## Step 13: Check Activity History

```http
GET /api/todos/TODO_ID/activity
```

Check that actions such as the following are recorded:

```text
created
assigned
updated
priority_changed
status_changed
comment_added
attachment_added
```

---

## Step 14: Delete Todo

```http
DELETE /api/todos/TODO_ID
```

The Todo should be soft deleted.

---

## Step 15: Admin Login

Login using an admin account.

Use the admin JWT token.

---

## Step 16: Check Trash

```http
GET /api/admin/todos/trash
```

---

## Step 17: Restore Todo

```http
PATCH /api/admin/todos/TODO_ID/restore
```

---

## Step 18: Check Activity Again

```http
GET /api/todos/TODO_ID/activity
```

The activity history should include:

```text
soft_deleted
restored
```

---

# 🧪 Automated Testing

The project includes automated tests using:

```text
Jest
+
Supertest
```

Available test commands:

## Run all tests

```bash
npm test
```

Or:

```bash
npm run test:all
```

---

## Run Authentication Tests

```bash
npm run test:auth
```

---

## Run Todo Tests

```bash
npm run test:todo
```

---

## Run Admin Tests

```bash
npm run test:admin
```

---

## Run Todo Audit Tests

```bash
npm run test:audit
```

---

## Run Admin Audit Tests

```bash
npm run test:admin-audit
```

---

## Run Attachment Activity Tests

```bash
npm run test:attachment
```

---

# 🗄 Database Models

The project contains the following main models.

---

## User

Stores user information such as:

```text
Name
Email
Password
Role
Status
Created At
```

---

## Todo

Stores Todo information:

```text
title
description
createdBy
assignedTo
attachmentUrl
attachmentPublicId
status
priority
dueDate
isDeleted
deletedAt
createdAt
updatedAt
```

---

## Comment

Stores Todo comments:

```text
todoId
userId
comment
createdAt
updatedAt
```

---

## Notification

Stores user notifications:

```text
userId
todoId
type
message
isRead
createdAt
```

---

## TodoActivity

Stores the complete Todo action history:

```text
todoId
userId
action
oldValue
newValue
createdAt
```

The TodoActivity model has an index for retrieving activities efficiently:

```text
todoId
createdAt
```

---

# 🧠 Complete Application Flow

The overall backend request flow is:

```text
Client / Postman
        ↓
Express Route
        ↓
Authentication Middleware
        ↓
Authorization Middleware
        ↓
Controller
        ↓
Validation
        ↓
MongoDB / Mongoose
        ↓
Additional Services
        ↓
Activity Log
        ↓
Notification
        ↓
API Response
```

---

# 📜 Todo Lifecycle Example

A complete Todo lifecycle can look like this:

```text
1. User Creates Todo
        ↓
Activity: created

2. Todo Assigned
        ↓
Activity: assigned

3. Priority Changed
        ↓
medium → high
Activity: priority_changed

4. Status Changed
        ↓
pending → in-progress
Activity: status_changed

5. Comment Added
        ↓
Activity: comment_added

6. Attachment Uploaded
        ↓
Activity: attachment_added

7. Todo Updated
        ↓
Activity: updated

8. Todo Soft Deleted
        ↓
Activity: soft_deleted

9. Admin Restores Todo
        ↓
Activity: restored
```

This creates a complete history of the Todo.

---

# ⚠️ Error Handling

The API includes error handling for situations such as:

* Invalid authentication token
* Missing token
* Unauthorized access
* Admin-only route access
* Invalid Todo ID
* Todo not found
* User not found
* Missing required fields
* Invalid priority
* Invalid status
* Invalid assignment
* Invalid file upload
* Comment not found

Example response:

```json
{
  "success": false,
  "message": "Todo not found"
}
```

Another example:

```json
{
  "success": false,
  "message": "Assigned user not found"
}
```

---

# 🔒 Security Concepts Used

The project implements or demonstrates the following security concepts:

* Password hashing
* JWT authentication
* Protected routes
* Role-based authorization
* Admin-only routes
* Input validation
* User access control
* Soft delete
* Activity logging
* Environment variables
* Secure file upload configuration

---

# 📈 Learning Outcomes

This project helped practice and understand:

```text
Node.js
Express.js
MongoDB
Mongoose
REST API Development
JWT Authentication
bcrypt Password Hashing
Middleware
Role-Based Authorization
Admin Management
Todo CRUD
Task Assignment
Task Reassignment
Due Dates
Priority Management
Comments
Cloudinary File Upload
Multer
Notifications
Soft Delete
Trash Management
Restore Functionality
Activity History
Audit Logs
Error Handling
Jest
Supertest
Postman API Testing
Environment Variables
Backend Project Structure
```

---

# 🚀 Future Improvements

Possible future improvements include:

* Email notifications
* Real-time notifications using Socket.io
* Scheduled due date reminders
* Automated overdue Todo detection
* Advanced filtering
* Advanced search
* Full-text search
* Rate limiting
* API documentation using Swagger
* Refresh tokens
* Password reset using email
* User profile image
* Multiple attachments
* Attachment deletion
* Activity pagination
* Notification pagination
* Dashboard analytics
* Deployment using Docker
* CI/CD pipeline
* Production logging
* Redis caching

---

# 👨‍💻 Author

**Project:** Advanced Todo API

**Technology:** Node.js, Express.js, MongoDB, Mongoose

---

# 📄 License

This project is created for learning and development purposes.

---

# ⭐ Final Summary

This project is an advanced Todo Management REST API that goes beyond basic CRUD operations.

It includes:

```text
Authentication
+
Role-Based Access
+
Todo Management
+
Assignment
+
Reassignment
+
Due Dates
+
Priority
+
Comments
+
File Attachments
+
Cloudinary
+
Notifications
+
Soft Delete
+
Trash
+
Restore
+
Admin Management
+
Activity History
+
Complete Audit Logs
+
Automated Testing
```

The main goal of this project is to understand how a professional backend application manages users, permissions, tasks, collaboration, files, notifications, and complete action history.

This Todo API demonstrates a structured backend architecture using:

```text
Routes
   ↓
Middleware
   ↓
Controllers
   ↓
Services
   ↓
Models
   ↓
MongoDB
```

The project can be further extended with frontend integration, real-time features, deployment, advanced security, and production-level monitoring.
