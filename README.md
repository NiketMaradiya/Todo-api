# Todo API

A RESTful Todo API built with Node.js, Express.js, MongoDB, and JWT authentication.

## Features

* User registration
* User login
* JWT authentication
* Protected routes
* Password hashing with bcrypt
* Get current user
* Change password
* Forgot password
* Password reset using reset token
* Compulsory password-change support
* Create Todo
* Get all Todos
* Get single Todo
* Update Todo
* Delete Todo
* User-specific Todos
* MongoDB integration
* Email support for password reset
* Environment variable configuration
* Nodemon development server

## Technologies

* Node.js
* Express.js
* MongoDB
* Mongoose
* JSON Web Token
* bcryptjs
* dotenv
* Nodemailer
* Nodemon

## Project Structure

```
todo-api/
│
├── controllers/
│   ├── authController.js
│   └── todoController.js
│
├── middleware/
│   └── authMiddleware.js
│
├── models/
│   ├── User.js
│   └── Todo.js
│
├── routes/
│   ├── authRoutes.js
│   └── todoRoutes.js
│
├── utils/
│   └── sendEmail.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

## Installation

### 1. Install Node.js

Make sure Node.js is installed.

Check the version:

```
node -v
```

Check npm:

```
npm -v
```

### 2. Install dependencies

Open the project folder in terminal:

```
cd todo-api
```

Install dependencies:

```
npm install
```

## Environment Variables

Create a `.env` file in the root folder.

Example:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/todo-api
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

CLIENT_URL=http://localhost:3000
```

Replace the values with your actual configuration.

Do not upload `.env` to GitHub.

## MongoDB

You can use local MongoDB or MongoDB Atlas.

### Local MongoDB

```
MONGO_URI=mongodb://127.0.0.1:27017/todo-api
```

### MongoDB Atlas

```
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/todo-api
```

Replace:

* `USERNAME`
* `PASSWORD`
* `CLUSTER`

with your actual MongoDB Atlas details.

## Start Server

### Development

```
npm run dev
```

Expected output:

```
[nodemon] starting `node server.js`
Server running on port 5000
MongoDB connected
```

### Production

```
npm start
```

## Base URL

```
http://localhost:5000
```

# Authentication

Authentication uses JWT.

After successful login, the API returns a token.

For protected routes, send the token using:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

# API Endpoints

## Authentication

| Method | Endpoint                        | Authentication |
| ------ | ------------------------------- | -------------- |
| POST   | /api/auth/register              | No             |
| POST   | /api/auth/login                 | No             |
| POST   | /api/auth/forgot-password       | No             |
| POST   | /api/auth/reset-password/:token | No             |
| POST   | /api/auth/change-password       | Yes            |
| GET    | /api/auth/me                    | Yes            |
| POST   | /api/auth/logout                | Yes            |

## Todos

| Method | Endpoint       | Authentication |
| ------ | -------------- | -------------- |
| POST   | /api/todos     | Yes            |
| GET    | /api/todos     | Yes            |
| GET    | /api/todos/:id | Yes            |
| PUT    | /api/todos/:id | Yes            |
| DELETE | /api/todos/:id | Yes            |

# Register User

### Request

```
POST /api/auth/register
```

### Body

```
{
  "name": "Niket",
  "email": "niket@example.com",
  "password": "Password@123"
}
```

### Example Response

```
{
  "message": "User registered successfully",
  "user": {
    "name": "Niket",
    "email": "niket@example.com"
  }
}
```

# Login

### Request

```
POST /api/auth/login
```

### Body

```
{
  "email": "niket@example.com",
  "password": "Password@123"
}
```

### Example Response

```
{
  "message": "Login successful",
  "token": "YOUR_JWT_TOKEN",
  "user": {
    "name": "Niket",
    "email": "niket@example.com"
  }
}
```

Copy the returned JWT token and use it for protected requests.

# Get Current User

### Request

```
GET /api/auth/me
```

### Header

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Example Response

```
{
  "user": {
    "name": "Niket",
    "email": "niket@example.com"
  }
}
```

# Change Password

A logged-in user can change their password.

### Request

```
POST /api/auth/change-password
```

### Header

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Body

```
{
  "currentPassword": "Password@123",
  "newPassword": "NewPassword@123"
}
```

### Example Response

```
{
  "message": "Password changed successfully"
}
```

# Forgot Password

If the user forgets their password, they can request a password reset.

### Request

```
POST /api/auth/forgot-password
```

### Body

```
{
  "email": "niket@example.com"
}
```

### Example Response

```
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

The reset email contains a password reset token.

# Password Reset Token

The password reset token is generated when the user requests a password reset.

The token is normally sent through the reset email.

Example reset URL:

```
http://localhost:3000/reset-password/RESET_TOKEN
```

The exact URL depends on your frontend configuration.

The reset token should be treated as secret information.

# Reset Password

Use the reset token received through the email.

### Request

```
POST /api/auth/reset-password/:token
```

Example:

```
POST /api/auth/reset-password/RESET_TOKEN
```

### Body

```
{
  "password": "NewPassword@123"
}
```

### Example Response

```
{
  "message": "Password reset successful"
}
```

After successfully resetting the password, login using the new password.

# Compulsory Password Change

The API supports a compulsory password-change flow.

This can be used when a user's password must be changed before they can continue using protected functionality.

Example login response:

```
{
  "message": "Password change required",
  "mustChangePassword": true,
  "token": "YOUR_JWT_TOKEN"
}
```

The frontend should redirect the user to the change-password page.

Then call:

```
POST /api/auth/change-password
```

with:

```
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123"
}
```

After successfully changing the password, the backend should clear the compulsory password-change flag.

# Logout

### Request

```
POST /api/auth/logout
```

### Header

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Example Response

```
{
  "message": "Logout successful"
}
```

For normal stateless JWT authentication, the client should remove the stored JWT token after logout.

# Todo API

## Create Todo

### Request

```
POST /api/todos
```

### Header

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Body

```
{
  "title": "Learn Node.js",
  "description": "Complete Node.js API project",
  "completed": false
}
```

### Example Response

```
{
  "message": "Todo created successfully",
  "todo": {
    "_id": "TODO_ID",
    "title": "Learn Node.js",
    "description": "Complete Node.js API project",
    "completed": false
  }
}
```

# Get All Todos

### Request

```
GET /api/todos
```

### Header

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Example Response

```
{
  "todos": [
    {
      "_id": "TODO_ID",
      "title": "Learn Node.js",
      "description": "Complete Node.js API project",
      "completed": false
    }
  ]
}
```

Only the authenticated user's Todos should be returned.

# Get Single Todo

### Request

```
GET /api/todos/:id
```

Example:

```
GET /api/todos/TODO_ID
```

### Header

```
Authorization: Bearer YOUR_JWT_TOKEN
```

# Update Todo

### Request

```
PUT /api/todos/:id
```

Example:

```
PUT /api/todos/TODO_ID
```

### Header

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Body

```
{
  "title": "Learn Express.js",
  "description": "Complete Express.js API",
  "completed": true
}
```

### Example Response

```
{
  "message": "Todo updated successfully",
  "todo": {
    "_id": "TODO_ID",
    "title": "Learn Express.js",
    "description": "Complete Express.js API",
    "completed": true
  }
}
```

# Delete Todo

### Request

```
DELETE /api/todos/:id
```

Example:

```
DELETE /api/todos/TODO_ID
```

### Header

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Example Response

```
{
  "message": "Todo deleted successfully"
}
```

# Postman Testing

Use Postman to test all API endpoints.

## Test 1 - Register

Method:

```
POST
```

URL:

```
http://localhost:5000/api/auth/register
```

Body:

```
{
  "name": "Niket",
  "email": "niket@example.com",
  "password": "Password@123"
}
```

Expected result:

```
201 Created
```

## Test 2 - Login

Method:

```
POST
```

URL:

```
http://localhost:5000/api/auth/login
```

Body:

```
{
  "email": "niket@example.com",
  "password": "Password@123"
}
```

Copy the returned token.

## Test 3 - Get Current User

Method:

```
GET
```

URL:

```
http://localhost:5000/api/auth/me
```

Header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Expected result:

```
200 OK
```

## Test 4 - Create Todo

Method:

```
POST
```

URL:

```
http://localhost:5000/api/todos
```

Headers:

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

Body:

```
{
  "title": "My First Todo",
  "description": "Test Todo API",
  "completed": false
}
```

Expected result:

```
201 Created
```

## Test 5 - Get All Todos

Method:

```
GET
```

URL:

```
http://localhost:5000/api/todos
```

Header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Expected result:

```
200 OK
```

## Test 6 - Get Single Todo

Copy the Todo `_id` from the previous response.

Method:

```
GET
```

URL:

```
http://localhost:5000/api/todos/TODO_ID
```

Header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Test 7 - Update Todo

Method:

```
PUT
```

URL:

```
http://localhost:5000/api/todos/TODO_ID
```

Headers:

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

Body:

```
{
  "title": "Updated Todo",
  "description": "Updated description",
  "completed": true
}
```

## Test 8 - Delete Todo

Method:

```
DELETE
```

URL:

```
http://localhost:5000/api/todos/TODO_ID
```

Header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Expected result:

```
200 OK
```

# Password Testing

## Test 9 - Wrong Password

Try logging in with an incorrect password.

```
{
  "email": "niket@example.com",
  "password": "WrongPassword@123"
}
```

Expected result:

```
401 Unauthorized
```

## Test 10 - Forgot Password

Method:

```
POST
```

URL:

```
http://localhost:5000/api/auth/forgot-password
```

Body:

```
{
  "email": "niket@example.com"
}
```

Check the configured email inbox for the reset email.

## Test 11 - Reset Password

Get the reset token from the reset email.

Method:

```
POST
```

URL:

```
http://localhost:5000/api/auth/reset-password/RESET_TOKEN
```

Body:

```
{
  "password": "NewPassword@123"
}
```

Then login using:

```
{
  "email": "niket@example.com",
  "password": "NewPassword@123"
}
```

## Test 12 - Change Password

Login and copy the JWT token.

Method:

```
POST
```

URL:

```
http://localhost:5000/api/auth/change-password
```

Header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Body:

```
{
  "currentPassword": "NewPassword@123",
  "newPassword": "AnotherPassword@123"
}
```

Then login again using the new password.

## Test 13 - Old Password Must Fail

After changing the password, try the old password:

```
{
  "email": "niket@example.com",
  "password": "NewPassword@123"
}
```

The old password should no longer work.

Use the latest password:

```
{
  "email": "niket@example.com",
  "password": "AnotherPassword@123"
}
```

# Authorization Testing

## Test 14 - Request Without Token

Try:

```
GET /api/todos
```

without the Authorization header.

Expected result:

```
401 Unauthorized
```

## Test 15 - Invalid Token

Try:

```
Authorization: Bearer invalid-token
```

Expected result:

```
401 Unauthorized
```

## Test 16 - User Cannot Access Another User's Todo

Create a Todo with User A.

Login as User B.

Try to access User A's Todo ID.

The API should reject the request.

Expected result:

```
403 Forbidden
```

or:

```
404 Not Found
```

depending on the implementation.

# Error Handling

Typical HTTP status codes:

| Status | Meaning               |
| ------ | --------------------- |
| 200    | Success               |
| 201    | Created               |
| 400    | Bad Request           |
| 401    | Unauthorized          |
| 403    | Forbidden             |
| 404    | Not Found             |
| 500    | Internal Server Error |

Example:

```
{
  "message": "Invalid credentials"
}
```

# Security

The API uses:

* bcrypt password hashing
* JWT authentication
* Protected routes
* User-specific Todo access
* Password reset tokens
* Password reset token expiration
* Environment variables
* Authentication middleware

Passwords should never be stored as plain text.

Sensitive values such as JWT secrets, database credentials, and email credentials must be stored in `.env`.

# .gitignore

The `.gitignore` file should contain:

```
node_modules/
.env
```

Never commit `.env` to GitHub.

# NPM Scripts

The `package.json` should contain scripts similar to:

```
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

Run development server:

```
npm run dev
```

Run production server:

```
npm start
```

# Common Problems

## MongoDB Connection Error

Check the `MONGO_URI` value in `.env`.

Example:

```
MONGO_URI=mongodb://127.0.0.1:27017/todo-api
```

Make sure MongoDB is running.

For MongoDB Atlas, make sure:

* Cluster is running
* Username is correct
* Password is correct
* IP address is allowed
* Database connection string is correct

## JWT Error

Check:

```
JWT_SECRET=your_super_secret_jwt_key
```

Restart the server after changing `.env`.

## Email Not Sending

Check:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

For Gmail, use an App Password when required by the account configuration.

## Nodemon Not Found

Run:

```
npm install
```

Or install Nodemon:

```
npm install --save-dev nodemon
```

Then run:

```
npm run dev
```

# Git Commands

Initialize Git:

```
git init
```

Add files:

```
git add .
```

Commit:

```
git commit -m "Initial Todo API"
```

Add GitHub remote:

```
git remote add origin <your-github-repository-url>
```

Rename branch:

```
git branch -M main
```

Push:

```
git push -u origin main
```

# API Summary

## Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password/:token
POST /api/auth/change-password
GET  /api/auth/me
POST /api/auth/logout
```

## Todos

```
POST   /api/todos
GET    /api/todos
GET    /api/todos/:id
PUT    /api/todos/:id
DELETE /api/todos/:id
```

# Project Status

The Todo API includes:

* User registration
* User login
* JWT authentication
* Protected routes
* Password hashing
* Change password
* Forgot password
* Password reset
* Password reset token
* Compulsory password-change support
* Todo creation
* Todo listing
* Todo details
* Todo update
* Todo deletion
* User-specific Todo access
* MongoDB integration
* Email password reset support


# License

This project is for learning and development purposes.
