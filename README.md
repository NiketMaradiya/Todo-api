# Todo API

A RESTful Todo Management API built with **Node.js, Express.js, MongoDB, Mongoose, and JWT Authentication**.

## Features

* User registration and login
* JWT authentication
* User roles: `user` and `admin`
* Protected Todo APIs
* Todo CRUD operations
* Todo ownership
* Todo assignment
* Role-based admin access
* Todo statistics
* Search by title and description
* Status filtering
* Pagination
* Sorting
* Combined filters
* Permission-based Todo visibility
* Input validation and error handling
* **Soft Delete**
* **Trash functionality**
* **Admin-only Trash access**
* **Admin-only Todo restore**

---

## Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* JSON Web Token (JWT)
* bcrypt
* dotenv
* CORS
* Nodemon
* Jest
* Supertest

---

# Project Structure

```text
Todo-api/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   └── todoController.js
│
├── middleware/
│   ├── adminMiddleware.js
│   └── authMiddleware.js
│
├── models/
│   ├── Todo.js
│   └── User.js
│
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   └── todoRoutes.js
│
├── tests/
│
├── .env
├── package.json
├── server.js
└── README.md
```

---

# Installation

## 1. Clone or Download the Project

```bash
git clone <your-repository-url>
cd Todo-api
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Create `.env` File

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/todo-api
JWT_SECRET=your_secret_key
```

## 4. Start MongoDB

Make sure MongoDB is running before starting the application.

## 5. Start the Server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server runs at:

```text
http://localhost:5000
```

---

# Authentication APIs

All authentication APIs are available under:

```text
/api/auth
```

## Register User

```http
POST /api/auth/register
```

### Request Body

```json
{
  "name": "User One",
  "email": "user1@test.com",
  "password": "123456"
}
```

A newly registered user receives the default role:

```text
user
```

---

## Login User

```http
POST /api/auth/login
```

### Request Body

```json
{
  "email": "user1@test.com",
  "password": "123456"
}
```

The login response returns a JWT token.

Use the token for protected APIs:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Get User Profile

```http
GET /api/profile
```

Requires a valid JWT token.

---

# Todo Model

A Todo contains the following important fields:

```json
{
  "_id": "TODO_ID",
  "title": "Team Meeting",
  "description": "Discuss the new project",
  "createdBy": "USER_ID",
  "assignedTo": "USER_ID",
  "status": "pending",
  "isDeleted": false,
  "deletedAt": null
}
```

## Supported Status Values

```text
pending
in-progress
completed
```

## Soft Delete Fields

### `isDeleted`

```text
Boolean
```

Default:

```text
false
```

It indicates whether the Todo has been moved to trash.

### `deletedAt`

```text
Date
```

Default:

```text
null
```

When a Todo is soft-deleted, this field stores the deletion date and time.

---

# Todo APIs

All Todo APIs require JWT authentication.

## Create Todo

```http
POST /api/todos
```

### Request Body

```json
{
  "title": "Team Meeting",
  "description": "Discuss the new project",
  "status": "pending",
  "assignedTo": "USER_ID"
}
```

---

## Get All Todos

```http
GET /api/todos
```

### Normal User

A normal user can see:

* Todos created by them
* Todos assigned to them

### Admin

An admin can see:

* All active Todos

### Important

Soft-deleted Todos are automatically excluded from this API.

---

# Search

Search works with:

* `title`
* `description`

Example:

```http
GET /api/todos?search=meeting
```

```http
GET /api/todos?search=node
```

```http
GET /api/todos?search=project
```

Search is case-insensitive.

---

# Status Filter

## Pending

```http
GET /api/todos?status=pending
```

## In Progress

```http
GET /api/todos?status=in-progress
```

## Completed

```http
GET /api/todos?status=completed
```

---

# Pagination

Use:

* `page`
* `limit`

Example:

```http
GET /api/todos?page=1&limit=10
```

### Example Response

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

# Sorting

## Newest First

```http
GET /api/todos?sort=newest
```

## Oldest First

```http
GET /api/todos?sort=oldest
```

---

# Combined Filters

All supported query parameters can be combined.

Example:

```http
GET /api/todos?search=meeting&status=pending&page=1&limit=10&sort=newest
```

## Request Flow

```text
Request
   ↓
JWT Authentication
   ↓
User Authorization Scope
   ↓
Soft Delete Filter
   ↓
Search
   ↓
Status Filter
   ↓
Sorting
   ↓
Pagination
   ↓
MongoDB
   ↓
Response
```

---

# Get Todo by ID

```http
GET /api/todos/:id
```

Example:

```http
GET /api/todos/64f123456789abcdef123456
```

Normal users can access only Todos they created or Todos assigned to them.

Admins can access any active Todo.

Soft-deleted Todos are not returned by this API.

---

# Update Todo

```http
PUT /api/todos/:id
```

or:

```http
PATCH /api/todos/:id
```

### Example Request Body

```json
{
  "title": "Updated Meeting",
  "description": "Updated description",
  "status": "in-progress",
  "assignedTo": "USER_ID"
}
```

Soft-deleted Todos cannot be updated through the normal Todo APIs.

---

# Update Todo Status

```http
PATCH /api/todos/:id/status
```

### Request Body

```json
{
  "status": "completed"
}
```

Supported values:

```text
pending
in-progress
completed
```

---

# Soft Delete

## Delete Todo

```http
DELETE /api/todos/:id
```

A Todo is **not permanently removed** from MongoDB.

Instead:

```text
isDeleted = true
deletedAt = current date/time
```

Example database state after deletion:

```json
{
  "isDeleted": true,
  "deletedAt": "2026-08-14T09:30:00.000Z"
}
```

The original Todo document remains in the database.

---

# Soft Delete Behavior

Before deletion:

```json
{
  "title": "Test Soft Delete",
  "isDeleted": false,
  "deletedAt": null
}
```

After deletion:

```json
{
  "title": "Test Soft Delete",
  "isDeleted": true,
  "deletedAt": "2026-08-14T09:30:00.000Z"
}
```

Normal Todo APIs automatically exclude:

```text
isDeleted = true
```

---

# Admin APIs

All Admin APIs require:

1. A valid JWT token
2. User role set to `admin`

Admin routes use role-based authorization.

Base path:

```text
/api/admin
```

---

# Get All Users

```http
GET /api/admin/users
```

Admin only.

---

# Get All Active Todos

```http
GET /api/admin/todos
```

Admin only.

This endpoint returns active Todos.

Soft-deleted Todos are excluded.

---

# Get Admin Todo by ID

```http
GET /api/admin/todos/:id
```

Admin only.

Soft-deleted Todos are excluded.

---

# Admin Update Todo

```http
PUT /api/admin/todos/:id
```

or:

```http
PATCH /api/admin/todos/:id
```

Admin can update any active Todo.

---

# Admin Delete Todo

```http
DELETE /api/admin/todos/:id
```

Admin deletion also uses soft delete.

The Todo is changed to:

```text
isDeleted = true
deletedAt = current date/time
```

The Todo is not permanently deleted.

---

# Trash Feature

The Trash API allows administrators to view all soft-deleted Todos.

## Get Trash

```http
GET /api/admin/todos/trash
```

Admin only.

### Example Response

```json
{
  "success": true,
  "count": 1,
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "data": [
    {
      "_id": "TODO_ID",
      "title": "Test Soft Delete",
      "description": "Testing trash feature",
      "status": "pending",
      "isDeleted": true,
      "deletedAt": "2026-08-14T09:30:00.000Z"
    }
  ]
}
```

## Trash Query Parameters

The Trash API supports:

```text
search
status
createdBy
assignedTo
page
limit
sort
```

Example:

```http
GET /api/admin/todos/trash?page=1&limit=10&sort=newest
```

Example with search:

```http
GET /api/admin/todos/trash?search=meeting
```

Example with status:

```http
GET /api/admin/todos/trash?status=pending
```

---

# Restore Todo

Only admins can restore deleted Todos.

```http
PATCH /api/admin/todos/:id/restore
```

Example:

```http
PATCH /api/admin/todos/64f123456789abcdef123456/restore
```

After restoring:

```text
isDeleted = false
deletedAt = null
```

Example response:

```json
{
  "success": true,
  "message": "Todo restored successfully",
  "data": {
    "_id": "TODO_ID",
    "title": "Test Soft Delete",
    "isDeleted": false,
    "deletedAt": null
  }
}
```

The restored Todo becomes available again through normal Todo APIs.

---

# Soft Delete Flow

```text
User/Admin
    ↓
DELETE /api/todos/:id
or
DELETE /api/admin/todos/:id
    ↓
Find active Todo
    ↓
isDeleted = true
    ↓
deletedAt = current date/time
    ↓
Save Todo
    ↓
Todo moves to Trash
```

---

# Restore Flow

```text
Admin
    ↓
GET /api/admin/todos/trash
    ↓
Find deleted Todo
    ↓
PATCH /api/admin/todos/:id/restore
    ↓
isDeleted = false
    ↓
deletedAt = null
    ↓
Save Todo
    ↓
Todo becomes active again
```

---

# Visibility Rules

| API                                  | Normal User               | Admin            |
| ------------------------------------ | ------------------------- | ---------------- |
| `GET /api/todos`                     | Own/assigned active Todos | All active Todos |
| `GET /api/todos/:id`                 | Own/assigned active Todo  | Any active Todo  |
| `DELETE /api/todos/:id`              | Own created Todo          | Supported        |
| `GET /api/admin/todos`               | No                        | Yes              |
| `GET /api/admin/todos/trash`         | No                        | Yes              |
| `PATCH /api/admin/todos/:id/restore` | No                        | Yes              |

---

# Todo Statistics

```http
GET /api/todos/stats
```

Normal users receive statistics based on:

* Todos created by them
* Todos assigned to them

Admins can receive statistics across active Todos according to the authorization rules.

Soft-deleted Todos are excluded from normal statistics.

---

# Postman Testing Guide

## 1. Create User One

```http
POST /api/auth/register
```

### Body

```json
{
  "name": "User One",
  "email": "user1@test.com",
  "password": "123456"
}
```

---

## 2. Create User Two

```http
POST /api/auth/register
```

### Body

```json
{
  "name": "User Two",
  "email": "user2@test.com",
  "password": "123456"
}
```

---

## 3. Login User One

```http
POST /api/auth/login
```

### Body

```json
{
  "email": "user1@test.com",
  "password": "123456"
}
```

Copy the returned JWT token.

Use:

```text
Authorization
Bearer Token
USER_1_TOKEN
```

---

## 4. Login User Two

```http
POST /api/auth/login
```

### Body

```json
{
  "email": "user2@test.com",
  "password": "123456"
}
```

Copy the returned JWT token.

---

## 5. Get User Profile

```http
GET /api/profile
```

Authorization:

```text
Bearer USER_2_TOKEN
```

Copy User Two's `_id`.

---

## 6. Create a Todo

Login as User One.

```http
POST /api/todos
```

Authorization:

```text
Bearer USER_1_TOKEN
```

### Body

```json
{
  "title": "Test Soft Delete",
  "description": "Testing trash feature",
  "status": "pending",
  "assignedTo": "USER_2_ID"
}
```

Copy the returned Todo `_id`.

---

## 7. Check Todo

```http
GET /api/todos
```

Authorization:

```text
Bearer USER_1_TOKEN
```

The Todo should appear.

---

## 8. Delete Todo

```http
DELETE /api/todos/TODO_ID
```

Authorization:

```text
Bearer USER_1_TOKEN
```

Expected:

```json
{
  "success": true,
  "message": "Todo moved to trash successfully"
}
```

---

## 9. Check Normal Todo List

```http
GET /api/todos
```

The deleted Todo should not appear.

This confirms soft delete is working.

---

# Admin Testing

## 10. Create Admin User

Register a normal user:

```http
POST /api/auth/register
```

```json
{
  "name": "Admin User",
  "email": "admin@test.com",
  "password": "123456"
}
```

The new user starts with:

```text
role = user
```

Change the user's role to:

```text
role = admin
```

using your existing admin/user-role process or directly in MongoDB for testing.

---

## 11. Login Admin

```http
POST /api/auth/login
```

### Body

```json
{
  "email": "admin@test.com",
  "password": "123456"
}
```

Copy the returned admin token.

---

## 12. Get Trash

```http
GET /api/admin/todos/trash
```

Authorization:

```text
Bearer ADMIN_TOKEN
```

The previously deleted Todo should appear.

---

## 13. Restore Todo

```http
PATCH /api/admin/todos/TODO_ID/restore
```

Authorization:

```text
Bearer ADMIN_TOKEN
```

Expected:

```json
{
  "success": true,
  "message": "Todo restored successfully"
}
```

---

## 14. Check Trash Again

```http
GET /api/admin/todos/trash
```

The restored Todo should no longer appear in Trash.

---

## 15. Check Normal Todos

```http
GET /api/todos
```

The restored Todo should appear again.

---

# Complete Soft Delete Testing Flow

```text
Register User
       ↓
Login User
       ↓
Create Todo
       ↓
GET /api/todos
       ↓
DELETE /api/todos/:id
       ↓
GET /api/todos
       ↓
Todo disappears
       ↓
Login Admin
       ↓
GET /api/admin/todos/trash
       ↓
Deleted Todo appears
       ↓
PATCH /api/admin/todos/:id/restore
       ↓
GET /api/admin/todos/trash
       ↓
Todo disappears from Trash
       ↓
GET /api/todos
       ↓
Restored Todo appears
```

---

# Validation and Error Handling

The API validates:

* Required title
* Valid Todo ID
* Valid assigned user ID
* Assigned user exists
* Valid Todo status
* Valid page number
* Valid limit
* Maximum limit of 100
* Valid sorting value
* JWT authentication
* Todo ownership
* Todo assignment access
* Admin permissions
* Soft-delete state
* Restore state

---

# Invalid Query Examples

## Invalid Page

```http
GET /api/todos?page=0
```

```http
GET /api/todos?page=-1
```

```http
GET /api/todos?page=abc
```

## Invalid Limit

```http
GET /api/todos?limit=0
```

```http
GET /api/todos?limit=101
```

```http
GET /api/todos?limit=abc
```

## Invalid Status

```http
GET /api/todos?status=invalid
```

## Invalid Sort

```http
GET /api/todos?sort=random
```

---

# Security and Authorization

Protected APIs require:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Admin APIs require:

```text
JWT token
+
role = admin
```

Normal users cannot access:

```http
GET /api/admin/todos/trash
```

or:

```http
PATCH /api/admin/todos/:id/restore
```

---

# API Summary

| Method | Endpoint                       | Description            |
| ------ | ------------------------------ | ---------------------- |
| POST   | `/api/auth/register`           | Register user          |
| POST   | `/api/auth/login`              | Login user             |
| POST   | `/api/auth/logout`             | Logout user            |
| GET    | `/api/profile`                 | Get logged-in user     |
| POST   | `/api/todos`                   | Create Todo            |
| GET    | `/api/todos`                   | Get active Todos       |
| GET    | `/api/todos/stats`             | Get Todo statistics    |
| GET    | `/api/todos/:id`               | Get active Todo by ID  |
| PUT    | `/api/todos/:id`               | Update Todo            |
| PATCH  | `/api/todos/:id`               | Update Todo            |
| PATCH  | `/api/todos/:id/status`        | Update Todo status     |
| DELETE | `/api/todos/:id`               | Soft-delete Todo       |
| GET    | `/api/admin/users`             | Get all users          |
| GET    | `/api/admin/todos`             | Get all active Todos   |
| GET    | `/api/admin/todos/:id`         | Get any active Todo    |
| PUT    | `/api/admin/todos/:id`         | Admin update Todo      |
| PATCH  | `/api/admin/todos/:id`         | Admin update Todo      |
| DELETE | `/api/admin/todos/:id`         | Admin soft-delete Todo |
| GET    | `/api/admin/todos/trash`       | Get deleted Todos      |
| PATCH  | `/api/admin/todos/:id/restore` | Restore deleted Todo   |

---

# Query Parameters

| Parameter    | Example               | Description                  |
| ------------ | --------------------- | ---------------------------- |
| `search`     | `?search=meeting`     | Search title and description |
| `status`     | `?status=pending`     | Filter by status             |
| `createdBy`  | `?createdBy=USER_ID`  | Filter by creator            |
| `assignedTo` | `?assignedTo=USER_ID` | Filter by assigned user      |
| `page`       | `?page=1`             | Current page                 |
| `limit`      | `?limit=10`           | Results per page             |
| `sort`       | `?sort=newest`        | Sort newest or oldest        |

All supported parameters can be combined.

Example:

```http
GET /api/todos?search=meeting&status=pending&page=1&limit=10&sort=newest
```

Trash example:

```http
GET /api/admin/todos/trash?search=meeting&status=pending&page=1&limit=10&sort=newest
```

---

# Running Tests

If tests are configured:

```bash
npm test
```

---

# Development

Start the project in development mode:

```bash
npm run dev
```

Nodemon automatically restarts the server when project files change.

---

# Production

Start the project with:

```bash
npm start
```

---

# Author

Todo Management REST API built with:

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Role-Based Authorization
* Todo Ownership
* Todo Assignment
* Search
* Filtering
* Pagination
* Sorting
* Soft Delete
* Trash
* Restore
