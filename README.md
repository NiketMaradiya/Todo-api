# Todo API

A RESTful Todo API built with **Node.js, Express, MongoDB, Mongoose and JWT Authentication**.

The API supports user authentication, role-based access, Todo CRUD operations, Todo assignment, status management, soft delete, pagination, searching, sorting, rate limiting, and file attachments.

Images are uploaded to **Cloudinary**, while documents are stored locally inside `public/uploads/`.

---

# Features

* User registration
* User login
* JWT authentication
* User logout
* User profile
* User and Admin roles
* Admin authorization
* Create Todo
* Read Todos
* Get Todo by ID
* Update Todo
* Update Todo status
* Delete Todo using soft delete
* Assign Todo to another user
* Todo ownership protection
* Admin Todo access
* Search Todos
* Filter Todos by status
* Pagination
* Sorting
* Todo statistics
* Rate limiting
* File attachment support
* Multer file upload
* Cloudinary image upload
* Local document storage
* File type validation
* Maximum file size validation
* Multipart/form-data support

---

# Technology Stack

| Technology | Purpose               |
| ---------- | --------------------- |
| Node.js    | Backend runtime       |
| Express.js | REST API framework    |
| MongoDB    | Database              |
| Mongoose   | MongoDB ODM           |
| JWT        | Authentication        |
| bcryptjs   | Password hashing      |
| Multer     | File upload handling  |
| Cloudinary | Image storage         |
| dotenv     | Environment variables |
| CORS       | Cross-origin requests |
| Jest       | Testing               |
| Supertest  | API testing           |
| Nodemon    | Development server    |

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
│   ├── adminController.js
│   ├── authController.js
│   └── todoController.js
│
├── middleware/
│   ├── adminMiddleware.js
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   ├── logger.js
│   └── uploadMiddleware.js
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
├── utils/
│   └── attachmentService.js
│
├── public/
│   └── uploads/
│
├── tests/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

---

# Requirements

Before running the project, install:

* Node.js
* npm
* MongoDB
* Cloudinary account
* Postman

---

# Installation

Clone or download the project.

Open the project folder:

```bash
cd todo-api
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

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Environment Variable Explanation

| Variable                | Description                               |
| ----------------------- | ----------------------------------------- |
| `PORT`                  | Server port                               |
| `MONGO_URI`             | MongoDB connection URL                    |
| `JWT_SECRET`            | Secret used to sign JWT tokens            |
| `JWT_EXPIRES_IN`        | JWT expiration time                       |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Product Environment cloud name |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                        |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                     |

Never commit `.env` to GitHub.

---

# Cloudinary Setup

The project uses Cloudinary for image attachments.

## Step 1: Create Account

Create a Cloudinary account and open the Cloudinary Dashboard.

## Step 2: Get Cloud Name

In the Cloudinary Dashboard, open the Product Environment section.

Copy:

```text
Cloud name
```

Example:

```text
dliotdri
```

Do not confuse:

```text
Cloud Name
```

with:

```text
Key Name
```

A Key Name is only the name of an API key.

## Step 3: Get API Key

Go to:

```text
Settings
→ API Keys
```

Copy the API Key.

## Step 4: Get API Secret

Use the API Secret belonging to the same API key.

Do not share the API Secret publicly.

## Step 5: Add Credentials

Add the values to `.env`.

Example:

```env
CLOUDINARY_CLOUD_NAME=dliotdri
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET
```

---

# Start the Server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The API will run at:

```text
http://localhost:5000
```

Health check:

```http
GET http://localhost:5000/
```

Expected response:

```json
{
  "success": true,
  "message": "Todo API is running"
}
```

---

# Authentication

All protected Todo APIs require a JWT token.

The token is returned after successful login.

Use the token in Postman:

```text
Authorization
→ Bearer Token
→ YOUR_JWT_TOKEN
```

---

# Authentication APIs

## Register

```http
POST /api/auth/register
```

Example:

```http
POST http://localhost:5000/api/auth/register
```

Body:

```json
{
  "name": "User One",
  "email": "user1@test.com",
  "password": "123456"
}
```

---

## Login

```http
POST /api/auth/login
```

Example:

```http
POST http://localhost:5000/api/auth/login
```

Body:

```json
{
  "email": "user1@test.com",
  "password": "123456"
}
```

Copy the JWT token from the response.

---

## Logout

```http
POST /api/auth/logout
```

Authorization:

```text
Bearer YOUR_JWT_TOKEN
```

---

## Profile

```http
GET /api/profile
```

Authorization:

```text
Bearer YOUR_JWT_TOKEN
```

---

# User Roles

The API supports two roles:

```text
user
admin
```

A normal user:

* Can access permitted Todos
* Can create Todos
* Can update their own created Todos
* Can update allowed Todo information
* Cannot access protected admin operations

An admin:

* Can access admin APIs
* Can access Todos according to admin permissions
* Can manage users
* Can update Todos according to admin rules

---

# Todo Model

A Todo contains:

```json
{
  "title": "Todo title",
  "description": "Todo description",
  "createdBy": "USER_ID",
  "assignedTo": "USER_ID",
  "attachmentUrl": "FILE_URL",
  "status": "pending",
  "isDeleted": false,
  "deletedAt": null
}
```

---

# Todo Status

Supported statuses:

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

---

# Todo APIs

All Todo APIs require authentication.

Base URL:

```text
http://localhost:5000/api/todos
```

---

## Create Todo

```http
POST /api/todos
```

Authorization:

```text
Bearer YOUR_JWT_TOKEN
```

The API supports:

```text
application/json
```

and:

```text
multipart/form-data
```

For an attachment, use:

```text
multipart/form-data
```

Example:

```text
title       = My Todo
description = My Todo description
assignedTo  = USER_ID
status      = pending
```

---

# Create Todo With Image

### Postman

Request:

```http
POST http://localhost:5000/api/todos
```

Authorization:

```text
Bearer YOUR_JWT_TOKEN
```

Body:

```text
form-data
```

| Key         | Type | Value                    |
| ----------- | ---- | ------------------------ |
| title       | Text | Cloudinary Test          |
| description | Text | Testing image attachment |
| assignedTo  | Text | USER_ID                  |
| status      | Text | pending                  |
| attachment  | File | attachment.jpg           |

The file field name must be exactly:

```text
attachment
```

Expected response:

```json
{
  "success": true,
  "message": "Todo created successfully",
  "data": {
    "_id": "TODO_ID",
    "title": "Cloudinary Test",
    "attachmentUrl": "https://res.cloudinary.com/...",
    "status": "pending"
  }
}
```

---

# File Attachment Flow

For images:

```text
Postman
   ↓
multipart/form-data
   ↓
Multer
   ↓
Cloudinary
   ↓
Cloudinary URL
   ↓
Todo.attachmentUrl
   ↓
MongoDB
```

For documents:

```text
Postman
   ↓
multipart/form-data
   ↓
Multer
   ↓
public/uploads/
   ↓
Local file URL
   ↓
Todo.attachmentUrl
   ↓
MongoDB
```

---

# Supported File Types

## Images

Supported:

```text
.jpg
.jpeg
.png
.webp
```

Images are uploaded to:

```text
Cloudinary
```

---

## Documents

Supported:

```text
.pdf
.doc
.docx
```

Documents are stored in:

```text
public/uploads/
```

---

# File Size Limit

Maximum attachment size:

```text
5 MB
```

Files larger than 5 MB are rejected.

Expected response:

```json
{
  "success": false,
  "message": "File too large. Maximum file size is 5 MB"
}
```

---

# Invalid File Type

Unsupported files are rejected.

Examples:

```text
.exe
.zip
.js
.html
.mp4
```

Expected response:

```json
{
  "success": false,
  "message": "Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, PDF, DOC and DOCX"
}
```

---

# File Field Name

The API accepts the uploaded file using:

```text
attachment
```

Correct:

```text
attachment → File → image.jpg
```

Incorrect:

```text
file → image.jpg
```

```text
image → image.jpg
```

```text
photo → image.jpg
```

Using the wrong field name results in a Multer error.

---

# Get All Todos

```http
GET /api/todos
```

Example:

```http
GET http://localhost:5000/api/todos
```

Authorization:

```text
Bearer YOUR_JWT_TOKEN
```

---

# Search Todos

Example:

```http
GET /api/todos?search=Node
```

Searches Todo title and description.

---

# Filter Todos By Status

Example:

```http
GET /api/todos?status=pending
```

Supported:

```text
pending
in-progress
completed
```

---

# Pagination

Example:

```http
GET /api/todos?page=1&limit=10
```

Parameters:

```text
page
limit
```

Example:

```text
page=1
limit=10
```

---

# Sorting

Newest first:

```http
GET /api/todos?sort=newest
```

Oldest first:

```http
GET /api/todos?sort=oldest
```

---

# Combined Filters

Example:

```http
GET /api/todos?search=Node&status=pending&page=1&limit=10&sort=newest
```

---

# Get Todo By ID

```http
GET /api/todos/:id
```

Example:

```http
GET http://localhost:5000/api/todos/TODO_ID
```

Authorization:

```text
Bearer YOUR_JWT_TOKEN
```

Example response:

```json
{
  "success": true,
  "data": {
    "_id": "TODO_ID",
    "title": "Cloudinary Test",
    "description": "Testing image attachment",
    "attachmentUrl": "https://res.cloudinary.com/..."
  }
}
```

---

# Update Todo

```http
PUT /api/todos/:id
```

or:

```http
PATCH /api/todos/:id
```

Example:

```http
PUT http://localhost:5000/api/todos/TODO_ID
```

Authorization:

```text
Bearer YOUR_JWT_TOKEN
```

---

# Update Todo With Image

Body:

```text
form-data
```

Example:

| Key        | Type | Value         |
| ---------- | ---- | ------------- |
| title      | Text | Updated Todo  |
| attachment | File | new-image.jpg |

The new image is uploaded to Cloudinary.

The Todo's `attachmentUrl` is updated with the new Cloudinary URL.

---

# Update Attachment Only

Example:

```http
PATCH http://localhost:5000/api/todos/TODO_ID
```

Body:

```text
form-data
```

```text
attachment → File → new-image.jpg
```

No other Todo fields are required.

---

# Update Todo Status

```http
PATCH /api/todos/:id/status
```

Example:

```http
PATCH http://localhost:5000/api/todos/TODO_ID/status
```

Body:

```json
{
  "status": "completed"
}
```

---

# Delete Todo

```http
DELETE /api/todos/:id
```

Authorization:

```text
Bearer YOUR_JWT_TOKEN
```

The Todo uses **soft delete**.

Instead of permanently removing the Todo, the API changes:

```json
{
  "isDeleted": true,
  "deletedAt": "DATE"
}
```

Deleted Todos are excluded from normal Todo queries.

---

# Todo Statistics

```http
GET /api/todos/stats
```

Example:

```http
GET http://localhost:5000/api/todos/stats
```

Returns Todo statistics such as:

```json
{
  "success": true,
  "data": {
    "total": 10,
    "pending": 3,
    "inProgress": 4,
    "completed": 3
  }
}
```

---

# Document Upload

PDF, DOC and DOCX files are stored inside:

```text
public/uploads/
```

Example:

```text
public/
└── uploads/
    └── 1750000000000-abcdef123456.pdf
```

The Todo stores:

```text
/uploads/1750000000000-abcdef123456.pdf
```

---

# Access Uploaded Documents

The server exposes:

```text
/uploads
```

Example:

```text
http://localhost:5000/uploads/example.pdf
```

If the Todo response contains:

```json
{
  "attachmentUrl": "/uploads/example.pdf"
}
```

open:

```text
http://localhost:5000/uploads/example.pdf
```

---

# Image URL

Cloudinary image URLs look similar to:

```text
https://res.cloudinary.com/dliotdri/image/upload/...
```

Copy the URL from:

```text
attachmentUrl
```

and open it in the browser.

---

# Admin APIs

Admin routes are protected by authentication and admin authorization.

Base URL:

```text
http://localhost:5000/api/admin
```

Example:

```http
GET /api/admin/users
```

Authorization:

```text
Bearer ADMIN_JWT_TOKEN
```

Only users with:

```text
role = admin
```

should access protected admin APIs.

---

# Rate Limiting

The API protects endpoints against excessive requests.

The configured limit is:

```text
20 requests / 1 minute / IP
```

When the limit is exceeded, the API returns a rate-limit error.

Example:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

---

# Error Handling

The API returns consistent JSON error responses.

Example:

```json
{
  "success": false,
  "message": "Todo not found"
}
```

Common errors include:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
413 Payload Too Large
429 Too Many Requests
500 Internal Server Error
```

---

# Common Attachment Errors

## Unexpected field

```json
{
  "success": false,
  "message": "Unexpected file field. Use the field name \"attachment\""
}
```

Check that Postman uses:

```text
attachment
```

as the file key.

---

## Invalid file type

```json
{
  "success": false,
  "message": "Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, PDF, DOC and DOCX"
}
```

Use only supported formats.

---

## File too large

```json
{
  "success": false,
  "message": "File too large. Maximum file size is 5 MB"
}
```

Use a file smaller than 5 MB.

---

# Postman Testing

## 1. Login

```http
POST http://localhost:5000/api/auth/login
```

Body:

```json
{
  "email": "user1@test.com",
  "password": "123456"
}
```

Copy the JWT token.

---

## 2. Create Todo With Image

```http
POST http://localhost:5000/api/todos
```

Authorization:

```text
Bearer YOUR_JWT_TOKEN
```

Body:

```text
form-data
```

```text
title        = Cloudinary Test
description  = Testing image attachment
assignedTo   = USER_ID
status       = pending
attachment   = image.jpg
```

Expected:

```text
201 Created
```

and:

```text
attachmentUrl = https://res.cloudinary.com/...
```

---

## 3. Get Todo

```http
GET http://localhost:5000/api/todos/TODO_ID
```

Check:

```text
attachmentUrl
```

---

## 4. Open Image

Copy:

```text
attachmentUrl
```

into the browser.

---

## 5. Update Todo

```http
PUT http://localhost:5000/api/todos/TODO_ID
```

Body:

```text
form-data
```

```text
title      = Updated Todo
attachment = new-image.jpg
```

---

## 6. Upload PDF

```http
POST http://localhost:5000/api/todos
```

Body:

```text
form-data
```

```text
title       = PDF Test
description = Testing PDF
assignedTo  = USER_ID
status      = pending
attachment  = test.pdf
```

Expected:

```text
attachmentUrl = /uploads/filename.pdf
```

---

## 7. Open PDF

Example:

```text
http://localhost:5000/uploads/filename.pdf
```

---

## 8. Test Invalid File

Try:

```text
test.exe
```

Expected:

```text
400 Bad Request
```

---

## 9. Test Large File

Use a file larger than:

```text
5 MB
```

Expected:

```text
413 Payload Too Large
```

---

# Complete Attachment Test Flow

```text
User
  ↓
JWT Authentication
  ↓
POST /api/todos
  ↓
multipart/form-data
  ↓
Multer
  ↓
Check file type
  ↓
Check file size
  ↓
 ┌───────────────────────┐
 │                       │
Image                  Document
 │                       │
 ↓                       ↓
Cloudinary          public/uploads
 │                       │
 ↓                       ↓
Cloudinary URL       Local URL
 │                       │
 └───────────┬───────────┘
             ↓
      attachmentUrl
             ↓
          MongoDB
             ↓
       GET Todo API
             ↓
       Access attachment
```

---

# Security Notes

Never commit:

```text
.env
```

Never publish:

```text
CLOUDINARY_API_SECRET
JWT_SECRET
```

Use `.env.example` for sharing configuration structure.

Example:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

# Git Ignore

The project should ignore:

```text
node_modules/
.env
public/uploads/*
```

while keeping:

```text
public/uploads/.gitkeep
```

---

# Development Commands

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Run production server:

```bash
npm start
```

Run tests:

```bash
npm test
```

---

# API Base URL

Local development:

```text
http://localhost:5000
```

API:

```text
http://localhost:5000/api
```

Todos:

```text
http://localhost:5000/api/todos
```

Authentication:

```text
http://localhost:5000/api/auth
```

Admin:

```text
http://localhost:5000/api/admin
```

---

# Summary

This Todo API provides:

```text
Authentication
     +
Authorization
     +
Todo Management
     +
User Assignment
     +
Search
     +
Filtering
     +
Pagination
     +
Sorting
     +
Statistics
     +
Soft Delete
     +
Rate Limiting
     +
Multer File Upload
     +
Cloudinary Image Storage
     +
Local Document Storage
```

The attachment system supports:

```text
JPG
JPEG
PNG
WEBP
PDF
DOC
DOCX
```

Maximum file size:

```text
5 MB
```

Images are stored in:

```text
Cloudinary
```

Documents are stored in:

```text
public/uploads/
```

The final file location is stored in:

```text
Todo.attachmentUrl
```

and returned by the Todo APIs.
