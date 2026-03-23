"use strict";

const express  = require("express");
const router   = express.Router();

const { register, login, me } = require("../controllers/auth.controller");
const auth                    = require("../middleware/auth.middleware");
const { validateBody }        = require("../middleware/validate.middleware");
const { registerSchema,
        loginSchema }         = require("../validators/auth.validator");

// ---------------------------------------------------------------------------
// Auth Routes â€” mounted at /api/v1/auth in app.js
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/auth/register
 * Public
 * Validates body â†’ creates user â†’ returns token
 */
router.post(
  "/register",
  validateBody(registerSchema),
  register
);

/**
 * POST /api/v1/auth/login
 * Public
 * Validates body â†’ verifies credentials â†’ returns token
 */
router.post(
  "/login",
  validateBody(loginSchema),
  login
);

/**
 * GET /api/v1/auth/me
 * Protected â€” requires valid JWT
 * Returns currently authenticated user's profile
 */
router.get(
  "/me",
  auth,
  me
);

router.get("/users", auth, async (req, res, next) => {
  try {
    const User = require("../models/User");
    const users = await User.find({ isActive: true }).select("-password").lean();
    return res.json({ success: true, message: "Users fetched", data: users });
  } catch (err) { next(err); }
});

module.exports = router;
