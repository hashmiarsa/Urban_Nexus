"use strict";

const http          = require("http");
const app           = require("./src/app");
const connectDB     = require("./src/config/db");
const config        = require("./src/config/index");
const logger        = require("./src/utils/logger");
const { initSocket } = require("./src/socket/socket.handler");

// ---------------------------------------------------------------------------
// Create HTTP server from Express app
// Socket.io attaches to this server instance, not to the Express app directly
// ---------------------------------------------------------------------------
const server = http.createServer(app);

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
const shutdown = (signal) => {
  logger.info(`[Server] ${signal} received â€” shutting down gracefully`);

  server.close(async () => {
    logger.info("[Server] HTTP server closed");

    try {
      const mongoose = require("mongoose");
      await mongoose.connection.close();
      logger.info("[DB] MongoDB connection closed");
      process.exit(0);
    } catch (err) {
      logger.error(`[Server] Error during shutdown â€” ${err.message}`);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error(`[Server] Unhandled Promise Rejection â€” ${reason}`);
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.error(`[Server] Uncaught Exception â€” ${err.message}`);
  shutdown("uncaughtException");
});

// ---------------------------------------------------------------------------
// Boot sequence
// 1. Connect MongoDB
// 2. Start HTTP server
// 3. Attach Socket.io (must be after server.listen so the port is bound)
// ---------------------------------------------------------------------------
const start = async () => {
  try {
    await connectDB();

    server.listen(config.PORT, () => {
      logger.info(`[Server] Urban Nexus API running on port ${config.PORT}`);
      logger.info(`[Server] Environment â€” ${config.NODE_ENV}`);
      logger.info(`[Server] Health check â€” http://localhost:${config.PORT}/health`);

      // Attach Socket.io after server is listening
      initSocket(server);
      logger.info(`[Server] Socket.io attached`);
    });
  } catch (err) {
    logger.error(`[Server] Failed to start â€” ${err.message}`);
    process.exit(1);
  }
};

start();

module.exports = server;
