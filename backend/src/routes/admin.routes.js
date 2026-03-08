"use strict";

const express = require("express");
const router  = express.Router();

const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  getAuditLog,
  getAuditLogByResource,
} = require("../controllers/admin.controller");

const auth               = require("../middleware/auth.middleware");
const { permit }         = require("../middleware/rbac.middleware");
const { validateParams } = require("../middleware/validate.middleware");

const Joi = require("joi");

// ---------------------------------------------------------------------------
// Reusable param schemas for admin routes
// ---------------------------------------------------------------------------
const userIdSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.hex":    "Must be a valid user ID",
      "string.length": "Must be a valid user ID",
      "any.required":  "User ID is required",
    }),
});

const resourceIdSchema = Joi.object({
  resourceId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.hex":    "Must be a valid resource ID",
      "string.length": "Must be a valid resource ID",
      "any.required":  "Resource ID is required",
    }),
});

// ---------------------------------------------------------------------------
// Admin Routes — mounted at /api/v1/admin in app.js
// ALL routes are admin only — permit("admin") on every route
// Full implementation in Phase 2/5 — currently all return 200 "Coming soon"
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/stats
 * Admin dashboard — total projects, conflicts, reports, dept performance
 */
router.get(
  "/stats",
  auth,
  permit("admin"),
  getDashboardStats
);

/**
 * GET /api/v1/admin/users
 * View all users across all departments
 */
router.get(
  "/users",
  auth,
  permit("admin"),
  getAllUsers
);

/**
 * GET /api/v1/admin/users/:id
 * View a single user profile
 */
router.get(
  "/users/:id",
  auth,
  permit("admin"),
  validateParams(userIdSchema),
  getUserById
);

/**
 * PATCH /api/v1/admin/users/:id
 * Update user details (name, role, department assignment)
 */
router.patch(
  "/users/:id",
  auth,
  permit("admin"),
  validateParams(userIdSchema),
  updateUser
);

/**
 * PATCH /api/v1/admin/users/:id/deactivate
 * Deactivate a user account — sets isActive: false
 * Separate from update to make the action explicit and auditable
 */
router.patch(
  "/users/:id/deactivate",
  auth,
  permit("admin"),
  validateParams(userIdSchema),
  deactivateUser
);

/**
 * GET /api/v1/admin/audit-log
 * Full audit log — all actions across all resources, paginated
 */
router.get(
  "/audit-log",
  auth,
  permit("admin"),
  getAuditLog
);

/**
 * GET /api/v1/admin/audit-log/:resourceId
 * Audit history for a specific resource (project, conflict, report)
 */
router.get(
  "/audit-log/:resourceId",
  auth,
  permit("admin"),
  validateParams(resourceIdSchema),
  getAuditLogByResource
);

module.exports = router;