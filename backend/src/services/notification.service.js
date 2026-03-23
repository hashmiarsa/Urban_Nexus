"use strict";

const socketHandler = require("../socket/socket.handler");
const logger        = require("../utils/logger");

// ---------------------------------------------------------------------------
// notification.service.js â€” LIVE (Phase 4 replacement)
//
// Replaces the Phase 2 stub.
// All function signatures and module.exports are identical to the stub â€”
// nothing that imports this file needs to change.
//
// Delegates to socket.handler.js which holds the io instance.
// If Socket.io is not yet initialised (e.g. during tests), calls are
// silently skipped â€” the try/catch guards ensure no crash.
// ---------------------------------------------------------------------------

const emitClashDetected = (conflictId, projectIds, departmentIds = []) => {
  try {
    socketHandler.emitClashDetected(conflictId, projectIds, departmentIds);
  } catch (err) {
    logger.warn(`[NotificationService] emitClashDetected failed â€” ${err.message}`);
  }
};

const emitProjectApproved = (projectId, departmentId) => {
  try {
    socketHandler.emitProjectApproved(projectId, departmentId);
  } catch (err) {
    logger.warn(`[NotificationService] emitProjectApproved failed â€” ${err.message}`);
  }
};

const emitProjectRejected = (projectId, departmentId) => {
  try {
    socketHandler.emitProjectRejected(projectId, departmentId);
  } catch (err) {
    logger.warn(`[NotificationService] emitProjectRejected failed â€” ${err.message}`);
  }
};

const emitReportStatusUpdate = (trackingId, status) => {
  try {
    socketHandler.emitReportStatusUpdate(trackingId, status);
  } catch (err) {
    logger.warn(`[NotificationService] emitReportStatusUpdate failed â€” ${err.message}`);
  }
};

const emitTaskAssigned = (supervisorId, projectId) => {
  try {
    socketHandler.emitTaskAssigned(supervisorId, projectId);
  } catch (err) {
    logger.warn(`[NotificationService] emitTaskAssigned failed â€” ${err.message}`);
  }
};

module.exports = {
  emitClashDetected,
  emitProjectApproved,
  emitProjectRejected,
  emitReportStatusUpdate,
  emitTaskAssigned,
};
