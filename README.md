# Todo API

A RESTful Todo API built with **Node.js, Express, MongoDB, Mongoose, and
JWT Authentication**.

## Features

-   User registration and login
-   JWT authentication
-   Logout and protected profile
-   User and Admin roles
-   Role-based authorization
-   Todo CRUD operations
-   Todo ownership using `createdBy`
-   Todo assignment/tagging using `assignedTo`
-   User-based Todo visibility
-   Admin access to all users and all Todos
-   Todo authorization
-   Request rate limiting
-   Validation and error handling
-   Jest + Supertest API tests

## Tech Stack

-   Node.js
-   Express.js
-   MongoDB
-   Mongoose
-   JSON Web Token (JWT)
-   bcryptjs
-   dotenv
-   cors
-   express-rate-limit
-   Jest
-   Supertest
-   Nodemon

## Project Structure

``` text
Todo-api/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── todoController.js
│   └── adminController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── adminMiddleware.js
│   ├── rateLimitMiddleware.js
│   └── errorMiddleware.js
├── models/
│   ├── User.js
│   └── Todo.js
├── routes/
│   ├── authRoutes.js
│   ├── todoRoutes.js
│   └── adminRoutes.js
├── tests/
│   ├── auth.test.js
│   ├── todo.test.js
│   └── admin.test.js
├── .env
├── .gitignore
├── package.json
└── server.js
```

## Installation

``` bash
cd Todo-api
npm install
```

## Environment Variables

Create `.env`:

``` env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/todo-api
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d
```

Never commit `.env`.

Recommended `.gitignore`:

``` gitignore
node_modules/
.env
coverage/
```

## Start MongoDB

Windows:

``` powershell
Get-Service MongoDB
Start-Service MongoDB
Test-NetConnection 127.0.0.1 -Port 27017
```

Expected:

``` text
TcpTestSucceeded : True
```

## Run the API

Development:

``` bash
npm run dev
```

Normal:

``` bash
npm start
```

Base URL:

``` text
http://localhost:5000
```

Expected:

``` text
Server running on port 5000
MongoDB Connected Successfully
```

# Authentication

## Register

``` http
POST /api/auth/register
```

Body:

``` json
{
  "name": "User A",
  "email": "usera@gmail.com",
  "password": "Password123"
}
```

## Login

``` http
POST /api/auth/login
```

Body:

``` json
{
  "email": "usera@gmail.com",
  "password": "Password123"
}
```

The response contains a JWT:

``` json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Postman Authorization

For protected requests:

1.  Open the request.
2.  Click **Authorization**.
3.  Select **Bearer Token**.
4.  Paste the JWT token.
5.  Click **Send**.

Correct:

``` text
Method: GET
URL: http://localhost:5000/api/todos
```

Do not put `GET` inside the URL.

## Logout

``` http
POST /api/auth/logout
```

Authorization:

``` text
Bearer <JWT_TOKEN>
```

## Profile

``` http
GET /api/auth/profile
```

Authorization:

``` text
Bearer <JWT_TOKEN>
```

# Roles

The system supports:

``` text
user
admin
```

New users default to:

``` text
role = user
```

Admin authorization requires a valid JWT and an admin role.

# Todo Assignment

Every Todo contains:

``` text
Todo
├── title
├── description
├── createdBy
├── assignedTo
├── status
├── createdAt
└── updatedAt
```

### createdBy

`createdBy` is always taken from the authenticated user's ID.

The client must not be able to choose another creator.

### assignedTo

`assignedTo` stores the ID of the assigned registered user.

The backend validates that the assigned user exists.

## Create Todo

``` http
POST /api/todos
```

Authorization:

``` text
Bearer <USER_A_TOKEN>
```

Body:

``` json
{
  "title": "Todo 1",
  "description": "Complete the API task",
  "assignedTo": "<USER_B_ID>"
}
```

Do not send `createdBy`.

The backend automatically stores:

``` text
createdBy = logged-in user's ID
```

Example:

``` text
User A
  ↓
Create Todo
  ↓
createdBy = User A
assignedTo = User B
```

# Todo Visibility

A normal user can see:

``` text
Todos created by me
+
Todos assigned to me
```

A normal user cannot see unrelated users' Todos.

Example:

``` text
Todo 1
createdBy = A
assignedTo = B
```

Visibility:

``` text
User A → visible
User B → visible
User C → hidden
Admin  → visible
```

## Get Todos

``` http
GET /api/todos
```

Authorization:

``` text
Bearer <USER_TOKEN>
```

The backend automatically filters Todos according to the authenticated
user.

## Get Todo by ID

``` http
GET /api/todos/:id
```

A normal user can access a Todo when they are the creator or assigned
user.

## Update Todo

``` http
PUT /api/todos/:id
```

Example body:

``` json
{
  "title": "Updated Todo",
  "description": "Updated description",
  "status": "inprogress"
}
```

Reassign:

``` json
{
  "assignedTo": "<USER_C_ID>"
}
```

The assigned user must exist.

## Delete Todo

``` http
DELETE /api/todos/:id
```

Normal users cannot delete another user's Todo. Admins can delete any
user's Todo.

# Todo Status

Existing project statuses:

``` text
todo
inprogress
complate
```

Example:

``` json
{
  "status": "inprogress"
}
```

> `complate` is retained as the existing project spelling.

# Admin API

Admin endpoints require:

``` text
Valid JWT
+
role = admin
```

Normal users should receive:

``` text
403 Forbidden
```

## Get All Users

``` http
GET /api/admin/users
```

Authorization:

``` text
Bearer <ADMIN_TOKEN>
```

## Get All Todos

``` http
GET /api/admin/todos
```

Authorization:

``` text
Bearer <ADMIN_TOKEN>
```

Admin can see all users' Todos, including:

``` text
title
description
createdBy
assignedTo
status
createdAt
updatedAt
```

# Authorization Rules

  Action                        User   Admin
  ---------------------------- ------ -------
  Create Todo                    ✅     ✅
  Assign Todo                    ✅     ✅
  See own created Todos          ✅     ✅
  See assigned Todos             ✅     ✅
  See unrelated Todos            ❌     ✅
  See all Todos                  ❌     ✅
  Update authorized Todo         ✅     ✅
  Delete own/authorized Todo     ✅     ✅
  Delete any user's Todo         ❌     ✅
  Access `/api/admin/users`      ❌     ✅
  Access `/api/admin/todos`      ❌     ✅

# Main Assignment Test

Create:

``` text
User A
User B
User C
Admin
```

User A creates:

``` text
Todo 1
createdBy = A
assignedTo = B
```

Expected:

``` text
User A → Todo 1 ✅
User B → Todo 1 ✅
User C → Todo 1 ❌
Admin  → Todo 1 ✅
```

## Self Assignment

User A creates:

``` text
Todo 2
createdBy = A
assignedTo = A
```

Expected:

``` text
User A → Todo 2 ✅
User B → Todo 2 ❌
User C → Todo 2 ❌
Admin  → Todo 2 ✅
```

## Reassignment

Initially:

``` text
Todo 1
createdBy = A
assignedTo = B
```

Change:

``` text
assignedTo = C
```

Expected:

``` text
User A → Todo 1 ✅
User B → Todo 1 ❌
User C → Todo 1 ✅
Admin  → Todo 1 ✅
```

# Security Tests

## Invalid Assigned User

Try:

``` json
{
  "title": "Invalid Assignment",
  "description": "Testing invalid user",
  "assignedTo": "000000000000000000000000"
}
```

Expected:

``` text
400 Bad Request
```

The Todo must not be created.

## createdBy Protection

Even if User A sends:

``` json
{
  "title": "Security Test",
  "createdBy": "<USER_B_ID>"
}
```

while authenticated as User A, the backend must store:

``` text
createdBy = USER_A_ID
```

The client cannot choose the creator.

# Postman Testing Order

``` text
1. Register User A
2. Register User B
3. Register User C
4. Login User A
5. Login User B
6. Login User C
7. Login Admin
8. Create Todo 1 as A → assign B
9. GET todos as A
10. GET todos as B
11. GET todos as C
12. Create Todo 2 as A → assign A
13. GET todos as A
14. GET todos as B
15. GET todos as C
16. GET Todo 1 by ID
17. Update Todo 1
18. Reassign Todo 1 from B → C
19. GET todos as B
20. GET todos as C
21. Test invalid assigned user
22. Test createdBy protection
23. GET /api/admin/users as Admin
24. GET /api/admin/todos as Admin
25. GET /api/admin/todos as normal User
26. Test delete authorization
27. Test Admin delete
```

# Rate Limiting

The existing project uses:

``` text
20 requests
per 1 minute
per IP
```

When exceeded:

``` json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

# Error Handling

Common errors:

``` text
401 Unauthorized
403 Forbidden
400 Bad Request
404 Not Found
```

Examples include:

-   Missing authentication
-   Invalid JWT
-   Insufficient permissions
-   Invalid Todo ID
-   Todo not found
-   Invalid assigned user

# Automated Tests

Run:

``` bash
npm test
```

Or:

``` bash
npx jest --runInBand
```

Test files:

``` text
tests/
├── auth.test.js
├── todo.test.js
└── admin.test.js
```

Tests cover authentication, Todo assignment, ownership, visibility,
reassignment, admin authorization, role management, and deletion.

## MongoDB Before Jest

Make sure MongoDB is running before:

``` bash
npm test
```

If you see:

``` text
connect ECONNREFUSED 127.0.0.1:27017
```

start MongoDB:

``` powershell
Start-Service MongoDB
```

Then verify:

``` powershell
Test-NetConnection 127.0.0.1 -Port 27017
```

# API Summary

## Authentication

``` text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/profile
```

## Todo

``` text
POST   /api/todos
GET    /api/todos
GET    /api/todos/:id
PUT    /api/todos/:id
DELETE /api/todos/:id
```

## Admin

``` text
GET /api/admin/users
GET /api/admin/todos
```

# GitHub

Do not commit:

``` text
.env
node_modules/
coverage/
```

Then:

``` bash
git add .
git commit -m "Add JWT auth, admin roles and todo assignment"
git push
```

# Final Feature Checklist

``` text
[✓] MongoDB connection
[✓] Express API
[✓] User registration
[✓] User login
[✓] JWT authentication
[✓] Logout
[✓] Protected profile
[✓] User role
[✓] Admin role
[✓] Admin authorization
[✓] Todo CRUD
[✓] Todo createdBy
[✓] Todo assignedTo
[✓] Assigned-user validation
[✓] Creator-based visibility
[✓] Assigned-user visibility
[✓] Unrelated Todo protection
[✓] Admin sees all Todos
[✓] Todo reassignment
[✓] Todo status
[✓] Rate limiting
[✓] Error handling
[✓] Jest tests
[✓] Supertest API testing
[✓] Postman testing
```

# Quick Start

``` bash
npm install
npm run dev
```

Then use Postman:

``` text
POST http://localhost:5000/api/auth/register
POST http://localhost:5000/api/auth/login

POST http://localhost:5000/api/todos
GET  http://localhost:5000/api/todos
GET  http://localhost:5000/api/todos/:id
PUT  http://localhost:5000/api/todos/:id
DELETE http://localhost:5000/api/todos/:id

GET http://localhost:5000/api/admin/users
GET http://localhost:5000/api/admin/todos
```

For protected endpoints:

``` text
Authorization → Bearer Token → JWT
```

Run tests:

``` bash
npm test
```

## Project Status

The Todo API supports JWT authentication, role-based admin
authorization, Todo ownership, user assignment/tagging, user-based Todo
visibility, admin Todo visibility, CRUD operations, validation, rate
limiting, and automated API testing.
