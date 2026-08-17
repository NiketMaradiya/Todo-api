# Todo API

A RESTful Todo API built using **Node.js, Express.js, MongoDB, and Mongoose**.

This project supports user authentication, JWT authorization, user roles, Todo assignment, due dates, priorities, status validation, soft delete, trash management, admin features, pagination, search, filtering, sorting, and file attachments.

---

## Features

* User Registration
* User Login
* JWT Authentication
* Protected Routes
* User Roles
* Admin Authorization
* Create Todo
* Get All Todos
* Get Single Todo
* Update Todo
* Delete Todo
* Soft Delete
* Restore Deleted Todo
* Trash Management
* Assign Todo to Users
* Todo Visibility Based on User Role
* Due Date Support
* Priority Support
* Status Validation
* File Attachments
* Cloudinary File Storage
* Pagination
* Search
* Filtering
* Sorting

---

# Technology Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcryptjs
* Multer
* Cloudinary
* dotenv
* cors
* Nodemon

---

# Project Structure

```text
todo-api/
│
├── config/
│   ├── db.js
│   └── cloudinary.js
│
├── controllers/
│   ├── authController.js
│   ├── todoController.js
│   └── adminController.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── adminMiddleware.js
│   └── uploadMiddleware.js
│
├── models/
│   ├── User.js
│   └── Todo.js
│
├── routes/
│   ├── authRoutes.js
│   ├── todoRoutes.js
│   └── adminRoutes.js
│
├── public/
│   └── uploads/
│
├── tests/
│
├── .env
├── .gitignore
├── package.json
├── server.js
└── README.md
```

---

# Installation

Clone or download the project.

Open the project folder in VS Code.

Install dependencies:

```bash
npm install
```

---

# Environment Variables

Create a `.env` file in the root folder.

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/todo-api

JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Replace the Cloudinary values with your own Cloudinary credentials.

---

# Start the Project

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

The server will run on:

```text
http://localhost:5000
```

---

# Authentication APIs

## Register User

### Request

```text
POST /api/auth/register
```

### Body

```json
{
  "name": "Test User",
  "email": "testuser@gmail.com",
  "password": "123456"
}
```

---

## Login User

### Request

```text
POST /api/auth/login
```

### Body

```json
{
  "email": "testuser@gmail.com",
  "password": "123456"
}
```

### Example Response

```json
{
  "success": true,
  "message": "Login successful",
  "token": "YOUR_JWT_TOKEN",
  "user": {
    "_id": "USER_ID",
    "name": "Test User",
    "email": "testuser@gmail.com",
    "role": "user"
  }
}
```

Copy the JWT token and use it for protected routes.

---

# Authorization

For protected APIs, add the token in Postman.

Go to:

```text
Authorization
```

Select:

```text
Bearer Token
```

Paste:

```text
YOUR_JWT_TOKEN
```

---

# Todo Model

A Todo contains the following fields:

```text
title
description
status
createdBy
assignedTo
dueDate
priority
attachmentUrl
isDeleted
deletedAt
createdAt
updatedAt
```

---

# Todo Status

The Todo API supports these status values:

```text
pending
in-progress
completed
```

Example:

```json
{
  "status": "pending"
}
```

Invalid status values should not be accepted.

Example invalid value:

```json
{
  "status": "todo"
}
```

Expected result:

```text
400 Bad Request
```

---

# Todo Priority

The API supports three priority values:

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

Invalid priority values should not be stored.

Example invalid value:

```json
{
  "priority": "urgent"
}
```

Expected result:

```text
400 Bad Request
```

---

# Create Todo

## Request

```text
POST /api/todos
```

This route requires authentication.

## Body

```json
{
  "title": "Learn Express Middleware",
  "description": "Practice authentication and middleware",
  "status": "pending",
  "assignedTo": "REAL_USER_ID",
  "dueDate": "2026-08-30",
  "priority": "high"
}
```

Important:

`assignedTo` must contain a real user ID from the MongoDB users collection.

Example error if the field is missing:

```json
{
  "success": false,
  "message": "assignedTo is required"
}
```

Example error if the user does not exist:

```json
{
  "success": false,
  "message": "Assigned user not found"
}
```

---

# Get All Todos

## Request

```text
GET /api/todos
```

Example:

```text
http://localhost:5000/api/todos
```

The user must provide a valid JWT token.

Depending on the user role:

## Normal User

A normal user can see:

* Todos created by the user
* Todos assigned to the user

## Admin

An admin can see all Todos.

---

# Get Single Todo

## Request

```text
GET /api/todos/:id
```

Example:

```text
GET http://localhost:5000/api/todos/TODO_ID
```

Replace `TODO_ID` with the actual Todo `_id`.

---

# Update Todo

## Request

```text
PUT /api/todos/:id
```

Example:

```text
PUT http://localhost:5000/api/todos/TODO_ID
```

## Body

```json
{
  "title": "Learn Express Middleware",
  "description": "Updated Todo description",
  "status": "in-progress",
  "assignedTo": "REAL_USER_ID",
  "dueDate": "2026-10-01",
  "priority": "medium"
}
```

The Todo can be updated with:

* New title
* New description
* New status
* New assigned user
* New due date
* New priority

---

# Update Due Date

Example:

```json
{
  "title": "Learn Express Middleware",
  "description": "Practice authentication and middleware",
  "status": "pending",
  "assignedTo": "REAL_USER_ID",
  "dueDate": "2026-10-01",
  "priority": "high"
}
```

---

# Update Priority

Example:

```json
{
  "title": "Learn Express Middleware",
  "description": "Practice authentication and middleware",
  "status": "in-progress",
  "assignedTo": "REAL_USER_ID",
  "dueDate": "2026-10-01",
  "priority": "medium"
}
```

---

# Invalid Priority Testing

Use:

```text
PUT /api/todos/:id
```

Body:

```json
{
  "title": "Invalid Priority Test",
  "description": "Testing priority validation",
  "status": "pending",
  "assignedTo": "REAL_USER_ID",
  "dueDate": "2026-10-10",
  "priority": "urgent"
}
```

Expected:

```text
400 Bad Request
```

Only these values are valid:

```text
low
medium
high
```

---

# Invalid Status Testing

Example:

```json
{
  "title": "Invalid Status Test",
  "description": "Testing status validation",
  "status": "todo",
  "assignedTo": "REAL_USER_ID",
  "dueDate": "2026-10-10",
  "priority": "high"
}
```

Expected response:

```json
{
  "success": false,
  "message": "Status must be pending, in-progress or completed"
}
```

---

# Delete Todo

## Request

```text
DELETE /api/todos/:id
```

Example:

```text
DELETE http://localhost:5000/api/todos/TODO_ID
```

This route requires authentication.

The Todo is soft deleted.

Instead of permanently removing the Todo, the API updates:

```text
isDeleted = true
deletedAt = current date
```

Soft-deleted Todos should not appear in the normal Todo list.

---

# Admin APIs

Admin routes require:

* Valid JWT token
* User role set to `admin`

---

# Get All Users

```text
GET /api/admin/users
```

The admin can view all users.

This API can be used to get a real user `_id` for the `assignedTo` field.

Example user:

```json
{
  "_id": "USER_ID",
  "name": "Test User",
  "email": "testuser@gmail.com",
  "role": "user"
}
```

Copy the real `_id` and use it as:

```json
{
  "assignedTo": "USER_ID"
}
```

---

# Make User Admin

```text
POST /api/admin/users/:id/make-admin
```

Example:

```text
POST http://localhost:5000/api/admin/users/USER_ID/make-admin
```

---

# Remove Admin Role

```text
POST /api/admin/users/:id/remove-admin
```

Example:

```text
POST http://localhost:5000/api/admin/users/USER_ID/remove-admin
```

---

# Trash APIs

## View Deleted Todos

```text
GET /api/admin/todos/trash
```

Only an admin can access this route.

This API returns soft-deleted Todos.

---

# Restore Todo

```text
PATCH /api/admin/todos/:id/restore
```

Example:

```text
PATCH http://localhost:5000/api/admin/todos/TODO_ID/restore
```

The Todo will be restored by changing:

```text
isDeleted = false
deletedAt = null
```

---

# File Attachments

The Todo API supports file attachments.

Files are uploaded using:

```text
multipart/form-data
```

The uploaded file can be stored using Cloudinary.

The Todo stores the uploaded file URL.

Example field:

```text
attachmentUrl
```

---

# Pagination

The Todo API supports pagination.

Example:

```text
GET /api/todos?page=1&limit=10
```

Parameters:

```text
page
limit
```

Example:

```text
http://localhost:5000/api/todos?page=1&limit=10
```

---

# Search

Search Todos using:

```text
search
```

Example:

```text
GET /api/todos?search=Express
```

---

# Filter by Status

Example:

```text
GET /api/todos?status=pending
```

Other valid values:

```text
pending
in-progress
completed
```

---

# Sorting

Example:

```text
GET /api/todos?sort=newest
```

Depending on the API implementation, sorting can be used to display:

```text
newest
oldest
```

---

# Complete Postman Testing Flow

## 1. Register User

```text
POST /api/auth/register
```

```json
{
  "name": "Test User",
  "email": "testuser@gmail.com",
  "password": "123456"
}
```

## 2. Login User

```text
POST /api/auth/login
```

```json
{
  "email": "testuser@gmail.com",
  "password": "123456"
}
```

Copy the JWT token.

## 3. Add JWT Token

In Postman:

```text
Authorization
→ Bearer Token
→ Paste JWT Token
```

## 4. Get a Real User ID

If you have admin access:

```text
GET /api/admin/users
```

Copy an existing user's `_id`.

## 5. Create Todo

```text
POST /api/todos
```

```json
{
  "title": "Learn Express Middleware",
  "description": "Practice authentication and middleware",
  "status": "pending",
  "assignedTo": "REAL_USER_ID",
  "dueDate": "2026-08-30",
  "priority": "high"
}
```

Copy the created Todo `_id`.

## 6. Get All Todos

```text
GET /api/todos
```

## 7. Get Single Todo

```text
GET /api/todos/TODO_ID
```

## 8. Update Todo

```text
PUT /api/todos/TODO_ID
```

```json
{
  "title": "Learn Express Middleware",
  "description": "Updated description",
  "status": "in-progress",
  "assignedTo": "REAL_USER_ID",
  "dueDate": "2026-10-01",
  "priority": "medium"
}
```

## 9. Test Invalid Priority

```text
PUT /api/todos/TODO_ID
```

```json
{
  "title": "Invalid Priority Test",
  "description": "Testing validation",
  "status": "pending",
  "assignedTo": "REAL_USER_ID",
  "dueDate": "2026-10-10",
  "priority": "urgent"
}
```

Expected:

```text
400 Bad Request
```

## 10. Test Invalid Status

```json
{
  "title": "Invalid Status Test",
  "description": "Testing validation",
  "status": "todo",
  "assignedTo": "REAL_USER_ID",
  "dueDate": "2026-10-10",
  "priority": "high"
}
```

Expected:

```text
400 Bad Request
```

## 11. Delete Todo

```text
DELETE /api/todos/TODO_ID
```

## 12. Check Normal Todo List

```text
GET /api/todos
```

The deleted Todo should not appear.

---

# Error Handling

## No Token

```text
401 Unauthorized
```

## Invalid Token

```text
401 Unauthorized
```

## Missing assignedTo

```json
{
  "success": false,
  "message": "assignedTo is required"
}
```

## Assigned User Not Found

```json
{
  "success": false,
  "message": "Assigned user not found"
}
```

## Invalid Status

```json
{
  "success": false,
  "message": "Status must be pending, in-progress or completed"
}
```

## Invalid Priority

```text
400 Bad Request
```

Valid priorities:

```text
low
medium
high
```

---

# Todo Testing Checklist

* [ ] User registration
* [ ] User login
* [ ] JWT authentication
* [ ] Create Todo
* [ ] Assign Todo to user
* [ ] Get all Todos
* [ ] Get single Todo
* [ ] Update Todo
* [ ] Update due date
* [ ] Update priority
* [ ] Test low priority
* [ ] Test medium priority
* [ ] Test high priority
* [ ] Test invalid priority
* [ ] Test invalid status
* [ ] Soft delete Todo
* [ ] View deleted Todos
* [ ] Restore Todo
* [ ] Admin authorization
* [ ] File attachment testing

---

# API Summary

| Feature         | Method | Endpoint                            |
| --------------- | ------ | ----------------------------------- |
| Register User   | POST   | `/api/auth/register`                |
| Login User      | POST   | `/api/auth/login`                   |
| Create Todo     | POST   | `/api/todos`                        |
| Get All Todos   | GET    | `/api/todos`                        |
| Get Single Todo | GET    | `/api/todos/:id`                    |
| Update Todo     | PUT    | `/api/todos/:id`                    |
| Delete Todo     | DELETE | `/api/todos/:id`                    |
| Get Users       | GET    | `/api/admin/users`                  |
| Make Admin      | POST   | `/api/admin/users/:id/make-admin`   |
| Remove Admin    | POST   | `/api/admin/users/:id/remove-admin` |
| View Trash      | GET    | `/api/admin/todos/trash`            |
| Restore Todo    | PATCH  | `/api/admin/todos/:id/restore`      |

---

# Author

Todo API Project

Built for learning and practicing:

* REST APIs
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Role-Based Authorization
* Todo Assignment
* Soft Delete
* File Uploads
* Due Date Management
* Priority Management
