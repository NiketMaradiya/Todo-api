const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const User = require("../models/User");

describe(
  "JWT Authentication API",
  () => {
    let userId;
    let token;

    // ==========================================
    // TEST EMAIL FROM .ENV
    // ==========================================

    const testEmail =
      process.env.TEST_EMAIL_A;

    const testPassword =
      "password123";

    // ==========================================
    // Validate Test Email
    // ==========================================

    if (!testEmail) {
      throw new Error(
        "TEST_EMAIL_A must be defined in .env"
      );
    }

    // ==========================================
    // SETUP
    // ==========================================

    beforeAll(
      async () => {
        // ----------------------------------------
        // Remove old test user
        // ----------------------------------------

        await User.deleteMany({
          email:
            testEmail,
        });

        // ----------------------------------------
        // Create test user directly
        //
        // This avoids the real registration flow,
        // which creates a temporary password and
        // can send an email.
        // ----------------------------------------

        const user =
          await User.create({
            name:
              "Auth Test User",

            email:
              testEmail,

            password:
              testPassword,

            role:
              "user",

            isActive:
              true,

            mustChangePassword:
              false,

            passwordChangedAt:
              new Date(),
          });

        userId =
          user._id.toString();

        // ========================================
        // LOGIN
        // ========================================

        const loginResponse =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                testEmail,

              password:
                testPassword,
            });

        expect(
          loginResponse.statusCode
        ).toBe(200);

        expect(
          loginResponse.body.token
        ).toBeDefined();

        token =
          loginResponse.body.token;
      },
      30000
    );

    // ==========================================
    // CLEANUP
    // ==========================================

    afterAll(
      async () => {
        await User.deleteMany({
          email:
            testEmail,
        });

        if (
          mongoose.connection
            .readyState !== 0
        ) {
          await mongoose.connection.close();
        }
      },
      30000
    );

    // ==========================================
    // PROFILE WITHOUT TOKEN
    // ==========================================

    test(
      "GET /api/auth/profile without token should return 401",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/auth/profile"
            );

        expect(
          response.statusCode
        ).toBe(401);
      }
    );

    // ==========================================
    // INVALID TOKEN
    // ==========================================

    test(
      "GET /api/auth/profile with invalid token should return 401",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/auth/profile"
            )
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
    // VALID TOKEN
    // ==========================================

    test(
      "GET /api/auth/profile with valid token should return 200",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/auth/profile"
            )
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
          response.body.data._id
        ).toBe(
          userId
        );

        expect(
          response.body.data.email
        ).toBe(
          testEmail
        );
      }
    );

    // ==========================================
    // VALID LOGIN
    // ==========================================

    test(
      "POST /api/auth/login should return token",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                testEmail,

              password:
                testPassword,
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

        expect(
          typeof response.body.token
        ).toBe("string");
      }
    );

    // ==========================================
    // INVALID PASSWORD
    // ==========================================

    test(
      "POST /api/auth/login should reject invalid password",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                testEmail,

              password:
                "wrong-password",
            });

        expect(
          response.statusCode
        ).toBe(401);

        expect(
          response.body.success
        ).toBe(false);
      }
    );

    // ==========================================
    // UNKNOWN USER
    // ==========================================

    test(
      "POST /api/auth/login should reject unknown user",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                "unknown-user@example.com",

              password:
                testPassword,
            });

        expect(
          response.statusCode
        ).toBe(401);

        expect(
          response.body.success
        ).toBe(false);
      }
    );

    // ==========================================
    // MISSING EMAIL
    // ==========================================

    test(
      "POST /api/auth/login should reject missing email",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              password:
                testPassword,
            });

        expect(
          response.statusCode
        ).toBeGreaterThanOrEqual(
          400
        );

        expect(
          response.statusCode
        ).toBeLessThan(
          500
        );
      }
    );

    // ==========================================
    // MISSING PASSWORD
    // ==========================================

    test(
      "POST /api/auth/login should reject missing password",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                testEmail,
            });

        expect(
          response.statusCode
        ).toBeGreaterThanOrEqual(
          400
        );

        expect(
          response.statusCode
        ).toBeLessThan(
          500
        );
      }
    );

    // ==========================================
    // LOGOUT WITHOUT TOKEN
    // ==========================================

    test(
      "POST /api/auth/logout without token should return 401",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/auth/logout"
            );

        expect(
          response.statusCode
        ).toBe(401);
      }
    );

    // ==========================================
    // LOGOUT WITH VALID TOKEN
    // ==========================================

    test(
      "POST /api/auth/logout with valid token should return 200",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/auth/logout"
            )
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
      }
    );

    // ==========================================
    // FRESH LOGIN AFTER LOGOUT
    // ==========================================

    test(
      "GET /api/auth/profile should work with a fresh valid JWT",
      async () => {
        const loginResponse =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                testEmail,

              password:
                testPassword,
            });

        expect(
          loginResponse.statusCode
        ).toBe(200);

        const freshToken =
          loginResponse.body.token;

        expect(
          freshToken
        ).toBeDefined();

        const response =
          await request(app)
            .get(
              "/api/auth/profile"
            )
            .set(
              "Authorization",
              `Bearer ${freshToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data._id
        ).toBe(
          userId
        );
      }
    );
  }
);