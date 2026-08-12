const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");
const User = require("../models/User");

describe("JWT Authentication API", () => {
  let token;

  beforeAll(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});

    if (
      mongoose.connection.readyState !== 0
    ) {
      await mongoose.connection.close();
    }
  });

  // ==========================================
  // Register User
  // ==========================================

  test(
    "POST /api/auth/register should register user",
    async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        });

      expect(
        response.statusCode
      ).toBe(201);

      expect(
        response.body.success
      ).toBe(true);

      expect(
        response.body.data.email
      ).toBe("test@example.com");

      expect(
        response.body.data.password
      ).toBeUndefined();
    }
  );

  // ==========================================
  // Login User
  // ==========================================

  test(
    "POST /api/auth/login should return JWT token",
    async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(
        response.statusCode
      ).toBe(200);

      expect(
        response.body.success
      ).toBe(true);

      expect(
        response.body.token
      ).toBeDefined();

      token = response.body.token;
    }
  );

  // ==========================================
  // Profile Without Token
  // ==========================================

  test(
    "GET /api/profile without token should return 401",
    async () => {
      const response = await request(app)
        .get("/api/profile");

      expect(
        response.statusCode
      ).toBe(401);

      expect(
        response.body.success
      ).toBe(false);
    }
  );

  // ==========================================
  // Profile With Invalid Token
  // ==========================================

  test(
    "GET /api/profile with invalid token should return 401",
    async () => {
      const response = await request(app)
        .get("/api/profile")
        .set(
          "Authorization",
          "Bearer invalid-token"
        );

      expect(
        response.statusCode
      ).toBe(401);
    }
  );

  // ==========================================
  // Profile With Valid Token
  // ==========================================

  test(
    "GET /api/profile with valid token should return 200",
    async () => {
      const response = await request(app)
        .get("/api/profile")
        .set(
          "Authorization",
          `Bearer ${token}`
        );

      expect(
        response.statusCode
      ).toBe(200);

      expect(
        response.body.success
      ).toBe(true);

      expect(
        response.body.data.email
      ).toBe("test@example.com");
    }
  );
});