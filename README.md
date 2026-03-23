# Urban Nexus
**Smart Urban Projects Coordination Platform**

Indian city departments (PWD, Water Board, Electricity, Parks) submit infrastructure projects at the same location without knowing about each other. Urban Nexus is the coordination layer that detects clashes, scores priority using TOPSIS, and recommends correct execution order.

---

## Quick Start (Docker)

```bash
# 1. Clone the repo
git clone https://github.com/your-org/urban-nexus.git
cd urban-nexus

# 2. Copy backend env file and fill in values
cp backend/.env.example backend/.env
# Edit backend/.env â€” set JWT_SECRET and Cloudinary credentials

# 3. Start all services
docker-compose up -d

# App is now available at http://localhost
# API docs at http://localhost/api/v1/docs
```

---

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT_SECRET, and Cloudinary credentials
npm run dev
# API runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
# Create .env
echo "VITE_API_URL=http://localhost:5000/api/v1" > .env
echo "VITE_SOCKET_URL=http://localhost:5000"    >> .env
npm run dev
# App runs on http://localhost:3000
```

---

## Environment Variables

### `backend/.env`

| Variable               | Required | Description |
|------------------------|----------|-------------|
| `NODE_ENV`             | yes      | `development` or `production` |
| `PORT`                 | yes      | API port (default 5000) |
| `MONGO_URI`            | yes      | MongoDB connection string |
| `JWT_SECRET`           | yes      | Secret for signing JWTs (min 32 chars) |
| `JWT_EXPIRY`           | no       | Token lifetime (default `7d`) |
| `CLOUDINARY_CLOUD_NAME`| yes      | Cloudinary cloud name |
| `CLOUDINARY_API_KEY`   | yes      | Cloudinary API key |
| `CLOUDINARY_API_SECRET`| yes      | Cloudinary API secret |
| `CLIENT_ORIGIN`        | yes      | Frontend URL for CORS (e.g. `http://localhost:3000`) |

### `frontend/.env`

| Variable          | Description |
|-------------------|-------------|
| `VITE_API_URL`    | Backend API base URL |
| `VITE_SOCKET_URL` | Socket.io server URL |

---

## Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     REST + Socket.io     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  React SPA  â”‚ â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º â”‚  Express API        â”‚
â”‚  (Vite)     â”‚                          â”‚  Node.js + Socket.ioâ”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                          â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                  â”‚
                                         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                         â”‚  MongoDB            â”‚
                                         â”‚  (Mongoose)         â”‚
                                         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Decision Engine Pipeline

```
New project submitted
       â†“
Conflict Engine (Turf.js geo intersection + date range overlap)
       â†“ clash found?
MCDM Engine (TOPSIS) â†’ scores each project 0â€“1
       â†“
Graph Engine (Kahn's topological sort) â†’ execution order
       â†“
Conflict document saved â†’ Socket.io clash:detected event
```

---

## User Roles

| Role       | Access |
|------------|--------|
| admin      | Full access â€” approve projects, resolve conflicts, audit log |
| officer    | Submit and manage their department's projects |
| supervisor | View and update progress on assigned tasks |
| citizen    | Submit reports and track by ID (no login required) |

### Default Routes After Login

| Role       | Redirect to   |
|------------|---------------|
| admin      | /dashboard    |
| officer    | /dept-dashboard |
| supervisor | /tasks        |

---

## API

Full API documentation is available at `/api/v1/docs` (Swagger UI) when the server is running.

Base URL: `/api/v1`

Key endpoints:
- `POST /auth/login` â€” get JWT
- `POST /projects` â€” submit project (triggers conflict detection)
- `GET  /projects/map` â€” GeoJSON for map rendering
- `GET  /conflicts` â€” list all conflicts with MCDM scores
- `POST /citizen-reports` â€” public report submission
- `GET  /citizen-reports/track/:trackingId` â€” public status check
- `GET  /admin/dashboard` â€” aggregated stats

---

## Running Tests

```bash
cd backend

# All tests
npm test

# Watch mode
npm run test:watch

# Specific test file
npx jest src/tests/engines/mcdm.test.js
```

Tests require a running MongoDB instance. Set `MONGO_URI_TEST` to use a dedicated test database:

```bash
MONGO_URI_TEST=mongodb://localhost:27017/urban-nexus-test npm test
```

---

## Project Structure

```
urban-nexus/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ config/          # Central config â€” never use process.env directly
â”‚   â”‚   â”œâ”€â”€ engines/
â”‚   â”‚   â”‚   â”œâ”€â”€ conflict/    # Geo + time overlap detection (pure functions)
â”‚   â”‚   â”‚   â”œâ”€â”€ mcdm/        # TOPSIS algorithm (pure functions)
â”‚   â”‚   â”‚   â””â”€â”€ graph/       # DAG + Kahn's topological sort (pure functions)
â”‚   â”‚   â”œâ”€â”€ services/        # All business logic
â”‚   â”‚   â”œâ”€â”€ controllers/     # Request/response only â€” no business logic
â”‚   â”‚   â”œâ”€â”€ models/          # Mongoose schemas
â”‚   â”‚   â”œâ”€â”€ middleware/       # Auth, RBAC, validation, error handling
â”‚   â”‚   â”œâ”€â”€ routes/          # Express routers
â”‚   â”‚   â”œâ”€â”€ socket/          # Socket.io handler
â”‚   â”‚   â””â”€â”€ tests/           # Jest test suites
â”‚   â””â”€â”€ server.js
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ api/             # Axios API calls
â”‚   â”‚   â”œâ”€â”€ components/      # Reusable UI components
â”‚   â”‚   â”œâ”€â”€ pages/           # Route-level page components
â”‚   â”‚   â”œâ”€â”€ store/           # Zustand state stores
â”‚   â”‚   â”œâ”€â”€ hooks/           # useSocket, useAuth, useProjects
â”‚   â”‚   â””â”€â”€ router/          # AppRouter with role-based redirects
â”‚   â””â”€â”€ Dockerfile
â”œâ”€â”€ nginx/
â”‚   â””â”€â”€ nginx.conf           # Reverse proxy config
â”œâ”€â”€ docker-compose.yml
â””â”€â”€ README.md
```

---

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18 + Vite + Tailwind CSS |
| Maps      | Leaflet.js + React-Leaflet |
| Charts    | Recharts |
| Realtime  | Socket.io |
| Backend   | Node.js + Express.js |
| Auth      | JWT + bcryptjs |
| Database  | MongoDB + Mongoose |
| Geo Logic | Turf.js |
| Graph     | Custom DAG (plain JS) |
| MCDM      | Custom TOPSIS module |
| Uploads   | Cloudinary |
| Infra     | Docker + Docker Compose + Nginx |
