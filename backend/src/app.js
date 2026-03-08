"use strict";

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const morgan       = require("morgan");
const rateLimit    = require("express-rate-limit");

const config       = require("./config/index");
const logger       = require("./utils/logger");

// Route imports
const authRoutes       = require("./routes/auth.routes");
const projectRoutes    = require("./routes/project.routes");
const conflictRoutes   = require("./routes/conflict.routes");
const departmentRoutes = require("./routes/department.routes");
const reportRoutes     = require("./routes/report.routes");
const adminRoutes      = require("./routes/admin.routes");

// Error middleware — must be imported last, registered last
const { errorHandler, notFound } = require("./middleware/error.middleware");

// Swagger — imported here so it registers before notFound middleware
const { setupSwagger } = require("../swagger");

// ---------------------------------------------------------------------------
// Initialize Express app
// ---------------------------------------------------------------------------
const app = express();

// ---------------------------------------------------------------------------
// 1. Security middleware
// ---------------------------------------------------------------------------

// Helmet sets secure HTTP headers
app.use(helmet());

// CORS — only allow requests from the configured frontend origin
app.use(
  cors({
    origin:      config.CLIENT_ORIGIN,
    credentials: true,
    methods:     ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Global rate limiter — 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      100,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
    error:   null,
  },
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders:   false,
});

app.use(globalLimiter);

// Stricter rate limiter for auth routes — 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
    error:   null,
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ---------------------------------------------------------------------------
// 2. Request parsing middleware
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ---------------------------------------------------------------------------
// 3. HTTP request logging
//    Uses morgan in development, skip in test to keep output clean
// ---------------------------------------------------------------------------
if (!config.IS_TEST) {
  app.use(
    morgan("dev", {
      stream: {
        write: (message) => logger.http(message.trim()),
      },
    })
  );
}

// ---------------------------------------------------------------------------
// 4. Health check — lightweight endpoint for Docker and load balancers
//    Does not require auth, not rate limited
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Urban Nexus API is running.",
    data: {
      environment: config.NODE_ENV,
      timestamp:   new Date().toISOString(),
    },
  });
});

// ---------------------------------------------------------------------------
// 5. API routes — all mounted under /api/v1
// ---------------------------------------------------------------------------
app.use("/api/v1/auth",            authLimiter, authRoutes);
app.use("/api/v1/projects",        projectRoutes);
app.use("/api/v1/conflicts",       conflictRoutes);
app.use("/api/v1/departments",     departmentRoutes);
app.use("/api/v1/citizen-reports", reportRoutes);
app.use("/api/v1/admin",           adminRoutes);

// Swagger UI — registered before notFound so it is not caught as 404
setupSwagger(app);

// ---------------------------------------------------------------------------
// 6. 404 handler — catches all unmatched routes
//    Must be after all route registrations
// ---------------------------------------------------------------------------
app.use(notFound);

// ---------------------------------------------------------------------------
// 7. Global error handler — must be last middleware registered
//    Receives all errors passed via next(err)
// ---------------------------------------------------------------------------
app.use(errorHandler);

module.exports = app;