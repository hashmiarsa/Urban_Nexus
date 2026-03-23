"use strict";

const { Server } = require("socket.io");
const config     = require("../config/index");
const logger     = require("../utils/logger");

// ---------------------------------------------------------------------------
// socket.handler.js
//
// Initialises Socket.io on the HTTP server.
// Exports:
//   initSocket(httpServer) â€” call once in server.js after server.listen()
//   getIO()                â€” returns the io instance for use in services
//
// Room strategy:
//   Every authenticated client joins two rooms on connection:
//     1. Their userId  â€” for personal notifications (task:assigned)
//     2. Their departmentId â€” for department notifications (clash:detected, project:approved)
//   Admin joins room "admin" â€” receives everything
//
// Client sends:  { event: "join", userId, departmentId, role }
// Server emits all events defined in HANDOFF.md Section 13
// ---------------------------------------------------------------------------

let io = null;

/**
 * Initialises Socket.io and attaches it to the HTTP server
 * Must be called once in server.js after server.listen()
 *
 * @param {http.Server} httpServer  - The Node.js HTTP server instance
 * @returns {Server}                - The Socket.io server instance
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:  config.CLIENT_ORIGIN,
      methods: ["GET", "POST"],
    },
    // Ping timeout / interval â€” keeps connections alive through proxies
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    logger.info(`[Socket] Client connected â€” socketId: ${socket.id}`);

    // -------------------------------------------------------------------------
    // join â€” client sends its identity so server can place it in correct rooms
    // Payload: { userId, departmentId, role }
    // -------------------------------------------------------------------------
    socket.on("join", ({ userId, departmentId, role }) => {
      if (userId) {
        socket.join(userId);
        logger.info(`[Socket] ${socket.id} joined user room: ${userId}`);
      }

      if (departmentId) {
        socket.join(departmentId);
        logger.info(`[Socket] ${socket.id} joined dept room: ${departmentId}`);
      }

      if (role === "admin") {
        socket.join("admin");
        logger.info(`[Socket] ${socket.id} joined admin room`);
      }

      // Acknowledge join
      socket.emit("joined", {
        userId,
        departmentId,
        role,
        socketId: socket.id,
      });
    });

    // -------------------------------------------------------------------------
    // disconnect
    // -------------------------------------------------------------------------
    socket.on("disconnect", (reason) => {
      logger.info(`[Socket] Client disconnected â€” socketId: ${socket.id} â€” reason: ${reason}`);
    });

    // -------------------------------------------------------------------------
    // Error handler â€” prevents uncaught errors from crashing the server
    // -------------------------------------------------------------------------
    socket.on("error", (err) => {
      logger.error(`[Socket] Error on ${socket.id} â€” ${err.message}`);
    });
  });

  logger.info("[Socket] Socket.io initialised");
  return io;
};

/**
 * Returns the active Socket.io instance
 * Throws if called before initSocket()
 *
 * @returns {Server}  - The Socket.io server instance
 */
const getIO = () => {
  if (!io) {
    throw new Error("[Socket] Socket.io not initialised. Call initSocket(server) first.");
  }
  return io;
};

// ---------------------------------------------------------------------------
// Emitter functions
// These are called by notification.service.js
// Separated here so the service never imports socket.io directly
// ---------------------------------------------------------------------------

/**
 * Emits clash:detected to the admin room AND both departments involved
 *
 * @param {string}   conflictId   - MongoDB conflict ID
 * @param {string[]} projectIds   - [projectAId, projectBId]
 * @param {string[]} departmentIds - Department IDs of the two projects (optional)
 */
const emitClashDetected = (conflictId, projectIds, departmentIds = []) => {
  if (!io) return;

  const payload = { conflictId, projectIds, timestamp: new Date().toISOString() };

  // Notify admin room
  io.to("admin").emit("clash:detected", payload);

  // Notify both departments
  for (const deptId of departmentIds) {
    if (deptId) io.to(String(deptId)).emit("clash:detected", payload);
  }

  logger.info(`[Socket] clash:detected emitted â€” conflict ${conflictId}`);
};

/**
 * Emits project:approved to the project's department room
 *
 * @param {string} projectId    - MongoDB project ID
 * @param {string} departmentId - Department to notify
 */
const emitProjectApproved = (projectId, departmentId) => {
  if (!io) return;

  const payload = { projectId, timestamp: new Date().toISOString() };

  if (departmentId) io.to(String(departmentId)).emit("project:approved", payload);
  io.to("admin").emit("project:approved", payload);

  logger.info(`[Socket] project:approved emitted â€” project ${projectId}`);
};

/**
 * Emits project:rejected to the project's department room
 *
 * @param {string} projectId    - MongoDB project ID
 * @param {string} departmentId - Department to notify
 */
const emitProjectRejected = (projectId, departmentId) => {
  if (!io) return;

  const payload = { projectId, timestamp: new Date().toISOString() };

  if (departmentId) io.to(String(departmentId)).emit("project:rejected", payload);
  io.to("admin").emit("project:rejected", payload);

  logger.info(`[Socket] project:rejected emitted â€” project ${projectId}`);
};

/**
 * Emits report:status_update â€” broadcast to all connected clients
 * (Citizens tracking their own report have no auth, so this is a global broadcast)
 *
 * @param {string} trackingId  - CNR-XXXXXX tracking ID
 * @param {string} status      - New status string
 */
const emitReportStatusUpdate = (trackingId, status) => {
  if (!io) return;

  io.emit("report:status_update", {
    trackingId,
    status,
    timestamp: new Date().toISOString(),
  });

  logger.info(`[Socket] report:status_update emitted â€” ${trackingId} â†’ ${status}`);
};

/**
 * Emits task:assigned to the specific supervisor's personal room
 *
 * @param {string} supervisorId  - MongoDB user ID of the supervisor
 * @param {string} projectId     - MongoDB project ID
 */
const emitTaskAssigned = (supervisorId, projectId) => {
  if (!io) return;

  io.to(String(supervisorId)).emit("task:assigned", {
    projectId,
    timestamp: new Date().toISOString(),
  });

  logger.info(`[Socket] task:assigned emitted â€” supervisor ${supervisorId}`);
};

module.exports = {
  initSocket,
  getIO,
  emitClashDetected,
  emitProjectApproved,
  emitProjectRejected,
  emitReportStatusUpdate,
  emitTaskAssigned,
};
