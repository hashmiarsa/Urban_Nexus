import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, User, ChevronDown, Check, AlertTriangle, CheckCircle, XCircle, Briefcase } from "lucide-react";
import Logo           from "./Logo";
import Avatar         from "./Avatar";
import useAuthStore   from "../../store/authStore";
import useNotificationStore from "../../store/notificationStore";
import useThemeStore  from "../../store/themeStore";

// ---------------------------------------------------------------------------
// Navbar.jsx â€” Top navigation bar
//
// Features:
//   â€” Logo + app name
//   â€” Notification bell with unread count badge (reads notificationStore)
//   â€” Notification dropdown with dismiss and mark-all-read
//   â€” User avatar + name + role badge
//   â€” Logout button
// ---------------------------------------------------------------------------

const NOTIF_ICONS = {
  clash:    <AlertTriangle size={14} className="text-red-500" />,
  approval: <CheckCircle  size={14} className="text-emerald-500" />,
  rejection:<XCircle      size={14} className="text-red-400" />,
  task:     <Briefcase    size={14} className="text-blue-500" />,
  report:   <Bell         size={14} className="text-amber-500" />,
};

const ROLE_LABELS = {
  admin:      "Administrator",
  officer:    "Field Officer",
  supervisor: "Supervisor",
  citizen:    "Citizen",
};

const Navbar = () => {
  const navigate  = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAllRead, markRead, clearAll } =
    useNotificationStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();

  const [showNotifs,  setShowNotifs]  = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifsRef  = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifsRef.current  && !notifsRef.current.contains(e.target))  setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNotifClick = (notif) => {
    markRead(notif.id);
    setShowNotifs(false);
    if (notif.conflictId) navigate(`/conflicts/${notif.conflictId}`);
    else if (notif.projectId) navigate(`/projects/${notif.projectId}`);
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0 z-50">
      {/* Left â€” Logo */}
      <Link to="/" className="flex items-center gap-2.5">
        <Logo size={32} />
        <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight hidden sm:block">
          Urban Nexus
        </span>
      </Link>

      {/* Right â€” controls */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? "â˜€ï¸" : "ðŸŒ™"}
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => { setShowNotifs((s) => !s); setShowProfile(false); }}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-11 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Notifications
                </span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    >
                      <Check size={11} /> Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 20).map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0 ${
                        !notif.read ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {NOTIF_ICONS[notif.type] || <Bell size={14} className="text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${!notif.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile((s) => !s); setShowNotifs(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Avatar name={user?.name || "U"} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                {user?.name}
              </p>
              <p className="text-[10px] text-gray-400 capitalize">
                {ROLE_LABELS[user?.role] || user?.role}
              </p>
            </div>
            <ChevronDown size={13} className="text-gray-400 hidden sm:block" />
          </button>

          {/* Profile dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-11 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{user?.name}</p>
                <p className="text-[11px] text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
