# Todo API

A RESTful Todo API built with **Node.js, Express.js, and MongoDB**.

The API supports creating, reading, updating, deleting, searching, filtering, sorting, pagination, statistics, validation, error handling, and automated testing.

---

## Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* dotenv
* CORS
* Helmet
* Morgan
* Jest
* Supertest
* Nodemon

---

# Features

* Create Todo
* Get all Todos
* Get Todo by ID
* Update Todo
* Toggle Todo completion
* Delete Todo
* Search Todos
* Filter by completed status
* Sort Todos
* Pagination
* Todo statistics
* Request logging
* Security headers
* CORS support
* Error handling
* Input validation
* Health check
* Automated API tests

---

# Project Structure

```text
todo-api/
│
├── .env
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── server.js
│
├── config/
│   └── db.js
│
├── controllers/
│   └── todoController.js
│
├── middleware/
│   ├── errorMiddleware.js
│   └── logger.js
│
├── models/
│   └── Todo.js
│
├── routes/
│   └── todoRoutes.js
│
└── tests/
    └── todo.test.js
```

---

# Requirements

Before running the project, install:

* Node.js
* MongoDB Community Server
* npm

Check Node.js:

```bash
node --version
```

Check npm:

```bash
npm --version
```

MongoDB should be running locally.

The application uses:

```text
mongodb://127.0.0.1:27017/todoDB
```

---

# Installation

## 1. Clone or download the project

Open the project directory:

```bash
cd todo-api
```

---

## 2. Install dependencies

```bash
npm install
```

---

# Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/todoDB

NODE_ENV=development
```

---

# Start MongoDB

Make sure MongoDB is running before starting the API.

On Windows, if MongoDB is installed as a service:

```powershell
Start-Service MongoDB
```

Check the service:

```powershell
sc.exe query MongoDB
```

The expected state is:

```text
STATE : 4 RUNNING
```

---

# Run the API

## Development Mode

```bash
npm run dev
```

Expected:

```text
🚀 Server running on http://localhost:5000
✅ MongoDB Connected Successfully
```

---

## Production Mode

```bash
npm start
```

---

# Base URL

```text
http://localhost:5000
```

---

# Health Check

## GET `/health`

Checks whether the API server and MongoDB connection are available.

### Request

```http
GET http://localhost:5000/health
```

### Response

```json
{
  "success": true,
  "server": "running",
  "database": "connected",
  "timestamp": "2026-08-11T05:30:00.000Z"
}
```

---

# API Information

## GET `/`

Returns basic API information.

### Request

```http
GET http://localhost:5000/
```

### Response

```json
{
  "success": true,
  "message": "Todo API is Running 🚀",
  "version": "1.0.0",
  "endpoints": {
    "todos": "/api/todos",
    "health": "/health"
  }
}
```

---

# Todo API

All Todo endpoints use:

```text
/api/todos
```

---

# 1. Create Todo

## POST `/api/todos`

Creates a new Todo.

### Request

```http
POST http://localhost:5000/api/todos
```

### Body

```json
{
  "title": "Learn Node.js"
}
```

### Optional `completed`

```json
{
  "title": "Learn Node.js",
  "completed": true
}
```

### Success Response

Status:

```text
201 Created
```

```json
{
  "success": true,
  "message": "Todo created successfully",
  "data": {
    "_id": "6a7ab2a1b6fe10b22271597f",
    "title": "Learn Node.js",
    "completed": false,
    "createdAt": "2026-08-11T05:26:57.751Z",
    "updatedAt": "2026-08-11T05:26:57.751Z"
  }
}
```

---

# 2. Get All Todos

## GET `/api/todos`

Returns all Todos.

### Request

```http
GET http://localhost:5000/api/todos
```

### Response

```json
{
  "success": true,
  "message": "Todos fetched successfully",
  "data": [
    {
      "_id": "6a7ab2a1b6fe10b22271597f",
      "title": "Learn Node.js",
      "completed": false,
      "createdAt": "2026-08-11T05:26:57.751Z",
      "updatedAt": "2026-08-11T05:26:57.751Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "limit": 10,
    "totalTodos": 1,
    "totalPages": 1
  }
}
```

---

# 3. Get Todo by ID

## GET `/api/todos/:id`

Returns one Todo.

### Request

```http
GET http://localhost:5000/api/todos/6a7ab2a1b6fe10b22271597f
```

### Success Response

```json
{
  "success": true,
  "message": "Todo fetched successfully",
  "data": {
    "_id": "6a7ab2a1b6fe10b22271597f",
    "title": "Learn Node.js",
    "completed": false,
    "createdAt": "2026-08-11T05:26:57.751Z",
    "updatedAt": "2026-08-11T05:26:57.751Z"
  }
}
```

---

# 4. Update Todo

## PUT `/api/todos/:id`

Updates a Todo.

### Request

```http
PUT http://localhost:5000/api/todos/6a7ab2a1b6fe10b22271597f
```

### Update Title

```json
{
  "title": "Learn Advanced Node.js"
}
```

### Update Completed

```json
{
  "completed": true
}
```

### Update Both

```json
{
  "title": "Learn Advanced Node.js",
  "completed": true
}
```

### Success Response

```json
{
  "success": true,
  "message": "Todo updated successfully",
  "data": {
    "_id": "6a7ab2a1b6fe10b22271597f",
    "title": "Learn Advanced Node.js",
    "completed": true
  }
}
```

---

# 5. Toggle Todo

## PATCH `/api/todos/:id/toggle`

Changes:

```text
false → true
```

or:

```text
true → false
```

### Request

```http
PATCH http://localhost:5000/api/todos/6a7ab2a1b6fe10b22271597f/toggle
```

### Response

```json
{
  "success": true,
  "message": "Todo status toggled successfully",
  "data": {
    "_id": "6a7ab2a1b6fe10b22271597f",
    "title": "Learn Node.js",
    "completed": true
  }
}
```

---

# 6. Delete Todo

## DELETE `/api/todos/:id`

Deletes a Todo.

### Request

```http
DELETE http://localhost:5000/api/todos/6a7ab2a1b6fe10b22271597f
```

### Response

```json
{
  "success": true,
  "message": "Todo deleted successfully",
  "data": {
    "_id": "6a7ab2a1b6fe10b22271597f"
  }
}
```

---

# Search Todos

Use the `search` query parameter.

## Example

```http
GET /api/todos?search=Node
```

Full URL:

```text
http://localhost:5000/api/todos?search=Node
```

This searches Todo titles.

---

# Filter Todos

## Completed Todos

```http
GET /api/todos?completed=true
```

## Pending Todos

```http
GET /api/todos?completed=false
```

---

# Pagination

Use:

```text
page
limit
```

### Example

```http
GET /api/todos?page=1&limit=10
```

Parameters:

| Parameter | Description              |
| --------- | ------------------------ |
| page      | Page number              |
| limit     | Number of Todos per page |

Maximum limit:

```text
100
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

# Combined Query

Multiple query parameters can be used together.

Example:

```http
GET /api/todos?search=Node&completed=false&page=1&limit=10&sort=newest
```

---

# Todo Statistics

## GET `/api/todos/stats`

Returns Todo statistics.

### Request

```http
GET http://localhost:5000/api/todos/stats
```

### Response

```json
{
  "success": true,
  "message": "Todo statistics fetched successfully",
  "data": {
    "total": 10,
    "completed": 6,
    "pending": 4,
    "completionPercentage": 60
  }
}
```

---

# Error Handling

The API uses a consistent error response.

Example:

```json
{
  "success": false,
  "message": "Todo not found"
}
```

---

# Invalid Todo ID

Example:

```http
GET /api/todos/123
```

Response:

```json
{
  "success": false,
  "message": "Invalid Todo ID"
}
```

Status:

```text
400 Bad Request
```

---

# Todo Not Found

Response:

```json
{
  "success": false,
  "message": "Todo not found"
}
```

Status:

```text
404 Not Found
```

---

# Validation Errors

## Empty Title

```json
{
  "title": ""
}
```

Response:

```json
{
  "success": false,
  "message": "Title cannot be empty"
}
```

---

## Invalid Title Type

```json
{
  "title": 123
}
```

Response:

```json
{
  "success": false,
  "message": "Title must be a string"
}
```

---

## Invalid Completed Value

```json
{
  "title": "Test",
  "completed": "true"
}
```

Response:

```json
{
  "success": false,
  "message": "Completed must be true or false"
}
```

---

# HTTP Status Codes

| Status | Meaning               |
| ------ | --------------------- |
| 200    | Success               |
| 201    | Created               |
| 400    | Bad Request           |
| 404    | Not Found             |
| 500    | Internal Server Error |
| 503    | Service Unavailable   |

---

# Testing

The project uses:

* Jest
* Supertest

Tests are located in:

```text
tests/todo.test.js
```

---

# Run Tests

Run all tests:

```bash
npm test
```

Expected result:

```text
PASS tests/todo.test.js

Test Suites: 1 passed
Tests:       32 passed
```

The tests cover:

* Health check
* Create Todo
* Get Todos
* Get Todo by ID
* Update Todo
* Toggle Todo
* Delete Todo
* Search
* Filtering
* Pagination
* Sorting
* Statistics
* Validation
* Invalid IDs
* Not-found errors
* Unknown routes

---

# Development Commands

## Start development server

```bash
npm run dev
```

## Start production server

```bash
npm start
```

## Run tests

```bash
npm test
```

---

# Security

The API uses Helmet for security-related HTTP headers.

```javascript
app.use(helmet());
```

CORS is enabled for API access.

Request body size is limited to:

```text
10kb
```

---

# Local Database

The project uses MongoDB locally.

Database:

```text
todoDB
```

Connection:

```text
mongodb://127.0.0.1:27017/todoDB
```

---

# API Endpoint Summary

| Method | Endpoint                | Purpose         |
| ------ | ----------------------- | --------------- |
| GET    | `/`                     | API information |
| GET    | `/health`               | Health check    |
| POST   | `/api/todos`            | Create Todo     |
| GET    | `/api/todos`            | Get Todos       |
| GET    | `/api/todos/:id`        | Get Todo        |
| PUT    | `/api/todos/:id`        | Update Todo     |
| PATCH  | `/api/todos/:id/toggle` | Toggle Todo     |
| DELETE | `/api/todos/:id`        | Delete Todo     |
| GET    | `/api/todos/stats`      | Todo statistics |

---

# Example Workflow

## 1. Start MongoDB

```powershell
Start-Service MongoDB
```

## 2. Start API

```bash
npm run dev
```

## 3. Create Todo

```http
POST /api/todos
```

```json
{
  "title": "Learn Express"
}
```

## 4. Get Todos

```http
GET /api/todos
```

## 5. Update Todo

```http
PUT /api/todos/:id
```

```json
{
  "completed": true
}
```

## 6. Toggle Todo

```http
PATCH /api/todos/:id/toggle
```

## 7. Delete Todo

```http
DELETE /api/todos/:id
```

---

# Project Status

The Todo API currently includes:

* REST API
* Local MongoDB
* CRUD operations
* Validation
* Error handling
* Search
* Filtering
* Sorting
* Pagination
* Statistics
* Security middleware
* Request logging
* Health monitoring
* Automated tests
* API documentation

---

# License

ISC

```
```
