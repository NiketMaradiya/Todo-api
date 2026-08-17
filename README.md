# Todo API

A complete **RESTful Todo Management API** built with **Node.js, Express.js, MongoDB, and Mongoose**.

This project supports user authentication, role-based authorization, todo assignment, due dates, priorities, comments, notifications, Cloudinary file attachments, soft delete functionality, and a complete activity/audit log system.

---

# 🚀 Features

## Authentication

* User registration
* User login
* User logout
* JWT authentication
* Password hashing using bcrypt
* Protected routes
* User profile access

## User Roles

The application supports two roles:

* `user`
* `admin`

### Normal User

A normal user can:

* Register and login
* Create todos
* View their own created todos
* View todos assigned to them
* Update authorized todos
* Add comments
* View comments
* Upload attachments
* View notifications
* Mark notifications as read
* View todo activity history

### Admin

An admin can:

* View all users
* Change user roles
* Make a user an admin
* Remove admin role
* View all todos
* View deleted todos
* Restore deleted todos
* Manage users
* Access system-level data according to authorization rules

---

# 🛠 Technologies Used

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcrypt
* Multer
* Cloudinary
* dotenv
* cors
* Nodemon
* Jest
* Supertest

---

# 📁 Project Structure

```text
todo-api/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── commentController.js
│   ├── notificationController.js
│   ├── todoController.js
│   └── todoActivityController.js
│
├── middleware/
│   ├── adminMiddleware.js
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   └── uploadMiddleware.js
│
├── models/
│   ├── Comment.js
│   ├── Notification.js
│   ├── Todo.js
│   ├── TodoActivity.js
│   └── User.js
│
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── commentRoutes.js
│   ├── notificationRoutes.js
│   ├── todoActivityRoutes.js
│   └── todoRoutes.js
│
├── utils/
│   ├── cloudinary.js
│   └── createNotification.js
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
```

> Your exact folder/file names may be slightly different depending on your implementation.

---

# ⚙️ Installation

## 1. Clone the Project

```bash
git clone <your-repository-url>
```

## 2. Open the Project

```bash
cd todo-api
```

## 3. Install Dependencies

```bash
npm install
```

---

# 🔐 Environment Variables

Create a `.env` file in the root folder.

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/todo-api

JWT_SECRET=your_super_secret_jwt_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Do not upload your real `.env` file to GitHub.

---

# ▶️ Run the Application

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

# 🔑 Authentication

Protected routes require a JWT token.

After login, copy the token from the response.

In Postman:

```text
Authorization
→ Bearer Token
→ Paste your JWT token
```

The request header will be:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

---

# 👤 Authentication APIs

## 1. Register User

### Request

```http
POST /api/auth/register
```

### URL

```text
http://localhost:5000/api/auth/register
```

### Body

```json
{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "123456"
}
```

### Example Response

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "USER_ID",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "user"
  }
}
```

---

## 2. Login User

### Request

```http
POST /api/auth/login
```

### URL

```text
http://localhost:5000/api/auth/login
```

### Body

```json
{
  "email": "testuser@example.com",
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
    "id": "USER_ID",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "user"
  }
}
```

Save this token for testing protected APIs.

---

## 3. Logout User

### Request

```http
POST /api/auth/logout
```

### Authorization

```text
Bearer Token
```

### Example Response

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 4. Get User Profile

### Request

```http
GET /api/profile
```

### Authorization

```text
Bearer Token
```

---

# 📝 Todo APIs

## Todo Model

A Todo can contain:

```text
title
description
status
priority
dueDate
createdBy
assignedTo
attachmentUrl
isDeleted
deletedAt
createdAt
updatedAt
```

---

# 1. Create Todo

### Request

```http
POST /api/todos
```

### Authorization

```text
Bearer Token
```

### Body

```json
{
  "title": "Complete Todo API",
  "description": "Finish the Todo API project",
  "assignedTo": "ASSIGNED_USER_ID",
  "status": "todo",
  "priority": "high",
  "dueDate": "2026-08-30"
}
```

### Status Values

```text
todo
inprogress
complate
```

### Priority Values

```text
low
medium
high
```

### Example Response

```json
{
  "success": true,
  "message": "Todo created successfully",
  "todo": {
    "_id": "TODO_ID",
    "title": "Complete Todo API",
    "description": "Finish the Todo API project",
    "status": "todo",
    "priority": "high",
    "dueDate": "2026-08-30T00:00:00.000Z",
    "createdBy": "USER_ID",
    "assignedTo": "ASSIGNED_USER_ID",
    "isDeleted": false
  }
}
```

When a todo is created, an activity log can be recorded with the action:

```text
created
```

---

# 2. Get All Todos

### Request

```http
GET /api/todos
```

### Authorization

```text
Bearer Token
```

Normal users can view:

* Todos created by them
* Todos assigned to them

Admin users can view:

* All active todos

Soft-deleted todos are excluded from normal todo listing.

---

# 3. Search Todos

### Request

```http
GET /api/todos?search=Node
```

Example:

```text
http://localhost:5000/api/todos?search=Node
```

---

# 4. Filter by Status

```text
GET /api/todos?status=todo
```

```text
GET /api/todos?status=inprogress
```

```text
GET /api/todos?status=complate
```

---

# 5. Filter by Priority

```text
GET /api/todos?priority=low
```

```text
GET /api/todos?priority=medium
```

```text
GET /api/todos?priority=high
```

---

# 6. Pagination

Example:

```text
GET /api/todos?page=1&limit=10
```

---

# 7. Sorting

Example:

```text
GET /api/todos?sort=newest
```

Other sorting options depend on your controller implementation.

---

# 8. Get Single Todo

### Request

```http
GET /api/todos/:id
```

Example:

```text
http://localhost:5000/api/todos/TODO_ID
```

---

# ✏️ Update Todo

### Request

```http
PUT /api/todos/:id
```

### Authorization

```text
Bearer Token
```

### Body

```json
{
  "title": "Updated Todo Title",
  "description": "Updated description",
  "status": "inprogress",
  "priority": "medium",
  "dueDate": "2026-09-01",
  "assignedTo": "NEW_ASSIGNED_USER_ID"
}
```

The activity system can automatically detect important changes.

Possible activity actions:

```text
updated
assigned
reassigned
status_changed
priority_changed
```

---

# 📌 Todo Assignment

A todo contains:

```text
createdBy
assignedTo
```

Example:

```json
{
  "title": "Backend Task",
  "description": "Complete API",
  "assignedTo": "USER_ID"
}
```

The assigned user must exist.

If the assigned user does not exist, the API should return an error such as:

```json
{
  "success": false,
  "message": "Assigned user not found"
}
```

---

# 🔄 Reassign Todo

To assign a todo to another user:

```http
PUT /api/todos/:id
```

Example body:

```json
{
  "assignedTo": "NEW_USER_ID"
}
```

The activity log should record:

```text
action: reassigned
oldValue: previous user
newValue: new user
```

A notification can also be created for the newly assigned user.

---

# 🔄 Change Todo Status

Example request:

```http
PUT /api/todos/:id
```

Body:

```json
{
  "status": "complate"
}
```

The activity system records:

```text
status_changed
```

Example:

```json
{
  "oldValue": "inprogress",
  "newValue": "complate"
}
```

---

# ⭐ Change Todo Priority

Example:

```http
PUT /api/todos/:id
```

Body:

```json
{
  "priority": "high"
}
```

The activity system records:

```text
priority_changed
```

Example:

```json
{
  "oldValue": "medium",
  "newValue": "high"
}
```

---

# 🗑 Soft Delete Todo

### Request

```http
DELETE /api/todos/:id
```

The todo is not permanently removed from MongoDB.

Instead, the application updates:

```json
{
  "isDeleted": true,
  "deletedAt": "DATE"
}
```

This allows the admin to restore the todo later.

---

# ♻️ Trash and Restore System

## View Deleted Todos

Admin only.

### Request

```http
GET /api/admin/todos/trash
```

### Authorization

```text
Bearer Token
```

---

## Restore Todo

Admin only.

### Request

```http
PATCH /api/admin/todos/:id/restore
```

The todo will be restored with:

```json
{
  "isDeleted": false,
  "deletedAt": null
}
```

---

# 💬 Comments System

Each comment contains:

```text
todoId
userId
comment
createdAt
updatedAt
```

---

## Add Comment

### Request

```http
POST /api/todos/:todoId/comments
```

### Authorization

```text
Bearer Token
```

### Body

```json
{
  "comment": "I have completed the backend API."
}
```

When a comment is added, the activity system records:

```text
comment_added
```

---

## Get Todo Comments

### Request

```http
GET /api/todos/:todoId/comments
```

### Authorization

```text
Bearer Token
```

---

# 📎 File Attachments

The Todo API supports file uploads.

Files are uploaded to **Cloudinary**.

The Todo stores the Cloudinary file URL.

Example field:

```text
attachmentUrl
```

---

## Upload Attachment

### Request

```http
POST /api/todos/:id/attachment
```

### Authorization

```text
Bearer Token
```

### Body Type

Select:

```text
form-data
```

Example:

```text
Key: file
Type: File
Value: Select your file
```

The uploaded file URL is stored in the Todo document.

Example:

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "attachmentUrl": "CLOUDINARY_FILE_URL"
}
```

---

# 🔔 Notification System

Notifications can be created when important actions happen.

Examples:

* Todo assigned
* Todo reassigned
* Status updated
* Priority updated
* Comment added

A notification can contain:

```text
userId
title
message
todoId
isRead
createdAt
```

---

## Get My Notifications

### Request

```http
GET /api/notifications
```

### Authorization

```text
Bearer Token
```

---

## Mark Notification as Read

Example:

```http
PATCH /api/notifications/:id/read
```

---

## Mark All Notifications as Read

Example:

```http
PATCH /api/notifications/read-all
```

---

# 📜 Todo Activity and Audit Log System

The project includes a complete activity history system.

Every important action can be recorded.

---

# TodoActivity Model

The TodoActivity model contains:

```text
todoId
userId
action
oldValue
newValue
createdAt
```

Example schema:

```javascript
{
  todoId: ObjectId,
  userId: ObjectId,
  action: String,
  oldValue: Mixed,
  newValue: Mixed,
  createdAt: Date
}
```

---

# Activity Actions

The system can record the following actions:

```text
created
updated
assigned
reassigned
status_changed
priority_changed
comment_added
```

---

# 1. Todo Created Activity

When a todo is created:

```json
{
  "action": "created"
}
```

The activity records:

* Todo ID
* User ID
* Action
* Creation time

---

# 2. Todo Updated Activity

When a general todo field changes:

```json
{
  "action": "updated",
  "oldValue": {
    "title": "Old Title"
  },
  "newValue": {
    "title": "New Title"
  }
}
```

---

# 3. Todo Assigned Activity

When a todo is assigned for the first time:

```json
{
  "action": "assigned",
  "oldValue": null,
  "newValue": "ASSIGNED_USER_ID"
}
```

---

# 4. Todo Reassigned Activity

When the assigned user changes:

```json
{
  "action": "reassigned",
  "oldValue": "OLD_USER_ID",
  "newValue": "NEW_USER_ID"
}
```

---

# 5. Status Changed Activity

Example:

```json
{
  "action": "status_changed",
  "oldValue": "todo",
  "newValue": "inprogress"
}
```

---

# 6. Priority Changed Activity

Example:

```json
{
  "action": "priority_changed",
  "oldValue": "medium",
  "newValue": "high"
}
```

---

# 7. Comment Added Activity

When a user adds a comment:

```json
{
  "action": "comment_added",
  "newValue": "User added a comment"
}
```

---

# 📋 Get Todo Activity History

### Request

```http
GET /api/todos/:todoId/activities
```

### Authorization

```text
Bearer Token
```

Example:

```text
http://localhost:5000/api/todos/TODO_ID/activities
```

### Example Response

```json
{
  "success": true,
  "count": 3,
  "activities": [
    {
      "_id": "ACTIVITY_ID",
      "todoId": "TODO_ID",
      "userId": {
        "_id": "USER_ID",
        "name": "Test User",
        "email": "testuser@example.com"
      },
      "action": "created",
      "oldValue": null,
      "newValue": null,
      "createdAt": "2026-08-17T10:00:00.000Z"
    },
    {
      "_id": "ACTIVITY_ID",
      "action": "status_changed",
      "oldValue": "todo",
      "newValue": "inprogress",
      "createdAt": "2026-08-17T10:30:00.000Z"
    },
    {
      "_id": "ACTIVITY_ID",
      "action": "priority_changed",
      "oldValue": "medium",
      "newValue": "high",
      "createdAt": "2026-08-17T11:00:00.000Z"
    }
  ]
}
```

Activities are normally sorted by newest first.

---

# 👑 Admin APIs

## Get All Users

Admin only.

```http
GET /api/admin/users
```

---

## Make User Admin

```http
POST /api/admin/users/:id/make-admin
```

---

## Remove Admin Role

```http
POST /api/admin/users/:id/remove-admin
```

---

# 🧪 Complete Postman Testing Order

Follow this order when testing the API.

---

## Step 1: Start MongoDB

Make sure MongoDB is running.

---

## Step 2: Start Server

```bash
npm run dev
```

Expected output:

```text
MongoDB Connected Successfully
Server running on port 5000
```

---

## Step 3: Register User 1

```http
POST http://localhost:5000/api/auth/register
```

```json
{
  "name": "User One",
  "email": "user1@example.com",
  "password": "123456"
}
```

Save:

```text
USER_1_ID
```

---

## Step 4: Register User 2

```http
POST http://localhost:5000/api/auth/register
```

```json
{
  "name": "User Two",
  "email": "user2@example.com",
  "password": "123456"
}
```

Save:

```text
USER_2_ID
```

---

## Step 5: Login User 1

```http
POST http://localhost:5000/api/auth/login
```

```json
{
  "email": "user1@example.com",
  "password": "123456"
}
```

Copy:

```text
USER_1_TOKEN
```

---

## Step 6: Login User 2

```http
POST http://localhost:5000/api/auth/login
```

```json
{
  "email": "user2@example.com",
  "password": "123456"
}
```

Copy:

```text
USER_2_TOKEN
```

---

## Step 7: Create Todo

Login as User 1.

Authorization:

```text
Bearer USER_1_TOKEN
```

Request:

```http
POST http://localhost:5000/api/todos
```

Body:

```json
{
  "title": "Learn Todo API",
  "description": "Complete all Todo API features",
  "assignedTo": "USER_2_ID",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2026-08-30"
}
```

Copy:

```text
TODO_ID
```

---

## Step 8: Check User 2 Notifications

Authorization:

```text
Bearer USER_2_TOKEN
```

Request:

```http
GET http://localhost:5000/api/notifications
```

Check whether the assignment notification is returned.

---

## Step 9: Get All Todos

As User 1:

```http
GET http://localhost:5000/api/todos
```

As User 2:

```http
GET http://localhost:5000/api/todos
```

User 2 should be able to see the todo assigned to them according to the authorization logic.

---

## Step 10: Update Todo Status

```http
PUT http://localhost:5000/api/todos/TODO_ID
```

```json
{
  "status": "inprogress"
}
```

---

## Step 11: Update Priority

```http
PUT http://localhost:5000/api/todos/TODO_ID
```

```json
{
  "priority": "high"
}
```

---

## Step 12: Reassign Todo

```http
PUT http://localhost:5000/api/todos/TODO_ID
```

```json
{
  "assignedTo": "NEW_USER_ID"
}
```

---

## Step 13: Add Comment

```http
POST http://localhost:5000/api/todos/TODO_ID/comments
```

```json
{
  "comment": "This task is currently in progress."
}
```

---

## Step 14: Get Comments

```http
GET http://localhost:5000/api/todos/TODO_ID/comments
```

---

## Step 15: Get Activity History

```http
GET http://localhost:5000/api/todos/TODO_ID/activities
```

You should see activities such as:

```text
created
assigned
status_changed
priority_changed
comment_added
```

---

## Step 16: Upload Attachment

Use:

```http
POST http://localhost:5000/api/todos/TODO_ID/attachment
```

In Postman:

```text
Body
→ form-data

file → File → Select File
```

Check that the returned URL is a Cloudinary URL.

---

## Step 17: Soft Delete Todo

```http
DELETE http://localhost:5000/api/todos/TODO_ID
```

---

## Step 18: Verify Deleted Todo Is Hidden

```http
GET http://localhost:5000/api/todos
```

The deleted todo should not appear in the normal todo list.

---

## Step 19: Admin Trash

Login using an admin account.

```http
GET http://localhost:5000/api/admin/todos/trash
```

The deleted todo should appear in the trash.

---

## Step 20: Restore Todo

```http
PATCH http://localhost:5000/api/admin/todos/TODO_ID/restore
```

The todo should become active again.

---

# ❌ Common Errors

## MongoDB Connection Error

Example:

```text
connect ECONNREFUSED 127.0.0.1:27017
```

Check whether MongoDB is running.

Also check:

```env
MONGO_URI=mongodb://127.0.0.1:27017/todo-api
```

---

## Invalid JWT Token

Example:

```json
{
  "success": false,
  "message": "Invalid token"
}
```

Login again and copy a new token.

Make sure Postman Authorization is:

```text
Bearer Token
```

Do not manually add an incorrect token format.

---

## No Token Provided

Example:

```json
{
  "success": false,
  "message": "No token provided"
}
```

Add the JWT token in:

```text
Authorization
→ Bearer Token
```

---

## Assigned User Not Found

Example:

```json
{
  "success": false,
  "message": "Assigned user not found"
}
```

Check that `assignedTo` contains a valid MongoDB user ID.

---

## assignedTo Is Required

Example:

```json
{
  "success": false,
  "message": "assignedTo is required"
}
```

Send a valid user ID:

```json
{
  "assignedTo": "USER_ID"
}
```

---

## Invalid Priority

Allowed values:

```text
low
medium
high
```

Example invalid value:

```json
{
  "priority": "urgent"
}
```

Use one of the supported priority values.

---

# 🧪 Run Tests

Run:

```bash
npm test
```

If your test script is configured differently, check `package.json`.

Example:

```json
{
  "scripts": {
    "test": "jest --runInBand --forceExit"
  }
}
```

---

# 🔒 Security Features

The project includes security-related functionality such as:

* Password hashing
* JWT authentication
* Protected routes
* Role-based authorization
* Admin-only routes
* User-based todo visibility
* Assignment validation
* Soft delete protection
* File validation
* Environment variables
* Unauthorized access protection

---

# 📊 Main API Endpoints

## Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/profile
```

## Todos

```text
POST   /api/todos
GET    /api/todos
GET    /api/todos/:id
PUT    /api/todos/:id
DELETE /api/todos/:id
```

## Attachments

```text
POST   /api/todos/:id/attachment
```

## Comments

```text
POST   /api/todos/:todoId/comments
GET    /api/todos/:todoId/comments
```

## Activities

```text
GET    /api/todos/:todoId/activities
```

## Notifications

```text
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
```

## Admin

```text
GET    /api/admin/users
POST   /api/admin/users/:id/make-admin
POST   /api/admin/users/:id/remove-admin

GET    /api/admin/todos/trash
PATCH  /api/admin/todos/:id/restore
```

---

# 🎯 Complete Feature Summary

This Todo API includes:

```text
✓ User Registration
✓ User Login
✓ JWT Authentication
✓ Password Hashing
✓ User Roles
✓ Admin Authorization
✓ Create Todo
✓ Update Todo
✓ Delete Todo
✓ Todo Assignment
✓ Todo Reassignment
✓ User-based Todo Visibility
✓ Todo Search
✓ Todo Filtering
✓ Pagination
✓ Sorting
✓ Due Dates
✓ Priority Levels
✓ Soft Delete
✓ Trash System
✓ Todo Restore
✓ Cloudinary Attachments
✓ Comments System
✓ Notifications System
✓ Mark Notification as Read
✓ Todo Activity History
✓ Complete Audit Logs
✓ Created Activity
✓ Updated Activity
✓ Assigned Activity
✓ Reassigned Activity
✓ Status Changed Activity
✓ Priority Changed Activity
✓ Comment Added Activity
✓ Admin User Management
✓ API Testing
✓ Jest Testing Support
```

---

# 👨‍💻 Development

This project was created for learning and practicing backend development concepts using:

```text
Node.js
Express.js
MongoDB
Mongoose
JWT Authentication
REST APIs
Role-Based Access Control
Cloudinary File Storage
Activity/Audit Logging
Notification Systems
```

---

# 📝 License

This project is created for educational and learning purposes.

You can modify and extend the project with additional features.

---

# ⭐ Future Improvements

Possible future features include:

* Email notifications
* Password reset
* Refresh tokens
* Real-time notifications using Socket.IO
* Todo labels and categories
* Multiple file attachments
* Permanent delete from trash
* Admin dashboard
* User profile image upload
* Dashboard analytics
* Rate limiting
* Swagger API documentation
* Docker support
* CI/CD pipeline
* Deployment

---

# 🎉 Conclusion

The Todo API is a complete backend project that demonstrates important backend development concepts.

It includes authentication, authorization, role management, todo assignment, priorities, due dates, comments, Cloudinary attachments, notifications, soft delete functionality, admin features, and a complete Todo Activity/Audit Log system.

The activity system makes it possible to track important actions performed on every todo, including who performed the action, what changed, the old value, the new value, and when the action occurred.
