"use strict";

const swaggerJsdoc  = require("swagger-jsdoc");
const swaggerUi     = require("swagger-ui-express");
const config        = require("./src/config/index");

// ---------------------------------------------------------------------------
// OpenAPI 3.0 base definition
// Phase 5 will add full endpoint documentation
// For now this sets up the Swagger UI at /api/v1/docs
// ---------------------------------------------------------------------------
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title:       "Urban Nexus API",
    version:     "1.0.0",
    description: `
      Urban Nexus — Smart Urban Projects Coordination Platform.
      
      This API enables Indian city departments to coordinate infrastructure
      projects, detect scheduling conflicts, and prioritise work using the
      TOPSIS multi-criteria decision-making algorithm.
      
      **Roles:** admin | officer | supervisor | citizen
      
      **Authentication:** Bearer JWT token in Authorization header.
      All endpoints except auth and citizen-reports require authentication.
    `,
    contact: {
      name:  "Urban Nexus",
      email: "support@urbannexus.in",
    },
  },
  servers: [
    {
      url:         `http://localhost:${config.PORT}/api/v1`,
      description: "Development server",
    },
    {
      url:         "https://api.urbannexus.in/api/v1",
      description: "Production server",
    },
  ],
  // -------------------------------------------------------------------------
  // Reusable components — schemas, responses, security schemes
  // -------------------------------------------------------------------------
  components: {
    // Security scheme — JWT Bearer token
    securitySchemes: {
      BearerAuth: {
        type:         "http",
        scheme:       "bearer",
        bearerFormat: "JWT",
        description:  "Enter your JWT token. Obtain it from POST /auth/login",
      },
    },
    // Reusable response schemas
    schemas: {
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation successful" },
          data:    { type: "object", nullable: true },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          error:   { type: "object", nullable: true },
        },
      },
      PaginatedResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Records fetched" },
          data:    { type: "array", items: { type: "object" } },
          pagination: {
            type: "object",
            properties: {
              total: { type: "integer", example: 100 },
              page:  { type: "integer", example: 1  },
              limit: { type: "integer", example: 20 },
              pages: { type: "integer", example: 5  },
            },
          },
        },
      },
      // User schema
      User: {
        type: "object",
        properties: {
          _id:        { type: "string", example: "64a7f3c2e4b0a1234567890a" },
          name:       { type: "string", example: "Rahul Sharma" },
          email:      { type: "string", example: "rahul@pwd.gov.in" },
          role:       { type: "string", enum: ["admin", "officer", "supervisor", "citizen"] },
          department: { type: "string", nullable: true, example: "64a7f3c2e4b0a1234567890b" },
          isActive:   { type: "boolean", example: true },
          createdAt:  { type: "string", format: "date-time" },
          updatedAt:  { type: "string", format: "date-time" },
        },
      },
      // Auth token response
      AuthResponse: {
        type: "object",
        properties: {
          user:  { "$ref": "#/components/schemas/User" },
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
        },
      },
      // Project schema
      Project: {
        type: "object",
        properties: {
          _id:           { type: "string", example: "64a7f3c2e4b0a1234567890c" },
          title:         { type: "string", example: "MG Road Resurfacing" },
          type:          { type: "string", enum: ["road", "water", "electricity", "sewage", "parks", "other"] },
          department:    { type: "string", example: "64a7f3c2e4b0a1234567890b" },
          status:        { type: "string", enum: ["pending", "approved", "ongoing", "completed", "rejected", "clashed"] },
          priority:      { type: "string", enum: ["low", "medium", "high", "critical"] },
          startDate:     { type: "string", format: "date-time" },
          endDate:       { type: "string", format: "date-time" },
          estimatedCost: { type: "number", example: 500000 },
          progress:      { type: "integer", example: 0 },
          mcdmScore:     { type: "number", nullable: true, example: 0.82 },
          createdAt:     { type: "string", format: "date-time" },
          updatedAt:     { type: "string", format: "date-time" },
        },
      },
      // Conflict schema
      Conflict: {
        type: "object",
        properties: {
          _id:        { type: "string", example: "64a7f3c2e4b0a1234567890d" },
          projectA:   { type: "string", example: "64a7f3c2e4b0a1234567890c" },
          projectB:   { type: "string", example: "64a7f3c2e4b0a1234567890e" },
          status:     { type: "string", enum: ["open", "resolved", "overridden"] },
          resolution: { type: "string", nullable: true },
          recommendation: {
            type: "object",
            properties: {
              order:  { type: "array", items: { type: "string" } },
              scores: {
                type: "object",
                properties: {
                  projectA: { type: "number", example: 0.82 },
                  projectB: { type: "number", example: 0.61 },
                },
              },
            },
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      // CitizenReport schema
      CitizenReport: {
        type: "object",
        properties: {
          _id:        { type: "string", example: "64a7f3c2e4b0a1234567890f" },
          trackingId: { type: "string", example: "CNR-A3FX92" },
          type:       { type: "string", enum: ["pothole", "streetlight", "water_leak", "garbage", "other"] },
          description:{ type: "string", example: "Large pothole near bus stop" },
          status:     { type: "string", enum: ["submitted", "acknowledged", "in_progress", "resolved"] },
          photoUrl:   { type: "string", nullable: true, example: "https://res.cloudinary.com/..." },
          createdAt:  { type: "string", format: "date-time" },
        },
      },
    },
    // Reusable response objects
    responses: {
      Unauthorized: {
        description: "Authentication required",
        content: {
          "application/json": {
            schema: { "$ref": "#/components/schemas/ErrorResponse" },
            example: { success: false, message: "Authentication required. Please log in.", error: null },
          },
        },
      },
      Forbidden: {
        description: "Insufficient permissions",
        content: {
          "application/json": {
            schema: { "$ref": "#/components/schemas/ErrorResponse" },
            example: { success: false, message: "Access denied.", error: null },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { "$ref": "#/components/schemas/ErrorResponse" },
            example: { success: false, message: "Resource not found.", error: null },
          },
        },
      },
      ValidationError: {
        description: "Validation failed",
        content: {
          "application/json": {
            schema: { "$ref": "#/components/schemas/ErrorResponse" },
            example: { success: false, message: "Validation failed", error: { email: "Please provide a valid email address" } },
          },
        },
      },
    },
  },
  // Apply BearerAuth globally — individual routes can override
  security: [{ BearerAuth: [] }],
};

// ---------------------------------------------------------------------------
// swagger-jsdoc options
// Scans route files for JSDoc @swagger annotations (added in Phase 5)
// ---------------------------------------------------------------------------
const options = {
  swaggerDefinition,
  apis: [
    "./src/routes/*.js",      // route files with @swagger JSDoc comments
    "./src/controllers/*.js", // controller files
  ],
};

const swaggerSpec = swaggerJsdoc(options);

// ---------------------------------------------------------------------------
// setupSwagger — call this in server.js to mount Swagger UI
// Only available in non-production environments
// ---------------------------------------------------------------------------
const setupSwagger = (app) => {
  if (config.IS_PRODUCTION) {
    return; // do not expose API docs in production
  }

  app.use(
    "/api/v1/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Urban Nexus API Docs",
      customCss:       ".swagger-ui .topbar { background-color: #0E9F6E; }",
      swaggerOptions: {
        persistAuthorization: true, // keep token between page refreshes
      },
    })
  );

  // Raw JSON spec endpoint — useful for Postman import
  app.get("/api/v1/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};

module.exports = { setupSwagger };