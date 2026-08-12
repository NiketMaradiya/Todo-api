# Todo API with JWT Authentication

A secure RESTful Todo API built with Node.js, Express.js, MongoDB, Mongoose, JWT, and bcryptjs.

The API provides user authentication and authorization using JWT. Each authenticated user can create, read, update, and delete only their own todos.

---

## Features

### Authentication

- User registration
- User login
- JWT access token
- Password hashing with bcryptjs
- Protected profile route
- Logout endpoint
- Invalid token handling
- Missing token handling

### Todo Management

- Create todo
- Get all user todos
- Get todo by ID
- Update todo
- Update todo status
- Delete todo
- Search todos
- Filter todos by status
- Sort todos
- Pagination
- Todo statistics

### Security

- Passwords are never stored as plain text
- Passwords are hashed using bcryptjs
- JWT authentication for protected routes
- User-specific todo ownership
- Rate limiting
- Helmet security middleware
- CORS support
- Global error handling

### Testing

- Authentication tests
- JWT tests
- Protected route tests
- Todo API tests
- Jest
- Supertest

---

# Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token
- bcryptjs
- Jest
- Supertest
- Nodemon
- Helmet
- CORS
- Morgan
- express-rate-limit

---

# Project Structure

~~~text
todo-api/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   └── todoController.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   └── logger.js
│
├── models/
│   ├── User.js
│   └── Todo.js
│
├── routes/
│   ├── authRoutes.js
│   └── todoRoutes.js
│
├── tests/
│   ├── auth.test.js
│   └── todo.test.js
│
├── .env
├── .gitignore
├── package.json
├── server.js
└── README.md
~~~

---

# Installation

## 1. Clone the Repository

~~~bash
git clone YOUR_REPOSITORY_URL
~~~

## 2. Open the Project Folder

~~~bash
cd todo-api
~~~

## 3. Install Dependencies

~~~bash
npm install
~~~

---

# Environment Variables

Create a `.env` file in the root folder.

~~~env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/todoDB

NODE_ENV=development

JWT_SECRET=your_super_secret_jwt_key

JWT_EXPIRES_IN=7d
~~~

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port |
| `MONGO_URI` | MongoDB connection URL |
| `NODE_ENV` | Application environment |
| `JWT_SECRET` | Secret key used to generate JWT tokens |
| `JWT_EXPIRES_IN` | JWT token expiration time |

> Do not upload your `.env` file to GitHub.

---

# Run the Application

## Development Mode

~~~bash
npm run dev
~~~

The server will run on:

~~~text
http://localhost:5000
~~~

## Production Mode

~~~bash
npm start
~~~

---

# Run Tests

~~~bash
npm test
~~~

Example result:

~~~text
PASS tests/auth.test.js
PASS tests/todo.test.js

Test Suites: 2 passed, 2 total
Tests: All tests passed
~~~

---

# API Base URL

~~~text
http://localhost:5000/api
~~~

---

# Authentication Flow

~~~text
Register
   │
   ▼
Password Hashing
   │
   ▼
User Saved in MongoDB
   │
   ▼
Login
   │
   ▼
Password Verification
   │
   ▼
JWT Token Generated
   │
   ▼
Protected Routes
~~~

---

# API Endpoints

## Authentication

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and receive JWT token | No |
| POST | `/api/auth/logout` | Logout user | No |
| GET | `/api/profile` | Get authenticated user profile | Yes |

## Todos

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| POST | `/api/todos` | Create a todo | Yes |
| GET | `/api/todos` | Get all user todos | Yes |
| GET | `/api/todos/stats` | Get todo statistics | Yes |
| GET | `/api/todos/:id` | Get todo by ID | Yes |
| PUT | `/api/todos/:id` | Update todo | Yes |
| PATCH | `/api/todos/:id/status` | Update todo status | Yes |
| DELETE | `/api/todos/:id` | Delete todo | Yes |

---

# Authentication

## Register User

### Endpoint

~~~http
POST /api/auth/register
~~~

### Request Body

~~~json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
~~~

### Success Response

**Status: `201 Created`**

~~~json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "USER_ID",
    "name": "Test User",
    "email": "test@example.com"
  }
}
~~~

### Validation

- Name is required
- Email is required
- Email must be unique
- Password is required
- Password must contain at least 6 characters

---

## Login User

### Endpoint

~~~http
POST /api/auth/login
~~~

### Request Body

~~~json
{
  "email": "test@example.com",
  "password": "password123"
}
~~~

### Success Response

**Status: `200 OK`**

~~~json
{
  "success": true,
  "message": "Login successful",
  "token": "YOUR_JWT_TOKEN",
  "data": {
    "_id": "USER_ID",
    "name": "Test User",
    "email": "test@example.com"
  }
}
~~~

Copy the JWT token and use it in protected routes.

---

## JWT Authorization

Send the token in the request header:

~~~text
Authorization: Bearer YOUR_JWT_TOKEN
~~~

Example:

~~~text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
~~~

---

## Get User Profile

### Endpoint

~~~http
GET /api/profile
~~~

### Required Header

~~~text
Authorization: Bearer YOUR_JWT_TOKEN
~~~

### Success Response

**Status: `200 OK`**

~~~json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "_id": "USER_ID",
    "name": "Test User",
    "email": "test@example.com"
  }
}
~~~

---

## Logout

### Endpoint

~~~http
POST /api/auth/logout
~~~

### Response

~~~json
{
  "success": true,
  "message": "Logout successful. Please remove the token from the client."
}
~~~

> JWT is stateless. Logout removes the token from the client side.

---

# Authentication Errors

## No Token

**Status: `401 Unauthorized`**

~~~json
{
  "success": false,
  "message": "Not authorized. Token is required"
}
~~~

## Invalid Token

**Status: `401 Unauthorized`**

~~~json
{
  "success": false,
  "message": "Invalid or expired token"
}
~~~

---

# Todo API

All Todo API routes require JWT authentication.

Required header:

~~~text
Authorization: Bearer YOUR_JWT_TOKEN
~~~

---

## Create Todo

### Endpoint

~~~http
POST /api/todos
~~~

### Request Body

~~~json
{
  "title": "Learn JWT Authentication",
  "status": "todo"
}
~~~

### Success Response

**Status: `201 Created`**

~~~json
{
  "success": true,
  "message": "Todo created successfully",
  "data": {
    "_id": "TODO_ID",
    "title": "Learn JWT Authentication",
    "status": "todo",
    "user": "USER_ID"
  }
}
~~~

The user ID is automatically taken from the JWT token.

---

## Todo Status

The API supports these status values:

~~~text
todo
inprogress
complate
~~~

> Note: The current project uses `complate` as the completed status value.

---

## Get All Todos

### Endpoint

~~~http
GET /api/todos
~~~

The API returns only todos belonging to the authenticated user.

### Example Response

~~~json
{
  "success": true,
  "message": "Todos fetched successfully",
  "pagination": {
    "currentPage": 1,
    "limit": 10,
    "totalTodos": 2,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "filters": {
    "search": "",
    "status": null,
    "sort": "newest"
  },
  "count": 2,
  "data": []
}
~~~

---

## Search Todos

~~~http
GET /api/todos?search=JWT
~~~

The search is case-insensitive.

---

## Filter Todos

~~~http
GET /api/todos?status=todo
~~~

Available values:

~~~text
todo
inprogress
complate
~~~

---

## Pagination

~~~http
GET /api/todos?page=1&limit=10
~~~

| Parameter | Description |
|---|---|
| `page` | Current page number |
| `limit` | Number of todos per page |

---

## Sorting

### Newest First

~~~http
GET /api/todos?sort=newest
~~~

### Oldest First

~~~http
GET /api/todos?sort=oldest
~~~

---

## Combined Query Example

~~~http
GET /api/todos?search=Node&status=inprogress&page=1&limit=10&sort=newest
~~~

---

## Get Todo by ID

### Endpoint

~~~http
GET /api/todos/:id
~~~

Users can access only their own todos.

---

## Update Todo

### Endpoint

~~~http
PUT /api/todos/:id
~~~

### Request Body

~~~json
{
  "title": "Build Secure Todo API",
  "status": "inprogress"
}
~~~

---

## Update Todo Status

### Endpoint

~~~http
PATCH /api/todos/:id/status
~~~

### Request Body

~~~json
{
  "status": "complate"
}
~~~

---

## Todo Statistics

### Endpoint

~~~http
GET /api/todos/stats
~~~

### Example Response

~~~json
{
  "success": true,
  "message": "Todo statistics fetched successfully",
  "data": {
    "total": 10,
    "todo": 3,
    "inprogress": 4,
    "complate": 3,
    "completionPercentage": 30
  }
}
~~~

---

## Delete Todo

### Endpoint

~~~http
DELETE /api/todos/:id
~~~

### Success Response

~~~json
{
  "success": true,
  "message": "Todo deleted successfully"
}
~~~

---

# Todo Ownership

Every todo belongs to the authenticated user.

~~~text
JWT Token
    │
    ▼
Authentication Middleware
    │
    ▼
req.user
    │
    ▼
req.user._id
    │
    ▼
Todo User ID
~~~

This ensures that users can only:

- Create their own todos
- Read their own todos
- Update their own todos
- Delete their own todos
- View statistics for their own todos

---

# Password Security

Passwords are never stored as plain text.

~~~text
User Password
      │
      ▼
bcrypt Hashing
      │
      ▼
Hashed Password
      │
      ▼
MongoDB
~~~

During login:

~~~text
Entered Password
      │
      ▼
bcrypt.compare()
      │
      ▼
Compare with Stored Hash
      │
      ▼
Login Success or Failure
~~~

---

# JWT Protection

The authentication middleware:

1. Reads the `Authorization` header
2. Extracts the Bearer token
3. Verifies the JWT token
4. Finds the authenticated user
5. Adds the user to `req.user`
6. Allows access to the protected route

Protected routes:

~~~text
GET    /api/profile

POST   /api/todos
GET    /api/todos
GET    /api/todos/stats
GET    /api/todos/:id
PUT    /api/todos/:id
PATCH  /api/todos/:id/status
DELETE /api/todos/:id
~~~

---

# Rate Limiting

The API allows:

~~~text
20 requests per IP
within 1 minute
~~~

If the limit is exceeded:

~~~json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
~~~

---

# Testing

Run all tests:

~~~bash
npm test
~~~

## Authentication Test Cases

The authentication tests verify:

- User registration returns `201`
- Login returns a JWT token
- Profile without token returns `401`
- Profile with invalid token returns `401`
- Profile with valid token returns `200`

## Complete API Test Flow

~~~text
Register User
      │
      ▼
Login User
      │
      ▼
Receive JWT Token
      │
      ▼
Create Todo
      │
      ▼
Get Todos
      │
      ▼
Get Todo by ID
      │
      ▼
Update Todo
      │
      ▼
Update Todo Status
      │
      ▼
Get Todo Statistics
      │
      ▼
Delete Todo
~~~

---

# Common Errors

## MongoDB Connection Error

Check your MongoDB connection string:

~~~env
MONGO_URI=mongodb://127.0.0.1:27017/todoDB
~~~

Make sure MongoDB is running.

---

## Missing Token

~~~json
{
  "success": false,
  "message": "Not authorized. Token is required"
}
~~~

Solution:

~~~text
Authorization: Bearer YOUR_JWT_TOKEN
~~~

---

## Invalid or Expired Token

~~~json
{
  "success": false,
  "message": "Invalid or expired token"
}
~~~

Solution: Login again and use a new JWT token.

---

## Invalid Todo ID

~~~json
{
  "success": false,
  "message": "Invalid Todo ID"
}
~~~

Make sure the ID is a valid MongoDB ObjectId.

---

## Todo Not Found

~~~json
{
  "success": false,
  "message": "Todo not found"
}
~~~

Possible reasons:

- The Todo does not exist
- The Todo belongs to another user

---

## User Already Exists

~~~json
{
  "success": false,
  "message": "User already exists with this email"
}
~~~

Use a different email address.

---

# Complete API Flow

~~~text
1. Register User
   POST /api/auth/register

          │
          ▼

2. Login User
   POST /api/auth/login

          │
          ▼

3. Receive JWT Token

          │
          ▼

4. Add Authorization Header
   Authorization: Bearer YOUR_JWT_TOKEN

          │
          ▼

5. Get Profile
   GET /api/profile

          │
          ▼

6. Create Todo
   POST /api/todos

          │
          ▼

7. Get Todos
   GET /api/todos

          │
          ▼

8. Update Todo
   PUT /api/todos/:id

          │
          ▼

9. Update Todo Status
   PATCH /api/todos/:id/status

          │
          ▼

10. Get Statistics
    GET /api/todos/stats

          │
          ▼

11. Delete Todo
    DELETE /api/todos/:id

          │
          ▼

12. Logout
    POST /api/auth/logout
~~~

---

# License

This project is licensed under the ISC License.

---

# Author

Built with:

**Node.js · Express.js · MongoDB · Mongoose · JWT · bcryptjs · Jest · Supertest**