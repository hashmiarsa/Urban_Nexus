# CIVIQ Progress Tracker
*Last updated: March 23, 2026*

---

## Project Status: ACTIVE ✅
**Phase: Frontend Setup Complete → Starting Screens**

---

## Tech Stack (Locked)

```
Frontend:     React + Vite + JavaScript (JSX)
Styling:      Tailwind CSS v3 (darkMode: 'class')
Routing:      React Router DOM
HTTP:         Axios
Font:         Inter (Google Fonts)
Icons:        Inline SVG (no external library)
Backend:      Urban Nexus (existing — Node.js/Express)
Database:     MongoDB
Repo:         github.com/hashmiarsa/civiq (main branch)
Preserved:    urban-nexus-v1 branch (old project)
```

---

## Repository Structure

```
civiq/
  frontend/              ← React + Vite (ACTIVE)
    src/
      components/        ← all reusable UI components
      pages/
        admin/
        officer/
        supervisor/
        citizen/
      router/
      context/
      services/
      hooks/
      utils/
      types/
  docs/                  ← project documentation + plan files
  .git/
```

---

## Component Library — COMPLETE ✅

All components built, tested in Stackblitz, converted to JSX, and moved to VS Code.

```
Component         Status    File
─────────────────────────────────────────
Button            ✅ Done   components/Button.jsx
Badge             ✅ Done   components/Badge.jsx
Input             ✅ Done   components/Input.jsx
Card              ✅ Done   components/Card.jsx
  └ ProjectCard   ✅ Done   (exported from Card.jsx)
  └ StatCard      ✅ Done   (exported from Card.jsx)
Sidebar           ✅ Done   components/Sidebar.jsx
Avatar            ✅ Done   components/Avatar.jsx
  └ AvatarGroup   ✅ Done   (exported from Avatar.jsx)
  └ AvatarWithName✅ Done   (exported from Avatar.jsx)
Toast             ✅ Done   components/Toast.jsx
  └ ToastContainer✅ Done   (exported from Toast.jsx)
  └ useToast      ✅ Done   (exported from Toast.jsx)
Navbar            ✅ Done   components/Navbar.jsx
DashboardLayout   ✅ Done   components/DashboardLayout.jsx
```

---

## Design Decisions — Locked Forever

```
1.  No UI library — pure React + Tailwind
2.  Dark mode: Tailwind 'class' strategy
3.  Citizen website: light mode ONLY
4.  Inter font only — no other fonts
5.  No gradients anywhere
6.  No card shadows — borders only
7.  No left colored border on project cards (removed)
8.  Single accent color: #5E6AD2 throughout
9.  Stat cards: ALL same top border (#5E6AD2) — never per-color
10. Only clashes get red numbers — no decorative colors
11. True gray text (#6B7280 / #9CA3AF) — NOT slate (blue-tinted)
12. Sidebar bg = Page bg (Linear unified approach)
13. Supabase pill active style on sidebar — no left border
14. MongoDB Atlas collapse icon on sidebar
15. Dark mode badge colors: deep dark bg + muted text (never saturated)
16. Files are .jsx (not .tsx — JavaScript not TypeScript)
17. Tailwind v3 only — never v4
18. Logo LOGO_SIZE = 34 — single source for icon + wordmark
19. Content card: fixed height h-[calc(100vh-32px)]
20. Collapsed sidebar: equal px-10 padding both sides (no stretching)
```

---

## Screens To Build

### Admin (12 screens)
```
Screen                  Status      Route
────────────────────────────────────────────────
Dashboard               🔄 Next     /admin/dashboard
Projects List           ⬜ Todo     /admin/projects
Project Detail          ⬜ Todo     /admin/projects/:id
New Project Form        ⬜ Todo     /admin/projects/new
Conflicts List          ⬜ Todo     /admin/conflicts
Conflict Detail         ⬜ Todo     /admin/conflicts/:id
City Map                ⬜ Todo     /admin/map
Complaints List         ⬜ Todo     /admin/complaints
Complaint Detail        ⬜ Todo     /admin/complaints/:id
Audit Log               ⬜ Todo     /admin/audit
User Management         ⬜ Todo     /admin/users
Settings                ⬜ Todo     /admin/settings
```

### Officer (10 screens)
```
Screen                  Status      Route
────────────────────────────────────────────────
Dashboard               ⬜ Todo     /officer/dashboard
My Projects List        ⬜ Todo     /officer/projects
Project Detail          ⬜ Todo     /officer/projects/:id
New Project Form        ⬜ Todo     /officer/projects/new
Edit Project            ⬜ Todo     /officer/projects/:id/edit
Conflict Detail         ⬜ Todo     /officer/conflicts/:id
City Map                ⬜ Todo     /officer/map
Complaints List         ⬜ Todo     /officer/complaints
Complaint Detail        ⬜ Todo     /officer/complaints/:id
Settings                ⬜ Todo     /officer/settings
```

### Supervisor (4 screens)
```
Screen                  Status      Route
────────────────────────────────────────────────
Dashboard               ⬜ Todo     /supervisor/dashboard
My Tasks                ⬜ Todo     /supervisor/tasks
Task Detail             ⬜ Todo     /supervisor/tasks/:id
Settings                ⬜ Todo     /supervisor/settings
```

### Citizen Website (6 screens)
```
Screen                  Status      Route
────────────────────────────────────────────────
Home                    ⬜ Todo     /
Track Project           ⬜ Todo     /track
Project Detail          ⬜ Todo     /track/:id
File Complaint          ⬜ Todo     /complaint
Track Complaint         ⬜ Todo     /complaint/:id
About                   ⬜ Todo     /about
```

---

## Immediate Next Steps

```
1. ✅ Push to GitHub (done)
2. 🔄 Update color system + progress docs (doing now)
3. ⬜ Setup React Router — AppRouter.jsx
4. ⬜ Setup Auth Context — AuthContext.jsx
5. ⬜ Build Admin Dashboard screen
6. ⬜ Build Admin Projects List
7. ⬜ Connect to backend API (Urban Nexus)
8. ⬜ Build remaining screens
9. ⬜ Testing
10. ⬜ Deployment
```

---

## Key Features to Implement

```
MCDM Scoring:
  Multi-criteria decision making
  Criteria: budget, duration, impact, urgency
  Auto-calculated score per project
  Score determines priority ranking

Clash Detection:
  Geographic overlap (map coordinates + buffer zone)
  Timeline overlap (date range intersection)
  Auto-flagged — admin cannot miss it

Role-based Access:
  Admin    → full access, approves/rejects, manages users
  Officer  → submits projects, sees own department
  Supervisor → assigned to projects, updates progress
  Citizen  → read-only, track projects, file complaints
```

---

## Backend (Urban Nexus — Preserved)

```
Status:     Working ✅
Branch:     urban-nexus-v1 (preserved on GitHub)
API:        REST API (Node.js/Express)
Database:   MongoDB

Key endpoints (to be connected):
  POST /api/auth/login
  GET  /api/projects
  POST /api/projects
  GET  /api/projects/:id
  GET  /api/conflicts
  GET  /api/complaints
  POST /api/complaints
  GET  /api/users (admin only)
  GET  /api/audit (admin only)
```

---

## Presentation Notes

```
Defense:    Next week
Show:       CIVIQ (main branch) — new frontend
Backup:     urban-nexus-v1 branch — old working project
            git checkout urban-nexus-v1 → npm run dev

Key points to explain:
  - JSX = JavaScript + HTML-like syntax (not TypeScript)
  - Tailwind = utility-first CSS, no separate CSS files
  - React Router = client-side navigation, no page reload
  - Component-based = reusable UI pieces
  - Dark mode = Tailwind 'class' strategy
  - MCDM = weighted scoring for project prioritization
  - Clash detection = geographic + timeline algorithm
```