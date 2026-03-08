"use strict";

const express  = require("express");
const router   = express.Router();

const { register, login, me } = require("../controllers/auth.controller");
const auth                    = require("../middleware/auth.middleware");
const { validateBody }        = require("../middleware/validate.middleware");
const { registerSchema,
        loginSchema }         = require("../validators/auth.validator");

// ---------------------------------------------------------------------------
// Auth Routes — mounted at /api/v1/auth in app.js
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/auth/register
 * Public
 * Validates body → creates user → returns token
 */
router.post(
  "/register",
  validateBody(registerSchema),
  register
);

/**
 * POST /api/v1/auth/login
 * Public
 * Validates body → verifies credentials → returns token
 */
router.post(
  "/login",
  validateBody(loginSchema),
  login
);

/**
 * GET /api/v1/auth/me
 * Protected — requires valid JWT
 * Returns currently authenticated user's profile
 */
router.get(
  "/me",
  auth,
  me
);

module.exports = router;