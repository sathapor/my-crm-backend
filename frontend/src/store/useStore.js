import { create } from 'zustand';

export const useStore = create((set) => ({
  // Theme state
  theme: 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),

  // Sidebar state
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // User Auth mock state
  user: {
    name: 'Admin User',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff'
  },

  // Notifications state
  notifications: [],
  addNotification: (notif) => set((state) => {
    const newNotif = {
      id: Date.now(),
      read: false,
      time: 'เมื่อสักครู่',
      ...notif
    };
    // เก็บไว้สูงสุด 20 รายการล่าสุด
    return { notifications: [newNotif, ...state.notifications].slice(0, 20) };
  }),
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),
  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
}));
