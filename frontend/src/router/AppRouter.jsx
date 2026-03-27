import { Routes, Route, Navigate } from "react-router-dom"
import Login from "../pages/auth/Login"
import AdminDashboard from "../pages/admin/Dashboard"
import AdminProjects from "../pages/admin/ProjectsList"
import AdminProjectDetail from "../pages/admin/ProjectDetail"
import AdminNewProject from "../pages/admin/NewProject"
import AdminConflicts from "../pages/admin/ConflictsList"
import AdminConflictDetail from "../pages/admin/ConflictDetail"
import AdminMap from "../pages/admin/CityMap"
import AdminComplaints from "../pages/admin/ComplaintsList"
import AdminComplaintDetail from "../pages/admin/ComplaintDetail"
import AdminAudit from "../pages/admin/AuditLog"
import AdminUsers from "../pages/admin/UserManagement"
import AdminSettings from "../pages/admin/Settings"
import OfficerDashboard from "../pages/officer/Dashboard"
import OfficerProjects from "../pages/officer/ProjectsList"
import OfficerProjectDetail from "../pages/officer/ProjectDetail"
import OfficerNewProject from "../pages/officer/NewProject"
import OfficerEditProject from "../pages/officer/EditProject"
import OfficerConflictDetail from "../pages/officer/ConflictDetail"
import OfficerMap from "../pages/officer/CityMap"
import OfficerComplaints from "../pages/officer/ComplaintsList"
import OfficerComplaintDetail from "../pages/officer/ComplaintDetail"
import OfficerSettings from "../pages/officer/Settings"
import SupervisorDashboard from "../pages/supervisor/Dashboard"
import SupervisorTasks from "../pages/supervisor/TasksList"
import SupervisorTaskDetail from "../pages/supervisor/TaskDetail"
import SupervisorSettings from "../pages/supervisor/Settings"
import CitizenHome from "../pages/citizen/Home"
import CitizenTrack from "../pages/citizen/TrackProject"
import CitizenProjectDetail from "../pages/citizen/ProjectDetail"
import CitizenComplaint from "../pages/citizen/FileComplaint"
import CitizenTrackComplaint from "../pages/citizen/TrackComplaint"
import CitizenAbout from "../pages/citizen/About"

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/projects" element={<AdminProjects />} />
      <Route path="/admin/projects/new" element={<AdminNewProject />} />
      <Route path="/admin/projects/:id" element={<AdminProjectDetail />} />
      <Route path="/admin/conflicts" element={<AdminConflicts />} />
      <Route path="/admin/conflicts/:id" element={<AdminConflictDetail />} />
      <Route path="/admin/map" element={<AdminMap />} />
      <Route path="/admin/complaints" element={<AdminComplaints />} />
      <Route path="/admin/complaints/:id" element={<AdminComplaintDetail />} />
      <Route path="/admin/audit" element={<AdminAudit />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/officer/dashboard" element={<OfficerDashboard />} />
      <Route path="/officer/projects" element={<OfficerProjects />} />
      <Route path="/officer/projects/new" element={<OfficerNewProject />} />
      <Route path="/officer/projects/:id" element={<OfficerProjectDetail />} />
      <Route path="/officer/projects/:id/edit" element={<OfficerEditProject />} />
      <Route path="/officer/conflicts/:id" element={<OfficerConflictDetail />} />
      <Route path="/officer/map" element={<OfficerMap />} />
      <Route path="/officer/complaints" element={<OfficerComplaints />} />
      <Route path="/officer/complaints/:id" element={<OfficerComplaintDetail />} />
      <Route path="/officer/settings" element={<OfficerSettings />} />
      <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
      <Route path="/supervisor/tasks" element={<SupervisorTasks />} />
      <Route path="/supervisor/tasks/:id" element={<SupervisorTaskDetail />} />
      <Route path="/supervisor/settings" element={<SupervisorSettings />} />
      <Route path="/home" element={<CitizenHome />} />
      <Route path="/track" element={<CitizenTrack />} />
      <Route path="/track/:id" element={<CitizenProjectDetail />} />
      <Route path="/complaint" element={<CitizenComplaint />} />
      <Route path="/complaint/:id" element={<CitizenTrackComplaint />} />
      <Route path="/about" element={<CitizenAbout />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
