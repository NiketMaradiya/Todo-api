const request = require("supertest");

const app = require("../server");
const User = require("../models/User");

describe("Admin Role Authorization API", () => {
  let userToken;
  let adminToken;
  let normalUserId;
  let secondUserId;

  beforeAll(async () => {
    await User.deleteMany({
      email: {
        $in: [
          "normal-user@test.com",
          "second-user@test.com",
          "admin-user@test.com",
        ],
      },
    });

    // Create normal user
    const userResponse =
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Normal User",
          email:
            "normal-user@test.com",
          password: "password123",
        });

    expect(
      userResponse.statusCode
    ).toBe(201);

    userToken =
      userResponse.body.token;

    normalUserId =
      userResponse.body.data._id;

    // Create second normal user
    const secondUserResponse =
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Second User",
          email:
            "second-user@test.com",
          password: "password123",
        });

    expect(
      secondUserResponse.statusCode
    ).toBe(201);

    secondUserId =
      secondUserResponse.body.data._id;

    // Create admin using same User model
    const admin =
      await User.create({
        name: "Admin User",
        email:
          "admin-user@test.com",
        password: "password123",
        role: "admin",
      });

    // Login using SAME login system
    const adminLoginResponse =
      await request(app)
        .post("/api/auth/login")
        .send({
          email: admin.email,
          password: "password123",
        });

    expect(
      adminLoginResponse.statusCode
    ).toBe(200);

    adminToken =
      adminLoginResponse.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({
      email: {
        $in: [
          "normal-user@test.com",
          "second-user@test.com",
          "admin-user@test.com",
        ],
      },
    });
  });

  // ==========================================
  // SECURITY TESTS
  // ==========================================

  test(
    "No token should return 401",
    async () => {
      const response =
        await request(app)
          .get("/api/admin/users");

      expect(
        response.statusCode
      ).toBe(401);
    }
  );

  test(
    "Invalid token should return 401",
    async () => {
      const response =
        await request(app)
          .get("/api/admin/users")
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
    "Valid normal user token should return 403",
    async () => {
      const response =
        await request(app)
          .get("/api/admin/users")
          .set(
            "Authorization",
            `Bearer ${userToken}`
          );

      expect(
        response.statusCode
      ).toBe(403);
    }
  );

  test(
    "Valid admin token should return 200",
    async () => {
      const response =
        await request(app)
          .get("/api/admin/users")
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect(
        response.statusCode
      ).toBe(200);

      expect(
        Array.isArray(
          response.body.data
        )
      ).toBe(true);
    }
  );

  // ==========================================
  // ADMIN FEATURES
  // ==========================================

  test(
    "Admin should make user admin",
    async () => {
      const response =
        await request(app)
          .post(
            `/api/admin/users/${normalUserId}/make-admin`
          )
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect(
        response.statusCode
      ).toBe(200);

      expect(
        response.body.data.role
      ).toBe("admin");
    }
  );

  test(
    "Admin should remove admin privileges",
    async () => {
      const response =
        await request(app)
          .post(
            `/api/admin/users/${normalUserId}/remove-admin`
          )
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect(
        response.statusCode
      ).toBe(200);

      expect(
        response.body.data.role
      ).toBe("user");
    }
  );

  test(
    "Admin should change user role",
    async () => {
      const response =
        await request(app)
          .patch(
            `/api/admin/users/${normalUserId}/role`
          )
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          )
          .send({
            role: "admin",
          });

      expect(
        response.statusCode
      ).toBe(200);

      expect(
        response.body.data.role
      ).toBe("admin");
    }
  );

  test(
    "Admin should change user password",
    async () => {
      const response =
        await request(app)
          .patch(
            `/api/admin/users/${secondUserId}/password`
          )
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          )
          .send({
            password:
              "newpassword123",
          });

      expect(
        response.statusCode
      ).toBe(200);

      const loginResponse =
        await request(app)
          .post("/api/auth/login")
          .send({
            email:
              "second-user@test.com",
            password:
              "newpassword123",
          });

      expect(
        loginResponse.statusCode
      ).toBe(200);
    }
  );

  test(
    "Admin should disable and enable user",
    async () => {
      const disableResponse =
        await request(app)
          .patch(
            `/api/admin/users/${secondUserId}/status`
          )
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          )
          .send({
            isActive: false,
          });

      expect(
        disableResponse.statusCode
      ).toBe(200);

      expect(
        disableResponse.body.data
          .isActive
      ).toBe(false);

      const enableResponse =
        await request(app)
          .patch(
            `/api/admin/users/${secondUserId}/status`
          )
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          )
          .send({
            isActive: true,
          });

      expect(
        enableResponse.statusCode
      ).toBe(200);

      expect(
        enableResponse.body.data
          .isActive
      ).toBe(true);
    }
  );

  test(
    "Admin should delete user",
    async () => {
      const response =
        await request(app)
          .delete(
            `/api/admin/users/${secondUserId}`
          )
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect(
        response.statusCode
      ).toBe(200);

      const deletedUser =
        await User.findById(
          secondUserId
        );

      expect(
        deletedUser
      ).toBeNull();
    }
  );
});