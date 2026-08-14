# Todo API

A RESTful Todo Management API built with **Node.js, Express.js, MongoDB, Mongoose, and JWT Authentication**.

## Features

- User registration and login
- JWT authentication
- User roles: `user` and `admin`
- Protected Todo APIs
- Todo CRUD operations
- Todo ownership
- Todo assignment
- Role-based admin access
- Todo statistics
- Search by title and description
- Status filtering
- Pagination
- Sorting
- Combined filters
- Permission-based Todo visibility
- Input validation and error handling

---

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcrypt
- dotenv
- CORS
- Nodemon
- Jest
- Supertest

---

## Project Structure

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

Make sure MongoDB is running.

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

### Supported Status Values

```text
pending
in-progress
completed
```

---

## Get All Todos

```http
GET /api/todos
```

### Permission Rules

### Normal User

A normal user can see:

- Todos created by them
- Todos assigned to them

### Admin

An admin can see:

- All users' Todos

Authorization scope is applied before search and filtering, preventing users from accessing other users' private Todos.

---

# Search

Search works with both:

- `title`
- `description`

Example:

```http
GET /api/todos?search=meeting
```

More examples:

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

- `page`
- `limit`

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

### More Examples

```http
GET /api/todos?page=1&limit=2
```

```http
GET /api/todos?page=2&limit=2
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

All query parameters can be combined.

Example:

```http
GET /api/todos?search=meeting&status=pending&page=1&limit=10&sort=newest
```

## Request Flow

```text
Request
   ↓
req.query
   ↓
Authorization / User Scope
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

# Other Todo APIs

## Get Todo by ID

```http
GET /api/todos/:id
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

---

## Update Todo Status

```http
PATCH /api/todos/:id/status
```

### Request Body

```json
{
  "status": "completed"
}
```

---

## Delete Todo

```http
DELETE /api/todos/:id
```

---

## Todo Statistics

```http
GET /api/todos/stats
```

Normal users receive statistics based on:

- Their created Todos
- Todos assigned to them

Admins can access statistics for all Todos according to the authorization rules.

---

# Admin APIs

Admin routes require:

- A valid JWT token
- User role set to `admin`

Example:

```http
GET /api/admin/users
```

---

# Validation and Error Handling

The API validates:

- Required title
- Valid Todo ID
- Valid assigned user ID
- Assigned user exists
- Valid Todo status
- Valid page number
- Valid limit
- Maximum limit of 100
- Valid sorting value
- JWT authentication
- Todo ownership
- Todo assignment access
- Admin permissions

## Invalid Query Examples

### Invalid Page

```http
GET /api/todos?page=0
```

```http
GET /api/todos?page=-1
```

```http
GET /api/todos?page=abc
```

### Invalid Limit

```http
GET /api/todos?limit=0
```

```http
GET /api/todos?limit=101
```

```http
GET /api/todos?limit=abc
```

### Invalid Status

```http
GET /api/todos?status=invalid
```

### Invalid Sort

```http
GET /api/todos?sort=random
```

Invalid requests should return an appropriate validation error.

---

# Postman Testing Guide

## Step 1: Create User One

```http
POST /api/auth/register
```

```json
{
  "name": "User One",
  "email": "user1@test.com",
  "password": "123456"
}
```

---

## Step 2: Create User Two

```http
POST /api/auth/register
```

```json
{
  "name": "User Two",
  "email": "user2@test.com",
  "password": "123456"
}
```

---

## Step 3: Login User One

```http
POST /api/auth/login
```

```json
{
  "email": "user1@test.com",
  "password": "123456"
}
```

Copy the returned JWT token.

Save it as:

```text
user1Token
```

---

## Step 4: Login User Two

```http
POST /api/auth/login
```

```json
{
  "email": "user2@test.com",
  "password": "123456"
}
```

Save the returned token as:

```text
user2Token
```

---

## Step 5: Get User Two ID

Use:

```http
GET /api/profile
```

Authorization:

```text
Bearer Token
{{user2Token}}
```

Copy the returned `_id`.

---

## Step 6: Create Test Todos

Login as User One and use:

```text
Authorization
↓
Bearer Token
↓
{{user1Token}}
```

Create multiple Todos with different:

- Titles
- Descriptions
- Statuses

Example:

```json
{
  "title": "Team Meeting",
  "description": "Discuss the new project",
  "status": "pending",
  "assignedTo": "USER_TWO_ID"
}
```

Create enough Todos to test pagination.

---

# Testing Checklist

## Authentication

- [ ] Register User One
- [ ] Register User Two
- [ ] Login User One
- [ ] Login User Two
- [ ] Get User Two ID

## Todo Creation

- [ ] Create pending Todo
- [ ] Create in-progress Todo
- [ ] Create completed Todo
- [ ] Assign Todo to another user
- [ ] Create Todo with searchable text in description

## Search

```http
GET /api/todos?search=meeting
```

- [ ] Search by title
- [ ] Search by description

## Status Filter

```http
GET /api/todos?status=pending
```

- [ ] Pending
- [ ] In Progress
- [ ] Completed

## Pagination

```http
GET /api/todos?page=1&limit=2
```

- [ ] Test page 1
- [ ] Test page 2
- [ ] Test different limit values

## Sorting

```http
GET /api/todos?sort=newest
```

- [ ] Newest
- [ ] Oldest

## Combined Filters

### Search + Status

```http
GET /api/todos?search=meeting&status=pending
```

### Search + Pagination

```http
GET /api/todos?search=meeting&page=1&limit=1
```

### All Filters

```http
GET /api/todos?search=meeting&status=pending&page=1&limit=10&sort=newest
```

- [ ] Search + Status
- [ ] Search + Pagination
- [ ] All filters together

## Validation

- [ ] Invalid status
- [ ] Invalid page = 0
- [ ] Invalid page = -1
- [ ] Invalid page = abc
- [ ] Invalid limit = 0
- [ ] Invalid limit = abc
- [ ] Limit greater than 100
- [ ] Invalid sort

## Permissions

- [ ] User can see Todos created by them
- [ ] User can see Todos assigned to them
- [ ] User cannot see unrelated users' Todos
- [ ] Admin can access all Todos

---

# Running Tests

If tests are configured:

```bash
npm test
```

---

# API Summary

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/profile` | Get logged-in user profile |
| POST | `/api/todos` | Create Todo |
| GET | `/api/todos` | Get Todos with search, filter, pagination and sorting |
| GET | `/api/todos/stats` | Get Todo statistics |
| GET | `/api/todos/:id` | Get Todo by ID |
| PUT | `/api/todos/:id` | Update Todo |
| PATCH | `/api/todos/:id` | Update Todo |
| PATCH | `/api/todos/:id/status` | Update Todo status |
| DELETE | `/api/todos/:id` | Delete Todo |
| GET | `/api/admin/users` | Get users for admin access |

---

# Query Parameters

| Parameter | Example | Description |
|---|---|---|
| `search` | `?search=meeting` | Search title and description |
| `status` | `?status=pending` | Filter by status |
| `page` | `?page=1` | Current page |
| `limit` | `?limit=10` | Results per page |
| `sort` | `?sort=newest` | Sort newest or oldest |

All parameters can be combined:

```http
GET /api/todos?search=meeting&status=pending&page=1&limit=10&sort=newest
```

---

# Author

Todo Management REST API project built with:

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Role-Based Authorization
- Todo Ownership
- Todo Assignment
- Search
- Filtering
- Pagination
- Sorting
