"use strict";

const express = require("express");
const router  = express.Router();

const {
  createReport,
  trackReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  assignReport,
  linkReportToProject,
} = require("../controllers/report.controller");

const auth               = require("../middleware/auth.middleware");
const { permit }         = require("../middleware/rbac.middleware");
const { validateParams } = require("../middleware/validate.middleware");
const { uploadReportPhoto } = require("../config/cloudinary");

const Joi = require("joi");

// ---------------------------------------------------------------------------
// Reusable param schemas for report routes
// ---------------------------------------------------------------------------
const reportIdSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.hex":    "Must be a valid report ID",
      "string.length": "Must be a valid report ID",
      "any.required":  "Report ID is required",
    }),
});

const trackingIdSchema = Joi.object({
  trackingId: Joi.string()
    .uppercase()
    .pattern(/^CNR-[A-Z0-9]{6}$/)
    .required()
    .messages({
      "string.pattern.base": "Tracking ID must be in the format CNR-XXXXXX",
      "any.required":        "Tracking ID is required",
    }),
});

// ---------------------------------------------------------------------------
// Report Routes — mounted at /api/v1/citizen-reports in app.js
// Note: createReport and trackReport are PUBLIC — no auth required
// Full implementation in Phase 5 — currently all return 200 "Coming soon"
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/citizen-reports
 * PUBLIC — no login required
 * Accepts optional photo upload via multipart/form-data
 * Photo upload middleware wired now — ready for Phase 5
 */
router.post(
  "/",
  uploadReportPhoto.single("photo"),
  createReport
);

/**
 * GET /api/v1/citizen-reports/track/:trackingId
 * PUBLIC — citizens track their own report by tracking ID
 * No auth required — tracking ID is the access token
 */
router.get(
  "/track/:trackingId",
  validateParams(trackingIdSchema),
  trackReport
);

/**
 * GET /api/v1/citizen-reports
 * admin and officer only — view all submitted reports
 */
router.get(
  "/",
  auth,
  permit("admin", "officer"),
  getAllReports
);

/**
 * GET /api/v1/citizen-reports/:id
 * admin and officer only — view a single report detail
 */
router.get(
  "/:id",
  auth,
  permit("admin", "officer"),
  validateParams(reportIdSchema),
  getReportById
);

/**
 * PATCH /api/v1/citizen-reports/:id/status
 * admin and officer only — update report status
 * Triggers report:status_update socket event in Phase 4
 */
router.patch(
  "/:id/status",
  auth,
  permit("admin", "officer"),
  validateParams(reportIdSchema),
  updateReportStatus
);

/**
 * PATCH /api/v1/citizen-reports/:id/assign
 * admin only — assign report to a department
 */
router.patch(
  "/:id/assign",
  auth,
  permit("admin"),
  validateParams(reportIdSchema),
  assignReport
);

/**
 * PATCH /api/v1/citizen-reports/:id/link-project
 * admin and officer only — link report to an existing project
 */
router.patch(
  "/:id/link-project",
  auth,
  permit("admin", "officer"),
  validateParams(reportIdSchema),
  linkReportToProject
);

module.exports = router;