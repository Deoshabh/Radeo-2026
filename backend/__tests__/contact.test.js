const request = require("supertest");
const app = require("../server");

describe("Contact API", () => {
  it("rejects whitespace-only required fields with 400", async () => {
    const res = await request(app).post("/api/v1/contact").send({
      name: "   ",
      email: "   ",
      subject: "Test",
      message: "   ",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it("accepts valid contact submissions", async () => {
    const res = await request(app).post("/api/v1/contact").send({
      name: "Contact User",
      email: "contact-user@example.com",
      subject: "Support",
      message: "Need help with my order",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
});
