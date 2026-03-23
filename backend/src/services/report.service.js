"use strict";

const CitizenReport              = require("../models/CitizenReport");
const { auditReportStatusUpdated } = require("./audit.service");
const { emitReportStatusUpdate }   = require("./notification.service");
const { paginate }                 = require("../utils/response");

// ---------------------------------------------------------------------------
// report.service.js
//
// All business logic for citizen report CRUD.
// Photo upload is handled upstream by multer + Cloudinary middleware in
// the route â€” by the time createReport runs, req.file.path is the URL.
// ---------------------------------------------------------------------------

/**
 * Creates a new citizen report
 * Photo URL comes from req.file.path set by multer-storage-cloudinary
 *
 * @param {object} body     - { type, description, latitude, longitude }
 * @param {string} photoUrl - Cloudinary URL from req.file.path (or null)
 * @returns {object}        - { trackingId, type, status, message }
 */
const createReport = async (body, photoUrl = null) => {
  const { type, description, latitude, longitude } = body;

  if (!type) {
    const err = new Error("type is required");
    err.statusCode = 400;
    throw err;
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    const err = new Error("Valid latitude and longitude are required");
    err.statusCode = 400;
    throw err;
  }

  const report = await CitizenReport.create({
    type,
    description: description || "",
    location: {
      type:        "Point",
      coordinates: [lng, lat],   // GeoJSON: [longitude, latitude]
    },
    photoUrl: photoUrl || null,
    status:   "submitted",
  });

  return {
    trackingId: report.trackingId,
    type:       report.type,
    status:     report.status,
    message:    "Use your tracking ID to check status",
  };
};

/**
 * Returns report status by tracking ID â€” public endpoint
 *
 * @param {string} trackingId  - CNR-XXXXXX
 * @returns {object}           - Trimmed report for public display
 */
const trackReport = async (trackingId) => {
  const report = await CitizenReport.findOne({ trackingId })
    .populate("assignedTo", "name")
    .lean();

  if (!report) {
    const err = new Error("Report not found. Check your tracking ID.");
    err.statusCode = 404;
    throw err;
  }

  // Return only public-safe fields
  return {
    trackingId:  report.trackingId,
    type:        report.type,
    status:      report.status,
    description: report.description,
    assignedTo:  report.assignedTo ? { name: report.assignedTo.name } : null,
    createdAt:   report.createdAt,
    updatedAt:   report.updatedAt,
  };
};

/**
 * Returns paginated list of all reports â€” admin and officer only
 *
 * @param {object} query  - { status, type, page, limit }
 * @returns {object}      - { reports, pagination }
 */
const getAllReports = async (query = {}) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.type)   filter.type   = query.type;

  const meta = paginate(
    await CitizenReport.countDocuments(filter),
    query.page,
    query.limit
  );

  const reports = await CitizenReport.find(filter)
    .populate("assignedTo",    "name code")
    .populate("linkedProject", "title type status")
    .sort({ createdAt: -1 })
    .skip(meta.skip)
    .limit(meta.limit)
    .lean();

  return { reports, pagination: meta };
};

/**
 * Returns a single report by MongoDB ID â€” admin and officer only
 *
 * @param {string} reportId  - MongoDB ObjectId
 * @returns {object}         - Full report document
 */
const getReportById = async (reportId) => {
  const report = await CitizenReport.findById(reportId)
    .populate("assignedTo",    "name code")
    .populate("linkedProject", "title type status department")
    .lean();

  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  return report;
};

/**
 * Updates report status and optional department assignment
 * Emits report:status_update socket event on every status change
 *
 * @param {string} reportId    - MongoDB ObjectId
 * @param {string} status      - New status
 * @param {string} assignedTo  - Department ObjectId (optional)
 * @param {object} user        - req.user
 * @param {string} ip          - Request IP for audit log
 * @returns {object}           - Updated report document
 */
const updateReportStatus = async (reportId, status, assignedTo, user, ip) => {
  const report = await CitizenReport.findById(reportId);

  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  const VALID_STATUSES = ["submitted", "acknowledged", "in_progress", "resolved"];
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  const prevStatus  = report.status;
  report.status     = status;
  if (assignedTo) report.assignedTo = assignedTo;

  await report.save();

  // Audit log â€” fire and forget
  auditReportStatusUpdated(user.userId, reportId, prevStatus, status, ip);

  // Real-time notification to citizen tracking this report
  emitReportStatusUpdate(report.trackingId, status);

  return report.populate("assignedTo", "name code");
};

/**
 * Assigns a report to a department
 *
 * @param {string} reportId      - MongoDB report ID
 * @param {string} departmentId  - MongoDB department ID
 * @returns {object}             - Updated report
 */
const assignReport = async (reportId, departmentId) => {
  const report = await CitizenReport.findById(reportId);

  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  report.assignedTo = departmentId;
  if (report.status === "submitted") report.status = "acknowledged";

  await report.save();

  return report.populate("assignedTo", "name code");
};

/**
 * Links a citizen report to an existing project
 *
 * @param {string} reportId   - MongoDB report ID
 * @param {string} projectId  - MongoDB project ID
 * @returns {object}          - Updated report
 */
const linkReportToProject = async (reportId, projectId) => {
  const report = await CitizenReport.findByIdAndUpdate(
    reportId,
    { linkedProject: projectId },
    { new: true }
  )
    .populate("linkedProject", "title type status")
    .lean();

  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  return report;
};

module.exports = {
  createReport,
  trackReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  assignReport,
  linkReportToProject,
};
