Todo API with JWT Authentication

A secure RESTful Todo API built with Node.js, Express.js, MongoDB, Mongoose, JWT Authentication, and bcrypt password hashing.

This project allows users to register, log in, receive a JWT token, access protected routes, and manage only their own todos.

🚀 Features
Authentication
User Registration
User Login
JWT Access Token
Password Hashing using bcrypt
Protected Profile Route
Logout API
Invalid Token Handling
Missing Token Handling
Todo Management
Create Todo
Get All User Todos
Get Todo by ID
Update Todo
Update Todo Status
Delete Todo
Search Todos
Filter Todos by Status
Sort Todos
Pagination
Todo Statistics
Security
Passwords are hashed using bcryptjs
Plain-text passwords are never stored
JWT protects private routes
Users can access only their own todos
Helmet security middleware
CORS enabled
Rate limiting
Global error handling
Testing
Authentication tests
JWT token tests
Protected route tests
Todo CRUD tests
Jest
Supertest
🛠 Tech Stack
Node.js
Express.js
MongoDB
Mongoose
JSON Web Token (JWT)
bcryptjs
Jest
Supertest
Nodemon
Helmet
CORS
Morgan
express-rate-limit
📁 Project Structure
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
⚙️ Installation
1. Clone the Repository
git clone YOUR_REPOSITORY_URL

Move into the project folder:

cd todo-api
2. Install Dependencies
npm install

The main authentication packages are:

npm install bcryptjs jsonwebtoken
🔐 Environment Variables

Create a .env file in the root directory.

PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/todoDB

NODE_ENV=development

JWT_SECRET=your_super_secret_jwt_key_change_this

JWT_EXPIRES_IN=7d
Environment Variables Explanation
Variable	Description
PORT	Port where the server runs
MONGO_URI	MongoDB connection URL
NODE_ENV	Application environment
JWT_SECRET	Secret key used to generate JWT tokens
JWT_EXPIRES_IN	JWT token expiration time

⚠️ Never upload your real .env file to GitHub.

▶️ Run the Application
Development Mode
npm run dev

The server will start at:

http://localhost:5000
Production Mode
npm start
🧪 Run Tests
npm test

Expected result:

PASS tests/auth.test.js
PASS tests/todo.test.js

Test Suites: 2 passed, 2 total
🌐 API Base URL
http://localhost:5000/api
🔄 Authentication Flow
Register User
      ↓
Password Hashing with bcrypt
      ↓
User Stored in MongoDB
      ↓
Login User
      ↓
Password Verification
      ↓
JWT Token Generated
      ↓
Client Receives Token
      ↓
Send Token in Authorization Header
      ↓
Access Protected Routes
🔑 JWT Authorization

After logging in, the API returns a JWT token.

Use the token in protected routes:

Authorization: Bearer YOUR_JWT_TOKEN

Example:

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
📡 API Endpoints
Authentication
Method	Endpoint	Description	Protected
POST	/api/auth/register	Register a new user	❌
POST	/api/auth/login	Login and get JWT token	❌
POST	/api/auth/logout	Logout user	❌
GET	/api/profile	Get logged-in user profile	✅
Todos
Method	Endpoint	Description	Protected
POST	/api/todos	Create Todo	✅
GET	/api/todos	Get all user Todos	✅
GET	/api/todos/stats	Get Todo statistics	✅
GET	/api/todos/:id	Get Todo by ID	✅
PUT	/api/todos/:id	Update Todo	✅
PATCH	/api/todos/:id/status	Update Todo status	✅
DELETE	/api/todos/:id	Delete Todo	✅
👤 Register User
Endpoint
POST /api/auth/register
Request Body
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
Success Response

Status: 201 Created

{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "USER_ID",
    "name": "Test User",
    "email": "test@example.com",
    "createdAt": "2026-08-12T00:00:00.000Z"
  }
}
Validation
Name is required
Name must be at least 2 characters
Email is required
Email must be valid
Email must be unique
Password is required
Password must be at least 6 characters
🔓 Login User
Endpoint
POST /api/auth/login
Request Body
{
  "email": "test@example.com",
  "password": "password123"
}
Success Response

Status: 200 OK

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

Copy the token and use it for protected routes.

👋 Logout User
Endpoint
POST /api/auth/logout
Response
{
  "success": true,
  "message": "Logout successful. Please remove the token from the client."
}

JWT is stateless. The client should remove the token from localStorage, sessionStorage, cookies, or application state.

👤 Get User Profile
Endpoint
GET /api/profile
Authorization Header
Authorization: Bearer YOUR_JWT_TOKEN
Success Response

Status: 200 OK

{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "_id": "USER_ID",
    "name": "Test User",
    "email": "test@example.com"
  }
}
❌ Authentication Errors
No Token

Request without an Authorization header.

Response

Status: 401 Unauthorized

{
  "success": false,
  "message": "Not authorized. Token is required"
}
Invalid Token
Authorization: Bearer invalid-token
Response

Status: 401 Unauthorized

{
  "success": false,
  "message": "Invalid or expired token"
}
📝 Create Todo
Endpoint
POST /api/todos
Authorization
Authorization: Bearer YOUR_JWT_TOKEN
Request Body
{
  "title": "Learn JWT Authentication",
  "status": "todo"
}
Success Response

Status: 201 Created

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

The user field is automatically assigned from the authenticated JWT token.

📋 Todo Status Values

The project supports the following status values:

todo
inprogress
complate

Examples:

{
  "status": "todo"
}
{
  "status": "inprogress"
}
{
  "status": "complate"
}

Note: The project currently uses complate as the completed status value.

📚 Get All Todos
Endpoint
GET /api/todos
Authorization
Authorization: Bearer YOUR_JWT_TOKEN

The API returns only the todos belonging to the logged-in user.

Example Response
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
🔍 Search Todos

Search by Todo title:

GET /api/todos?search=JWT

Example:

GET /api/todos?search=Node

The search is case-insensitive.

🎯 Filter Todos

Filter by status:

GET /api/todos?status=todo

Other examples:

GET /api/todos?status=inprogress
GET /api/todos?status=complate
📄 Pagination
Example
GET /api/todos?page=1&limit=10
Parameters
Parameter	Description
page	Current page number
limit	Number of Todos per page

Rules:

page must be greater than or equal to 1
limit must be between 1 and 100

Example:

GET /api/todos?page=2&limit=5
↕️ Sorting
Newest First
GET /api/todos?sort=newest

This is the default.

Oldest First
GET /api/todos?sort=oldest
🔎 Combined Query Example

You can combine search, filtering, pagination, and sorting:

GET /api/todos?search=Node&status=inprogress&page=1&limit=10&sort=newest
📌 Get Todo by ID
Endpoint
GET /api/todos/:id

Example:

GET /api/todos/68a123456789abcdef123456
Authorization
Authorization: Bearer YOUR_JWT_TOKEN

Users can only access their own todos.

If the Todo belongs to another user:

{
  "success": false,
  "message": "Todo not found"
}
✏️ Update Todo
Endpoint
PUT /api/todos/:id
Authorization
Authorization: Bearer YOUR_JWT_TOKEN
Update Title
{
  "title": "Learn JWT Authentication"
}
Update Status
{
  "status": "inprogress"
}
Update Both
{
  "title": "Build Secure Todo API",
  "status": "complate"
}
Success Response
{
  "success": true,
  "message": "Todo updated successfully",
  "data": {
    "_id": "TODO_ID",
    "title": "Build Secure Todo API",
    "status": "complate",
    "user": "USER_ID"
  }
}
🔄 Update Todo Status
Endpoint
PATCH /api/todos/:id/status
Authorization
Authorization: Bearer YOUR_JWT_TOKEN
Request Body
{
  "status": "complate"
}
Success Response
{
  "success": true,
  "message": "Todo status updated successfully",
  "data": {
    "_id": "TODO_ID",
    "title": "Learn JWT Authentication",
    "status": "complate",
    "user": "USER_ID"
  }
}
📊 Todo Statistics
Endpoint
GET /api/todos/stats
Authorization
Authorization: Bearer YOUR_JWT_TOKEN
Success Response
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

Statistics include only the authenticated user's todos.

🗑️ Delete Todo
Endpoint
DELETE /api/todos/:id
Authorization
Authorization: Bearer YOUR_JWT_TOKEN
Success Response
{
  "success": true,
  "message": "Todo deleted successfully",
  "data": {
    "_id": "TODO_ID",
    "title": "Learn JWT Authentication",
    "status": "complate",
    "user": "USER_ID"
  }
}
🔒 Todo Ownership

Every Todo belongs to a user.

JWT Token
    ↓
Authentication Middleware
    ↓
req.user
    ↓
req.user._id
    ↓
Todo user field

This ensures users can only:

Create their own todos
View their own todos
Update their own todos
Delete their own todos
View their own Todo statistics
🔐 Password Security

Passwords are never stored as plain text.

User Password
      ↓
bcrypt Hashing
      ↓
Hashed Password
      ↓
MongoDB

During login:

Entered Password
      ↓
bcrypt.compare()
      ↓
Compare with Stored Hash
      ↓
Valid or Invalid
🛡️ JWT Protected Routes

The authentication middleware performs the following steps:

Checks the Authorization header
Extracts the Bearer token
Verifies the JWT token
Finds the user
Adds the user to req.user
Allows access to the protected route

Protected routes include:

GET    /api/profile

POST   /api/todos
GET    /api/todos
GET    /api/todos/stats
GET    /api/todos/:id
PUT    /api/todos/:id
PATCH  /api/todos/:id/status
DELETE /api/todos/:id
🚦 Rate Limiting

The API allows:

20 requests per IP
within 1 minute

If the limit is exceeded:

{
  "success": false,
  "message": "Too many requests. Please try again later."
}
🧪 Testing

The project uses:

Jest
Supertest

Run all tests:

npm test
✅ Authentication Test Cases

The authentication tests verify:

Register User
      ↓
201 Created
Login User
      ↓
JWT Token Returned
GET /api/profile
Without Token
      ↓
401 Unauthorized
GET /api/profile
Invalid Token
      ↓
401 Unauthorized
GET /api/profile
Valid Token
      ↓
200 OK
🔁 Complete Integration Test Flow

The Todo API tests follow this flow:

Register User
      ↓
Login User
      ↓
Receive JWT Token
      ↓
Create Todo
      ↓
Get Todos
      ↓
Get Todo by ID
      ↓
Update Todo
      ↓
Update Todo Status
      ↓
Get Todo Statistics
      ↓
Delete Todo
❗ Common Errors
MongoDB Connection Failed

Make sure MongoDB is running.

On Windows:

Get-Service MongoDB

Check your .env:

MONGO_URI=mongodb://127.0.0.1:27017/todoDB
Missing JWT Token
{
  "success": false,
  "message": "Not authorized. Token is required"
}

Solution:

Authorization: Bearer YOUR_JWT_TOKEN
Invalid or Expired Token
{
  "success": false,
  "message": "Invalid or expired token"
}

Solution: Login again and use a new token.

Invalid Todo ID
{
  "success": false,
  "message": "Invalid Todo ID"
}

Make sure the ID is a valid MongoDB ObjectId.

Todo Not Found
{
  "success": false,
  "message": "Todo not found"
}

Possible reasons:

Todo does not exist
Todo belongs to another user
User Already Exists
{
  "success": false,
  "message": "User already exists with this email"
}

Use a different email address.

🔄 Complete API Flow
1. Register User

POST /api/auth/register

        ↓

2. Login User

POST /api/auth/login

        ↓

3. Receive JWT Token

        ↓

4. Add Authorization Header

Authorization: Bearer YOUR_JWT_TOKEN

        ↓

5. Get User Profile

GET /api/profile

        ↓

6. Create Todo

POST /api/todos

        ↓

7. Get User Todos

GET /api/todos

        ↓

8. Update Todo

PUT /api/todos/:id

        ↓

9. Update Todo Status

PATCH /api/todos/:id/status

        ↓

10. Get Todo Statistics

GET /api/todos/stats

        ↓

11. Delete Todo

DELETE /api/todos/:id

        ↓

12. Logout

POST /api/auth/logout
📄 License

This project is licensed under the ISC License.

👨‍💻 Author

Built as a Node.js REST API project using:

Node.js • Express.js • MongoDB • Mongoose • JWT • bcryptjs • Jest • Supertest