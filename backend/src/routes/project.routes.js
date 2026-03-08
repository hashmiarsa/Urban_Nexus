"use strict";

const express = require("express");
const router  = express.Router();

const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  updateProjectProgress,
} = require("../controllers/project.controller");

const auth             = require("../middleware/auth.middleware");
const { permit }       = require("../middleware/rbac.middleware");
const { validateBody,
        validateParams } = require("../middleware/validate.middleware");
const { createProjectSchema,
        updateProjectSchema,
        projectIdSchema }  = require("../validators/project.validator");

// ---------------------------------------------------------------------------
// Project Routes — mounted at /api/v1/projects in app.js
// All routes require authentication
// Full implementation in Phase 2 — currently all return 200 "Coming soon"
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/projects
 * admin — all projects
 * officer — own department's projects
 * supervisor — assigned projects only
 */
router.get(
  "/",
  auth,
  permit("admin", "officer", "supervisor"),
  getAllProjects
);

/**
 * GET /api/v1/projects/:id
 * admin — any project
 * officer — own department only (enforced in Phase 2 service)
 * supervisor — assigned only (enforced in Phase 2 service)
 */
router.get(
  "/:id",
  auth,
  permit("admin", "officer", "supervisor"),
  validateParams(projectIdSchema),
  getProjectById
);

/**
 * POST /api/v1/projects
 * admin and officer only
 */
router.post(
  "/",
  auth,
  permit("admin", "officer"),
  validateBody(createProjectSchema),
  createProject
);

/**
 * PATCH /api/v1/projects/:id
 * admin and officer only
 */
router.patch(
  "/:id",
  auth,
  permit("admin", "officer"),
  validateParams(projectIdSchema),
  validateBody(updateProjectSchema),
  updateProject
);

/**
 * DELETE /api/v1/projects/:id
 * admin only
 */
router.delete(
  "/:id",
  auth,
  permit("admin"),
  validateParams(projectIdSchema),
  deleteProject
);

/**
 * PATCH /api/v1/projects/:id/status
 * admin only — approve, reject, mark ongoing/completed
 */
router.patch(
  "/:id/status",
  auth,
  permit("admin"),
  validateParams(projectIdSchema),
  updateProjectStatus
);

/**
 * PATCH /api/v1/projects/:id/progress
 * admin and supervisor only
 */
router.patch(
  "/:id/progress",
  auth,
  permit("admin", "supervisor"),
  validateParams(projectIdSchema),
  updateProjectProgress
);

module.exports = router;