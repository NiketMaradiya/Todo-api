# 🚀 Todo API – Advanced Task Management System

A complete and advanced **RESTful Todo API** built with **Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Nodemailer, Cloudinary, Multer, Jest, and Supertest**.

The project supports:

* User registration and login
* Temporary-password onboarding
* Mandatory first-login password change
* JWT authentication
* Forgot-password and password-reset flow
* Role-based authorization
* Todo CRUD
* Todo assignment and reassignment
* Due dates and priorities
* Comments
* File attachments
* Cloudinary integration
* Notifications
* Soft delete and restore
* Todo activity history
* Admin management
* Audit logging
* Automated tests
* Postman testing

---

# 📌 Table of Contents

* [Features](#-features)
* [Technology Stack](#-technology-stack)
* [Project Structure](#-project-structure)
* [Installation](#-installation)
* [Environment Variables](#-environment-variables)
* [Gmail Email Setup](#-gmail-email-setup)
* [Running the Project](#-running-the-project)
* [Health Check](#-health-check)
* [Authentication Flow](#-authentication-flow)
* [Registration and Temporary Password](#-registration-and-temporary-password)
* [Mandatory First Login Password Change](#-mandatory-first-login-password-change)
* [Forgot Password](#-forgot-password)
* [Reset Password](#-reset-password)
* [JWT Authentication](#-jwt-authentication)
* [User Roles](#-user-roles)
* [Todo Features](#-todo-features)
* [Todo Assignment](#-todo-assignment)
* [Due Date and Priority](#-due-date-and-priority)
* [Comments System](#-comments-system)
* [File Attachments](#-file-attachments)
* [Notification System](#-notification-system)
* [Soft Delete and Trash](#-soft-delete-and-trash)
* [Admin Features](#-admin-features)
* [Activity History and Audit Logs](#-activity-history-and-audit-logs)
* [API Endpoints](#-api-endpoints)
* [Postman Testing Flow](#-postman-testing-flow)
* [Error Testing](#-error-testing)
* [Automated Testing](#-automated-testing)
* [Database Models](#-database-models)
* [Authorization Rules](#-authorization-rules)
* [Security](#-security)
* [Project Flow](#-project-flow)
* [Future Improvements](#-future-improvements)
* [Author](#-author)

---

# ✨ Features

## 🔐 Authentication

The API supports:

* User registration
* Temporary-password generation
* Temporary-password email delivery
* User login
* JWT authentication
* Protected routes
* User profile
* Logout
* Password hashing with bcryptjs
* Mandatory first-login password change
* Forgot password
* Password reset
* Password reset token expiry
* Password changed notifications

---

## 📧 Email System

The backend uses **Nodemailer** for email delivery.

Emails are used for:

* Temporary password after registration
* Login notification
* Forgot-password reset link
* Password changed notification

For Gmail, use a **Google App Password** rather than your normal Gmail password.

---

## 👥 Role-Based Authorization

The API supports two main roles:

```text
user
admin
```

### User

A normal user can:

* Register
* Login
* Change password
* View profile
* Create Todos
* View accessible Todos
* Update allowed Todos
* Delete allowed Todos
* Add comments
* View comments
* Upload attachments
* View notifications
* Mark notifications as read
* View Todo activity history

### Admin

An admin can additionally:

* View all users
* View all active Todos
* View any Todo
* Update any active Todo
* Soft delete any Todo
* View deleted Todos
* Restore deleted Todos
* Make users admin
* Remove admin role
* Change user roles
* Change user passwords
* Enable or disable users
* Delete users
* View Todo activity history

---

# 🛠 Technology Stack

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose

## Authentication

* JSON Web Token
* bcryptjs

## Email

* Nodemailer
* Gmail SMTP

## File Upload

* Multer
* Cloudinary

## Testing

* Jest
* Supertest

## Development

* Nodemon
* dotenv
* CORS

---

# 📁 Project Structure

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
│   ├── notificationController.js
│   └── todoController.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   ├── logger.js
│   └── uploadMiddleware.js
│
├── models/
│   ├── Activity.js
│   ├── Comment.js
│   ├── Notification.js
│   ├── Todo.js
│   ├── TodoActivity.js
│   └── User.js
│
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── notificationRoutes.js
│   └── todoRoutes.js
│
├── tests/
│   ├── admin.test.js
│   ├── adminActivity.test.js
│   ├── auth.test.js
│   ├── setup.js
│   ├── todo.test.js
│   ├── todoActivity.test.js
│   └── todoAttachmentActivity.test.js
│
├── utils/
│   ├── activityService.js
│   ├── attachmentService.js
│   ├── emailService.js
│   ├── notificationService.js
│   └── passwordService.js
│
├── public/
│   └── uploads/
│
├── server.js
├── package.json
├── package-lock.json
├── jest.config.js
├── .env
├── .gitignore
└── README.md
```

---

# ⚙️ Installation

## 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
```

## 2. Move into the project folder

```bash
cd todo-api
```

## 3. Install dependencies

```bash
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file in the project root.

Example:

```env
# ==========================================
# SERVER
# ==========================================

PORT=5000


# ==========================================
# DATABASE
# ==========================================

MONGO_URI=your_mongodb_connection_string


# ==========================================
# JWT
# ==========================================

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d


# ==========================================
# FRONTEND URL
# Used to create password reset links
# ==========================================

CLIENT_URL=http://localhost:3000


# ==========================================
# CLOUDINARY
# ==========================================

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret


# ==========================================
# EMAIL - GMAIL SMTP
# ==========================================

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

EMAIL_USER=your_gmail@gmail.com

# Gmail App Password
# Do NOT use your normal Gmail password
EMAIL_PASSWORD=your_gmail_app_password

EMAIL_FROM="Todo API <your_gmail@gmail.com>"
```

### Important

Never commit your real `.env` file to GitHub.

Your `.gitignore` should contain:

```text
.env
node_modules
```

---

# 📧 Gmail Email Setup

The registration process generates a temporary password and emails it to the new user.

For Gmail:

## Step 1

Open:

```text
https://myaccount.google.com/security
```

## Step 2

Enable:

```text
2-Step Verification
```

## Step 3

Open:

```text
https://myaccount.google.com/apppasswords
```

## Step 4

Create an App Password.

For example, use:

```text
Todo API
```

Google will generate a 16-character App Password.

Put that value into:

```env
EMAIL_PASSWORD=YOUR_APP_PASSWORD
```

Do not use your normal Gmail password.

## Step 5

Set:

```env
EMAIL_USER=your_gmail@gmail.com
EMAIL_FROM="Todo API <your_gmail@gmail.com>"
```

## Step 6

Restart the backend after changing `.env`.

```bash
npm run dev
```

---

# ▶️ Running the Project

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

Default API URL:

```text
http://localhost:5000
```

---

# ❤️ Health Check

## Endpoint

```http
GET /
```

## Example

```text
http://localhost:5000/
```

## Response

```json
{
  "success": true,
  "message": "Todo API is running"
}
```

---

# 🔐 Authentication Flow

The authentication system has two different password flows.

## Normal existing user

```text
Login
  ↓
JWT Token
  ↓
Protected APIs
```

## New user

```text
Register
   ↓
Temporary Password Generated
   ↓
Temporary Password Emailed
   ↓
Login with Temporary Password
   ↓
mustChangePassword = true
   ↓
Only Change Password / Profile / Logout
   ↓
Change Password
   ↓
mustChangePassword = false
   ↓
Full Application Access
```

---

# 👤 Registration and Temporary Password

## Register

```http
POST /api/auth/register
```

Full URL:

```text
http://localhost:5000/api/auth/register
```

## Request Body

The registration request does not need the user's final password.

```json
{
  "name": "Test User",
  "email": "testuser@gmail.com"
}
```

## Successful Response

```json
{
  "success": true,
  "message": "New user created successfully. A temporary password has been sent to the registered email. Password change is required after first login.",
  "data": {
    "_id": "USER_ID",
    "name": "Test User",
    "email": "testuser@gmail.com",
    "role": "user",
    "isActive": true,
    "mustChangePassword": true
  }
}
```

The user should receive an email containing the temporary password.

---

# 🔑 Login With Temporary Password

## Endpoint

```http
POST /api/auth/login
```

Example:

```json
{
  "email": "testuser@gmail.com",
  "password": "TEMPORARY_PASSWORD_FROM_EMAIL"
}
```

## Expected Response

```json
{
  "success": true,
  "message": "Login successful. You must change your temporary password before continuing.",
  "token": "JWT_TOKEN",
  "data": {
    "email": "testuser@gmail.com",
    "mustChangePassword": true
  }
}
```

Copy the JWT token.

---

# 🔒 Mandatory First Login Password Change

A new user must change the temporary password before accessing normal application resources.

When:

```json
{
  "mustChangePassword": true
}
```

the following remain available:

```text
GET  /api/auth/profile
POST /api/auth/logout
PATCH /api/auth/change-password
```

The following are blocked:

```text
Todo APIs
Notification APIs
Admin APIs
```

Blocked requests return:

```text
403 Forbidden
```

Example:

```json
{
  "success": false,
  "mustChangePassword": true,
  "message": "You must change your temporary password before accessing this resource."
}
```

---

# 🔐 Change Password

## Endpoint

```http
PATCH /api/auth/change-password
```

## Authorization

```text
Bearer JWT_TOKEN
```

## Request Body

```json
{
  "currentPassword": "TEMPORARY_PASSWORD",
  "newPassword": "NewPassword@123"
}
```

## Successful Response

```json
{
  "success": true,
  "message": "Password changed successfully. You can now access the application."
}
```

After this operation:

```text
mustChangePassword = false
```

The user can access the normal application.

---

# 👤 Get User Profile

## Endpoint

```http
GET /api/auth/profile
```

## Authorization

```text
Bearer JWT_TOKEN
```

Example response:

```json
{
  "success": true,
  "data": {
    "_id": "USER_ID",
    "name": "Test User",
    "email": "testuser@gmail.com",
    "role": "user",
    "isActive": true,
    "mustChangePassword": false
  }
}
```

---

# 🚪 Logout

## Endpoint

```http
POST /api/auth/logout
```

## Authorization

```text
Bearer JWT_TOKEN
```

Example response:

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

# 📩 Forgot Password

Forgot password is available to users who have forgotten their password.

## Endpoint

```http
POST /api/auth/forgot-password
```

## Request Body

```json
{
  "email": "testuser@gmail.com"
}
```

## Response

```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

The API intentionally returns the same message for an existing or non-existing email to avoid exposing account existence.

---

# 🔗 Password Reset Token

After the forgot-password request, the user receives an email.

Example reset link:

```text
http://localhost:3000/reset-password/abc123XYZ456
```

The token is:

```text
abc123XYZ456
```

The token is only valid for a limited time.

Current reset-token lifetime:

```text
15 minutes
```

---

# 🔄 Reset Password

## Endpoint

```http
PATCH /api/auth/reset-password/:token
```

Example:

```text
http://localhost:5000/api/auth/reset-password/abc123XYZ456
```

## Request Body

```json
{
  "newPassword": "ForgotPassword@123"
}
```

## Successful Response

```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password."
}
```

After a successful password reset:

```text
mustChangePassword = false
```

The reset token is cleared and cannot be reused.

---

# 🔑 JWT Authentication

Protected APIs require:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

In Postman:

```text
Authorization
    ↓
Type: Bearer Token
    ↓
Paste JWT Token
```

Do not manually place a second `Bearer` inside the token field.

---

# 📝 Todo Features

Each Todo can contain information such as:

```json
{
  "title": "Complete Todo API",
  "description": "Build advanced backend features",
  "createdBy": "USER_ID",
  "assignedTo": "USER_ID",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-08-25",
  "attachmentUrl": "FILE_URL",
  "isDeleted": false
}
```

Supported features:

* Create Todo
* Get Todos
* Get single Todo
* Update Todo
* Update Todo using PUT
* Update Todo using PATCH
* Update Todo status
* Assign Todo
* Reassign Todo
* Set priority
* Set due date
* Search Todos
* Filter Todos
* Pagination
* Sorting
* File attachment
* Soft delete
* Restore
* Statistics
* Activity history

---

# ➕ Create Todo

## Endpoint

```http
POST /api/todos
```

## Request Body

```json
{
  "title": "Build Audit Log System",
  "description": "Track important Todo actions",
  "assignedTo": "USER_ID",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-08-25"
}
```

The authenticated user is automatically treated as the Todo creator.

---

# 📋 Get Todos

## Endpoint

```http
GET /api/todos
```

Examples:

```http
GET /api/todos?page=1&limit=10
```

```http
GET /api/todos?search=API
```

```http
GET /api/todos?status=pending
```

```http
GET /api/todos?priority=high
```

---

# 🔍 Get Single Todo

```http
GET /api/todos/:id
```

Example:

```http
GET /api/todos/TODO_ID
```

---

# ✏️ Update Todo

## PUT

```http
PUT /api/todos/:id
```

## PATCH

```http
PATCH /api/todos/:id
```

Example:

```json
{
  "title": "Updated Todo Title",
  "description": "Updated Todo description",
  "priority": "medium"
}
```

---

# 🔄 Update Todo Status

```http
PATCH /api/todos/:id/status
```

Example:

```json
{
  "status": "in-progress"
}
```

Supported status values:

```text
pending
in-progress
completed
```

---

# 📊 Todo Statistics

```http
GET /api/todos/stats
```

Returns Todo-related statistics.

---

# 👥 Todo Assignment

A Todo can be assigned to another user.

Example:

```json
{
  "assignedTo": "USER_ID"
}
```

The backend validates the assigned user.

Assignment and reassignment actions are recorded in the activity history.

Example:

```text
created
assigned
reassigned
```

---

# 📅 Due Date

Example:

```json
{
  "dueDate": "2026-08-25"
}
```

---

# 🚨 Priority

Supported priority values:

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

Priority changes are recorded in the activity history.

---

# 💬 Comments System

Users can add comments to accessible Todos.

A comment contains:

```text
Todo ID
User ID
Comment
Created At
Updated At
```

---

# ➕ Add Comment

```http
POST /api/todos/:id/comments
```

Example:

```json
{
  "comment": "Started working on this Todo."
}
```

---

# 📋 Get Comments

```http
GET /api/todos/:id/comments
```

---

# ✏️ Update Comment

```http
PATCH /api/todos/:todoId/comments/:commentId
```

Example:

```json
{
  "comment": "Updated comment text."
}
```

---

# 🗑️ Delete Comment

```http
DELETE /api/todos/:todoId/comments/:commentId
```

---

# 📎 File Attachments

Todos can have file attachments.

## Endpoint

```http
POST /api/todos/:id/attachment
```

In Postman:

```text
Body
  ↓
form-data
  ↓
Key: attachment
  ↓
Type: File
  ↓
Choose File
```

The backend uses:

```text
Multer
   ↓
Cloudinary
```

The Todo stores the returned attachment information.

---

# 🔔 Notification System

Users can receive notifications related to Todo activity.

## Get Notifications

```http
GET /api/notifications
```

## Mark All Notifications as Read

```http
PATCH /api/notifications/read-all
```

## Mark One Notification as Read

```http
PATCH /api/notifications/:id/read
```

### First-login restriction

When:

```text
mustChangePassword = true
```

notification APIs return:

```text
403 Forbidden
```

until the password is changed.

---

# 🗑️ Soft Delete and Trash

Deleting a Todo uses soft delete behavior.

The Todo remains in the database but is marked as deleted.

Typical fields:

```json
{
  "isDeleted": true,
  "deletedAt": "2026-08-18T10:00:00.000Z"
}
```

Admins can later restore the Todo.

---

# 👑 Admin Features

Admin routes use:

```text
JWT authentication
        +
mustChangePassword = false
        +
admin role
```

## Admin Todo APIs

```http
GET /api/admin/todos
```

```http
GET /api/admin/todos/trash
```

```http
GET /api/admin/todos/:id
```

```http
PUT /api/admin/todos/:id
```

```http
PATCH /api/admin/todos/:id
```

```http
DELETE /api/admin/todos/:id
```

```http
PATCH /api/admin/todos/:id/restore
```

## Admin User APIs

```http
GET /api/admin/users
```

```http
POST /api/admin/users/:id/make-admin
```

```http
POST /api/admin/users/:id/remove-admin
```

```http
PATCH /api/admin/users/:id/role
```

```http
PATCH /api/admin/users/:id/password
```

```http
PATCH /api/admin/users/:id/status
```

```http
DELETE /api/admin/users/:id
```

---

# 📜 Activity History and Audit Logs

The system records important Todo actions.

Examples:

```text
created
assigned
reassigned
updated
priority_changed
status_changed
comment_added
attachment_added
soft_deleted
restored
```

## Get Todo Activity

```http
GET /api/todos/:id/activity
```

The activity history contains information such as:

```text
todoId
userId
action
oldValue
newValue
createdAt
```

This provides a complete audit trail of important Todo changes.

---

# 📚 API Endpoints

## Authentication

| Method | Endpoint                          | Description                               | Auth |
| ------ | --------------------------------- | ----------------------------------------- | ---- |
| POST   | `/api/auth/register`              | Register user and send temporary password | No   |
| POST   | `/api/auth/login`                 | Login                                     | No   |
| POST   | `/api/auth/forgot-password`       | Request reset email                       | No   |
| PATCH  | `/api/auth/reset-password/:token` | Reset password                            | No   |
| PATCH  | `/api/auth/change-password`       | Change password                           | Yes  |
| GET    | `/api/auth/profile`               | Get profile                               | Yes  |
| POST   | `/api/auth/logout`                | Logout                                    | Yes  |

---

## Todos

| Method | Endpoint                                 | Description          | Auth |
| ------ | ---------------------------------------- | -------------------- | ---- |
| POST   | `/api/todos`                             | Create Todo          | Yes  |
| GET    | `/api/todos`                             | Get accessible Todos | Yes  |
| GET    | `/api/todos/stats`                       | Get Todo statistics  | Yes  |
| GET    | `/api/todos/:id`                         | Get single Todo      | Yes  |
| PUT    | `/api/todos/:id`                         | Update Todo          | Yes  |
| PATCH  | `/api/todos/:id`                         | Update Todo          | Yes  |
| PATCH  | `/api/todos/:id/status`                  | Update status        | Yes  |
| DELETE | `/api/todos/:id`                         | Soft delete Todo     | Yes  |
| POST   | `/api/todos/:id/attachment`              | Upload attachment    | Yes  |
| GET    | `/api/todos/:id/activity`                | Activity history     | Yes  |
| POST   | `/api/todos/:id/comments`                | Add comment          | Yes  |
| GET    | `/api/todos/:id/comments`                | Get comments         | Yes  |
| PATCH  | `/api/todos/:todoId/comments/:commentId` | Update comment       | Yes  |
| DELETE | `/api/todos/:todoId/comments/:commentId` | Delete comment       | Yes  |

---

## Notifications

| Method | Endpoint                      | Description       | Auth |
| ------ | ----------------------------- | ----------------- | ---- |
| GET    | `/api/notifications`          | Get notifications | Yes  |
| PATCH  | `/api/notifications/read-all` | Mark all as read  | Yes  |
| PATCH  | `/api/notifications/:id/read` | Mark one as read  | Yes  |

---

## Admin

| Method | Endpoint                            | Description          | Auth  |
| ------ | ----------------------------------- | -------------------- | ----- |
| GET    | `/api/admin/users`                  | Get users            | Admin |
| GET    | `/api/admin/todos`                  | Get all active Todos | Admin |
| GET    | `/api/admin/todos/trash`            | Get deleted Todos    | Admin |
| GET    | `/api/admin/todos/:id`              | Get any Todo         | Admin |
| PUT    | `/api/admin/todos/:id`              | Update any Todo      | Admin |
| PATCH  | `/api/admin/todos/:id`              | Update any Todo      | Admin |
| DELETE | `/api/admin/todos/:id`              | Soft delete any Todo | Admin |
| PATCH  | `/api/admin/todos/:id/restore`      | Restore Todo         | Admin |
| POST   | `/api/admin/users/:id/make-admin`   | Make user admin      | Admin |
| POST   | `/api/admin/users/:id/remove-admin` | Remove admin role    | Admin |
| PATCH  | `/api/admin/users/:id/role`         | Change role          | Admin |
| PATCH  | `/api/admin/users/:id/password`     | Change user password | Admin |
| PATCH  | `/api/admin/users/:id/status`       | Enable/disable user  | Admin |
| DELETE | `/api/admin/users/:id`              | Delete user          | Admin |

---

# 🧪 Postman Testing Flow

Use the following sequence to test authentication from beginning to end.

---

## Step 1 — Start MongoDB

Make sure MongoDB is running.

---

## Step 2 — Configure `.env`

Verify:

```env
MONGO_URI=...
JWT_SECRET=...
EMAIL_USER=...
EMAIL_PASSWORD=...
EMAIL_FROM=...
CLIENT_URL=http://localhost:3000
```

---

## Step 3 — Start Server

```bash
npm run dev
```

Expected:

```text
Server running on port 5000
```

---

## Step 4 — Register a New User

```http
POST http://localhost:5000/api/auth/register
```

Body:

```json
{
  "name": "Test User",
  "email": "testuser@gmail.com"
}
```

Expected:

```text
201 Created
```

---

## Step 5 — Check Email

Open:

```text
testuser@gmail.com
```

Find:

```text
Welcome - Your Temporary Password
```

Copy the temporary password.

Also check:

```text
Spam
Promotions
All Mail
```

if needed.

---

## Step 6 — Login With Temporary Password

```http
POST http://localhost:5000/api/auth/login
```

```json
{
  "email": "testuser@gmail.com",
  "password": "TEMPORARY_PASSWORD_FROM_EMAIL"
}
```

Expected:

```text
200 OK
```

and:

```json
{
  "mustChangePassword": true
}
```

Copy the JWT token.

---

## Step 7 — Test Todo Before Password Change

```http
GET http://localhost:5000/api/todos
```

Authorization:

```text
Bearer JWT_TOKEN
```

Expected:

```text
403 Forbidden
```

Response should contain:

```json
{
  "success": false,
  "mustChangePassword": true
}
```

---

## Step 8 — Test Notifications Before Password Change

```http
GET http://localhost:5000/api/notifications
```

Expected:

```text
403 Forbidden
```

---

## Step 9 — Test Profile Before Password Change

```http
GET http://localhost:5000/api/auth/profile
```

Expected:

```text
200 OK
```

and:

```json
{
  "mustChangePassword": true
}
```

---

## Step 10 — Change Password

```http
PATCH http://localhost:5000/api/auth/change-password
```

Authorization:

```text
Bearer JWT_TOKEN
```

Body:

```json
{
  "currentPassword": "TEMPORARY_PASSWORD_FROM_EMAIL",
  "newPassword": "Niket@123"
}
```

Expected:

```text
200 OK
```

---

## Step 11 — Test Todo After Password Change

```http
GET http://localhost:5000/api/todos
```

Expected:

```text
200 OK
```

The user can now access normal Todo APIs.

---

## Step 12 — Login Again With New Password

```http
POST http://localhost:5000/api/auth/login
```

```json
{
  "email": "testuser@gmail.com",
  "password": "Niket@123"
}
```

Expected:

```json
{
  "success": true,
  "data": {
    "mustChangePassword": false
  }
}
```

Copy the new JWT.

---

## Step 13 — Create Todo

```http
POST http://localhost:5000/api/todos
```

Example:

```json
{
  "title": "Build Audit Log System",
  "description": "Track Todo changes",
  "priority": "high",
  "status": "pending",
  "dueDate": "2026-08-25"
}
```

Copy the Todo ID.

---

## Step 14 — Get Todo

```http
GET http://localhost:5000/api/todos/TODO_ID
```

Expected:

```text
200 OK
```

---

## Step 15 — Update Todo

```http
PATCH http://localhost:5000/api/todos/TODO_ID
```

Example:

```json
{
  "title": "Updated Audit Log System",
  "priority": "medium"
}
```

---

## Step 16 — Change Status

```http
PATCH http://localhost:5000/api/todos/TODO_ID/status
```

Body:

```json
{
  "status": "in-progress"
}
```

---

## Step 17 — Add Comment

```http
POST http://localhost:5000/api/todos/TODO_ID/comments
```

Body:

```json
{
  "comment": "Started working on this Todo."
}
```

---

## Step 18 — Get Comments

```http
GET http://localhost:5000/api/todos/TODO_ID/comments
```

---

## Step 19 — Upload Attachment

```http
POST http://localhost:5000/api/todos/TODO_ID/attachment
```

Postman:

```text
Body
↓
form-data
↓
Key: attachment
↓
Type: File
↓
Select file
```

---

## Step 20 — Check Activity History

```http
GET http://localhost:5000/api/todos/TODO_ID/activity
```

Look for activities such as:

```text
created
assigned
updated
priority_changed
status_changed
comment_added
attachment_added
```

---

## Step 21 — Delete Todo

```http
DELETE http://localhost:5000/api/todos/TODO_ID
```

The Todo should be soft deleted.

---

## Step 22 — Admin Login

Login using an admin account:

```http
POST http://localhost:5000/api/auth/login
```

Copy the admin JWT.

---

## Step 23 — View Trash

```http
GET http://localhost:5000/api/admin/todos/trash
```

Use the admin JWT.

---

## Step 24 — Restore Todo

```http
PATCH http://localhost:5000/api/admin/todos/TODO_ID/restore
```

Expected:

```text
200 OK
```

---

# 🔁 Forgot Password Testing

## Step 25 — Request Password Reset

```http
POST http://localhost:5000/api/auth/forgot-password
```

Body:

```json
{
  "email": "testuser@gmail.com"
}
```

Expected:

```text
200 OK
```

Response:

```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

---

## Step 26 — Check Email

You should receive:

```text
Password Reset Request
```

Example link:

```text
http://localhost:3000/reset-password/RESET_TOKEN
```

The part after:

```text
/reset-password/
```

is the reset token.

Example:

```text
abc123XYZ456
```

---

## Step 27 — Reset Password

```http
PATCH http://localhost:5000/api/auth/reset-password/abc123XYZ456
```

Body:

```json
{
  "newPassword": "ForgotPassword@123"
}
```

Expected:

```text
200 OK
```

---

## Step 28 — Login With Reset Password

```http
POST http://localhost:5000/api/auth/login
```

```json
{
  "email": "testuser@gmail.com",
  "password": "ForgotPassword@123"
}
```

Expected:

```json
{
  "success": true,
  "data": {
    "mustChangePassword": false
  }
}
```

---

## Step 29 — Reuse Reset Token

Try the same token again:

```http
PATCH http://localhost:5000/api/auth/reset-password/OLD_TOKEN
```

Expected:

```text
400 Bad Request
```

Message:

```text
Password reset token is invalid or has expired
```

The reset token is single-use.

---

# 🧪 Error Testing

## Invalid Login

```http
POST /api/auth/login
```

```json
{
  "email": "testuser@gmail.com",
  "password": "WrongPassword"
}
```

Expected:

```text
401 Unauthorized
```

---

## Missing Login Fields

```json
{
  "email": ""
}
```

Expected:

```text
400 Bad Request
```

---

## Wrong Current Password

```http
PATCH /api/auth/change-password
```

```json
{
  "currentPassword": "WrongPassword",
  "newPassword": "NewPassword@123"
}
```

Expected:

```text
400 Bad Request
```

---

## Same Password

```json
{
  "currentPassword": "NewPassword@123",
  "newPassword": "NewPassword@123"
}
```

Expected:

```text
400 Bad Request
```

---

## Invalid JWT

Use:

```text
Authorization: Bearer abc123
```

Expected:

```text
401 Unauthorized
```

---

## Missing JWT

Call a protected API without Authorization.

Expected:

```text
401 Unauthorized
```

---

## Disabled User

Disable the user through the admin API and then try to login.

Expected:

```text
403 Forbidden
```

---

## Duplicate Registration

Register the same email twice.

Expected:

```text
400 Bad Request
```

---

# ✅ Complete Authentication Test Checklist

```text
☐ Register new user
☐ Temporary password generated
☐ Temporary password email received
☐ Login with temporary password
☐ mustChangePassword = true
☐ Todo blocked before password change
☐ Notifications blocked before password change
☐ Profile available before password change
☐ Change password succeeds
☐ mustChangePassword = false
☐ Todo available after password change
☐ Login with new password
☐ Old temporary password fails
☐ Wrong current password fails
☐ Same password rejected
☐ Forgot password request succeeds
☐ Password reset email received
☐ Extract reset token
☐ Reset password succeeds
☐ Login with reset password
☐ Reset token cannot be reused
☐ Invalid reset token rejected
☐ Invalid JWT rejected
☐ Missing JWT rejected
☐ Duplicate registration rejected
☐ Disabled user rejected
☐ Login notification email received
☐ Password changed email received
```

---

# 🧪 Automated Testing

The project uses:

```text
Jest
Supertest
```

## Run all tests

```bash
npm test
```

or:

```bash
npm run test:all
```

## Authentication tests

```bash
npm run test:auth
```

## Todo tests

```bash
npm run test:todo
```

## Admin tests

```bash
npm run test:admin
```

## Todo activity tests

```bash
npm run test:audit
```

## Admin activity tests

```bash
npm run test:admin-audit
```

## Attachment activity tests

```bash
npm run test:attachment
```

---

# 🗄 Database Models

## User

Stores:

```text
name
email
password
role
isActive
mustChangePassword
passwordChangedAt
passwordResetToken
passwordResetExpires
lastLoginAt
lastLoginIp
createdAt
updatedAt
```

---

## Todo

Stores:

```text
title
description
createdBy
assignedTo
attachmentUrl
attachmentPublicId
status
priority
dueDate
isDeleted
deletedAt
createdAt
updatedAt
```

---

## Comment

Stores:

```text
todoId
userId
comment
createdAt
updatedAt
```

---

## Notification

Stores:

```text
userId
todoId
type
message
isRead
createdAt
```

---

## TodoActivity

Stores:

```text
todoId
userId
action
oldValue
newValue
createdAt
```

---

# 🔒 Authorization Rules

The application has three levels of protection.

## Level 1 — Public

These APIs do not require JWT:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
PATCH /api/auth/reset-password/:token
```

---

## Level 2 — Authenticated

These APIs require a valid JWT:

```text
GET /api/auth/profile
PATCH /api/auth/change-password
POST /api/auth/logout
```

A first-login user can access these because they need to complete the password-change process.

---

## Level 3 — Password Already Changed

These APIs require:

```text
Valid JWT
+
isActive = true
+
mustChangePassword = false
```

Examples:

```text
Todo APIs
Notification APIs
Admin APIs
```

---

## Level 4 — Admin

Admin APIs additionally require:

```text
role = admin
```

---

# 🛡️ Security

The project uses:

* bcrypt password hashing
* JWT authentication
* Protected routes
* Role-based authorization
* Mandatory first-login password change
* Password reset tokens
* Expiring reset tokens
* Single-use password reset tokens
* Account enable/disable
* Input validation
* Environment variables
* Soft delete
* Audit logging
* Access control
* Secure file upload configuration
* Non-enumerating forgot-password responses

---

# 🧠 Complete Application Flow

```text
Client / Postman
        ↓
Express Route
        ↓
Authentication Middleware
        ↓
Password-Change Middleware
        ↓
Authorization Middleware
        ↓
Controller
        ↓
Validation
        ↓
MongoDB / Mongoose
        ↓
Additional Services
        ↓
Activity / Notification
        ↓
API Response
```

---

# 🔐 Complete New User Flow

```text
REGISTER
   ↓
Generate temporary password
   ↓
Save user
   ↓
Send temporary password email
   ↓
LOGIN
   ↓
JWT returned
   ↓
mustChangePassword = true
   ↓
Todo / Notification / Admin APIs blocked
   ↓
Change password
   ↓
mustChangePassword = false
   ↓
Full access
```

---

# 🔄 Forgot Password Flow

```text
Forgot Password Request
        ↓
Generate reset token
        ↓
Hash token
        ↓
Store token + expiry
        ↓
Send reset email
        ↓
User opens reset link
        ↓
Extract reset token
        ↓
Reset password
        ↓
Delete reset token
        ↓
mustChangePassword = false
        ↓
Login with new password
```

---

# 📜 Todo Lifecycle Example

```text
1. User Creates Todo
        ↓
created

2. Todo Assigned
        ↓
assigned

3. Todo Reassigned
        ↓
reassigned

4. Priority Changed
        ↓
priority_changed

5. Status Changed
        ↓
status_changed

6. Comment Added
        ↓
comment_added

7. Attachment Uploaded
        ↓
attachment_added

8. Todo Updated
        ↓
updated

9. Todo Deleted
        ↓
soft_deleted

10. Admin Restores Todo
        ↓
restored
```

---

# ⚠️ Common Problems

## Email not received

Check:

```text
EMAIL_USER
EMAIL_PASSWORD
EMAIL_HOST
EMAIL_PORT
EMAIL_SECURE
EMAIL_FROM
```

For Gmail, `EMAIL_PASSWORD` must be an App Password.

Also check:

```text
Spam
Promotions
All Mail
```

Restart the server after changing `.env`.

---

## Temporary-password login fails

Do not use the user's intended final password.

Use the temporary password from the registration email.

Example:

```json
{
  "email": "testuser@gmail.com",
  "password": "TEMPORARY_PASSWORD_FROM_EMAIL"
}
```

---

## Todo returns 403 after registration

This is expected when:

```text
mustChangePassword = true
```

First call:

```http
PATCH /api/auth/change-password
```

Then access Todo APIs.

---

## Password reset token fails

Make sure you copied the exact token from the email.

Example:

```text
http://localhost:3000/reset-password/abc123XYZ456
```

Token:

```text
abc123XYZ456
```

The token expires and can be used only once.

---

# 📈 Future Improvements

Possible future enhancements:

* Refresh tokens
* Rate limiting
* Swagger/OpenAPI documentation
* Socket.io real-time notifications
* Scheduled due-date reminders
* Automated overdue Todo detection
* Advanced search
* Full-text search
* Multiple attachments
* Attachment deletion
* Notification pagination
* Activity pagination
* Dashboard analytics
* Docker deployment
* CI/CD
* Production logging
* Redis caching
* Monitoring and health metrics

---

# 👨‍💻 Author

**Project:** Advanced Todo API

**Technology:** Node.js, Express.js, MongoDB, Mongoose

---

# 📄 License

This project is created for learning and development purposes.

---

# ⭐ Final Summary

This Todo API is an advanced backend application that demonstrates:

```text
Authentication
+
JWT
+
Temporary Passwords
+
Mandatory Password Change
+
Forgot Password
+
Password Reset
+
Email Integration
+
Role-Based Authorization
+
Todo Management
+
Assignment
+
Reassignment
+
Due Dates
+
Priority
+
Comments
+
File Attachments
+
Cloudinary
+
Notifications
+
Soft Delete
+
Trash
+
Restore
+
Admin Management
+
Activity History
+
Audit Logs
+
Automated Testing
+
Postman API Testing
```

The project follows a structured backend architecture:

```text
Routes
   ↓
Middleware
   ↓
Controllers
   ↓
Services
   ↓
Models
   ↓
MongoDB
```

The authentication system is designed so that a newly registered user receives a temporary password, must change that password on first login, and only then receives normal application access.

The project can be extended with a frontend, real-time features, stronger production security, deployment automation, monitoring, and additional enterprise features.
