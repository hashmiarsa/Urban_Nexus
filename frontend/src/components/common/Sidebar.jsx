import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Map, FolderKanban, AlertTriangle,
  ClipboardList, FileText, Users, BookOpen, ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";
import { useState } from "react";
import Logo          from "./Logo";
import useAuthStore  from "../../store/authStore";

// ---------------------------------------------------------------------------
// Sidebar.jsx â€” Left navigation sidebar
//
// Menu items filtered by role.
// Collapsible â€” icon-only mode when collapsed.
// Active link highlighted with emerald accent.
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  {
    path:  "/dashboard",
    icon:  LayoutDashboard,
    label: "Dashboard",
    roles: ["admin"],
  },
  {
    path:  "/dept-dashboard",
    icon:  LayoutDashboard,
    label: "Dashboard",
    roles: ["officer"],
  },
  {
    path:  "/tasks",
    icon:  ClipboardList,
    label: "My Tasks",
    roles: ["supervisor"],
  },
  {
    path:  "/map",
    icon:  Map,
    label: "City Map",
    roles: ["admin", "officer", "supervisor"],
  },
  {
    path:  "/projects",
    icon:  FolderKanban,
    label: "Projects",
    roles: ["admin", "officer"],
  },
  {
    path:  "/conflicts",
    icon:  AlertTriangle,
    label: "Conflicts",
    roles: ["admin", "officer"],
  },
  {
    path:  "/reports",
    icon:  FileText,
    label: "Citizen Reports",
    roles: ["admin", "officer"],
  },
  {
    path:  "/audit",
    icon:  BookOpen,
    label: "Audit Log",
    roles: ["admin"],
  },
];

const Sidebar = () => {
  const { user }          = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const location          = useLocation();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside
      className={`flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 flex-shrink-0 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo strip â€” visible only when collapsed on mobile */}
      <div className={`h-16 flex items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0 ${collapsed ? "justify-center" : "px-4 gap-2"}`}>
        <Logo size={28} />
        {!collapsed && (
          <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">
            Urban Nexus
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {visibleItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
              }`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={() => { useAuthStore.getState().logout(); window.location.href = "/login"; }}
        className="h-12 flex items-center gap-3 px-4 border-t border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
        title="Logout"
      >
        <LogOut size={18} className="flex-shrink-0" />
        {!collapsed && <span className="text-sm font-medium">Logout</span>}
      </button>
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="h-12 flex items-center justify-center border-t border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
};

export default Sidebar;


