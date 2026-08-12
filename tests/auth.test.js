const request = require("supertest");
const app = require("../server");
const User = require("../models/User");

describe("JWT Authentication API", () => {
  let token;
  let userId;

  const testUser = {
    name: "Auth Test User",
    email: "auth-test@example.com",
    password: "password123",
  };

  beforeAll(async () => {
    await User.deleteMany({
      email: testUser.email,
    });
  });

  afterAll(async () => {
    await User.deleteMany({
      email: testUser.email,
    });
  });

  test(
    "POST /api/auth/register should register user",
    async () => {
      const response =
        await request(app)
          .post("/api/auth/register")
          .send(testUser);

      expect(
        response.statusCode
      ).toBe(201);

      expect(
        response.body.success
      ).toBe(true);

      expect(
        response.body.token
      ).toBeDefined();

      expect(
        response.body.data.role
      ).toBe("user");

      token =
        response.body.token;

      userId =
        response.body.data._id;
    }
  );

  test(
    "POST /api/auth/register should reject duplicate user",
    async () => {
      const response =
        await request(app)
          .post("/api/auth/register")
          .send(testUser);

      expect(
        response.statusCode
      ).toBe(400);
    }
  );

  test(
    "POST /api/auth/login should return token",
    async () => {
      const response =
        await request(app)
          .post("/api/auth/login")
          .send({
            email: testUser.email,
            password: testUser.password,
          });

      expect(
        response.statusCode
      ).toBe(200);

      expect(
        response.body.token
      ).toBeDefined();

      token =
        response.body.token;
    }
  );

  test(
    "POST /api/auth/login should reject invalid password",
    async () => {
      const response =
        await request(app)
          .post("/api/auth/login")
          .send({
            email: testUser.email,
            password: "wrongpassword",
          });

      expect(
        response.statusCode
      ).toBe(401);
    }
  );

  test(
    "GET /api/auth/profile without token should return 401",
    async () => {
      const response =
        await request(app).get(
          "/api/auth/profile"
        );

      expect(
        response.statusCode
      ).toBe(401);
    }
  );

  test(
    "GET /api/auth/profile with invalid token should return 401",
    async () => {
      const response =
        await request(app)
          .get("/api/auth/profile")
          .set(
            "Authorization",
            "Bearer invalid-token"
          );

      expect(
        response.statusCode
      ).toBe(401);
    }
  );

  test(
    "GET /api/auth/profile with valid token should return 200",
    async () => {
      const response =
        await request(app)
          .get("/api/auth/profile")
          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(
        response.statusCode
      ).toBe(200);

      expect(
        response.body.data._id
      ).toBe(userId);

      expect(
        response.body.data.role
      ).toBe("user");
    }
  );

  test(
    "POST /api/auth/logout without token should return 401",
    async () => {
      const response =
        await request(app)
          .post("/api/auth/logout");

      expect(
        response.statusCode
      ).toBe(401);
    }
  );

  test(
    "POST /api/auth/logout with valid token should return 200",
    async () => {
      const response =
        await request(app)
          .post("/api/auth/logout")
          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(
        response.statusCode
      ).toBe(200);
    }
  );
});