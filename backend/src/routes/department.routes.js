"use strict";

const express = require("express");
const router  = express.Router();

const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignDepartmentHead,
  getDepartmentProjects,
} = require("../controllers/department.controller");

const auth               = require("../middleware/auth.middleware");
const { permit }         = require("../middleware/rbac.middleware");
const { validateParams } = require("../middleware/validate.middleware");

const Joi = require("joi");

// ---------------------------------------------------------------------------
// Reusable ObjectId param schema for department routes
// ---------------------------------------------------------------------------
const departmentIdSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.hex":    "Must be a valid department ID",
      "string.length": "Must be a valid department ID",
      "any.required":  "Department ID is required",
    }),
});

// ---------------------------------------------------------------------------
// Department Routes — mounted at /api/v1/departments in app.js
// Full implementation in Phase 2 — currently all return 200 "Coming soon"
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/departments
 * All authenticated roles — needed for dropdowns in project form
 */
router.get(
  "/",
  auth,
  permit("admin", "officer", "supervisor"),
  getAllDepartments
);

/**
 * GET /api/v1/departments/:id
 * All authenticated roles
 */
router.get(
  "/:id",
  auth,
  permit("admin", "officer", "supervisor"),
  validateParams(departmentIdSchema),
  getDepartmentById
);

/**
 * POST /api/v1/departments
 * admin only — create a new department
 */
router.post(
  "/",
  auth,
  permit("admin"),
  createDepartment
);

/**
 * PATCH /api/v1/departments/:id
 * admin only — update department name or code
 */
router.patch(
  "/:id",
  auth,
  permit("admin"),
  validateParams(departmentIdSchema),
  updateDepartment
);

/**
 * DELETE /api/v1/departments/:id
 * admin only — soft delete (sets isActive: false)
 */
router.delete(
  "/:id",
  auth,
  permit("admin"),
  validateParams(departmentIdSchema),
  deleteDepartment
);

/**
 * PATCH /api/v1/departments/:id/head
 * admin only — assign a department head
 */
router.patch(
  "/:id/head",
  auth,
  permit("admin"),
  validateParams(departmentIdSchema),
  assignDepartmentHead
);

/**
 * GET /api/v1/departments/:id/projects
 * admin and officer — view all projects under a department
 */
router.get(
  "/:id/projects",
  auth,
  permit("admin", "officer"),
  validateParams(departmentIdSchema),
  getDepartmentProjects
);

module.exports = router;