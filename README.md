# Todo API

A complete RESTful Todo Management API built with **Node.js, Express.js, MongoDB, and Mongoose**.

This project includes authentication, user roles, Todo CRUD, Todo assignment, due dates, priorities, soft delete, restore, Cloudinary attachments, comments, activity history, and a notification system.

---

# 1. Project Overview

The Todo API allows users to create and manage tasks.

Users can create tasks, assign tasks to other users, set priorities and due dates, upload files, add comments, and track Todo activity.

The system also includes notifications so users can be informed when important actions happen, such as:

* A Todo is assigned to them
* A Todo is updated
* A Todo is completed
* A comment is added
* A due date is approaching
* A Todo is deleted
* A Todo is restored

Admins have additional permissions to manage users, todos, deleted todos, and other administrative operations.

---

# 2. Main Features

## Authentication

* User registration
* User login
* User logout
* JWT authentication
* Password hashing using bcrypt
* Protected API routes
* User profile

## User Management

* User roles
* Normal user
* Admin user
* Make user admin
* Remove admin role
* Admin user management

## Todo Management

* Create Todo
* Get Todo
* Get all Todos
* Update Todo
* Delete Todo
* Search Todos
* Filter Todos
* Pagination
* Sorting

## Todo Assignment

* Assign Todo to a user
* Validate assigned user
* Store creator
* Store assigned user
* Users can see their assigned Todos
* Admin can see all Todos

## Due Date

* Add due date
* Update due date
* Track Todo deadlines

## Priority

Supported priorities:

```text
low
medium
high
```

Invalid priority values are rejected.

## Soft Delete

* Todo is not permanently removed
* Deleted Todo is marked as deleted
* Deleted Todo has deletion date
* Deleted Todo does not appear in normal Todo lists
* Admin can view trash
* Admin can restore Todo

## Attachments

* Upload Todo attachments
* Multer file handling
* Cloudinary upload
* Save Cloudinary URL
* Associate attachment with Todo

## Comments

* Add comments
* Get comments
* Update comments
* Delete comments
* Associate comments with Todo and user

## Activity History

The application records important actions performed on Todos.

Examples:

```text
Todo created
Todo updated
Todo assigned
Status changed
Priority changed
Due date changed
Comment added
Attachment uploaded
Todo deleted
Todo restored
```

## Notification System

The application includes a notification system that informs users when important events happen.

Notifications can be generated when:

```text
Todo is assigned
Todo is updated
Todo status changes
Todo becomes completed
Comment is added
Todo is deleted
Todo is restored
Due date is approaching
```

Users can:

* Get their notifications
* See unread notifications
* Mark one notification as read
* Mark all notifications as read
* Delete notifications
* Check notification count

---

# 3. Technology Stack

## Backend

```text
Node.js
Express.js
```

## Database

```text
MongoDB
Mongoose
```

## Authentication

```text
JSON Web Token
bcrypt
```

## File Upload

```text
Multer
Cloudinary
```

## Configuration

```text
dotenv
```

## Testing

```text
Jest
Supertest
```

## Development

```text
Nodemon
```

---

# 4. Project Architecture

The project follows a layered backend structure.

```text
Client / Postman
        |
        v
      Routes
        |
        v
   Middleware
        |
        v
   Controllers
        |
        v
     Models
        |
        v
    MongoDB
```

For example:

```text
Postman
   |
   v
todoRoutes.js
   |
   v
authMiddleware.js
   |
   v
todoController.js
   |
   v
Todo.js
   |
   v
MongoDB
```

Notification flow:

```text
Todo Action
    |
    v
Controller
    |
    v
Create Notification
    |
    v
Notification Model
    |
    v
MongoDB
    |
    v
User Notification API
```

---

# 5. Project Folder Structure

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
│   ├── adminController.js
│   ├── commentController.js
│   └── notificationController.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── adminMiddleware.js
│   └── uploadMiddleware.js
│
├── models/
│   ├── User.js
│   ├── Todo.js
│   ├── Comment.js
│   ├── Activity.js
│   └── Notification.js
│
├── routes/
│   ├── authRoutes.js
│   ├── todoRoutes.js
│   ├── adminRoutes.js
│   ├── commentRoutes.js
│   └── notificationRoutes.js
│
├── tests/
│   └── todo.test.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

---

# 6. Installation

Open the terminal inside the project directory.

```bash
cd todo-api
```

Install all dependencies:

```bash
npm install
```

---

# 7. Environment Variables

Create a file named:

```text
.env
```

Example:

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/todo-api

JWT_SECRET=your_jwt_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Do not upload `.env` to GitHub.

Add it to `.gitignore`:

```text
.env
node_modules/
```

---

# 8. MongoDB Setup

Make sure MongoDB is running.

For local MongoDB, the connection normally looks like:

```text
mongodb://127.0.0.1:27017/todo-api
```

The database name is:

```text
todo-api
```

Once the server starts successfully, the console should show a MongoDB connection message.

---

# 9. Cloudinary Setup

The project uses Cloudinary for Todo attachments.

Create a Cloudinary account and get:

```text
Cloud Name
API Key
API Secret
```

Add them to `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Uploaded files are stored in Cloudinary instead of only storing them on the local computer.

The Todo stores the uploaded file URL.

---

# 10. Start the Server

Development:

```bash
npm run dev
```

Normal start:

```bash
npm start
```

Expected output:

```text
Server running on port 5000
MongoDB Connected Successfully
```

Base URL:

```text
http://localhost:5000
```

---

# 11. Authentication

Authentication is based on JWT.

After successful login, the server returns a token.

Example:

```json
{
  "success": true,
  "message": "Login successful",
  "token": "YOUR_JWT_TOKEN"
}
```

The token must be sent with protected requests.

Use this header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

In Postman you can also use:

```text
Authorization
Type: Bearer Token
Token: YOUR_JWT_TOKEN
```

---

# 12. User Registration

## Request

```http
POST /api/auth/register
```

## URL

```text
http://localhost:5000/api/auth/register
```

## Body

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "123456"
}
```

## Another User

```json
{
  "name": "Normal User",
  "email": "user@example.com",
  "password": "123456"
}
```

---

# 13. Login

## Request

```http
POST /api/auth/login
```

## Body

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Copy the returned JWT token.

Keep two tokens during testing:

```text
ADMIN_TOKEN
USER_TOKEN
```

---

# 14. Get Profile

```http
GET /api/auth/profile
```

Authorization:

```text
Bearer USER_TOKEN
```

---

# 15. Logout

```http
POST /api/auth/logout
```

Authorization:

```text
Bearer USER_TOKEN
```

---

# 16. User Roles

The system supports:

```text
user
admin
```

Default role:

```text
user
```

Admin permissions are greater than normal-user permissions.

---

# 17. Admin User APIs

## Get Users

```http
GET /api/admin/users
```

Authorization:

```text
Bearer ADMIN_TOKEN
```

---

## Make User Admin

```http
POST /api/admin/users/:id/make-admin
```

Example:

```text
POST /api/admin/users/USER_ID/make-admin
```

Authorization:

```text
Bearer ADMIN_TOKEN
```

---

## Remove Admin Role

```http
POST /api/admin/users/:id/remove-admin
```

Authorization:

```text
Bearer ADMIN_TOKEN
```

---

# 18. Todo Data

A Todo can contain information such as:

```text
title
description
createdBy
assignedTo
status
dueDate
priority
attachmentUrl
isDeleted
deletedAt
createdAt
updatedAt
```

---

# 19. Todo Status

Supported statuses:

```text
todo
inprogress
complate
```

Example:

```json
{
  "status": "inprogress"
}
```

---

# 20. Todo Priority

Supported priorities:

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

An invalid priority must not be saved.

Example invalid value:

```json
{
  "priority": "urgent"
}
```

---

# 21. Create Todo

## Endpoint

```http
POST /api/todos
```

## URL

```text
http://localhost:5000/api/todos
```

## Authorization

```text
Bearer USER_TOKEN
```

## Body

```json
{
  "title": "Complete Todo API",
  "description": "Complete all Todo API features",
  "assignedTo": "USER_ID",
  "status": "todo",
  "dueDate": "2026-08-30",
  "priority": "high"
}
```

The API automatically stores the logged-in user as:

```text
createdBy
```

---

# 22. Assigned User Validation

When assigning a Todo:

```json
{
  "assignedTo": "USER_ID"
}
```

The system checks whether the user exists.

If the user does not exist, the API returns an error.

Example:

```json
{
  "success": false,
  "message": "Assigned user not found"
}
```

---

# 23. Todo Visibility

## Normal User

A normal user can see:

```text
Todos created by them
+
Todos assigned to them
```

## Admin

An admin can see:

```text
All active Todos
```

---

# 24. Get Todos

```http
GET /api/todos
```

Example:

```text
http://localhost:5000/api/todos
```

---

# 25. Search Todos

```http
GET /api/todos?search=Node
```

Another example:

```http
GET /api/todos?search=project
```

---

# 26. Filter Todos by Status

```http
GET /api/todos?status=todo
```

Example:

```http
GET /api/todos?status=inprogress
```

---

# 27. Pagination

```http
GET /api/todos?page=1&limit=10
```

Example:

```text
page = 1
limit = 10
```

This means:

```text
Return first 10 records
```

---

# 28. Sorting

Newest:

```http
GET /api/todos?sort=newest
```

Oldest:

```http
GET /api/todos?sort=oldest
```

---

# 29. Combined Todo Search

Example:

```http
GET /api/todos?search=Node&status=inprogress&page=1&limit=10&sort=newest
```

This combines:

```text
Search
Status
Pagination
Sorting
```

---

# 30. Get Single Todo

```http
GET /api/todos/:id
```

Example:

```text
GET http://localhost:5000/api/todos/TODO_ID
```

Authorization:

```text
Bearer USER_TOKEN
```

---

# 31. Update Todo

```http
PUT /api/todos/:id
```

Example URL:

```text
http://localhost:5000/api/todos/TODO_ID
```

Body:

```json
{
  "title": "Updated Todo",
  "description": "Updated description",
  "status": "inprogress",
  "dueDate": "2026-09-10",
  "priority": "medium"
}
```

---

# 32. Update Only Priority

```json
{
  "priority": "low"
}
```

---

# 33. Update Only Due Date

```json
{
  "dueDate": "2026-09-20"
}
```

---

# 34. Update Status

```json
{
  "status": "complate"
}
```

A status change can also create an activity record and notification.

---

# 35. Soft Delete

The Delete API uses soft delete.

## Endpoint

```http
DELETE /api/todos/:id
```

Example:

```text
DELETE http://localhost:5000/api/todos/TODO_ID
```

Instead of physically removing the MongoDB document, the Todo is marked:

```text
isDeleted = true
```

and:

```text
deletedAt = current date
```

Deleted Todos are excluded from the normal Todo list.

---

# 36. Admin Trash

Admin can view deleted Todos.

```http
GET /api/admin/todos/trash
```

Authorization:

```text
Bearer ADMIN_TOKEN
```

---

# 37. Restore Todo

```http
PATCH /api/admin/todos/:id/restore
```

Example:

```text
PATCH http://localhost:5000/api/admin/todos/TODO_ID/restore
```

After restore:

```text
isDeleted = false
deletedAt = null
```

The Todo becomes active again.

---

# 38. Attachment System

Todo attachments are handled using:

```text
Multer
+
Cloudinary
```

Files are uploaded using:

```text
multipart/form-data
```

---

# 39. Upload Todo Attachment

## Endpoint

```http
POST /api/todos/:id/attachment
```

Example:

```text
POST http://localhost:5000/api/todos/TODO_ID/attachment
```

Authorization:

```text
Bearer USER_TOKEN
```

In Postman:

```text
Body
→ form-data
```

Add:

```text
Key: attachment
Type: File
Value: Select a file
```

Then click:

```text
Send
```

After successful upload, Cloudinary returns a file URL.

The URL is associated with the Todo.

---

# 40. Comment System

A Comment contains:

```text
todoId
userId
comment
createdAt
updatedAt
```

---

# 41. Add Comment

```http
POST /api/todos/:todoId/comments
```

Example:

```text
POST http://localhost:5000/api/todos/TODO_ID/comments
```

Body:

```json
{
  "comment": "I have started working on this task."
}
```

Authorization:

```text
Bearer USER_TOKEN
```

---

# 42. Get Todo Comments

```http
GET /api/todos/:todoId/comments
```

Example:

```text
GET http://localhost:5000/api/todos/TODO_ID/comments
```

---

# 43. Update Comment

```http
PUT /api/todos/:todoId/comments/:commentId
```

Body:

```json
{
  "comment": "Updated comment text."
}
```

---

# 44. Delete Comment

```http
DELETE /api/todos/:todoId/comments/:commentId
```

---

# 45. Activity History

The Activity system stores important events.

Typical activities:

```text
TODO_CREATED
TODO_UPDATED
TODO_ASSIGNED
TODO_STATUS_CHANGED
TODO_PRIORITY_CHANGED
TODO_DUE_DATE_CHANGED
TODO_DELETED
TODO_RESTORED
COMMENT_ADDED
COMMENT_UPDATED
COMMENT_DELETED
ATTACHMENT_UPLOADED
```

An activity record can contain:

```text
todoId
userId
action
createdAt
```

---

# 46. Get Activity History

```http
GET /api/todos/:todoId/activity
```

Example:

```text
GET http://localhost:5000/api/todos/TODO_ID/activity
```

Authorization:

```text
Bearer USER_TOKEN
```

---

# 47. Notification System

The Notification System informs users about important events.

A notification belongs to a specific user.

A notification can contain:

```text
userId
todoId
type
message
isRead
createdAt
updatedAt
```

---

# 48. Why Notifications Are Needed

Suppose User A creates a Todo and assigns it to User B.

User B should know that:

```text
A new Todo has been assigned to you.
```

The system creates a notification for User B.

Another example:

User B comments on a Todo.

The Todo owner can receive:

```text
A new comment was added to your Todo.
```

This allows users to see important activity without continuously checking every Todo.

---

# 49. Notification Types

The system can use notification types such as:

```text
TODO_ASSIGNED
TODO_UPDATED
TODO_STATUS_CHANGED
TODO_COMPLETED
COMMENT_ADDED
TODO_DELETED
TODO_RESTORED
DUE_DATE_REMINDER
```

---

# 50. Notification Flow

Example: Todo Assignment

```text
User A
  |
  | Creates Todo
  |
  v
Todo Controller
  |
  | assignedTo = User B
  |
  v
Create Notification
  |
  v
Notification Model
  |
  v
MongoDB
  |
  v
User B
```

User B can later retrieve the notification.

---

# 51. Todo Assignment Notification

When a Todo is assigned:

```text
TODO_ASSIGNED
```

Example message:

```text
You have been assigned a new Todo.
```

The notification should be connected to:

```text
userId = assigned user
todoId = assigned Todo
```

---

# 52. Todo Update Notification

When a Todo is updated, a notification can be created for the relevant user.

Example:

```text
The Todo "Complete API" has been updated.
```

Type:

```text
TODO_UPDATED
```

---

# 53. Status Change Notification

When Todo status changes:

```text
todo
→
inprogress
```

or:

```text
inprogress
→
complate
```

a notification can be generated.

Example:

```text
Todo "Complete API" status changed to completed.
```

Type:

```text
TODO_STATUS_CHANGED
```

---

# 54. Comment Notification

When another user comments on a Todo:

```text
COMMENT_ADDED
```

Example:

```text
A new comment was added to your Todo.
```

This notification should normally be sent to the relevant Todo owner or participant.

---

# 55. Due Date Notification

A due-date reminder can notify the user when a Todo deadline is approaching.

Example:

```text
Your Todo "Complete API" is due tomorrow.
```

Type:

```text
DUE_DATE_REMINDER
```

The exact reminder timing depends on how the notification scheduler is implemented.

---

# 56. Delete Notification

When a Todo is deleted:

```text
TODO_DELETED
```

Example:

```text
Todo "Complete API" was deleted.
```

---

# 57. Restore Notification

When an admin restores a Todo:

```text
TODO_RESTORED
```

Example:

```text
Todo "Complete API" has been restored.
```

---

# 58. Notification APIs

The notification system should expose protected endpoints for the logged-in user.

Common endpoints are:

```text
GET    /api/notifications
GET    /api/notifications/unread
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
```

Use the exact route names implemented in the project when testing.

---

# 59. Get Notifications

```http
GET /api/notifications
```

Authorization:

```text
Bearer USER_TOKEN
```

This returns notifications belonging to the logged-in user.

A user must not receive another user's private notifications.

---

# 60. Get Unread Notifications

```http
GET /api/notifications/unread
```

Authorization:

```text
Bearer USER_TOKEN
```

This returns notifications where:

```text
isRead = false
```

---

# 61. Mark Notification as Read

```http
PATCH /api/notifications/NOTIFICATION_ID/read
```

Authorization:

```text
Bearer USER_TOKEN
```

After the request:

```text
isRead = true
```

---

# 62. Mark All Notifications as Read

```http
PATCH /api/notifications/read-all
```

Authorization:

```text
Bearer USER_TOKEN
```

This marks all notifications belonging to the logged-in user as read.

---

# 63. Delete Notification

```http
DELETE /api/notifications/NOTIFICATION_ID
```

Authorization:

```text
Bearer USER_TOKEN
```

Only the owner of the notification should be able to remove it.

---

# 64. Notification Example

Example stored notification:

```json
{
  "userId": "USER_ID",
  "todoId": "TODO_ID",
  "type": "TODO_ASSIGNED",
  "message": "You have been assigned a new Todo.",
  "isRead": false
}
```

After reading:

```json
{
  "userId": "USER_ID",
  "todoId": "TODO_ID",
  "type": "TODO_ASSIGNED",
  "message": "You have been assigned a new Todo.",
  "isRead": true
}
```

---

# 65. Important Notification Security Rule

A logged-in user should only see their own notifications.

For example:

```text
User A
```

must not be able to request:

```text
User B notifications
```

The notification controller should use the authenticated user ID from JWT.

---

# 66. Notification Testing in Postman

The following workflow is recommended.

---

## Step 1: Register Admin

```http
POST http://localhost:5000/api/auth/register
```

Body:

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "123456"
}
```

---

## Step 2: Register User

```http
POST http://localhost:5000/api/auth/register
```

Body:

```json
{
  "name": "Normal User",
  "email": "user@example.com",
  "password": "123456"
}
```

---

## Step 3: Login Admin

```http
POST http://localhost:5000/api/auth/login
```

Body:

```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

Save:

```text
ADMIN_TOKEN
```

---

## Step 4: Login Normal User

```http
POST http://localhost:5000/api/auth/login
```

Body:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Save:

```text
USER_TOKEN
```

---

# 67. Notification Test - Assignment

Create a Todo and assign it to the normal user.

Use:

```http
POST /api/todos
```

Body:

```json
{
  "title": "Test Notification",
  "description": "Testing assignment notification",
  "assignedTo": "USER_ID",
  "status": "todo",
  "priority": "high",
  "dueDate": "2026-08-30"
}
```

After successful assignment, the notification system should create a notification for the assigned user.

---

# 68. Check User Notifications

Login using the normal user's token.

Then call:

```http
GET /api/notifications
```

Authorization:

```text
Bearer USER_TOKEN
```

You should see the assignment notification.

Example:

```json
{
  "type": "TODO_ASSIGNED",
  "message": "You have been assigned a new Todo.",
  "isRead": false
}
```

---

# 69. Check Unread Notifications

```http
GET /api/notifications/unread
```

Authorization:

```text
Bearer USER_TOKEN
```

The notification should appear because:

```text
isRead = false
```

---

# 70. Mark Notification as Read

Copy the notification ID.

Then:

```http
PATCH /api/notifications/NOTIFICATION_ID/read
```

Authorization:

```text
Bearer USER_TOKEN
```

The notification should become:

```text
isRead = true
```

---

# 71. Check Unread Again

Call:

```http
GET /api/notifications/unread
```

The notification that was marked as read should no longer appear in the unread list.

---

# 72. Mark All Notifications as Read

```http
PATCH /api/notifications/read-all
```

Authorization:

```text
Bearer USER_TOKEN
```

All notifications for that user should become:

```text
isRead = true
```

---

# 73. Test Comment Notification

1. Create a Todo.
2. Assign it to another user.
3. Add a comment.
4. Login as the user who should receive the notification.
5. Call:

```http
GET /api/notifications
```

Check that the comment notification exists.

Example:

```text
A new comment was added to your Todo.
```

---

# 74. Test Status Notification

Update a Todo:

```http
PUT /api/todos/TODO_ID
```

Body:

```json
{
  "status": "complate"
}
```

Then check:

```http
GET /api/notifications
```

A status-related notification should be generated according to the implemented notification rules.

---

# 75. Test Delete Notification

Delete a Todo:

```http
DELETE /api/todos/TODO_ID
```

Then check notifications for the relevant user.

Expected type:

```text
TODO_DELETED
```

---

# 76. Test Restore Notification

Admin restores the Todo:

```http
PATCH /api/admin/todos/TODO_ID/restore
```

Then check notifications.

Expected type:

```text
TODO_RESTORED
```

---

# 77. Complete Postman Testing Order

For testing the complete system, use this order:

```text
1. Start MongoDB
2. Start Node server
3. Register Admin
4. Register User
5. Login Admin
6. Login User
7. Make user Admin if required
8. Create Todo
9. Assign Todo
10. Get Todos
11. Search Todo
12. Filter Todo
13. Test pagination
14. Test sorting
15. Update Todo
16. Update priority
17. Update due date
18. Upload attachment
19. Add comment
20. Get comments
21. Update comment
22. Check activity
23. Check notification
24. Check unread notification
25. Mark notification as read
26. Mark all notifications as read
27. Delete comment
28. Soft delete Todo
29. Check admin trash
30. Restore Todo
31. Check activity again
32. Check restore notification
```

---

# 78. Important IDs Required During Postman Testing

Keep these values available:

```text
ADMIN_USER_ID
USER_ID
TODO_ID
COMMENT_ID
NOTIFICATION_ID
ADMIN_TOKEN
USER_TOKEN
```

These values will be required by different endpoints.

---

# 79. Postman Environment Variables

For easier testing, create a Postman environment.

Recommended variables:

```text
baseUrl
adminToken
userToken
adminUserId
userId
todoId
commentId
notificationId
```

Example:

```text
baseUrl = http://localhost:5000
```

Then use:

```text
{{baseUrl}}/api/todos
```

Instead of:

```text
http://localhost:5000/api/todos
```

---

# 80. Recommended Authorization Setup

For normal user requests:

```text
Bearer {{userToken}}
```

For admin requests:

```text
Bearer {{adminToken}}
```

This makes testing faster and easier.

---

# 81. Example Postman Collection Structure

```text
Todo API
│
├── Auth
│   ├── Register Admin
│   ├── Register User
│   ├── Login Admin
│   ├── Login User
│   ├── Profile
│   └── Logout
│
├── Todos
│   ├── Create Todo
│   ├── Get Todos
│   ├── Get Todo
│   ├── Search Todo
│   ├── Filter Todo
│   ├── Pagination
│   ├── Sort
│   ├── Update Todo
│   ├── Upload Attachment
│   └── Delete Todo
│
├── Comments
│   ├── Add Comment
│   ├── Get Comments
│   ├── Update Comment
│   └── Delete Comment
│
├── Activity
│   └── Get Activity
│
├── Notifications
│   ├── Get Notifications
│   ├── Get Unread Notifications
│   ├── Mark Notification Read
│   ├── Mark All Read
│   └── Delete Notification
│
└── Admin
    ├── Get Users
    ├── Make Admin
    ├── Remove Admin
    ├── Trash
    └── Restore Todo
```

---

# 82. Common Errors

## Error: assignedTo is required

Example:

```json
{
  "success": false,
  "message": "assignedTo is required"
}
```

Solution:

Add:

```json
{
  "assignedTo": "USER_ID"
}
```

---

# 83. Error: Assigned User Not Found

Example:

```json
{
  "success": false,
  "message": "Assigned user not found"
}
```

Solution:

Check that the assigned user ID exists in MongoDB.

---

# 84. Error: Unauthorized

Example:

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

Check:

```text
Authorization header
JWT token
Bearer prefix
```

Correct format:

```text
Authorization: Bearer YOUR_TOKEN
```

---

# 85. Error: Invalid Token

Check that:

* Token is copied correctly
* Token has not expired
* Bearer token is being sent
* JWT_SECRET is correct

---

# 86. Error: Admin Access Required

If a normal user calls an admin endpoint, access should be rejected.

Examples of admin endpoints:

```text
/api/admin/users
/api/admin/todos/trash
/api/admin/todos/:id/restore
```

Login as an admin and use:

```text
ADMIN_TOKEN
```

---

# 87. Error: Invalid Priority

Only these are accepted:

```text
low
medium
high
```

Do not use:

```text
urgent
normal
important
```

---

# 88. MongoDB Connection Error

Example:

```text
ECONNREFUSED 127.0.0.1:27017
```

This normally means MongoDB is not running or the connection string is incorrect.

Check:

```env
MONGO_URI=mongodb://127.0.0.1:27017/todo-api
```

Then make sure MongoDB is running.

---

# 89. Cloudinary Upload Error

Check:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Also verify:

* Internet connection
* Cloudinary credentials
* File field name
* Postman uses `form-data`
* File field type is `File`

---

# 90. Notification Debugging

When a notification is expected but is not created, check:

```text
1. Is the event controller being executed?
2. Is the target user ID correct?
3. Is Notification model imported?
4. Is the notification saved to MongoDB?
5. Is the notification endpoint protected correctly?
6. Is the logged-in user the notification owner?
7. Is isRead initially false?
```

For assignment notifications, especially check:

```text
assignedTo
```

For comment notifications, check:

```text
todo owner
comment author
```

---

# 91. Notification Ownership

Every notification should be associated with the user who should receive it.

Example:

```text
User A creates Todo
User B is assigned
```

Notification:

```text
userId = User B
```

Not:

```text
userId = User A
```

This prevents notifications from being shown to the wrong user.

---

# 92. Data Relationships

The main relationships are:

```text
User
 |
 +---- createdBy ----> Todo
 |
 +---- assignedTo ---> Todo
 |
 +---- userId -------> Comment
 |
 +---- userId -------> Activity
 |
 +---- userId -------> Notification
```

Todo relationships:

```text
Todo
 |
 +---- createdBy
 |
 +---- assignedTo
 |
 +---- comments
 |
 +---- activities
 |
 +---- notifications
 |
 +---- attachment
```

---

# 93. Security Rules

The API should follow these rules:

```text
1. Passwords must be hashed.
2. JWT is required for protected routes.
3. Normal users cannot access admin routes.
4. Users can only access allowed Todos.
5. Users cannot read another user's private notifications.
6. Assigned users must exist.
7. Invalid priority values must be rejected.
8. Soft-deleted Todos should not appear in normal lists.
9. Admin-only restore operation must be protected.
10. Uploaded files must be validated.
```

---

# 94. API Feature Summary

| Feature               | Supported |
| --------------------- | --------- |
| User Registration     | Yes       |
| User Login            | Yes       |
| JWT Authentication    | Yes       |
| Logout                | Yes       |
| User Profile          | Yes       |
| User Roles            | Yes       |
| Admin Management      | Yes       |
| Todo CRUD             | Yes       |
| Todo Assignment       | Yes       |
| Todo Search           | Yes       |
| Todo Filter           | Yes       |
| Pagination            | Yes       |
| Sorting               | Yes       |
| Due Date              | Yes       |
| Priority              | Yes       |
| Soft Delete           | Yes       |
| Restore               | Yes       |
| Cloudinary Attachment | Yes       |
| Comments              | Yes       |
| Activity History      | Yes       |
| Notifications         | Yes       |
| Read Notifications    | Yes       |
| Unread Notifications  | Yes       |

---

# 95. Complete API Endpoint Reference

## Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/profile
```

## Todos

```text
POST   /api/todos
GET    /api/todos
GET    /api/todos/:id
PUT    /api/todos/:id
DELETE /api/todos/:id
POST   /api/todos/:id/attachment
```

## Comments

```text
POST   /api/todos/:todoId/comments
GET    /api/todos/:todoId/comments
PUT    /api/todos/:todoId/comments/:commentId
DELETE /api/todos/:todoId/comments/:commentId
```

## Activity

```text
GET    /api/todos/:todoId/activity
```

## Notifications

```text
GET    /api/notifications
GET    /api/notifications/unread
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
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

# 96. Testing Checklist

Use this checklist before considering the API complete.

* [ ] MongoDB is running
* [ ] `.env` is configured
* [ ] Cloudinary credentials are configured
* [ ] Dependencies are installed
* [ ] Server starts successfully
* [ ] User registration works
* [ ] Login works
* [ ] JWT authentication works
* [ ] Profile API works
* [ ] Logout works
* [ ] Admin authorization works
* [ ] Todo creation works
* [ ] Todo assignment works
* [ ] Assigned user validation works
* [ ] Todo listing works
* [ ] Todo search works
* [ ] Todo filtering works
* [ ] Pagination works
* [ ] Sorting works
* [ ] Due date works
* [ ] Priority works
* [ ] Invalid priority is rejected
* [ ] Todo update works
* [ ] Attachment upload works
* [ ] Cloudinary URL is saved
* [ ] Comment creation works
* [ ] Comment listing works
* [ ] Comment update works
* [ ] Comment delete works
* [ ] Activity history works
* [ ] Soft delete works
* [ ] Deleted Todo disappears from normal list
* [ ] Admin trash works
* [ ] Restore works
* [ ] Assignment notification works
* [ ] Update notification works
* [ ] Comment notification works
* [ ] Status notification works
* [ ] Delete notification works
* [ ] Restore notification works
* [ ] Unread notifications work
* [ ] Mark notification as read works
* [ ] Mark all notifications as read works
* [ ] Delete notification works
* [ ] Notification ownership works

---

# 97. Running Tests

If Jest is configured in the project:

```bash
npm test
```

For Jest in-band:

```bash
npx jest --runInBand
```

For force exit:

```bash
npx jest --runInBand --forceExit
```

---

# 98. Development Commands

Install packages:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Start production-style server:

```bash
npm start
```

Run tests:

```bash
npm test
```

---

# 99. Git Ignore

Recommended `.gitignore`:

```text
node_modules/
.env
coverage/
uploads/
```

Never commit:

```text
.env
```

because it may contain:

```text
JWT_SECRET
Cloudinary credentials
MongoDB credentials
```

---

# 100. Complete System Flow

The complete application can be understood with this flow:

```text
User
 |
 v
Register
 |
 v
Login
 |
 v
JWT Token
 |
 v
Protected API
 |
 +-----------------------------+
 |                             |
 v                             v
Todo Management             Notification System
 |                             |
 +-- Create                    +-- Assignment
 +-- Update                    +-- Update
 +-- Assign                    +-- Status Change
 +-- Priority                  +-- Comment
 +-- Due Date                  +-- Delete
 +-- Attachment                +-- Restore
 +-- Comment                   +-- Due Reminder
 +-- Activity
 |
 v
MongoDB
 |
 +---- Users
 +---- Todos
 +---- Comments
 +---- Activities
 +---- Notifications
```

---

# 101. Example Real-World Workflow

A complete example:

```text
1. Admin registers.
2. Normal user registers.
3. Admin logs in.
4. Normal user logs in.
5. Admin creates a Todo.
6. Admin assigns Todo to normal user.
7. Normal user receives assignment notification.
8. Normal user opens notifications.
9. Normal user marks notification as read.
10. Normal user updates Todo status.
11. Activity is created.
12. Relevant notification is created.
13. Normal user uploads an attachment.
14. Cloudinary stores the attachment.
15. Normal user adds a comment.
16. Relevant user receives comment notification.
17. Todo is completed.
18. Activity is stored.
19. Todo is soft deleted.
20. Admin checks trash.
21. Admin restores Todo.
22. Restore activity is stored.
23. Restore notification is generated.
```

---

# 102. Final Project Goal

This project demonstrates a complete backend API with:

```text
Authentication
+
Authorization
+
CRUD
+
User Assignment
+
Validation
+
Search
+
Filtering
+
Pagination
+
Sorting
+
Due Dates
+
Priority
+
Soft Delete
+
Restore
+
Cloudinary Uploads
+
Comments
+
Activity History
+
Notifications
+
Admin Management
```

The architecture is designed so that each feature is separated into:

```text
Models
Controllers
Routes
Middleware
Configuration
```

This keeps the API easier to maintain, test, and extend.

---

# 103. Base URL

For local development:

```text
http://localhost:5000
```

Example:

```text
http://localhost:5000/api/todos
```

---

# 104. Project Status

```text
Todo API
Version: 1.0.0
Environment: Development
Database: MongoDB
Authentication: JWT
File Storage: Cloudinary
API Testing: Postman
Automated Testing: Jest + Supertest
```

---

# 105. Conclusion

The Todo API provides a complete backend system for managing tasks and users.

It supports secure authentication, role-based access, Todo management, assignment, deadlines, priorities, file attachments, comments, activity history, soft deletion, restoration, and notifications.

The notification system makes the application more interactive by informing users about important Todo events such as assignments, comments, updates, status changes, deletions, restorations, and due-date reminders.

The API can be extended in the future with features such as:

```text
Email Notifications
Push Notifications
WebSocket / Real-Time Notifications
Notification Preferences
Reminder Scheduler
Recurring Todos
Team Management
Advanced Reporting
Dashboard Statistics
```

---
