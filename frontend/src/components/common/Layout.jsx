import { useEffect } from "react";
import { Outlet }    from "react-router-dom";
import Navbar        from "./Navbar";
import Sidebar       from "./Sidebar";
import useSocket     from "../../hooks/useSocket";
import useThemeStore from "../../store/themeStore";
import useNotificationStore from "../../store/notificationStore";
import { AlertTriangle, CheckCircle, XCircle, Briefcase, Bell, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Layout.jsx â€” Shared page layout wrapper
//
// Renders: Navbar (top) + Sidebar (left) + main content area (right)
// Initialises Socket.io connection via useSocket (runs once, app-wide)
// Renders toast notifications from notificationStore
// ---------------------------------------------------------------------------

const TOAST_STYLES = {
  clash:    "border-red-400 bg-red-50 dark:bg-red-900/30",
  approval: "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30",
  rejection:"border-red-300 bg-red-50 dark:bg-red-900/20",
  task:     "border-blue-400 bg-blue-50 dark:bg-blue-900/30",
  report:   "border-amber-400 bg-amber-50 dark:bg-amber-900/30",
};

const TOAST_ICONS = {
  clash:    <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />,
  approval: <CheckCircle  size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />,
  rejection:<XCircle      size={16} className="text-red-400 flex-shrink-0 mt-0.5" />,
  task:     <Briefcase    size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />,
  report:   <Bell         size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />,
};

// Toast notification component
const Toast = ({ notif, onDismiss }) => {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => onDismiss(notif.id), 5000);
    return () => clearTimeout(t);
  }, [notif.id, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full backdrop-blur-sm animate-slide-in ${
        TOAST_STYLES[notif.type] || "border-gray-300 bg-white dark:bg-gray-800"
      }`}
    >
      {TOAST_ICONS[notif.type] || <Bell size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{notif.title}</p>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{notif.message}</p>
      </div>
      <button
        onClick={() => onDismiss(notif.id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const Layout = () => {
  // Initialise Socket.io connection â€” runs once when Layout mounts
  useSocket();

  const { isDark } = useThemeStore();
  const { toasts, dismissToast } = useNotificationStore();

  return (
    <div className={`${isDark ? "dark" : ""} flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Toast container â€” bottom right */}
      {toasts && toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end">
          {toasts.map((notif) => (
            <Toast key={notif.id} notif={notif} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Layout;
