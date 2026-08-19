const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");

const User = require("../models/User");
const CloudinaryConfig =
  require("../models/CloudinaryConfig");

const encryptionService =
  require("../utils/encryptionService");

describe(
  "Secure Cloudinary Configuration API",
  () => {
    let adminToken;
    let userToken;

    let adminId;
    let userId;

    // ==========================================
    // TEST EMAILS FROM .ENV
    // ==========================================

    const adminEmail =
      process.env.TEST_EMAIL_ADMIN;

    const userEmail =
      process.env.TEST_EMAIL_A;

    const testPassword =
      "password123";

    // ==========================================
    // VALIDATE TEST EMAILS
    // ==========================================

    if (
      !adminEmail ||
      !userEmail
    ) {
      throw new Error(
        "TEST_EMAIL_ADMIN and TEST_EMAIL_A must be defined in .env"
      );
    }

    // ==========================================
    // CLOUDINARY TEST DATA
    // ==========================================

    const cloudName =
      "test-cloud-name";

    const apiKey =
      "test-api-key-123";

    const apiSecret =
      "test-api-secret-456";

    // ==========================================
    // SETUP
    // ==========================================

    beforeAll(
      async () => {
        await CloudinaryConfig.deleteMany({});

        await User.deleteMany({
          email: {
            $in: [
              adminEmail,
              userEmail,
            ],
          },
        });

        // ========================================
        // CREATE ADMIN
        // ========================================

        const admin =
          await User.create({
            name:
              "Cloudinary Test Admin",

            email:
              adminEmail,

            password:
              testPassword,

            role:
              "admin",

            isActive:
              true,

            mustChangePassword:
              false,

            passwordChangedAt:
              new Date(),
          });

        adminId =
          admin._id.toString();

        // ========================================
        // CREATE NORMAL USER
        // ========================================

        const user =
          await User.create({
            name:
              "Cloudinary Test User",

            email:
              userEmail,

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
        // LOGIN ADMIN
        // ========================================

        const adminLogin =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                adminEmail,

              password:
                testPassword,
            });

        expect(
          adminLogin.statusCode
        ).toBe(200);

        expect(
          adminLogin.body.token
        ).toBeDefined();

        adminToken =
          adminLogin.body.token;

        // ========================================
        // LOGIN NORMAL USER
        // ========================================

        const userLogin =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                userEmail,

              password:
                testPassword,
            });

        expect(
          userLogin.statusCode
        ).toBe(200);

        expect(
          userLogin.body.token
        ).toBeDefined();

        userToken =
          userLogin.body.token;
      },
      30000
    );

    // ==========================================
    // CLEANUP
    // ==========================================

    afterAll(
      async () => {
        await CloudinaryConfig.deleteMany({});

        await User.deleteMany({
          email: {
            $in: [
              adminEmail,
              userEmail,
            ],
          },
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
    // GET WITHOUT CONFIGURATION
    // ==========================================

    test(
      "GET should return 404 when configuration is missing",
      async () => {
        await CloudinaryConfig.deleteMany({});

        const response =
          await request(app)
            .get(
              "/api/admin/cloudinary"
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(404);

        expect(
          response.body.success
        ).toBe(false);
      }
    );

    // ==========================================
    // NORMAL USER ACCESS
    // ==========================================

    test(
      "Normal user cannot access Cloudinary configuration",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/admin/cloudinary"
            )
            .set(
              "Authorization",
              `Bearer ${userToken}`
            );

        expect(
          response.statusCode
        ).toBe(403);
      }
    );

    // ==========================================
    // CREATE CONFIGURATION
    // ==========================================

    test(
      "Admin can save Cloudinary configuration",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/admin/cloudinary"
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            )
            .send({
              cloudName:
                cloudName,

              apiKey:
                apiKey,

              apiSecret:
                apiSecret,
            });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data.cloudName
        ).toBe(
          cloudName
        );

        expect(
          response.body.data.apiKey
        ).toBe(
          apiKey
        );

        expect(
          response.body.data.apiSecret
        ).not.toBe(
          apiSecret
        );
      }
    );

    // ==========================================
    // VERIFY ENCRYPTION
    // ==========================================

    test(
      "Cloudinary API key and secret are encrypted in MongoDB",
      async () => {
        const config =
          await CloudinaryConfig.findOne(
            {
              cloudName:
                cloudName,
            }
          ).select(
            "+apiKey +apiSecret"
          );

        expect(
          config
        ).not.toBeNull();

        expect(
          config.apiKey
        ).not.toBe(
          apiKey
        );

        expect(
          config.apiSecret
        ).not.toBe(
          apiSecret
        );
      }
    );

    // ==========================================
    // VERIFY DECRYPTION
    // ==========================================

    test(
      "Application can decrypt stored credentials",
      async () => {
        const config =
          await CloudinaryConfig.findOne(
            {
              cloudName:
                cloudName,
            }
          ).select(
            "+apiKey +apiSecret"
          );

        expect(
          config
        ).not.toBeNull();

        const decryptedApiKey =
          encryptionService.decrypt(
            config.apiKey
          );

        const decryptedApiSecret =
          encryptionService.decrypt(
            config.apiSecret
          );

        expect(
          decryptedApiKey
        ).toBe(
          apiKey
        );

        expect(
          decryptedApiSecret
        ).toBe(
          apiSecret
        );
      }
    );

    // ==========================================
    // GET CONFIGURATION
    // ==========================================

    test(
      "Admin can view configuration but cannot see the actual API secret",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/admin/cloudinary"
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data.cloudName
        ).toBe(
          cloudName
        );

        expect(
          response.body.data.apiKey
        ).toBe(
          apiKey
        );

        expect(
          response.body.data.apiSecret
        ).not.toBe(
          apiSecret
        );
      }
    );

    // ==========================================
    // UPDATE CONFIGURATION
    // ==========================================

    test(
      "Admin can update Cloudinary configuration",
      async () => {
        const response =
          await request(app)
            .put(
              "/api/admin/cloudinary"
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            )
            .send({
              cloudName:
                "updated-cloud",

              apiKey:
                "updated-api-key",

              apiSecret:
                "updated-api-secret",
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data.cloudName
        ).toBe(
          "updated-cloud"
        );

        expect(
          response.body.data.apiKey
        ).toBe(
          "updated-api-key"
        );

        expect(
          response.body.data.apiSecret
        ).not.toBe(
          "updated-api-secret"
        );
      }
    );

    // ==========================================
    // MASKED SECRET PROTECTION
    // ==========================================

    test(
      "Masked apiSecret cannot overwrite the real secret",
      async () => {
        // ----------------------------------------
        // Make sure the current real secret exists
        // ----------------------------------------

        const before =
          await CloudinaryConfig.findOne(
            {}
          ).select(
            "+apiSecret"
          );

        expect(
          before
        ).not.toBeNull();

        // ----------------------------------------
        // Send masked secret
        //
        // The API is expected to reject this
        // instead of treating ******** as a
        // real Cloudinary secret.
        // ----------------------------------------

        const response =
          await request(app)
            .put(
              "/api/admin/cloudinary"
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            )
            .send({
              cloudName:
                "updated-cloud",

              apiKey:
                "updated-api-key",

              apiSecret:
                "********",
            });

        // ----------------------------------------
        // Correct behavior:
        // masked secret is rejected.
        // ----------------------------------------

        expect(
          response.statusCode
        ).toBe(400);

        expect(
          response.body.success
        ).toBe(false);

        // ----------------------------------------
        // Read stored configuration
        // ----------------------------------------

        const after =
          await CloudinaryConfig.findOne(
            {}
          ).select(
            "+apiSecret"
          );

        expect(
          after
        ).not.toBeNull();

        // ----------------------------------------
        // Decrypt stored secret
        // ----------------------------------------

        const decryptedApiSecret =
          encryptionService.decrypt(
            after.apiSecret
          );

        // ----------------------------------------
        // Original secret must remain unchanged
        // ----------------------------------------

        expect(
          decryptedApiSecret
        ).toBe(
          "updated-api-secret"
        );
      }
    );

    // ==========================================
    // DELETE CONFIGURATION
    // ==========================================

    test(
      "Admin can delete Cloudinary configuration",
      async () => {
        const response =
          await request(app)
            .delete(
              "/api/admin/cloudinary"
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
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
    // VERIFY DELETE
    // ==========================================

    test(
      "Cloudinary upload configuration is missing after delete",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/admin/cloudinary"
            )
            .set(
              "Authorization",
              `Bearer ${adminToken}`
            );

        expect(
          response.statusCode
        ).toBe(404);

        expect(
          response.body.success
        ).toBe(false);
      }
    );
  }
);