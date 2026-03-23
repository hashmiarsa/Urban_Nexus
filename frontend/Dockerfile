# ===========================================================================
# Urban Nexus â€” Frontend Dockerfile
# Multi-stage build: node build â†’ nginx serve
# ===========================================================================

# Stage 1 â€” Build the Vite React app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

# Stage 2 â€” Serve with nginx
FROM nginx:1.25-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config for SPA â€” all routes serve index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
