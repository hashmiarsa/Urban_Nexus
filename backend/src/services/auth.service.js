"use strict";

const jwt        = require("jsonwebtoken");
const config     = require("../config/index");
const User       = require("../models/User");
const Department = require("../models/Department");
const logger     = require("../utils/logger");

// ---------------------------------------------------------------------------
// Helper — signs a JWT token for the given user
// ---------------------------------------------------------------------------
const signToken = (user) => {
  return jwt.sign(
    {
      userId:       user._id,
      role:         user.role,
      departmentId: user.department,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRY }
  );
};

// ---------------------------------------------------------------------------
// Helper — builds the application error with a status code
// Services throw these — errorHandler in middleware catches them
// ---------------------------------------------------------------------------
const appError = (message, statusCode = 400, details = null) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (details) err.details = details;
  return err;
};

// ---------------------------------------------------------------------------
// registerUser — creates a new user account
//
// Business rules:
//   1. Email must not already exist
//   2. officer and supervisor roles must provide a valid, active department
//   3. admin and citizen roles must NOT provide a department
//   4. Password is hashed by the User model pre-save hook
//
// @param   {object} data  - Validated body from auth.controller.js
// @returns {object}       - { user, token }
// ---------------------------------------------------------------------------
const registerUser = async (data) => {
  const { name, email, password, role, department } = data;

  // 1. Check for duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw appError("An account with this email already exists.", 409);
  }

  // 2. Department validation based on role
  if (["officer", "supervisor"].includes(role)) {
    if (!department) {
      throw appError(
        `A department is required for the '${role}' role.`,
        400
      );
    }

    const dept = await Department.findById(department);
    if (!dept) {
      throw appError("Department not found.", 404);
    }
    if (!dept.isActive) {
      throw appError("Cannot register under an inactive department.", 400);
    }
  }

  if (["admin", "citizen"].includes(role) && department) {
    throw appError(
      `The '${role}' role must not be assigned to a department.`,
      400
    );
  }

  // 3. Create user — password hashing handled by pre-save hook in User model
  const user = await User.create({
    name,
    email,
    password,
    role,
    department: ["officer", "supervisor"].includes(role) ? department : null,
  });

  // 4. Sign token
  const token = signToken(user);

  logger.info(`[AuthService] New user registered — ${email} (${role})`);

  // Return user without password (select: false handles this on queries,
  // but on create we manually exclude it from the returned object)
  const userResponse = user.toJSON();
  delete userResponse.password;

  return { user: userResponse, token };
};

// ---------------------------------------------------------------------------
// loginUser — authenticates a user and returns a token
//
// Business rules:
//   1. User must exist with the given email
//   2. Password must match the stored hash
//   3. Account must be active
//
// @param   {object} data  - { email, password } validated body
// @returns {object}       - { user, token }
// ---------------------------------------------------------------------------
const loginUser = async (data) => {
  const { email, password } = data;

  // 1. Find user — must explicitly select password (select: false on schema)
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    // Intentionally vague — do not reveal whether email exists
    throw appError("Invalid email or password.", 401);
  }

  // 2. Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw appError("Invalid email or password.", 401);
  }

  // 3. Check account is active
  if (!user.isActive) {
    throw appError(
      "Your account has been deactivated. Please contact an administrator.",
      403
    );
  }

  // 4. Sign token
  const token = signToken(user);

  logger.info(`[AuthService] User logged in — ${email} (${user.role})`);

  const userResponse = user.toJSON();
  delete userResponse.password;

  return { user: userResponse, token };
};

// ---------------------------------------------------------------------------
// getMe — returns the currently authenticated user's profile
//
// @param   {string} userId  - ObjectId string from req.user.userId
// @returns {object}         - user document (no password)
// ---------------------------------------------------------------------------
const getMe = async (userId) => {
  const user = await User.findById(userId).populate(
    "department",
    "name code"  // only return department name and code, not full document
  );

  if (!user) {
    throw appError("User not found.", 404);
  }

  return user;
};

module.exports = { registerUser, loginUser, getMe };