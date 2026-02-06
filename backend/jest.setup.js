const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

// Setup for backend tests
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.JWT_ACCESS_SECRET = "test-jwt-secret-key";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key";
process.env.JWT_ACCESS_EXPIRATION = "15m";
process.env.JWT_REFRESH_EXPIRATION = "7d";

// Mock MinIO to prevent initialization issues in tests
jest.mock("./utils/minio", () => ({
  initializeBucket: jest.fn().mockResolvedValue(true),
  generateSignedUploadUrl: jest
    .fn()
    .mockResolvedValue("https://fake-minio-url.com/upload"),
  generateSignedGetUrl: jest
    .fn()
    .mockResolvedValue("https://fake-minio-url.com/get"),
  deleteFile: jest.fn().mockResolvedValue(true),
}));

beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  process.env.MONGO_URI = mongoUri;

  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up collections except User and Product collections to preserve test data
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (key !== "users" && key !== "products") {
      await collections[key].deleteMany();
    }
  }
});
