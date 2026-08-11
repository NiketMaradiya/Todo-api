const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");
const Todo = require("../models/Todo");

describe("Todo API", () => {
  let todoId;

  // ==========================================
  // Before All Tests
  // ==========================================

  beforeAll(async () => {
    await Todo.deleteMany({});
  });

  // ==========================================
  // After All Tests
  // ==========================================

  afterAll(async () => {
    await Todo.deleteMany({});

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ==========================================
  // 1. API Status
  // ==========================================

  test("GET / should return API status", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Todo API is Running 🚀"
    );
  });

  // ==========================================
  // 2. Create Todo
  // ==========================================

  test("POST /api/todos should create Todo", async () => {
    const response = await request(app)
      .post("/api/todos")
      .send({
        title: "Learn Jest",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Todo created successfully"
    );

    expect(response.body.data.title).toBe(
      "Learn Jest"
    );

    expect(response.body.data.status).toBe("todo");

    expect(response.body.data._id).toBeDefined();

    todoId = response.body.data._id;
  });

  // ==========================================
  // 3. Create In Progress Todo
  // ==========================================

  test("POST /api/todos should create inprogress Todo", async () => {
    const response = await request(app)
      .post("/api/todos")
      .send({
        title: "Learn Supertest",
        status: "inprogress",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.title).toBe(
      "Learn Supertest"
    );

    expect(response.body.data.status).toBe(
      "inprogress"
    );
  });

  // ==========================================
  // 4. Create Complate Todo
  // ==========================================

  test("POST /api/todos should create complate Todo", async () => {
    const response = await request(app)
      .post("/api/todos")
      .send({
        title: "Learn MongoDB",
        status: "complate",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.status).toBe(
      "complate"
    );
  });

  // ==========================================
  // 5. Missing Title
  // ==========================================

  test("POST /api/todos should reject missing title", async () => {
    const response = await request(app)
      .post("/api/todos")
      .send({});

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Title is required"
    );
  });

  // ==========================================
  // 6. Empty Title
  // ==========================================

  test("POST /api/todos should reject empty title", async () => {
    const response = await request(app)
      .post("/api/todos")
      .send({
        title: "",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Title cannot be empty"
    );
  });

  // ==========================================
  // 7. Invalid Title Type
  // ==========================================

  test("POST /api/todos should reject non-string title", async () => {
    const response = await request(app)
      .post("/api/todos")
      .send({
        title: 123,
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Title must be a string"
    );
  });

  // ==========================================
  // 8. Invalid Status
  // ==========================================

  test("POST /api/todos should reject invalid status", async () => {
    const response = await request(app)
      .post("/api/todos")
      .send({
        title: "Invalid Todo",
        status: "pending",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Status must be todo, inprogress or complate"
    );
  });

  // ==========================================
  // 9. Get All Todos
  // ==========================================

  test("GET /api/todos should return Todos", async () => {
    const response = await request(app)
      .get("/api/todos");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Todos fetched successfully"
    );

    expect(Array.isArray(response.body.data)).toBe(
      true
    );

    expect(response.body.pagination).toBeDefined();
  });

  // ==========================================
  // 10. Get Todo By ID
  // ==========================================

  test("GET /api/todos/:id should return Todo", async () => {
    const response = await request(app)
      .get(`/api/todos/${todoId}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Todo fetched successfully"
    );

    expect(response.body.data._id).toBe(todoId);

    expect(response.body.data.title).toBe(
      "Learn Jest"
    );

    expect(response.body.data.status).toBe("todo");
  });

  // ==========================================
  // 11. Invalid Todo ID
  // ==========================================

  test("GET /api/todos/:id should reject invalid ID", async () => {
    const response = await request(app)
      .get("/api/todos/123");

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Invalid Todo ID"
    );
  });

  // ==========================================
  // 12. Non-existing Todo
  // ==========================================

  test("GET /api/todos/:id should return 404 for non-existing Todo", async () => {
    const response = await request(app).get(
      "/api/todos/507f1f77bcf86cd799439011"
    );

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Todo not found"
    );
  });

  // ==========================================
  // 13. Update Todo Title
  // ==========================================

  test("PUT /api/todos/:id should update Todo title", async () => {
    const response = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({
        title: "Learn Jest Testing",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Todo updated successfully"
    );

    expect(response.body.data.title).toBe(
      "Learn Jest Testing"
    );
  });

  // ==========================================
  // 14. Update Todo Status
  // ==========================================

  test("PUT /api/todos/:id should update status", async () => {
    const response = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({
        status: "inprogress",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.status).toBe(
      "inprogress"
    );
  });

  // ==========================================
  // 15. Empty Update
  // ==========================================

  test("PUT /api/todos/:id should reject empty update", async () => {
    const response = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({});

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Please provide title or status"
    );
  });

  // ==========================================
  // 16. Invalid Status Update
  // ==========================================

  test("PUT /api/todos/:id should reject invalid status", async () => {
    const response = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({
        status: "pending",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Status must be todo, inprogress or complate"
    );
  });

  // ==========================================
  // 17. Dedicated Status API
  // ==========================================

  test("PATCH /api/todos/:id/status should update status", async () => {
    const response = await request(app)
      .patch(`/api/todos/${todoId}/status`)
      .send({
        status: "complate",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Todo status updated successfully"
    );

    expect(response.body.data.status).toBe(
      "complate"
    );
  });

  // ==========================================
  // 18. Status Required
  // ==========================================

  test("PATCH /api/todos/:id/status should require status", async () => {
    const response = await request(app)
      .patch(`/api/todos/${todoId}/status`)
      .send({});

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Status is required"
    );
  });

  // ==========================================
  // 19. Invalid Status
  // ==========================================

  test("PATCH /api/todos/:id/status should reject invalid status", async () => {
    const response = await request(app)
      .patch(`/api/todos/${todoId}/status`)
      .send({
        status: "pending",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Status must be todo, inprogress or complate"
    );
  });

  // ==========================================
  // 20. Search Todos
  // ==========================================

  test("GET /api/todos?search=Jest should search Todos", async () => {
    const response = await request(app)
      .get("/api/todos?search=Jest");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(
      true
    );

    response.body.data.forEach((todo) => {
      expect(todo.title.toLowerCase()).toContain(
        "jest"
      );
    });
  });

  // ==========================================
  // 21. Todo Status Filter
  // ==========================================

  test("GET /api/todos?status=todo should return todo status", async () => {
    const response = await request(app)
      .get("/api/todos?status=todo");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(
      true
    );

    response.body.data.forEach((todo) => {
      expect(todo.status).toBe("todo");
    });
  });

  // ==========================================
  // 22. Inprogress Status Filter
  // ==========================================

  test("GET /api/todos?status=inprogress should return inprogress Todos", async () => {
    const response = await request(app)
      .get("/api/todos?status=inprogress");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(
      true
    );

    response.body.data.forEach((todo) => {
      expect(todo.status).toBe("inprogress");
    });
  });

  // ==========================================
  // 23. Complate Status Filter
  // ==========================================

  test("GET /api/todos?status=complate should return complate Todos", async () => {
    const response = await request(app)
      .get("/api/todos?status=complate");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(
      true
    );

    response.body.data.forEach((todo) => {
      expect(todo.status).toBe("complate");
    });
  });

  // ==========================================
  // 24. Invalid Status Filter
  // ==========================================

  test("GET /api/todos should reject invalid status filter", async () => {
    const response = await request(app)
      .get("/api/todos?status=pending");

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Status must be todo, inprogress or complate"
    );
  });

  // ==========================================
  // 25. Pagination
  // ==========================================

  test("GET /api/todos?page=1&limit=2 should paginate Todos", async () => {
    const response = await request(app)
      .get("/api/todos?page=1&limit=2");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(
      response.body.pagination.currentPage
    ).toBe(1);

    expect(response.body.pagination.limit).toBe(2);

    expect(response.body.data.length).toBeLessThanOrEqual(
      2
    );
  });

  // ==========================================
  // 26. Invalid Pagination Page
  // ==========================================

  test("GET /api/todos should reject invalid page", async () => {
    const response = await request(app)
      .get("/api/todos?page=0");

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Page must be a positive number"
    );
  });

  // ==========================================
  // 27. Invalid Pagination Limit
  // ==========================================

  test("GET /api/todos should reject invalid limit", async () => {
    const response = await request(app)
      .get("/api/todos?limit=101");

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Limit must be between 1 and 100"
    );
  });

  // ==========================================
  // 28. Sort Newest
  // ==========================================

  test("GET /api/todos?sort=newest should sort newest first", async () => {
    const response = await request(app)
      .get("/api/todos?sort=newest");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(
      true
    );
  });

  // ==========================================
  // 29. Sort Oldest
  // ==========================================

  test("GET /api/todos?sort=oldest should sort oldest first", async () => {
    const response = await request(app)
      .get("/api/todos?sort=oldest");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(
      true
    );
  });

  // ==========================================
  // 30. Invalid Sort
  // ==========================================

  test("GET /api/todos should reject invalid sort", async () => {
    const response = await request(app)
      .get("/api/todos?sort=random");

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Sort must be newest or oldest"
    );
  });

  // ==========================================
  // 31. Combined Query
  // ==========================================

  test("GET /api/todos should support combined query parameters", async () => {
    const response = await request(app).get(
      "/api/todos?search=Jest&status=complate&page=1&limit=5&sort=newest"
    );

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(
      true
    );

    expect(
      response.body.pagination.currentPage
    ).toBe(1);

    expect(response.body.pagination.limit).toBe(5);

    response.body.data.forEach((todo) => {
      expect(todo.status).toBe("complate");
    });
  });

  // ==========================================
  // 32. Todo Statistics
  // ==========================================

  test("GET /api/todos/stats should return Todo statistics", async () => {
    const response = await request(app)
      .get("/api/todos/stats");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Todo statistics fetched successfully"
    );

    expect(typeof response.body.data.total).toBe(
      "number"
    );

    expect(typeof response.body.data.todo).toBe(
      "number"
    );

    expect(
      typeof response.body.data.inprogress
    ).toBe("number");

    expect(typeof response.body.data.complate).toBe(
      "number"
    );

    expect(
      typeof response.body.data.completionPercentage
    ).toBe("number");
  });

  // ==========================================
  // 33. Delete Todo
  // ==========================================

  test("DELETE /api/todos/:id should delete Todo", async () => {
    const response = await request(app).delete(
      `/api/todos/${todoId}`
    );

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Todo deleted successfully"
    );

    expect(response.body.data._id).toBe(todoId);
  });

  // ==========================================
  // 34. Deleted Todo Should Not Exist
  // ==========================================

  test("GET deleted Todo should return 404", async () => {
    const response = await request(app).get(
      `/api/todos/${todoId}`
    );

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Todo not found"
    );
  });

  // ==========================================
  // 35. Delete Non-existing Todo
  // ==========================================

  test("DELETE /api/todos/:id should return 404 for non-existing Todo", async () => {
    const response = await request(app).delete(
      "/api/todos/507f1f77bcf86cd799439011"
    );

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Todo not found"
    );
  });

  // ==========================================
  // 36. Delete Invalid ID
  // ==========================================

  test("DELETE /api/todos/:id should reject invalid ID", async () => {
    const response = await request(app).delete(
      "/api/todos/123"
    );

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Invalid Todo ID"
    );
  });

  // ==========================================
  // 37. Unknown Route
  // ==========================================

  test("Unknown route should return 404", async () => {
    const response = await request(app).get(
      "/api/unknown"
    );

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toContain(
      "Route not found"
    );
  });
});