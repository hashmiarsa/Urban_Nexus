"use strict";

const request    = require("supertest");
const mongoose   = require("mongoose");
const app        = require("../../app");
const User       = require("../../models/User");
const Department = require("../../models/Department");
const Project    = require("../../models/Project");

// ---------------------------------------------------------------------------
// project.test.js â€” API integration tests for /api/v1/projects
// ---------------------------------------------------------------------------

let dept;
let officerToken;
let adminToken;
let projectId;

// GeoJSON polygon over a small area in Ghaziabad
const testPolygon = {
  type: "Polygon",
  coordinates: [[
    [77.4538, 28.6692],
    [77.4548, 28.6692],
    [77.4548, 28.6702],
    [77.4538, 28.6702],
    [77.4538, 28.6692],
  ]],
};

beforeAll(async () => {
  const uri = process.env.MONGO_URI_TEST || "mongodb://localhost:27017/urban-nexus-test";
  await mongoose.connect(uri);

  // Create dept
  dept = await Department.create({ name: "Test Dept Projects", code: "TDP" });

  // Register officer
  await request(app).post("/api/v1/auth/register").send({
    name: "Test Officer Proj", email: "proj.test.officer@test.com",
    password: "password123", role: "officer", department: dept._id.toString(),
  });
  const loginO = await request(app).post("/api/v1/auth/login")
    .send({ email: "proj.test.officer@test.com", password: "password123" });
  officerToken = loginO.body.data.token;

  // Register admin
  await request(app).post("/api/v1/auth/register").send({
    name: "Test Admin Proj", email: "proj.test.admin@test.com",
    password: "password123", role: "admin",
  });
  const loginA = await request(app).post("/api/v1/auth/login")
    .send({ email: "proj.test.admin@test.com", password: "password123" });
  adminToken = loginA.body.data.token;
});

afterAll(async () => {
  await Project.deleteMany({ title: /Test Project/ });
  await User.deleteMany({ email: /proj\.test\./ });
  await Department.deleteOne({ code: "TDP" });
  await mongoose.connection.close();
});

// ---------------------------------------------------------------------------
describe("POST /api/v1/projects", () => {

  it("officer can create a project", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${officerToken}`)
      .send({
        title:         "Test Project Alpha",
        type:          "road",
        description:   "Test road resurfacing",
        address:       "Test Road, Ghaziabad",
        location:      testPolygon,
        startDate:     "2026-06-01",
        endDate:       "2026-06-30",
        estimatedCost: 300000,
        priority:      "high",
        criteria: {
          urgency: 7, socialImpact: 8, estimatedCost: 5,
          feasibility: 7, environmentImpact: 4,
        },
        dependencies: [],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.project.title).toBe("Test Project Alpha");
    expect(res.body.data.project.status).toBe("pending");
    expect(res.body.data).toHaveProperty("clashesDetected");

    projectId = res.body.data.project._id;
  });

  it("rejects project without location", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${officerToken}`)
      .send({
        title: "Test Project No Location", type: "water",
        startDate: "2026-06-01", endDate: "2026-06-30",
        // missing location
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects unauthenticated request", async () => {
    const res = await request(app).post("/api/v1/projects").send({ title: "x" });
    expect(res.status).toBe(401);
  });

});

// ---------------------------------------------------------------------------
describe("GET /api/v1/projects", () => {

  it("returns paginated project list for officer", async () => {
    const res = await request(app)
      .get("/api/v1/projects")
      .set("Authorization", `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/v1/projects");
    expect(res.status).toBe(401);
  });

});

// ---------------------------------------------------------------------------
describe("GET /api/v1/projects/:id", () => {

  it("returns project detail by ID", async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(projectId);
    expect(res.body.data.title).toBe("Test Project Alpha");
  });

  it("returns 404 for non-existent ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/v1/projects/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

});

// ---------------------------------------------------------------------------
describe("PATCH /api/v1/projects/:id/status", () => {

  it("admin can approve a project", async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved", comment: "Looks good" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("approved");
  });

  it("officer cannot approve â€” returns 403", async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/status`)
      .set("Authorization", `Bearer ${officerToken}`)
      .send({ status: "approved" });

    expect(res.status).toBe(403);
  });

});

// ---------------------------------------------------------------------------
describe("GET /api/v1/projects/map", () => {

  it("returns GeoJSON FeatureCollection", async () => {
    const res = await request(app)
      .get("/api/v1/projects/map")
      .set("Authorization", `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.type).toBe("FeatureCollection");
    expect(Array.isArray(res.body.data.features)).toBe(true);
  });

});
