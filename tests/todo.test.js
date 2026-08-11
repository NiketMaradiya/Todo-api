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
  // 1. Health Check
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

  test("POST /api/todos should create a Todo", async () => {
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

    expect(response.body.data.completed).toBe(false);

    expect(response.body.data._id).toBeDefined();

    todoId = response.body.data._id;
  });

  // ==========================================
  // 3. Create Completed Todo
  // ==========================================

  test("POST /api/todos should create completed Todo", async () => {
    const response = await request(app)
      .post("/api/todos")
      .send({
        title: "Learn Supertest",
        completed: true,
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.title).toBe(
      "Learn Supertest"
    );

    expect(response.body.data.completed).toBe(true);
  });

  // ==========================================
  // 4. Create Todo - Missing Title
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
  // 5. Create Todo - Empty Title
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
  // 6. Create Todo - Invalid Title Type
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
  // 7. Create Todo - Invalid Completed Type
  // ==========================================

  test("POST /api/todos should reject invalid completed value", async () => {
    const response = await request(app)
      .post("/api/todos")
      .send({
        title: "Invalid Todo",
        completed: "true",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Completed must be true or false"
    );
  });

  // ==========================================
  // 8. Get All Todos
  // ==========================================

  test("GET /api/todos should return Todos", async () => {
    const response = await request(app)
      .get("/api/todos");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Todos fetched successfully"
    );

    expect(Array.isArray(response.body.data)).toBe(true);

    expect(response.body.pagination).toBeDefined();
  });

  // ==========================================
  // 9. Get Todo By ID
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
  });

  // ==========================================
  // 10. Invalid Todo ID
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
  // 11. Non-existing Todo
  // ==========================================

  test("GET /api/todos/:id should return 404 for non-existing Todo", async () => {
    const response = await request(app)
      .get(
        "/api/todos/507f1f77bcf86cd799439011"
      );

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Todo not found"
    );
  });

  // ==========================================
  // 12. Update Todo Title
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
  // 13. Update Todo Completed
  // ==========================================

  test("PUT /api/todos/:id should update completed status", async () => {
    const response = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({
        completed: true,
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.completed).toBe(true);
  });

  // ==========================================
  // 14. Update Todo - Empty Body
  // ==========================================

  test("PUT /api/todos/:id should reject empty update", async () => {
    const response = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({});

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Please provide title or completed"
    );
  });

  // ==========================================
  // 15. Toggle Todo
  // ==========================================

  test("PATCH /api/todos/:id/toggle should toggle Todo", async () => {
    const response = await request(app)
      .patch(`/api/todos/${todoId}/toggle`);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data._id).toBe(todoId);

    expect(
      typeof response.body.data.completed
    ).toBe("boolean");
  });

  // ==========================================
  // 16. Search Todos
  // ==========================================

  test("GET /api/todos?search=Jest should search Todos", async () => {
    const response = await request(app)
      .get("/api/todos?search=Jest");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(true);

    response.body.data.forEach((todo) => {
      expect(
        todo.title.toLowerCase()
      ).toContain("jest");
    });
  });

  // ==========================================
  // 17. Completed Filter
  // ==========================================

  test("GET /api/todos?completed=true should return completed Todos", async () => {
    const response = await request(app)
      .get("/api/todos?completed=true");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(true);

    response.body.data.forEach((todo) => {
      expect(todo.completed).toBe(true);
    });
  });

  // ==========================================
  // 18. Pending Filter
  // ==========================================

  test("GET /api/todos?completed=false should return pending Todos", async () => {
    const response = await request(app)
      .get("/api/todos?completed=false");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(true);

    response.body.data.forEach((todo) => {
      expect(todo.completed).toBe(false);
    });
  });

  // ==========================================
  // 19. Invalid Completed Filter
  // ==========================================

  test("GET /api/todos should reject invalid completed filter", async () => {
    const response = await request(app)
      .get("/api/todos?completed=yes");

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Completed must be true or false"
    );
  });

  // ==========================================
  // 20. Pagination
  // ==========================================

  test("GET /api/todos?page=1&limit=2 should paginate Todos", async () => {
    const response = await request(app)
      .get("/api/todos?page=1&limit=2");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(
      response.body.pagination.currentPage
    ).toBe(1);

    expect(
      response.body.pagination.limit
    ).toBe(2);

    expect(
      response.body.data.length
    ).toBeLessThanOrEqual(2);
  });

  // ==========================================
  // 21. Invalid Pagination
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
  // 22. Invalid Limit
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
  // 23. Sort Newest
  // ==========================================

  test("GET /api/todos?sort=newest should sort newest first", async () => {
    const response = await request(app)
      .get("/api/todos?sort=newest");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(true);
  });

  // ==========================================
  // 24. Sort Oldest
  // ==========================================

  test("GET /api/todos?sort=oldest should sort oldest first", async () => {
    const response = await request(app)
      .get("/api/todos?sort=oldest");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(true);
  });

  // ==========================================
  // 25. Invalid Sort
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
  // 26. Combined Search + Filter + Pagination
  // ==========================================

  test("GET /api/todos should support combined query parameters", async () => {
    const response = await request(app)
      .get(
        "/api/todos?search=Jest&completed=false&page=1&limit=5&sort=newest"
      );

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(true);

    expect(
      response.body.pagination.currentPage
    ).toBe(1);

    expect(
      response.body.pagination.limit
    ).toBe(5);
  });

  // ==========================================
  // 27. Todo Statistics
  // ==========================================

  test("GET /api/todos/stats should return Todo statistics", async () => {
    const response = await request(app)
      .get("/api/todos/stats");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Todo statistics fetched successfully"
    );

    expect(
      typeof response.body.data.total
    ).toBe("number");

    expect(
      typeof response.body.data.completed
    ).toBe("number");

    expect(
      typeof response.body.data.pending
    ).toBe("number");

    expect(
      typeof response.body.data.completionPercentage
    ).toBe("number");
  });

  // ==========================================
  // 28. Delete Todo
  // ==========================================

  test("DELETE /api/todos/:id should delete Todo", async () => {
    const response = await request(app)
      .delete(`/api/todos/${todoId}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Todo deleted successfully"
    );

    expect(response.body.data._id).toBe(todoId);
  });

  // ==========================================
  // 29. Deleted Todo Should Not Exist
  // ==========================================

  test("GET deleted Todo should return 404", async () => {
    const response = await request(app)
      .get(`/api/todos/${todoId}`);

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Todo not found"
    );
  });

  // ==========================================
  // 30. Delete Non-existing Todo
  // ==========================================

  test("DELETE /api/todos/:id should return 404 for non-existing Todo", async () => {
    const response = await request(app)
      .delete(
        "/api/todos/507f1f77bcf86cd799439011"
      );

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Todo not found"
    );
  });

  // ==========================================
  // 31. Delete Invalid ID
  // ==========================================

  test("DELETE /api/todos/:id should reject invalid ID", async () => {
    const response = await request(app)
      .delete("/api/todos/123");

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Invalid Todo ID"
    );
  });

  // ==========================================
  // 32. Unknown Route
  // ==========================================

  test("Unknown route should return 404", async () => {
    const response = await request(app)
      .get("/api/unknown");

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);

    expect(
      response.body.message
    ).toContain("Route not found");
  });
});
