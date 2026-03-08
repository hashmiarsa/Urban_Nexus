# ===========================================================================
# Urban Nexus — Backend Dockerfile
# Multi-stage build:
#   Stage 1 (deps)   — installs only production dependencies
#   Stage 2 (runner) — lean final image, copies deps + source
#
# Build:   docker build -t urban-nexus-backend .
# Run:     docker run -p 5000:5000 --env-file .env urban-nexus-backend
# ===========================================================================


# ---------------------------------------------------------------------------
# Stage 1 — deps
# Install production dependencies in isolation
# Keeps node_modules out of the final build context
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Set working directory
WORKDIR /app

# Copy package files only — maximises Docker layer cache
# node_modules are only reinstalled when package.json changes
COPY package.json package-lock.json ./

# Install production dependencies only
# ci is faster and stricter than install — uses package-lock.json exactly
RUN npm ci --omit=dev


# ---------------------------------------------------------------------------
# Stage 2 — runner
# Final lean image — only what is needed to run the server
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install dumb-init — proper PID 1 process manager for containers
# Handles SIGTERM correctly and reaps zombie processes
RUN apk add --no-cache dumb-init

# Create a non-root user for security
# Never run Node.js as root in production
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nodeuser

# Set working directory
WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Copy application source code
COPY --chown=nodeuser:nodejs . .

# Create logs directory and set correct ownership
# Winston writes logs here in production
RUN mkdir -p logs && chown nodeuser:nodejs logs

# Switch to non-root user
USER nodeuser

# Expose the port the server listens on
EXPOSE 5000

# Set Node.js to production mode
ENV NODE_ENV=production

# Health check — Docker will mark container unhealthy if this fails
# Checks every 30s, allows 10s to respond, retries 3 times before unhealthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Start server with dumb-init as PID 1
# dumb-init forwards SIGTERM to Node.js for graceful shutdown
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]