const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const Product = require("../models/Product");

describe("Product API Tests", () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    // Cleanup
    await Product.deleteMany({});
    await mongoose.connection.close();
  });

  describe("GET /api/v1/products", () => {
    it("should return all active products", async () => {
      const res = await request(app).get("/api/v1/products");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should filter products by category", async () => {
      const res = await request(app)
        .get("/api/v1/products")
        .query({ category: "formal" });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should ignore invalid ids without throwing cast errors", async () => {
      const product = await Product.create({
        name: "IDs Filter Shoe",
        slug: "ids-filter-shoe",
        description: "Test description",
        category: "formal",
        price: 1999,
        brand: "TestBrand",
        stock: 5,
        images: [],
        isActive: true,
      });

      const res = await request(app)
        .get("/api/v1/products")
        .query({ ids: `${product._id},invalid-id` });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(String(res.body[0]._id)).toBe(String(product._id));
    });

    it("should return an empty array when all ids are invalid", async () => {
      const res = await request(app)
        .get("/api/v1/products")
        .query({ ids: "bad-id-1,bad-id-2" });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });
  });

  describe("GET /api/v1/products/:slug", () => {
    it("should return a product by slug", async () => {
      // Create test product
      const product = await Product.create({
        name: "Test Shoe",
        slug: "test-shoe",
        description: "Test description",
        category: "formal",
        price: 2500,
        brand: "TestBrand",
        stock: 10,
        images: [],
        isActive: true,
      });

      const res = await request(app).get(`/api/v1/products/${product.slug}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe("Test Shoe");
      expect(res.body.slug).toBe("test-shoe");
    });

    it("should return 404 for non-existent product", async () => {
      const res = await request(app).get("/api/v1/products/non-existent-slug");

      expect(res.statusCode).toBe(404);
    });
  });
});
