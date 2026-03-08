"use strict";

const http      = require("http");
const app       = require("./src/app");
const connectDB = require("./src/config/db");
const config    = require("./src/config/index");
const logger    = require("./src/utils/logger");

// ---------------------------------------------------------------------------
// Create HTTP server from Express app
// Separating server creation from app.js allows socket.io to attach
// to the same server instance in Phase 4
// ---------------------------------------------------------------------------
const server = http.createServer(app);

// ---------------------------------------------------------------------------
// Graceful shutdown handler
// Closes server and DB connection cleanly on SIGTERM / SIGINT
// SIGTERM — sent by Docker / process managers on container stop
// SIGINT  — sent by Ctrl+C in development
// ---------------------------------------------------------------------------
const shutdown = (signal) => {
  logger.info(`[Server] ${signal} received — shutting down gracefully`);

  server.close(async () => {
    logger.info("[Server] HTTP server closed");

    try {
      const mongoose = require("mongoose");
      await mongoose.connection.close();
      logger.info("[DB] MongoDB connection closed");
      process.exit(0);
    } catch (err) {
      logger.error(`[Server] Error during shutdown — ${err.message}`);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// ---------------------------------------------------------------------------
// Unhandled rejection and exception safety nets
// Logs the error and exits — let Docker / PM2 restart the process
// ---------------------------------------------------------------------------
process.on("unhandledRejection", (reason) => {
  logger.error(`[Server] Unhandled Promise Rejection — ${reason}`);
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.error(`[Server] Uncaught Exception — ${err.message}`);
  shutdown("uncaughtException");
});

// ---------------------------------------------------------------------------
// Boot sequence — connect DB first, then start listening
// Server never starts if DB connection fails
// ---------------------------------------------------------------------------
const start = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start HTTP server
    server.listen(config.PORT, () => {
      logger.info(`[Server] Urban Nexus API running on port ${config.PORT}`);
      logger.info(`[Server] Environment — ${config.NODE_ENV}`);
      logger.info(`[Server] Health check — http://localhost:${config.PORT}/health`);
    });
  } catch (err) {
    logger.error(`[Server] Failed to start — ${err.message}`);
    process.exit(1);
  }
};

start();

module.exports = server;