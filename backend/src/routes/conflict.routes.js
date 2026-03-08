"use strict";

const express = require("express");
const router  = express.Router();

const {
  getAllConflicts,
  getConflictById,
  resolveConflict,
  overrideConflict,
} = require("../controllers/conflict.controller");

const auth           = require("../middleware/auth.middleware");
const { permit }     = require("../middleware/rbac.middleware");
const { validateParams } = require("../middleware/validate.middleware");

const Joi = require("joi");

// ---------------------------------------------------------------------------
// Reusable ObjectId param schema for conflict routes
// ---------------------------------------------------------------------------
const conflictIdSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.hex":    "Must be a valid conflict ID",
      "string.length": "Must be a valid conflict ID",
      "any.required":  "Conflict ID is required",
    }),
});

// ---------------------------------------------------------------------------
// Conflict Routes — mounted at /api/v1/conflicts in app.js
// All routes require authentication
// Full implementation in Phase 2 — currently all return 200 "Coming soon"
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/conflicts
 * admin only — view all conflicts across all departments
 */
router.get(
  "/",
  auth,
  permit("admin"),
  getAllConflicts
);

/**
 * GET /api/v1/conflicts/:id
 * admin only — view conflict detail with MCDM scores and execution order
 */
router.get(
  "/:id",
  auth,
  permit("admin"),
  validateParams(conflictIdSchema),
  getConflictById
);

/**
 * PATCH /api/v1/conflicts/:id/resolve
 * admin only — resolve a conflict with a resolution note
 */
router.patch(
  "/:id/resolve",
  auth,
  permit("admin"),
  validateParams(conflictIdSchema),
  resolveConflict
);

/**
 * PATCH /api/v1/conflicts/:id/override
 * admin only — override a conflict (proceed despite clash)
 */
router.patch(
  "/:id/override",
  auth,
  permit("admin"),
  validateParams(conflictIdSchema),
  overrideConflict
);

module.exports = router;