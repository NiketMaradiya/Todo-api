# Todo API

A REST API for managing Todo tasks with JWT authentication, user assignment, role-based access, priority, due dates, attachments, soft delete, comments, and activity history.

## Features

### Authentication

* User registration
* User login
* JWT authentication
* User logout
* Get logged-in user profile
* Password hashing with bcrypt

### User Roles

* `user`
* `admin`

### Todo Management

* Create Todo
* Get Todo list
* Get Todo by ID
* Update Todo
* Update Todo status
* Delete Todo using soft delete
* Admin can view all Todos
* Admin can update any Todo
* Admin can delete any Todo
* Admin can view trash
* Admin can restore deleted Todos

### Todo Fields

* `title`
* `description`
* `createdBy`
* `assignedTo`
* `status`
* `priority`
* `dueDate`
* `attachmentUrl`
* `isDeleted`
* `deletedAt`
* `createdAt`
* `updatedAt`

### Priority

Allowed values:

```text
low
medium
high
```

### Status

Allowed values:

```text
pending
in-progress
completed
```

### Todo Assignment

A Todo stores:

```text
createdBy
assignedTo
```

Normal users can see Todos:

* Created by themselves
* Assigned to themselves

Admins can see all active Todos.

### Attachments

Todo attachments are supported using:

* Multer
* Cloudinary

The attachment field name is:

```text
attachment
```

### Soft Delete

Todos are not permanently removed when deleted.

Instead:

```text
isDeleted = true
deletedAt = current date
```

Deleted Todos can be viewed by admins in the trash and restored later.

### Comments

Users can add comments to Todos they are allowed to view.

Comment fields:

```text
todoId
userId
comment
createdAt
updatedAt
```

Comment APIs:

```text
POST /api/todos/:id/comments
GET  /api/todos/:id/comments
```

Normal users can comment when they are:

* The Todo creator
* The assigned user

Admins can view and manage comments for all Todos.

### Activity History

The API records important Todo actions automatically.

Supported actions:

```text
Todo Created
Todo Updated
Todo Assigned
Todo Status Changed
Todo Deleted
Todo Restored
Comment Added
```

Each activity contains:

```text
action
performedBy
todoId
createdAt
updatedAt
metadata
```

Activity API:

```text
GET /api/todos/:id/activity
```

Example:

```text
Todo #123
│
├── Todo Created
├── Todo Assigned
├── Todo Updated
├── Todo Status Changed
├── Comment Added
├── Todo Deleted
└── Todo Restored
```

---

# Tech Stack

```text
Node.js
Express.js
MongoDB
Mongoose
JWT
bcryptjs
Multer
Cloudinary
Jest
Supertest
Nodemon
CORS
dotenv
```

---

# Project Structure

```text
todo-api/
│
├── config/
│   ├── cloudinary.js
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   ├── todoController.js
│   └── adminController.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   ├── logger.js
│   └── uploadMiddleware.js
│
├── models/
│   ├── User.js
│   ├── Todo.js
│   ├── Comment.js
│   └── Activity.js
│
├── routes/
│   ├── authRoutes.js
│   ├── todoRoutes.js
│   └── adminRoutes.js
│
├── utils/
│   ├── attachmentService.js
│   └── activityService.js
│
├── tests/
│   ├── auth.test.js
│   ├── todo.test.js
│   ├── admin.test.js
│   └── setup.js
│
├── .env
├── .gitignore
├── jest.config.js
├── package.json
├── package-lock.json
└── server.js
```

---

# Installation

## 1. Clone or copy the project

Open the project folder:

```powershell
cd todo-api
```

## 2. Install dependencies

```powershell
npm install
```

## 3. Create `.env`

Create a file named:

```text
.env
```

Add:

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/todo-api

JWT_SECRET=your_jwt_secret_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Do not commit `.env` to GitHub.

---

# Start MongoDB

Make sure MongoDB is running before starting the API.

For local MongoDB, your connection is:

```text
mongodb://127.0.0.1:27017/todo-api
```

---

# Run the Project

## Development

```powershell
npm run dev
```

## Production

```powershell
npm start
```

The API runs on:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/
```

Expected:

```json
{
  "success": true,
  "message": "Todo API is running"
}
```

---

# Authentication APIs

## Register

```http
POST /api/auth/register
```

Body:

```json
{
  "name": "User A",
  "email": "usera@gmail.com",
  "password": "123456"
}
```

---

## Login

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "usera@gmail.com",
  "password": "123456"
}
```

The login response returns a JWT token.

Use it in protected requests:

```text
Authorization: Bearer YOUR_TOKEN
```

---

## Logout

```http
POST /api/auth/logout
```

Header:

```text
Authorization: Bearer YOUR_TOKEN
```

---

## Get Profile

```http
GET /api/auth/profile
```

Header:

```text
Authorization: Bearer YOUR_TOKEN
```

---

# Todo APIs

All Todo APIs require:

```text
Authorization: Bearer YOUR_TOKEN
```

## Create Todo

```http
POST /api/todos
```

JSON example:

```json
{
  "title": "Complete API",
  "description": "Finish Todo API work",
  "assignedTo": "USER_ID",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-08-20"
}
```

For attachment upload use:

```text
multipart/form-data
```

Field:

```text
attachment
```

---

## Get Todos

```http
GET /api/todos
```

Examples:

```text
GET /api/todos
GET /api/todos?page=1&limit=10
GET /api/todos?search=API
GET /api/todos?status=in-progress
GET /api/todos?priority=high
GET /api/todos?sort=newest
```

---

## Get Todo Statistics

```http
GET /api/todos/stats
```

---

## Get Todo By ID

```http
GET /api/todos/:id
```

Example:

```text
GET /api/todos/64f123456789abcdef123456
```

---

## Update Todo

```http
PUT /api/todos/:id
```

or:

```http
PATCH /api/todos/:id
```

Example:

```json
{
  "title": "Updated Todo",
  "description": "Updated description",
  "priority": "medium",
  "dueDate": "2026-08-25"
}
```

---

## Update Todo Status

```http
PATCH /api/todos/:id/status
```

Body:

```json
{
  "status": "in-progress"
}
```

---

## Delete Todo

```http
DELETE /api/todos/:id
```

This performs a soft delete.

---

# Comments APIs

## Add Comment

```http
POST /api/todos/:id/comments
```

Header:

```text
Authorization: Bearer YOUR_TOKEN
```

Body:

```json
{
  "comment": "I have started working on this task."
}
```

---

## Get Comments

```http
GET /api/todos/:id/comments
```

Header:

```text
Authorization: Bearer YOUR_TOKEN
```

Example response:

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "comment": "I have started working on this task."
    },
    {
      "comment": "I have received the assigned task."
    }
  ]
}
```

---

# Activity History API

## Get Todo Activity

```http
GET /api/todos/:id/activity
```

Header:

```text
Authorization: Bearer YOUR_TOKEN
```

Example:

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "action": "Todo Created",
      "performedBy": "USER_ID",
      "todoId": "TODO_ID",
      "metadata": {
        "title": "Complete API"
      }
    },
    {
      "action": "Todo Assigned",
      "performedBy": "USER_ID",
      "todoId": "TODO_ID",
      "metadata": {
        "assignedTo": "ASSIGNED_USER_ID"
      }
    },
    {
      "action": "Todo Status Changed",
      "performedBy": "USER_ID",
      "todoId": "TODO_ID",
      "metadata": {
        "from": "pending",
        "to": "in-progress"
      }
    },
    {
      "action": "Comment Added",
      "performedBy": "USER_ID",
      "todoId": "TODO_ID",
      "metadata": {
        "commentId": "COMMENT_ID"
      }
    }
  ]
}
```

---

# Admin APIs

All admin APIs require:

```text
Authorization: Bearer ADMIN_TOKEN
```

The logged-in user must have:

```text
role = admin
```

---

## Get All Users

```http
GET /api/admin/users
```

---

## Make User Admin

```http
POST /api/admin/users/:id/make-admin
```

---

## Remove Admin

```http
POST /api/admin/users/:id/remove-admin
```

---

## Change User Role

```http
PATCH /api/admin/users/:id/role
```

Body:

```json
{
  "role": "admin"
}
```

or:

```json
{
  "role": "user"
}
```

---

## Change User Password

```http
PATCH /api/admin/users/:id/password
```

Body:

```json
{
  "password": "newpassword123"
}
```

---

## Enable / Disable User

```http
PATCH /api/admin/users/:id/status
```

Body:

```json
{
  "isActive": false
}
```

---

## Delete User

```http
DELETE /api/admin/users/:id
```

---

# Admin Todo APIs

## Get All Active Todos

```http
GET /api/admin/todos
```

Admin can see all active Todos.

---

## Get Any Todo

```http
GET /api/admin/todos/:id
```

---

## Update Any Todo

```http
PUT /api/admin/todos/:id
```

or:

```http
PATCH /api/admin/todos/:id
```

---

## Delete Any Todo

```http
DELETE /api/admin/todos/:id
```

This uses soft delete.

---

## View Trash

```http
GET /api/admin/todos/trash
```

---

## Restore Todo

```http
PATCH /api/admin/todos/:id/restore
```

---

# Permission Rules

## Normal User

A normal user can:

```text
View Todo if:
- createdBy = logged-in user
OR
- assignedTo = logged-in user
```

A normal user can comment if:

```text
- createdBy = logged-in user
OR
- assignedTo = logged-in user
```

A normal user cannot access another user's unrelated Todo.

---

## Admin

Admin can:

```text
View all Todos
Update all Todos
Delete all Todos
Restore deleted Todos
View all users
Manage user roles
Manage user status
Manage user passwords
View comments on all accessible Todos
View activity history for all Todos
```

---

# Activity Recording

The system automatically creates activity records when these events happen:

## Todo Created

```text
Todo Created
```

## Todo Updated

```text
Todo Updated
```

Metadata can contain fields changed, for example:

```json
{
  "priority": {
    "from": "low",
    "to": "high"
  }
}
```

## Todo Assigned

```text
Todo Assigned
```

Example metadata:

```json
{
  "from": "OLD_USER_ID",
  "to": "NEW_USER_ID"
}
```

## Todo Status Changed

```text
Todo Status Changed
```

Example:

```json
{
  "from": "pending",
  "to": "in-progress"
}
```

## Todo Deleted

```text
Todo Deleted
```

## Todo Restored

```text
Todo Restored
```

## Comment Added

```text
Comment Added
```

---

# Postman Testing Flow

Recommended testing order:

```text
1. Register User A
2. Login User A
3. Register User B
4. Login User B
5. Make User A Admin
6. Create Todo as User A
7. Get Todo Activity
8. Add Comment as User A
9. Get Comments
10. Add Comment as User B
11. Change Todo Status
12. Update Todo
13. Get Activity History
14. Delete Todo
15. Admin View Trash
16. Admin Restore Todo
17. Get Activity History Again
```

---

# Example Activity Flow

After testing, a Todo history can look like:

```text
Todo #123
│
├── Todo Created
│
├── Todo Assigned
│
├── Todo Updated
│
├── Todo Status Changed
│
├── Comment Added
│
├── Comment Added
│
├── Todo Deleted
│
└── Todo Restored
```

---

# Error Handling

Examples of validation errors:

### Missing title

```json
{
  "success": false,
  "message": "Title is required"
}
```

### Invalid priority

```json
{
  "success": false,
  "message": "Priority must be low, medium or high"
}
```

### Invalid status

```json
{
  "success": false,
  "message": "Status must be pending, in-progress or completed"
}
```

### Missing assigned user

```json
{
  "success": false,
  "message": "assignedTo is required"
}
```

### Assigned user not found

```json
{
  "success": false,
  "message": "Assigned user not found"
}
```

### Unauthorized access

```json
{
  "success": false,
  "message": "Not authorized"
}
```

---

# Testing

Run all Jest tests:

```powershell
npm test
```

Run Jest directly:

```powershell
npx jest --runInBand --forceExit
```

---

# Important Files for Comments and Activity

The Comments and Activity feature uses:

```text
models/Comment.js
models/Activity.js
utils/activityService.js
controllers/todoController.js
controllers/adminController.js
routes/todoRoutes.js
```

---

# MongoDB Collections

The application uses these main collections:

```text
users
todos
comments
activities
```

---

# Security

The API uses:

```text
JWT authentication
bcrypt password hashing
Role-based authorization
Todo ownership checks
Todo assignment checks
Admin authorization
Input validation
Soft delete
```

Never store the JWT secret or Cloudinary credentials directly inside source code.

Use `.env`.

---

# Environment Variables

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/todo-api

JWT_SECRET=your_jwt_secret_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

CLOUDINARY_API_KEY=your_cloudinary_api_key

CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

# Useful Commands

Install packages:

```powershell
npm install
```

Start development server:

```powershell
npm run dev
```

Start server:

```powershell
npm start
```

Run tests:

```powershell
npm test
```

Check Git status:

```powershell
git status
```

Add files:

```powershell
git add .
```

Commit:

```powershell
git commit -m "Add comments and activity history"
```

Push:

```powershell
git push
```

---

# API Base URL

Local development:

```text
http://localhost:5000
```

Authentication:

```text
http://localhost:5000/api/auth
```

Todos:

```text
http://localhost:5000/api/todos
```

Admin:

```text
http://localhost:5000/api/admin
```

---

# Notes

Before testing Comments and Activity History, make sure these files exist:

```text
models/Comment.js
models/Activity.js
utils/activityService.js
```

Also make sure `todoRoutes.js` exports and registers:

```text
POST /api/todos/:id/comments
GET /api/todos/:id/comments
GET /api/todos/:id/activity
```

And make sure `todoController.js` contains:

```text
addComment
getTodoComments
getTodoActivity
```

The activity service is responsible for creating activity records throughout the Todo lifecycle.

---

# Summary

This Todo API currently supports:

```text
Authentication
        ↓
JWT Login / Register
        ↓
User Roles
        ↓
Todo CRUD
        ↓
Todo Assignment
        ↓
Priority
        ↓
Due Date
        ↓
Attachments
        ↓
Cloudinary Storage
        ↓
Soft Delete
        ↓
Admin Trash / Restore
        ↓
Comments
        ↓
Activity History
        ↓
Jest / Supertest Testing
```
