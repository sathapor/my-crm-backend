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
  notifications: [
    { id: 1, type: 'order', read: false, title: 'ออเดอร์ใหม่!', body: 'คุณสมชาย สั่งซื้อสินค้า 3 รายการ', time: '5 นาทีที่แล้ว' },
    { id: 2, type: 'chat', read: false, title: 'ข้อความใหม่', body: 'สาวิตรี: ของมาถึงแล้วค่ะ ขอบคุณนะคะ', time: '12 นาทีที่แล้ว' },
    { id: 3, type: 'stock', read: false, title: 'สินค้าใกล้หมด', body: 'ลิปสติกเนื้อกลอส เหลือสต็อคแค่ 2 ชิ้น', time: '1 ชั่วโมงที่แล้ว' },
    { id: 4, type: 'payment', read: true, title: 'รับสลิปโอนเงิน', body: 'มนัส โอนเงิน ฿590 แล้ว รอยืนยัน', time: '2 ชั่วโมงที่แล้ว' },
  ],
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),
  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
}));
