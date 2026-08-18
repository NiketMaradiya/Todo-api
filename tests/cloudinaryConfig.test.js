const request =
  require("supertest");

const jwt =
  require("jsonwebtoken");

const mongoose =
  require("mongoose");

const app =
  require("../server");

const User =
  require("../models/User");

const CloudinaryConfig =
  require(
    "../models/CloudinaryConfig"
  );

const {
  getDecryptedCloudinaryConfig,
} = require(
  "../utils/cloudinaryConfigService"
);

describe(
  "Secure Cloudinary Configuration API",
  () => {
    let adminToken;
    let userToken;

    beforeAll(async () => {
      await CloudinaryConfig.deleteMany(
        {}
      );

      await User.deleteMany({
        email: {
          $in: [
            "cloudinary-admin@test.com",
            "cloudinary-user@test.com",
          ],
        },
      });

      const admin =
        await User.create({
          name:
            "Cloudinary Admin",

          email:
            "cloudinary-admin@test.com",

          password:
            "password123",

          role:
            "admin",

          isActive:
            true,

          mustChangePassword:
            false,
        });

      const user =
        await User.create({
          name:
            "Cloudinary User",

          email:
            "cloudinary-user@test.com",

          password:
            "password123",

          role:
            "user",

          isActive:
            true,

          mustChangePassword:
            false,
        });

      adminToken =
        jwt.sign(
          {
            id:
              admin._id.toString(),

            role:
              "admin",
          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "1h",
          }
        );

      userToken =
        jwt.sign(
          {
            id:
              user._id.toString(),

            role:
              "user",
          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "1h",
          }
        );
    });

    afterAll(async () => {
      await CloudinaryConfig.deleteMany(
        {}
      );

      await User.deleteMany({
        email: {
          $in: [
            "cloudinary-admin@test.com",
            "cloudinary-user@test.com",
          ],
        },
      });

      if (
        mongoose.connection.readyState !==
        0
      ) {
        await mongoose.connection.close();
      }
    });

    // ==========================================
    // GET before configuration
    // ==========================================

    test(
      "GET should return 404 when configuration is missing",
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
          response.body.message
        ).toBe(
          "Cloudinary configuration not found"
        );
      }
    );

    // ==========================================
    // Normal user blocked
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
    // Create
    // ==========================================

    test(
      "Admin can save Cloudinary configuration",
      async () => {
        const apiKey =
          "test-api-key-123";

        const apiSecret =
          "test-api-secret-456";

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
                "test-cloud",

              apiKey,

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
          "test-cloud"
        );

        expect(
          response.body.data.apiKey
        ).toBe(
          apiKey
        );

        expect(
          response.body.data.apiSecret
        ).toBe(
          "********"
        );

        expect(
          JSON.stringify(
            response.body
          )
        ).not.toContain(
          apiSecret
        );
      }
    );

    // ==========================================
    // Encryption in MongoDB
    // ==========================================

    test(
      "Cloudinary API key and secret are encrypted in MongoDB",
      async () => {
        const config =
          await CloudinaryConfig.findOne()
            .select(
              "+apiKey +apiSecret"
            )
            .lean();

        expect(
          config
        ).not.toBeNull();

        expect(
          config.apiKey
        ).not.toBe(
          "test-api-key-123"
        );

        expect(
          config.apiSecret
        ).not.toBe(
          "test-api-secret-456"
        );

        expect(
          config.apiKey
        ).toContain(":");

        expect(
          config.apiSecret
        ).toContain(":");

        expect(
          JSON.stringify(
            config
          )
        ).not.toContain(
          process.env.CONFIG_ENCRYPTION_KEY
        );
      }
    );

    // ==========================================
    // Decryption
    // ==========================================

    test(
      "Application can decrypt stored credentials",
      async () => {
        const config =
          await getDecryptedCloudinaryConfig();

        expect(
          config.cloudName
        ).toBe(
          "test-cloud"
        );

        expect(
          config.apiKey
        ).toBe(
          "test-api-key-123"
        );

        expect(
          config.apiSecret
        ).toBe(
          "test-api-secret-456"
        );
      }
    );

    // ==========================================
    // GET masks secret
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
          response.body.data.apiSecret
        ).toBe(
          "********"
        );

        expect(
          JSON.stringify(
            response.body
          )
        ).not.toContain(
          "test-api-secret-456"
        );
      }
    );

    // ==========================================
    // Update
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

              apiSecret:
                "updated-secret-789",
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.data.cloudName
        ).toBe(
          "updated-cloud"
        );

        expect(
          response.body.data.apiSecret
        ).toBe(
          "********"
        );

        expect(
          JSON.stringify(
            response.body
          )
        ).not.toContain(
          "updated-secret-789"
        );

        const config =
          await getDecryptedCloudinaryConfig();

        expect(
          config.apiKey
        ).toBe(
          "test-api-key-123"
        );

        expect(
          config.apiSecret
        ).toBe(
          "updated-secret-789"
        );
      }
    );

    // ==========================================
    // Masked secret must not be accepted
    // ==========================================

    test(
      "Masked apiSecret cannot overwrite the real secret",
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
              apiSecret:
                "********",
            });

        expect(
          response.statusCode
        ).toBe(400);
      }
    );

    // ==========================================
    // Delete
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

        const config =
          await CloudinaryConfig.findOne();

        expect(
          config
        ).toBeNull();
      }
    );

    // ==========================================
    // Missing configuration after delete
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
      }
    );
  }
);