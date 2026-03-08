"use strict";

const AuthService    = require("../services/auth.service");
const { success }    = require("../utils/response");

// ---------------------------------------------------------------------------
// Auth Controller — handles req/res only, zero business logic
// All logic lives in AuthService
// Pattern from HANDOFF.md Section 9
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/auth/register
 * Public — no auth required
 * Body validated by registerSchema via validateBody middleware in routes
 */
const register = async (req, res, next) => {
  try {
    const { user, token } = await AuthService.registerUser(req.body);

    return res.status(201).json(
      success("Account created successfully.", { user, token })
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 * Public — no auth required
 * Body validated by loginSchema via validateBody middleware in routes
 */
const login = async (req, res, next) => {
  try {
    const { user, token } = await AuthService.loginUser(req.body);

    return res.status(200).json(
      success("Logged in successfully.", { user, token })
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 * Protected — requires valid JWT via auth middleware in routes
 * Returns the currently authenticated user's profile
 */
const me = async (req, res, next) => {
  try {
    const user = await AuthService.getMe(req.user.userId);

    return res.status(200).json(
      success("User profile fetched.", user )
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me };