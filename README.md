# Todo API with JWT Authentication & Admin Role

A secure REST API built with **Node.js, Express, MongoDB, Mongoose, and JWT**.

This project started as a Todo API and was extended with an authentication system and **Role-Based Access Control (RBAC)**.

The same authentication system is used for both normal users and admins.

```text
User
├── user
└── admin
```

There is **no separate admin login system**.

---

# Features

## Authentication

- User registration
- User login
- JWT authentication
- Protected routes
- User profile
- Logout
- Password hashing
- JWT token contains user role

## User Roles

The system supports two roles:

```text
user
admin
```

New users are created with:

```text
role = user
```

For security, users cannot make themselves admins during public registration.

---

# Admin Features

Admins can:

- See all users
- Make a user an admin
- Remove admin privileges
- Change a user's role
- Change a user's password
- Disable a user
- Enable a user
- Delete a user

Normal users cannot access admin APIs.

---

# Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- dotenv
- cors
- Jest
- Supertest
- Nodemon

---

# Project Structure

```text
Todo-api/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   ├── todoController.js
│   └── adminController.js
│
├── middleware/
│   ├── authMiddleware.js
│   └── roleMiddleware.js
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
├── scripts/
│   └── createAdmin.js
│
├── tests/
│   ├── auth.test.js
│   ├── todo.test.js
│   └── admin.test.js
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

Open the project folder:

```bash
cd Todo-api
```

Install dependencies:

```bash
npm install
```

---

# Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/todo-api

JWT_SECRET=mySuperSecretKey123456789

JWT_EXPIRE=7d
```

For MongoDB Atlas:

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/todo-api
```

Important:

Your MongoDB URI must start with:

```text
mongodb://
```

or:

```text
mongodb+srv://
```

---

# Run the Server

Development mode:

```bash
npm run dev
```

Expected output:

```text
Server running on port 5000
MongoDB Connected
```

Production mode:

```bash
npm start
```

---

# Authentication Flow

```text
Register
   ↓
User created
   ↓
Default role = user
   ↓
Login
   ↓
JWT generated
   ↓
JWT contains:
- User ID
- User Role
```

Example JWT payload:

```json
{
  "id": "USER_ID",
  "role": "user"
}
```

For an admin:

```json
{
  "id": "ADMIN_ID",
  "role": "admin"
}
```

---

# User Registration

## Register User

### Endpoint

```http
POST /api/auth/register
```

### Request Body

```json
{
  "name": "John",
  "email": "john@test.com",
  "password": "password123"
}
```

### Response

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "JWT_TOKEN",
  "data": {
    "_id": "USER_ID",
    "name": "John",
    "email": "john@test.com",
    "role": "user",
    "isActive": true
  }
}
```

---

# Important Security Rule

Even if someone sends:

```json
{
  "name": "Hacker",
  "email": "hacker@test.com",
  "password": "password123",
  "role": "admin"
}
```

The system should still create:

```json
{
  "role": "user"
}
```

Public registration should not allow users to create themselves as admins.

---

# Login

## Login User

### Endpoint

```http
POST /api/auth/login
```

### Request Body

```json
{
  "email": "john@test.com",
  "password": "password123"
}
```

### Response

```json
{
  "success": true,
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "data": {
    "_id": "USER_ID",
    "name": "John",
    "email": "john@test.com",
    "role": "user"
  }
}
```

---

# Protected Routes

Protected routes require a JWT token.

Send the token in the request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Authentication flow:

```text
Request
   ↓
Authorization Header
   ↓
Bearer Token
   ↓
JWT Verification
   ↓
User Authentication
   ↓
Allow / Reject Request
```

---

# Role-Based Access Control

The application uses the existing authentication middleware.

```text
JWT
 ↓
protect middleware
 ↓
User authenticated
 ↓
role middleware
 ↓
Check user role
 ↓
Allow / Deny access
```

Example:

```text
Normal User
   ↓
Admin API
   ↓
403 Forbidden
```

```text
Admin
   ↓
Admin API
   ↓
200 OK
```

---

# Admin APIs

All admin APIs require:

```text
Authorization: Bearer ADMIN_JWT_TOKEN
```

---

# Get All Users

Only admins can access this API.

### Endpoint

```http
GET /api/admin/users
```

### Authorization

```text
Bearer ADMIN_JWT_TOKEN
```

### Success Response

```text
200 OK
```

Example:

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "USER_ID",
      "name": "John",
      "email": "john@test.com",
      "role": "user",
      "isActive": true
    },
    {
      "_id": "ADMIN_ID",
      "name": "Admin",
      "email": "admin@test.com",
      "role": "admin",
      "isActive": true
    }
  ]
}
```

---

# Make User Admin

Only an admin can promote a user.

### Endpoint

```http
POST /api/admin/users/:id/make-admin
```

Example:

```http
POST /api/admin/users/USER_ID/make-admin
```

### Authorization

```text
Bearer ADMIN_JWT_TOKEN
```

### Success Response

```text
200 OK
```

```json
{
  "success": true,
  "message": "User promoted to admin successfully"
}
```

The user's role changes:

```text
user
 ↓
admin
```

---

# Remove Admin Role

Only an admin can remove admin privileges.

### Endpoint

```http
POST /api/admin/users/:id/remove-admin
```

Example:

```http
POST /api/admin/users/USER_ID/remove-admin
```

### Authorization

```text
Bearer ADMIN_JWT_TOKEN
```

### Success Response

```text
200 OK
```

The user's role changes:

```text
admin
 ↓
user
```

---

# Change User Role

An admin can directly change a user's role.

### Endpoint

```http
PATCH /api/admin/users/:id/role
```

### Request Body

Make user an admin:

```json
{
  "role": "admin"
}
```

Make user a normal user:

```json
{
  "role": "user"
}
```

Allowed roles:

```text
user
admin
```

---

# Change User Password

Only an admin can change another user's password.

### Endpoint

```http
PATCH /api/admin/users/:id/password
```

### Request Body

```json
{
  "password": "newpassword123"
}
```

### Success Response

```text
200 OK
```

---

# Disable User

An admin can disable a user account.

### Endpoint

```http
PATCH /api/admin/users/:id/status
```

### Request Body

Disable:

```json
{
  "isActive": false
}
```

Enable:

```json
{
  "isActive": true
}
```

When disabled:

```text
User
 ↓
Cannot login
```

---

# Delete User

Only an admin can delete a user.

### Endpoint

```http
DELETE /api/admin/users/:id
```

### Authorization

```text
Bearer ADMIN_JWT_TOKEN
```

---

# Creating the First Admin

Public registration always creates:

```text
role = user
```

Therefore, the project includes:

```text
scripts/createAdmin.js
```

This script creates or updates the first admin.

Run:

```bash
node scripts/createAdmin.js
```

Expected output:

```text
MongoDB Connected
Admin created successfully
Done
```

If the user already exists:

```text
MongoDB Connected
Existing user updated to admin
Done
```

The admin can then login using the same login API:

```http
POST /api/auth/login
```

Example:

```json
{
  "email": "admin@test.com",
  "password": "password123"
}
```

There is no separate admin login system.

---

# How Admin Promotion Works

```text
First Admin
     ↓
Login
     ↓
Admin JWT Token
     ↓
POST /api/admin/users/:id/make-admin
     ↓
Normal User
     ↓
role = admin
```

---

# Todo APIs

Your existing Todo APIs remain protected by the same authentication system.

Typical Todo endpoints:

```http
GET /api/todos
POST /api/todos
PATCH /api/todos/:id
DELETE /api/todos/:id
```

Use:

```http
Authorization: Bearer USER_JWT_TOKEN
```

---

# Security Testing

The following security tests are important.

## 1. No Token

Request:

```http
GET /api/admin/users
```

Without:

```text
Authorization header
```

Expected:

```text
401 Unauthorized
```

---

## 2. Invalid Token

Send:

```http
Authorization: Bearer invalid-token
```

Expected:

```text
401 Unauthorized
```

---

## 3. Valid Normal User Token

Login as a normal user.

Use:

```http
Authorization: Bearer USER_JWT_TOKEN
```

Request:

```http
GET /api/admin/users
```

Expected:

```text
403 Forbidden
```

---

## 4. Valid Admin Token

Login as an admin.

Use:

```http
Authorization: Bearer ADMIN_JWT_TOKEN
```

Request:

```http
GET /api/admin/users
```

Expected:

```text
200 OK
```

---

# Security Test Summary

| Token | Role | Expected Result |
|---|---|---|
| No Token | None | 401 Unauthorized |
| Invalid Token | None | 401 Unauthorized |
| Valid User Token | user | 403 Forbidden |
| Valid Admin Token | admin | 200 OK |

---

# Automated Testing

Run all tests:

```bash
npm test
```

Expected:

```text
PASS tests/auth.test.js
PASS tests/todo.test.js
PASS tests/admin.test.js

Test Suites: 3 passed
Tests: All passed
```

---

# Manual Testing with Postman

## Step 1: Register User

```http
POST http://localhost:5000/api/auth/register
```

```json
{
  "name": "Test User",
  "email": "user@test.com",
  "password": "password123"
}
```

Role should be:

```text
user
```

---

## Step 2: Test User Access to Admin API

```http
GET http://localhost:5000/api/admin/users
```

Use the normal user token.

Expected:

```text
403 Forbidden
```

---

## Step 3: Create First Admin

Run:

```bash
node scripts/createAdmin.js
```

---

## Step 4: Login as Admin

```http
POST http://localhost:5000/api/auth/login
```

```json
{
  "email": "admin@test.com",
  "password": "password123"
}
```

Copy the admin token.

---

## Step 5: Access Admin API

```http
GET http://localhost:5000/api/admin/users
```

Use:

```text
Authorization: Bearer ADMIN_JWT_TOKEN
```

Expected:

```text
200 OK
```

---

## Step 6: Make Another User Admin

```http
POST http://localhost:5000/api/admin/users/USER_ID/make-admin
```

Use the admin token.

Expected:

```text
200 OK
```

---

# API Summary

## Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Authenticated |
| GET | `/api/auth/profile` | Authenticated |

## Todo

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/todos` | Authenticated |
| POST | `/api/todos` | Authenticated |
| PATCH | `/api/todos/:id` | Authenticated |
| DELETE | `/api/todos/:id` | Authenticated |

## Admin

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/admin/users` | Admin |
| POST | `/api/admin/users/:id/make-admin` | Admin |
| POST | `/api/admin/users/:id/remove-admin` | Admin |
| PATCH | `/api/admin/users/:id/role` | Admin |
| PATCH | `/api/admin/users/:id/password` | Admin |
| PATCH | `/api/admin/users/:id/status` | Admin |
| DELETE | `/api/admin/users/:id` | Admin |

---

# Complete Role System

```text
                    ┌─────────────┐
                    │   Register  │
                    └──────┬──────┘
                           ↓
                    role = user
                           ↓
                    ┌─────────────┐
                    │    Login    │
                    └──────┬──────┘
                           ↓
                     JWT Token
                           │
                 ┌─────────┴─────────┐
                 ↓                   ↓
              user                admin
                 │                   │
                 │                   ├── See all users
                 │                   ├── Make admin
                 │                   ├── Remove admin
                 │                   ├── Change role
                 │                   ├── Change password
                 │                   ├── Disable user
                 │                   └── Delete user
                 │
                 └── Cannot access
                     Admin APIs
```

---

# Main Security Principle

The project uses one authentication system:

```text
User
 ├── user
 └── admin
```

Both roles use:

```text
POST /api/auth/login
```

Both roles receive JWT tokens.

The difference is the role stored in the database and JWT:

```text
Normal User JWT
role = user
```

```text
Admin JWT
role = admin
```

Admin access is controlled using:

```text
Authentication Middleware
        +
Role-Based Middleware
```

This extends the existing authentication system instead of creating a separate admin authentication system.

---

# Author

Todo API Project

Built for learning:

- REST APIs
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Authorization
- Role-Based Access Control
- Middleware
- Admin Management
- Automated Testing