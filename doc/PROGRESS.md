# URBAN NEXUS — Build Progress Tracker
# Update this file after every session.
# Every new Claude ID reads this before starting work.

---

## Current Status

```
Phase 1 — Backend Foundation      ✅ DONE
Phase 2 — Decision Engines        ⏳ NOT STARTED  ← START HERE NEXT
Phase 3 — Frontend                ✅ DONE
Phase 4 — Maps & Realtime         ⏳ NOT STARTED
Phase 5 — Integration & Testing   ⏳ NOT STARTED
```

---

## Phase 1 — Backend Foundation
**Assigned to:** Claude ID 1
**Status:** ✅ DONE

**Must build:**

### Config
- [x] src/config/index.js
- [x] src/config/db.js
- [x] src/config/cloudinary.js

### Models
- [x] src/models/User.js
- [x] src/models/Department.js
- [x] src/models/Project.js
- [x] src/models/Conflict.js
- [x] src/models/CitizenReport.js
- [x] src/models/AuditLog.js

### Utils
- [x] src/utils/response.js
- [x] src/utils/logger.js
- [x] src/utils/trackingId.js

### Middleware
- [x] src/middleware/auth.middleware.js
- [x] src/middleware/rbac.middleware.js
- [x] src/middleware/validate.middleware.js
- [x] src/middleware/error.middleware.js

### Validators
- [x] src/validators/auth.validator.js
- [x] src/validators/project.validator.js

### Auth
- [x] src/services/auth.service.js
- [x] src/controllers/auth.controller.js
- [x] src/routes/auth.routes.js

### Stubbed Controllers + Routes
- [x] src/controllers/project.controller.js
- [x] src/controllers/conflict.controller.js
- [x] src/controllers/department.controller.js
- [x] src/controllers/report.controller.js
- [x] src/controllers/admin.controller.js
- [x] src/routes/project.routes.js
- [x] src/routes/conflict.routes.js
- [x] src/routes/department.routes.js
- [x] src/routes/report.routes.js
- [x] src/routes/admin.routes.js

### App Entry
- [x] src/app.js
- [x] server.js
- [x] swagger.js

### DevOps
- [x] package.json
- [x] .env.example
- [x] Dockerfile
- [x] docker-compose.yml

**Done when:**
- npm run dev → server starts on port 5000 ✅
- MongoDB connects successfully ✅
- POST /api/v1/auth/register → creates user, returns token ✅
- POST /api/v1/auth/login → returns JWT token ✅
- GET /api/v1/auth/me → returns user with valid token ✅
- All other routes return 200 "Coming soon" ✅
- Swagger UI loads at /api/v1/docs/ ✅

**Postman collection exported:** doc/postman/urban-nexus-phase1-tests.json ✅

**Known minor issue:** Duplicate schema index warning on users.email — cosmetic, not breaking.

---

## Phase 2 — Decision Engines
**Assigned to:** Claude ID 2
**Status:** ⏳ NOT STARTED
**Depends on:** Phase 1 complete ✅

**Needs from Phase 1 (paste these files at session start):**
- src/models/Project.js
- src/models/Conflict.js
- src/middleware/auth.middleware.js
- src/middleware/rbac.middleware.js
- src/utils/response.js
- src/routes/project.routes.js
- src/routes/conflict.routes.js
- src/app.js

**Must build:**

### Conflict Engine
- [ ] src/engines/conflict/geo.detector.js — Turf.js polygon intersection
- [ ] src/engines/conflict/time.detector.js — date range overlap detection
- [ ] src/engines/conflict/conflict.engine.js — orchestrator

### MCDM Engine
- [ ] src/engines/mcdm/topsis.js — TOPSIS algorithm (pure function)
- [ ] src/engines/mcdm/mcdm.engine.js — orchestrator

### Graph Engine
- [ ] src/engines/graph/dag.js — DAG data structure
- [ ] src/engines/graph/topological.js — Kahn's topological sort
- [ ] src/engines/graph/graph.engine.js — orchestrator

### Services
- [ ] src/services/project.service.js — full CRUD + triggers conflict engine on create
- [ ] src/services/conflict.service.js — save and fetch conflicts
- [ ] src/services/decision.service.js — combines all 3 engines in sequence
- [ ] src/services/audit.service.js — writes audit log entries

### Controllers (replacing stubs)
- [ ] src/controllers/project.controller.js — full implementation
- [ ] src/controllers/conflict.controller.js — full implementation
- [ ] src/controllers/department.controller.js — full implementation
- [ ] src/controllers/admin.controller.js — dashboard stats + audit log

**Done when:**
- POST /api/v1/projects saves project and runs conflict check
- Two overlapping projects → conflict document created in DB
- GET /api/v1/conflicts/:id returns MCDM scores + execution order
- GET /api/v1/admin/dashboard returns stats aggregation
- All tested in Postman, collection exported

**Files created:** *(fill after session)*

---

## Phase 3 — Frontend
**Assigned to:** Claude ID 3
**Status:** ✅ DONE
**Depends on:** Phase 1 complete ✅

**Verified working:**
- npm run dev → React app loads on port 3000 ✅
- Login page renders correctly ✅
- Login works, admin redirects to /dashboard ✅
- Admin dashboard renders with stats cards and charts ✅
- Officer dashboard renders with project list ✅
- Conflicts page renders ✅
- Citizen report form renders without login ✅
- Track report section works ✅
- Dark mode toggle in sidebar works ✅

**Files created:**
- package.json
- vite.config.js
- tailwind.config.js
- postcss.config.js
- index.html
- .env
- src/index.css
- src/main.jsx
- src/App.jsx
- src/config/index.js
- src/api/axios.config.js
- src/api/auth.api.js
- src/api/project.api.js
- src/api/conflict.api.js
- src/api/report.api.js
- src/store/authStore.js
- src/store/themeStore.js
- src/store/notificationStore.js
- src/store/projectStore.js
- src/router/AppRouter.jsx
- src/utils/roles.js
- src/utils/formatters.js
- src/utils/animations.js
- src/hooks/useAuth.js
- src/hooks/useProjects.js
- src/components/common/Logo.jsx
- src/components/common/Avatar.jsx
- src/components/common/Button.jsx
- src/components/common/Spinner.jsx
- src/components/common/Badge.jsx
- src/components/common/Modal.jsx
- src/components/common/Table.jsx
- src/components/project/ProjectCard.jsx
- src/components/conflict/ConflictAlert.jsx
- src/components/dashboard/StatsCard.jsx
- src/components/dashboard/ActivityChart.jsx
- src/components/dashboard/DeptPerformance.jsx
- src/pages/Login.jsx
- src/pages/Dashboard.jsx
- src/pages/DeptDashboard.jsx
- src/pages/Projects.jsx
- src/pages/ProjectDetail.jsx
- src/pages/Conflicts.jsx
- src/pages/MyTasks.jsx
- src/pages/CitizenReport.jsx
- src/pages/AuditLog.jsx
- src/pages/MapView.jsx (placeholder — full build Phase 4)

**Deferred to Phase 4:**
- src/components/map/CityMap.jsx
- src/components/map/ProjectMarker.jsx
- src/components/map/DrawPolygon.jsx
- src/components/map/MapFilters.jsx
- src/hooks/useSocket.js

**Deferred to Phase 5:**
- src/components/common/Navbar.jsx
- src/components/common/Sidebar.jsx
- src/components/common/Layout.jsx
- src/components/common/Skeleton.jsx
- src/components/project/ProjectForm.jsx
- src/components/project/ProjectList.jsx
- src/components/conflict/ConflictList.jsx
- src/components/conflict/ConflictDetail.jsx
- src/components/citizen/ReportForm.jsx
- src/components/citizen/TrackReport.jsx
- src/pages/Landing.jsx
- src/pages/NotFound.jsx
- frontend/Dockerfile

---

## Phase 4 — Maps & Realtime
**Assigned to:** Claude ID 4
**Status:** ⏳ NOT STARTED
**Depends on:** Phase 2 ✅ and Phase 3 ✅

**Attach at session start:**
- HANDOFF.md
- PROGRESS.md
- UI_GUIDE.md

**Paste these existing files at session start:**
- frontend/src/config/index.js
- frontend/src/api/axios.config.js
- frontend/src/api/project.api.js
- frontend/src/pages/MapView.jsx
- frontend/src/pages/CitizenReport.jsx
- frontend/src/router/AppRouter.jsx
- backend/src/app.js

**Must build:**

### Map Components
- [ ] src/components/map/CityMap.jsx — Leaflet map with project polygons
- [ ] src/components/map/ProjectMarker.jsx — colored polygon per type and status
- [ ] src/components/map/DrawPolygon.jsx — polygon draw tool for project form
- [ ] src/components/map/MapFilters.jsx — filter panel on map

### Pages
- [ ] src/pages/MapView.jsx — full city map page (replaces placeholder)
- [ ] Add DrawPolygon component to ProjectForm polygon field

### Realtime
- [ ] src/hooks/useSocket.js — Socket.io client connection
- [ ] backend/src/socket/socket.handler.js — all Socket.io event handlers
- [ ] backend/src/services/notification.service.js — emit events from backend

### Citizen Map
- [ ] Add map pin drop to CitizenReport.jsx

**Done when:**
- Map loads with all projects as colored polygons
- Officer draws polygon in project form, polygon saves correctly
- Two clashing projects → real-time toast alert appears on frontend
- Citizen can drop a pin on map in report form

**Files created:** *(fill after session)*

---

## Phase 5 — Integration & Testing
**Assigned to:** Claude ID 5
**Status:** ⏳ NOT STARTED
**Depends on:** All phases complete

**Attach at session start:**
- HANDOFF.md
- PROGRESS.md

**Paste these existing files at session start:**
- backend/src/engines/mcdm/topsis.js
- backend/src/engines/conflict/geo.detector.js
- backend/src/engines/conflict/time.detector.js
- backend/src/engines/graph/topological.js
- backend/src/controllers/report.controller.js
- backend/src/services/report.service.js
- backend/docker-compose.yml
- frontend/src/router/AppRouter.jsx
- frontend/src/pages/Dashboard.jsx
- frontend/src/pages/DeptDashboard.jsx

**Must build:**

### Remaining Frontend Components
- [ ] src/components/common/Navbar.jsx
- [ ] src/components/common/Sidebar.jsx
- [ ] src/components/common/Layout.jsx
- [ ] src/components/common/Skeleton.jsx
- [ ] src/components/project/ProjectForm.jsx
- [ ] src/components/project/ProjectList.jsx
- [ ] src/components/conflict/ConflictList.jsx
- [ ] src/components/conflict/ConflictDetail.jsx
- [ ] src/components/citizen/ReportForm.jsx
- [ ] src/components/citizen/TrackReport.jsx
- [ ] src/pages/Landing.jsx
- [ ] src/pages/NotFound.jsx
- [ ] frontend/Dockerfile

### Remaining Flows
- [ ] Full citizen report flow with Cloudinary photo upload
- [ ] Report status update flow end-to-end
- [ ] Task assignment — officer assigns project to supervisor
- [ ] Supervisor progress update flow
- [ ] Admin audit log page fully connected to backend
- [ ] Notification bell component in navbar

### Tests
- [ ] backend/src/tests/engines/mcdm.test.js
- [ ] backend/src/tests/engines/conflict.test.js
- [ ] backend/src/tests/engines/graph.test.js
- [ ] backend/src/tests/api/auth.test.js
- [ ] backend/src/tests/api/project.test.js

### Final
- [ ] docker-compose.yml — final with all services (backend, frontend, mongo, nginx)
- [ ] swagger.js — complete API documentation
- [ ] README.md — full setup instructions

**Done when:**
- Citizen submits report with photo → Cloudinary URL saved in DB
- Track by CNR-XXXXXX → returns correct status timeline
- All Jest tests pass with no failures
- docker-compose up → entire app runs correctly
- Full flow works: login → submit project → clash detected →
  MCDM scores → execution order → admin resolves

**Files created:** *(fill after session)*

---

## Known Issues / Notes

- Duplicate schema index warning on users.email — cosmetic only, not breaking
- Dashboard page calls /api/v1/admin/dashboard — returns stub until Phase 2 done
- MapView.jsx is a placeholder — full Leaflet map built in Phase 4

---

## Important Notes for All IDs

1. Read HANDOFF.md completely before writing any code
2. Read SCHEMA.md for all data structures
3. Read API_CONTRACT.md for all endpoint shapes
4. Read UI_GUIDE.md for all visual decisions (frontend IDs only)
5. Never deviate from the folder structure in HANDOFF.md
6. Always use the standard response format from HANDOFF.md Section 8
7. Engines are pure functions — no DB access inside engine files
8. Never use process.env directly — always import from src/config/index.js
9. Frontend: never use import.meta.env directly — always import from src/config/index.js
10. Ask the project manager if anything is unclear before building
