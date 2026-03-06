# URBAN NEXUS — Developer Handoff File
# Read this completely before writing any code.

---

## 1. What Is This Project

Urban Nexus is a Smart Urban Projects Coordination Platform.
Indian city departments (PWD, Water Board, Electricity, Parks) work in silos.
They schedule projects at the same location and same time without knowing about each other.
This causes: roads repaired then dug again, budget wasted, citizens disrupted.

Urban Nexus is the coordination layer that prevents this.
It detects clashes, scores project priority using MCDM, and recommends correct execution order.

---

## 2. Target Users

| Role | What They Do |
|---|---|
| admin | Sees everything, approves projects, resolves clashes |
| officer | Submits and manages their department's projects |
| supervisor | Views and updates progress on assigned tasks |
| citizen | Reports issues, tracks complaints (no login needed) |

---

## 3. Core Features

1. Project Management — departments submit infrastructure projects with geo-location
2. Conflict Detection — auto-detects two projects at same location + same time
3. MCDM Priority Scoring — scores conflicting projects using TOPSIS algorithm
4. Dependency & Execution Ordering — graph DAG determines correct project sequence
5. Role Based Access Control — 4 roles with strict access boundaries
6. Citizen Issue Reporting — public issue submission with photo and map pin

---

## 4. Tech Stack

```
Frontend:      React.js + Tailwind CSS (Vite)
Maps:          Leaflet.js + React-Leaflet
Charts:        Recharts
Realtime:      Socket.io
Backend:       Node.js + Express.js
Auth:          JWT + bcrypt
Database:      MongoDB + Mongoose
Geo Logic:     Turf.js
Graph Engine:  Custom DAG (plain JS)
MCDM Engine:   Custom JS module (TOPSIS)
Uploads:       Cloudinary
Infra:         Docker + Docker Compose + Nginx
Dev Tools:     Swagger, Jest, Postman
```

---

## 5. Folder Structure — Backend

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── cloudinary.js          # Cloudinary config
│   ├── models/
│   │   ├── User.js
│   │   ├── Department.js
│   │   ├── Project.js
│   │   ├── Conflict.js
│   │   ├── CitizenReport.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── project.routes.js
│   │   ├── conflict.routes.js
│   │   ├── department.routes.js
│   │   ├── report.routes.js
│   │   └── admin.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── project.controller.js
│   │   ├── conflict.controller.js
│   │   ├── department.controller.js
│   │   ├── report.controller.js
│   │   └── admin.controller.js
│   ├── services/
│   │   ├── project.service.js
│   │   ├── conflict.service.js
│   │   ├── decision.service.js
│   │   ├── notification.service.js
│   │   ├── audit.service.js
│   │   └── report.service.js
│   ├── engines/
│   │   ├── mcdm/
│   │   │   ├── mcdm.engine.js
│   │   │   └── topsis.js
│   │   ├── conflict/
│   │   │   ├── conflict.engine.js
│   │   │   ├── geo.detector.js
│   │   │   └── time.detector.js
│   │   └── graph/
│   │       ├── graph.engine.js
│   │       ├── dag.js
│   │       └── topological.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── validate.middleware.js
│   │   └── error.middleware.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   └── project.validator.js
│   ├── utils/
│   │   ├── response.js
│   │   ├── logger.js
│   │   └── trackingId.js
│   ├── socket/
│   │   └── socket.handler.js
│   └── app.js
├── server.js
├── .env.example
├── Dockerfile
├── package.json
└── swagger.js
```

---

## 6. Folder Structure — Frontend

```
frontend/
├── src/
│   ├── api/
│   │   ├── axios.config.js
│   │   ├── auth.api.js
│   │   ├── project.api.js
│   │   ├── conflict.api.js
│   │   └── report.api.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Toast.jsx
│   │   ├── map/
│   │   │   ├── CityMap.jsx
│   │   │   ├── ProjectMarker.jsx
│   │   │   ├── DrawPolygon.jsx
│   │   │   └── MapFilters.jsx
│   │   ├── project/
│   │   │   ├── ProjectForm.jsx
│   │   │   ├── ProjectCard.jsx
│   │   │   ├── ProjectList.jsx
│   │   │   └── ProjectDetail.jsx
│   │   ├── conflict/
│   │   │   ├── ConflictAlert.jsx
│   │   │   ├── ConflictList.jsx
│   │   │   └── ConflictDetail.jsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.jsx
│   │   │   ├── ActivityChart.jsx
│   │   │   └── DeptPerformance.jsx
│   │   └── citizen/
│   │       ├── ReportForm.jsx
│   │       └── TrackReport.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DeptDashboard.jsx
│   │   ├── MapView.jsx
│   │   ├── Projects.jsx
│   │   ├── ProjectDetail.jsx
│   │   ├── Conflicts.jsx
│   │   ├── MyTasks.jsx
│   │   ├── CitizenReport.jsx
│   │   └── AuditLog.jsx
│   ├── store/
│   │   ├── authStore.js
│   │   ├── projectStore.js
│   │   └── notificationStore.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProjects.js
│   │   └── useSocket.js
│   ├── utils/
│   │   ├── roles.js
│   │   └── formatters.js
│   ├── router/
│   │   └── AppRouter.jsx
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── tailwind.config.js
├── vite.config.js
└── Dockerfile
```

---

## 7. Environment Variables

```bash
# backend/.env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://mongo:27017/urban-nexus
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_ORIGIN=http://localhost:3000

# frontend/.env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

---

## 8. Standard API Response Format

Every single API response must follow this format. No exceptions.

```javascript
// Success
{
  "success": true,
  "message": "Project created successfully",
  "data": { ...payload }
}

// Error
{
  "success": false,
  "message": "Validation failed",
  "error": { ...details }
}

// List with pagination
{
  "success": true,
  "message": "Projects fetched",
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

## 9. Coding Standards

**Naming:**
- Files: kebab-case → `project.service.js`
- React components: PascalCase → `ProjectForm.jsx`
- Variables and functions: camelCase → `detectClashes()`
- Constants: UPPER_SNAKE_CASE → `MAX_RETRY`
- API endpoints: kebab-case plural → `/api/v1/citizen-reports`

**JavaScript Rules:**
- ES6+ only. No var. Use const and let.
- Async/await only. No raw .then() chains.
- All async route handlers use try/catch and pass errors to next(err)
- No hardcoded values. Use constants or env variables.

**File Rules:**
- Controllers only handle req/res. Zero business logic.
- Services contain all business logic.
- Engines are pure functions. No DB access inside engines.
- Models are the only place that touches MongoDB.

**Config Rule:**
- NEVER use process.env.ANYTHING directly in any file
- ALWAYS import from src/config/index.js
- Frontend: ALWAYS import from src/config/index.js using import.meta.env

**Error Handling:**
```javascript
// Every controller follows this pattern
const createProject = async (req, res, next) => {
  try {
    const result = await ProjectService.createProject(req.body, req.user);
    return res.status(201).json(success("Project created", result));
  } catch (err) {
    next(err);
  }
};
```

---

## 10. Role Permission Rules

| Action | admin | officer | supervisor | citizen |
|---|---|---|---|---|
| Submit project | yes | yes | no | no |
| Approve/reject project | yes | no | no | no |
| View all projects | yes | own dept | assigned only | public map |
| Resolve conflict | yes | no | no | no |
| View audit log | yes | no | no | no |
| Update task progress | yes | no | assigned only | no |
| Submit citizen report | yes | yes | yes | yes (no login) |

---

## 11. RBAC Middleware Usage

```javascript
// In route files
router.post("/", auth, permit("officer", "admin"), createProject);
router.patch("/:id/status", auth, permit("admin"), updateStatus);
router.get("/audit", auth, permit("admin"), getAuditLog);

// permit() is imported from middleware/rbac.middleware.js
```

---

## 12. Decision Engine Flow

```
New project submitted
       ↓
Conflict Engine (geo.detector.js + time.detector.js)
       ↓ clash found?
MCDM Engine (topsis.js) → scores each project 0 to 1
       ↓ priority scores
Graph Engine (topological.js) → correct execution order
       ↓
Recommendation saved to Conflict document
Notification emitted via Socket.io
```

---

## 13. Socket.io Events

| Event Name | Direction | Trigger |
|---|---|---|
| `clash:detected` | server → client | New conflict found |
| `project:approved` | server → client | Admin approves project |
| `project:rejected` | server → client | Admin rejects project |
| `report:status_update` | server → client | Citizen report status changes |
| `task:assigned` | server → client | Supervisor gets new task |

---

## 14. What Has Been Built

See `PROGRESS.md` for current build status.

---

## 15. GitHub Repo Structure

```
urban-nexus/
├── backend/       ← Node.js + Express API
├── frontend/      ← React + Vite SPA
├── doc/
│   ├── HANDOFF.md        ← this file
│   ├── SCHEMA.md         ← all MongoDB schemas
│   ├── API_CONTRACT.md   ← all endpoints
│   └── PROGRESS.md       ← build tracker
└── README.md
```

---

---

## 16. Assets

### 16.1 Illustrations
> Source: [undraw.co](https://undraw.co) — set accent color to `#0E9F6E` before downloading

Location: `frontend/src/assets/illustrations/`

| File Name | Where It Is Used |
|---|---|
| `empty-projects.svg` | Projects list — no data state |
| `no-conflicts.svg` | Conflicts page — no active conflicts |
| `hero-city.svg` | Landing page — hero section right side |
| `not-found.svg` | 404 error page |

---

### 16.2 Icons
> Source: [Lucide React](https://lucide.dev) — npm package, no files to download
```bash
npm install lucide-react
```
```javascript
// Usage
import { MapPin, AlertTriangle, Building2, Bell } from 'lucide-react'
```

No icon files live in this repo. Every icon comes from this package only.

---

### 16.3 Logo
> Defined in: `UI_GUIDE.md → Section 5`

- Built as a pure SVG React component
- Location: `src/components/common/Logo.jsx`
- Never use an image file for the logo
- Works in both light and dark mode automatically

---

### 16.4 User Avatars
> No image uploads for user profiles in MVP

- Built as an initials-based React component
- Location: `src/components/common/Avatar.jsx`
- Generates a colored circle with user initials
- Example: `"Rahul Sharma"` → circle showing `RS`

---

### 16.5 Map Tiles
> CDN reference only — no downloads required

| Mode | Tile Provider |
|---|---|
| Light mode | CartoDB Positron |
| Dark mode | CartoDB DarkMatter |

Full URLs defined in `UI_GUIDE.md → Section 8`

*This file is the single source of truth for all developers on this project.*
*Do not deviate from the folder structure, naming conventions, or response format defined here.*