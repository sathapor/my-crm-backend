import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Payments from './pages/Payments';
import Shipping from './pages/Shipping';
import Live from './pages/Live';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';

function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors">
      <Sidebar />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Topbar />
        <main className="w-full p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { io } from 'socket.io-client';
import RegisterLine from './pages/RegisterLine';
import Register from './pages/Register';

// Production-ready Socket URL
const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const rawSocketURL = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : 'https://my-crm-api.onrender.com');
const SOCKET_URL = rawSocketURL.replace('my-crm-apis.onrender.com', 'my-crm-api.onrender.com');

function App() {
  const { addNotification } = useStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('📡 Global Socket Connected:', socket.id);
    });

    socket.on('new_notification', (data) => {
      console.log('🔔 New Notification Received:', data);
      addNotification(data);
      
      // Optional: Play a sound or trigger a Browser Notification here
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, { body: data.body });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [addNotification]);

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/register-line" element={<RegisterLine />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected / Dashboard Layout Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/products" element={<Products />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/shipping" element={<Shipping />} />
                <Route path="/live" element={<Live />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                {/* Add more routes here later */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
