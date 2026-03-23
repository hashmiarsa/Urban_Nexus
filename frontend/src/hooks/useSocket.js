import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/index";
import useAuthStore         from "../store/authStore";
import useNotificationStore from "../store/notificationStore";

// ---------------------------------------------------------------------------
// useSocket.js
//
// Manages the Socket.io client connection lifecycle.
// - Connects once on mount when user is authenticated
// - Joins the correct rooms (userId, departmentId, "admin" if role=admin)
// - Listens for all 5 server events and dispatches to notificationStore
// - Disconnects cleanly on unmount
//
// Usage:
//   const { socket, connected } = useSocket();
//   â€” call in a top-level component (e.g. Layout.jsx) so it runs app-wide
// ---------------------------------------------------------------------------

const useSocket = () => {
  const socketRef   = useRef(null);
  const { user }    = useAuthStore();
  const { addNotification } = useNotificationStore();

  // -------------------------------------------------------------------------
  // Connect and set up listeners
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) return;

    // Prevent duplicate connections
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      transports:       ["websocket", "polling"],
      reconnection:     true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    // -----------------------------------------------------------------------
    // On connect â€” join rooms
    // -----------------------------------------------------------------------
    socket.on("connect", () => {
      socket.emit("join", {
        userId:       user._id,
        departmentId: user.department?._id || user.department || null,
        role:         user.role,
      });
    });

    // -----------------------------------------------------------------------
    // clash:detected
    // { conflictId, projectIds, timestamp }
    // -----------------------------------------------------------------------
    socket.on("clash:detected", (data) => {
      addNotification({
        type:      "clash",
        title:     "Conflict Detected",
        message:   "Two projects at the same location have conflicting schedules.",
        conflictId: data.conflictId,
        projectIds: data.projectIds,
        timestamp:  data.timestamp,
        read:       false,
      });
    });

    // -----------------------------------------------------------------------
    // project:approved
    // { projectId, timestamp }
    // -----------------------------------------------------------------------
    socket.on("project:approved", (data) => {
      addNotification({
        type:      "approval",
        title:     "Project Approved",
        message:   "A project in your department has been approved.",
        projectId: data.projectId,
        timestamp: data.timestamp,
        read:      false,
      });
    });

    // -----------------------------------------------------------------------
    // project:rejected
    // { projectId, timestamp }
    // -----------------------------------------------------------------------
    socket.on("project:rejected", (data) => {
      addNotification({
        type:      "rejection",
        title:     "Project Rejected",
        message:   "A project in your department has been rejected.",
        projectId: data.projectId,
        timestamp: data.timestamp,
        read:      false,
      });
    });

    // -----------------------------------------------------------------------
    // report:status_update
    // { trackingId, status, timestamp }
    // -----------------------------------------------------------------------
    socket.on("report:status_update", (data) => {
      addNotification({
        type:       "report",
        title:      "Report Updated",
        message:    `Report ${data.trackingId} is now ${data.status}.`,
        trackingId: data.trackingId,
        status:     data.status,
        timestamp:  data.timestamp,
        read:       false,
      });
    });

    // -----------------------------------------------------------------------
    // task:assigned
    // { projectId, timestamp }
    // -----------------------------------------------------------------------
    socket.on("task:assigned", (data) => {
      addNotification({
        type:      "task",
        title:     "Task Assigned",
        message:   "You have been assigned a new project.",
        projectId: data.projectId,
        timestamp: data.timestamp,
        read:      false,
      });
    });

    // -----------------------------------------------------------------------
    // Error / disconnect
    // -----------------------------------------------------------------------
    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    // -----------------------------------------------------------------------
    // Cleanup on unmount or user change
    // -----------------------------------------------------------------------
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, addNotification]);

  // -------------------------------------------------------------------------
  // Manual emit helper â€” exposed for components that need to send events
  // -------------------------------------------------------------------------
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket:    socketRef.current,
    connected: socketRef.current?.connected ?? false,
    emit,
  };
};

export default useSocket;
