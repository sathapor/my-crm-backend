import { NavLink } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { 
  LayoutDashboard, 
  MessageSquare, 
  ShoppingCart, 
  Package, 
  CreditCard, 
  Truck, 
  Video, 
  Users, 
  BarChart3, 
  Settings,
  ChevronLeft,
  Menu
} from 'lucide-react';

const navItems = [
  { name: 'แดชบอร์ด', path: '/dashboard', icon: LayoutDashboard },
  { name: 'แชท (ตอบลูกค้า)', path: '/chat', icon: MessageSquare },
  { name: 'จัดการออเดอร์', path: '/orders', icon: ShoppingCart },
  { name: 'จัดการสินค้า', path: '/products', icon: Package },
  { name: 'แจ้งโอนเงิน', path: '/payments', icon: CreditCard },
  { name: 'จัดส่งสินค้า', path: '/shipping', icon: Truck },
  { name: 'ไลฟ์สด (ดูดรหัส)', path: '/live', icon: Video },
  { name: 'จัดการลูกค้า', path: '/customers', icon: Users },
  { name: 'สถิติการขาย', path: '/analytics', icon: BarChart3 },
  { name: 'ตั้งค่าระบบ', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useStore();

  return (
    <div className={`transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen \${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col z-20 shadow-sm relative`}>
      {/* Logo Area */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-gray-700/50">
        {sidebarOpen ? (
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-DEFAULT to-purple-600">
            OmniPage
          </span>
        ) : (
          <span className="text-xl font-bold text-brand-DEFAULT w-full text-center">O</span>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center mx-3 px-3 py-2.5 rounded-lg transition-colors group relative \${
                isActive 
                  ? 'bg-brand-DEFAULT/10 dark:bg-brand-DEFAULT/20 text-brand-dark dark:text-brand-light font-medium' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'
              }`
            }
          >
            <item.icon size={20} className={sidebarOpen ? 'mr-3 shrink-0' : 'mx-auto shrink-0'} />
            <span className={`transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'} whitespace-nowrap`}>
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>
      
      {/* Bottom Profile Area placeholder */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 text-xs text-gray-400 text-center">
        {sidebarOpen ? '© 2026 OmniPage SaaS' : '©'}
      </div>
    </div>
  );
}
