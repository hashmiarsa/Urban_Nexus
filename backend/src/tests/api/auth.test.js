"use strict";

const request   = require("supertest");
const mongoose  = require("mongoose");
const app       = require("../../app");
const User       = require("../../models/User");
const Department = require("../../models/Department");
const config     = require("../../config/index");

// ---------------------------------------------------------------------------
// auth.test.js â€” API integration tests for /api/v1/auth
// Uses in-memory connection â€” mocks mongoose if no MONGO_URI_TEST is set
// ---------------------------------------------------------------------------

let testDept;
let testUser;
let token;

beforeAll(async () => {
  // Connect to test DB
  const uri = process.env.MONGO_URI_TEST || "mongodb://localhost:27017/urban-nexus-test";
  await mongoose.connect(uri);

  // Create a test department
  testDept = await Department.create({ name: "Test Department Auth", code: "TDA" });
});

afterAll(async () => {
  // Cleanup
  await User.deleteMany({ email: /auth\.test@/ });
  await Department.deleteOne({ code: "TDA" });
  await mongoose.connection.close();
});

// ---------------------------------------------------------------------------
describe("POST /api/v1/auth/register", () => {

  it("registers an officer successfully", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name:       "Test Officer",
        email:      "auth.test.officer@test.com",
        password:   "password123",
        role:       "officer",
        department: testDept._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("auth.test.officer@test.com");
    expect(res.body.data.role).toBe("officer");
    // Password must never be returned
    expect(res.body.data.password).toBeUndefined();

    testUser = res.body.data;
  });

  it("rejects duplicate email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name:       "Duplicate",
        email:      "auth.test.officer@test.com",  // same email
        password:   "password123",
        role:       "officer",
        department: testDept._id.toString(),
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects missing required fields", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "auth.test.missing@test.com" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

});

// ---------------------------------------------------------------------------
describe("POST /api/v1/auth/login", () => {

  it("logs in with correct credentials and returns JWT", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "auth.test.officer@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe("string");

    token = res.body.data.token;
  });

  it("rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "auth.test.officer@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects non-existent email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@nowhere.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

});

// ---------------------------------------------------------------------------
describe("GET /api/v1/auth/me", () => {

  it("returns user profile with valid token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("auth.test.officer@test.com");
    expect(res.body.data.password).toBeUndefined();
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

});
