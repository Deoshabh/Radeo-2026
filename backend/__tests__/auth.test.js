const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../server");
const User = require("../models/User");
const bcrypt = require("bcrypt");

describe("Auth API Tests", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body.user).toHaveProperty("email", "test@example.com");
    });

    it("should not register duplicate email", async () => {
      await request(app).post("/api/v1/auth/register").send({
        name: "User One",
        email: "duplicate@example.com",
        password: "Password123",
      });

      const res = await request(app).post("/api/v1/auth/register").send({
        name: "User Two",
        email: "duplicate@example.com",
        password: "Password123",
      });

      expect(res.statusCode).toBe(400);
    });

    it("should validate required fields", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Test",
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash("Password123", 10);
      await User.create({
        name: "Login Test User",
        email: "login@example.com",
        passwordHash: hashedPassword,
      });
    });

    it("should login with correct credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "login@example.com",
        password: "Password123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
    });

    it("should reject incorrect password", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "login@example.com",
        password: "WrongPassword",
      });

      expect(res.statusCode).toBe(401);
    });

    it("should reject non-existent user", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "nonexistent@example.com",
        password: "Password123",
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
