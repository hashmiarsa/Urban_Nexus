import { create } from "zustand";

// ---------------------------------------------------------------------------
// notificationStore.js
//
// Manages two lists:
//   notifications â€” persistent bell dropdown items (survives page nav)
//   toasts        â€” ephemeral pop-up alerts (auto-dismissed after 5s)
//
// useSocket.js calls addNotification() when server events arrive.
// Layout.jsx renders toasts from this store.
// Navbar.jsx reads notifications + unreadCount from this store.
// ---------------------------------------------------------------------------

let nextId = 1;

const useNotificationStore = create((set, get) => ({
  notifications: [],
  toasts:        [],
  unreadCount:   0,

  // -------------------------------------------------------------------------
  // addNotification â€” called by useSocket when a server event arrives
  // Adds to BOTH the persistent list AND the toast queue
  // -------------------------------------------------------------------------
  addNotification: (notif) => {
    const id = `notif-${nextId++}`;
    const full = { ...notif, id, createdAt: new Date().toISOString() };

    set((state) => ({
      notifications: [full, ...state.notifications].slice(0, 50), // cap at 50
      toasts:        [full, ...state.toasts].slice(0, 5),          // max 5 toasts
      unreadCount:   state.unreadCount + 1,
    }));
  },

  // -------------------------------------------------------------------------
  // dismissToast â€” removes a single toast (called by Toast auto-dismiss + X)
  // -------------------------------------------------------------------------
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  // -------------------------------------------------------------------------
  // markRead â€” marks a single notification as read
  // -------------------------------------------------------------------------
  markRead: (id) => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    });
  },

  // -------------------------------------------------------------------------
  // markAllRead â€” marks every notification as read
  // -------------------------------------------------------------------------
  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount:   0,
    }));
  },

  // -------------------------------------------------------------------------
  // clearAll â€” wipes the notification list entirely
  // -------------------------------------------------------------------------
  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));

export default useNotificationStore;
