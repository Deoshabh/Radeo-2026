const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = require("../server");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

describe("Admin API Integration Tests", () => {
  let adminToken;
  let regularToken;
  let adminUser;
  let regularUser;
  let testProduct;

  beforeAll(async () => {
    // Create admin user with hashed password
    adminUser = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      passwordHash: await bcrypt.hash("Admin123!", 10),
      role: "admin",
      isBlocked: false,
    });

    // Create regular user for toggle-block tests
    regularUser = await User.create({
      name: "Regular User",
      email: "user@test.com",
      passwordHash: await bcrypt.hash("User123!", 10),
      role: "customer",
      isBlocked: false,
    });

    // Generate tokens manually - use 'id' format which is supported by auth middleware
    adminToken = jwt.sign(
      { id: adminUser._id.toString() },
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    regularToken = jwt.sign(
      { id: regularUser._id.toString() },
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    // Create test product
    testProduct = await Product.create({
      name: "Test Shoe",
      slug: "test-shoe",
      description: "Test description",
      price: 5000,
      category: "sneakers",
      sizes: [{ size: "9", stock: 10 }],
      colors: ["Black"],
      images: [{ url: "https://example.com/image.jpg", key: "test123" }],
      isActive: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await mongoose.connection.close();
  });

  describe("GET /api/v1/admin/stats", () => {
    it("should return admin statistics", async () => {
      const res = await request(app)
        .get("/api/v1/admin/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("orders.total");
      expect(res.body).toHaveProperty("products.total");
      expect(res.body).toHaveProperty("users.customers");
      expect(res.body).toHaveProperty("revenue.total");
      expect(typeof res.body.orders.total).toBe("number");
      expect(typeof res.body.products.total).toBe("number");
      expect(typeof res.body.users.customers).toBe("number");
      expect(typeof res.body.revenue.total).toBe("number");
    });

    it("should return 401 without authentication", async () => {
      const res = await request(app).get("/api/v1/admin/stats");

      expect(res.status).toBe(401);
    });

    it("should return 403 for non-admin users", async () => {
      const res = await request(app)
        .get("/api/v1/admin/stats")
        .set("Authorization", `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/v1/admin/users/:id/toggle-block", () => {
    it("should toggle user block status", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${regularUser._id}/toggle-block`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("blocked");
      expect(res.body.user).toHaveProperty("isBlocked", true);
      expect(res.body.user).toHaveProperty("isActive", false);

      // Toggle back
      const res2 = await request(app)
        .patch(`/api/v1/admin/users/${regularUser._id}/toggle-block`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.message).toContain("unblocked");
      expect(res2.body.user).toHaveProperty("isBlocked", false);
      expect(res2.body.user).toHaveProperty("isActive", true);
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/v1/admin/users/${fakeId}/toggle-block`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should return 400 when admin tries to block themselves", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminUser._id}/toggle-block`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Cannot block yourself");
    });

    it("should return 400 for invalid user ID", async () => {
      const res = await request(app)
        .patch("/api/v1/admin/users/invalid-id/toggle-block")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 401 without authentication", async () => {
      const res = await request(app).patch(
        `/api/v1/admin/users/${regularUser._id}/toggle-block`,
      );

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/admin/users", () => {
    it("should return all users with isActive field", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("users");
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);

      // Check that isActive field is present
      res.body.users.forEach((user) => {
        expect(user).toHaveProperty("isActive");
        expect(typeof user.isActive).toBe("boolean");
        expect(user.isActive).toBe(!user.isBlocked);
      });
    });

    it("should not include password in response", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.users.forEach((user) => {
        expect(user).not.toHaveProperty("password");
        expect(user).not.toHaveProperty("passwordHash");
      });
    });
  });

  describe("PATCH /api/v1/admin/products/:id/toggle", () => {
    it("should toggle product active status", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/products/${testProduct._id}/toggle`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("isActive", false);
      expect(res.body).toHaveProperty("status", "inactive");

      // Toggle back
      const res2 = await request(app)
        .patch(`/api/v1/admin/products/${testProduct._id}/toggle`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body).toHaveProperty("isActive", true);
      expect(res2.body).toHaveProperty("status", "active");
    });

    it("should return 404 for non-existent product", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/v1/admin/products/${fakeId}/toggle`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/admin/products", () => {
    it("should return all products", async () => {
      const res = await request(app)
        .get("/api/v1/admin/products")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("should return products with status field", async () => {
      const res = await request(app)
        .get("/api/v1/admin/products")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.forEach((product) => {
        expect(product).toHaveProperty("isActive");
        expect(typeof product.isActive).toBe("boolean");
        expect(product).toHaveProperty("status");
        expect(["active", "inactive"]).toContain(product.status);
      });
    });
  });

  describe("Admin Authorization", () => {
    it("should block access to all admin routes without token", async () => {
      const routes = [
        "/api/v1/admin/stats",
        "/api/v1/admin/users",
        "/api/v1/admin/products",
        "/api/v1/admin/orders",
      ];

      for (const route of routes) {
        const res = await request(app).get(route);
        expect(res.status).toBe(401);
      }
    });

    it("should block access to all admin routes for regular users", async () => {
      const routes = [
        "/api/v1/admin/stats",
        "/api/v1/admin/users",
        "/api/v1/admin/products",
        "/api/v1/admin/orders",
      ];

      for (const route of routes) {
        const res = await request(app)
          .get(route)
          .set("Authorization", `Bearer ${regularToken}`);
        expect(res.status).toBe(403);
      }
    });
  });
});
