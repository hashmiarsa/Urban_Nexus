"use strict";

const AuditLog = require("../models/AuditLog");
const logger   = require("../utils/logger");

// ---------------------------------------------------------------------------
// audit.service.js
//
// Single responsibility: write immutable audit log entries.
// Called by every service that performs a significant state change.
//
// AuditLog documents are append-only â€” no updates or deletes ever.
// The model enforces this via pre-hooks (built in Phase 1).
//
// Designed to never throw â€” audit failure must not break the main operation.
// Errors are logged via Winston but swallowed so callers are unaffected.
// ---------------------------------------------------------------------------

/**
 * Writes an audit log entry for a significant action
 * Designed to be fire-and-forget â€” never throws
 *
 * @param {object} params
 * @param {string} params.userId      - ID of user performing the action
 * @param {string} params.action      - Dot-notation action string e.g. "project.created"
 * @param {string} params.resource    - Collection name e.g. "projects"
 * @param {string} params.resourceId  - ID of the affected document
 * @param {object} [params.before]    - State before the change (null for creates)
 * @param {object} [params.after]     - State after the change (null for deletes)
 * @param {string} [params.ip]        - IP address of the request
 * @returns {Promise<void>}
 */
const logAction = async ({
  userId,
  action,
  resource,
  resourceId,
  before = null,
  after  = null,
  ip     = null,
}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      resource,
      resourceId,
      before,
      after,
      ip,
    });
  } catch (err) {
    // Audit failure must never break the calling operation
    // Log the error but do not rethrow
    logger.error(`[AuditService] Failed to write audit log â€” action: ${action}, resource: ${resource}/${resourceId} â€” ${err.message}`);
  }
};

// ---------------------------------------------------------------------------
// Convenience wrappers for common actions
// These ensure consistent action string formatting across the codebase
// ---------------------------------------------------------------------------

const auditProjectCreated = (userId, project, ip) =>
  logAction({
    userId,
    action:     "project.created",
    resource:   "projects",
    resourceId: project._id,
    before:     null,
    after:      { title: project.title, status: project.status, department: project.department },
    ip,
  });

const auditProjectStatusUpdated = (userId, projectId, before, after, ip) =>
  logAction({
    userId,
    action:     "project.status_updated",
    resource:   "projects",
    resourceId: projectId,
    before:     { status: before },
    after:      { status: after },
    ip,
  });

const auditProjectAssigned = (userId, projectId, supervisorId, ip) =>
  logAction({
    userId,
    action:     "project.assigned",
    resource:   "projects",
    resourceId: projectId,
    before:     null,
    after:      { assignedTo: supervisorId },
    ip,
  });

const auditConflictResolved = (userId, conflictId, resolution, ip) =>
  logAction({
    userId,
    action:     "conflict.resolved",
    resource:   "conflicts",
    resourceId: conflictId,
    before:     { status: "open" },
    after:      { status: "resolved", resolution },
    ip,
  });

const auditDepartmentCreated = (userId, department, ip) =>
  logAction({
    userId,
    action:     "department.created",
    resource:   "departments",
    resourceId: department._id,
    before:     null,
    after:      { name: department.name, code: department.code },
    ip,
  });

const auditReportStatusUpdated = (userId, reportId, before, after, ip) =>
  logAction({
    userId,
    action:     "report.status_updated",
    resource:   "citizen_reports",
    resourceId: reportId,
    before:     { status: before },
    after:      { status: after },
    ip,
  });

module.exports = {
  logAction,
  auditProjectCreated,
  auditProjectStatusUpdated,
  auditProjectAssigned,
  auditConflictResolved,
  auditDepartmentCreated,
  auditReportStatusUpdated,
};
