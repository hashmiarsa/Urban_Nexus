"use strict";

const dotenv = require("dotenv");
dotenv.config();

// ---------------------------------------------------------------------------
// Required variables â€” server crashes on startup if any of these are missing
// ---------------------------------------------------------------------------
const REQUIRED_VARS = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[Config] FATAL â€” Missing required environment variables: ${missing.join(", ")}`
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Exported constants â€” every file in the codebase imports from here
// Never use process.env directly anywhere else
// ---------------------------------------------------------------------------
const config = {
  // Server
  NODE_ENV:       process.env.NODE_ENV     || "development",
  PORT:           parseInt(process.env.PORT, 10) || 5000,

  // Database
  MONGO_URI:      process.env.MONGO_URI,

  // Auth
  JWT_SECRET:     process.env.JWT_SECRET,
  JWT_EXPIRY:     process.env.JWT_EXPIRY   || "7d",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME:  process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY:     process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET:  process.env.CLOUDINARY_API_SECRET,

  // CORS
  CLIENT_ORIGIN:  process.env.CLIENT_ORIGIN || "http://localhost:3000",

  // Derived helpers
  IS_PRODUCTION:  process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_TEST:        process.env.NODE_ENV === "test",
  // Conflict detection
  CONFLICT_CHECK_STATUSES: ["pending", "approved", "ongoing"],
  TOPSIS_WEIGHTS: {
    urgency:           0.30,
    socialImpact:      0.25,
    estimatedCost:     0.20,
    feasibility:       0.15,
    environmentImpact: 0.10,
  },
};

module.exports = config;

