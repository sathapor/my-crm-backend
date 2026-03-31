import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Moon, Sun, ShoppingCart, MessageSquare, AlertTriangle, CreditCard, X, Check } from 'lucide-react';

const NOTIF_CONFIG = {
  order:   { icon: ShoppingCart,  color: 'bg-indigo-100 text-indigo-600',  route: '/orders' },
  chat:    { icon: MessageSquare, color: 'bg-emerald-100 text-emerald-600', route: '/chat' },
  stock:   { icon: AlertTriangle, color: 'bg-amber-100 text-amber-600',    route: '/products' },
  payment: { icon: CreditCard,    color: 'bg-blue-100 text-blue-600',      route: '/orders' },
};

export default function Topbar() {
  const { theme, toggleTheme, user, notifications, markAllRead, dismissNotification } = useStore();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (notif) => {
    dismissNotification(notif.id);   // ลบออกจากรายการทันที
    setShowNotif(false);
    const cfg = NOTIF_CONFIG[notif.type];
    if (cfg?.route) navigate(cfg.route);
  };

  const handleMarkAllRead = () => {
    markAllRead();  // mark read แล้วค่อยๆ ลบออกอัตโนมัติ
  };

  return (
    <header className="h-16 bg-white/70 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm transition-colors">
      
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input 
          type="text"
          placeholder="ค้นหาออเดอร์, ลูกค้า, หรือสินค้า..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm transition shadow-inner"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(v => !v)}
            className={`relative p-2 rounded-full transition ${showNotif ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 ring-2 ring-white dark:ring-gray-800">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel */}
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 animate-fade-in overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">การแจ้งเตือน</h3>
                  {unreadCount > 0 && <p className="text-[11px] text-gray-400 mt-0.5">ยังไม่ได้อ่าน {unreadCount} รายการ</p>}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1 transition"
                  >
                    <Check size={12} /> อ่านทั้งหมด
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/60">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-gray-400">
                    <Bell size={28} className="mb-2 opacity-30" />
                    <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const cfg = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.order;
                    const IconComp = cfg.icon;
                    return (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 px-4 py-3 transition relative group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!notif.read ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}
                        onClick={() => handleNotifClick(notif)}
                      >
                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                          <IconComp size={16} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {!notif.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{notif.title}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1 font-medium">{notif.time}</p>
                        </div>

                        {/* Dismiss X (ป้องกัน click bubble ไปที่ row) */}
                        <button
                          onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                          className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition mt-0.5"
                          title="ลบออก"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/30">
                  <button
                    onClick={() => { setShowNotif(false); navigate('/orders'); }}
                    className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 transition w-full text-center"
                  >
                    ดูการแจ้งเตือนทั้งหมด →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center border-l border-gray-200 dark:border-gray-700 pl-3 space-x-3 cursor-pointer">
          <img src={user.avatar} alt="Profile" className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm" />
          <div className="hidden md:block text-sm">
            <p className="font-medium text-gray-700 dark:text-gray-200 leading-tight">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
