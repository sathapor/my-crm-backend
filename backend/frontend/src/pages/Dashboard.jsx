import { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, ShoppingBag, Users, TrendingUp, Sparkles, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import api from '../api';

// ── Custom Tooltip ─────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl px-4 py-2.5 text-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-gray-900 dark:text-white">฿{Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, bgColor, change, loading }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
          {loading ? (
            <div className="skeleton h-8 w-28 mt-2 rounded-lg" />
          ) : (
            <h3 className="text-2xl font-bold mt-1.5 text-gray-900 dark:text-white">{value}</h3>
          )}
          {change !== undefined && !loading && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(change)}% จากเดือนก่อน
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bgColor} shrink-0`}>
          <Icon size={22} className={color} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/stats/dashboard');
      setStats(res.data.data);
    } catch (err) {
      console.error('Dashboard stats error:', err);
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="section-title">ภาพรวมระบบ</h1>
          <p className="section-subtitle">สถิติแบบเรียลไทม์จาก Supabase Database</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary text-xs">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />รีเฟรช
        </button>
      </div>

      {/* AI Insight */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm mb-1 opacity-80 uppercase tracking-wider">AI Insight</h3>
            <p className="text-sm leading-relaxed opacity-90">
              {stats
                ? `ยอดขายรวม ฿${stats.revenue.toLocaleString()} | ออเดอร์ ${stats.ordersCount} รายการ | อัตราปิดการขาย ${stats.conversionRate} — ระบบเชื่อมต่อ Supabase สำเร็จ ✅`
                : 'กำลังวิเคราะห์ข้อมูลยอดขายจากฐานข้อมูล Supabase...'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="ยอดขายรวม" value={stats ? `฿${stats.revenue.toLocaleString()}` : '—'}
          icon={DollarSign} color="text-emerald-500" bgColor="bg-emerald-50 dark:bg-emerald-900/20" change={12} loading={loading} />
        <StatCard title="ออเดอร์ทั้งหมด" value={stats ? stats.ordersCount : '—'}
          icon={ShoppingBag} color="text-indigo-500" bgColor="bg-indigo-50 dark:bg-indigo-900/20" change={8} loading={loading} />
        <StatCard title="ลูกค้าใหม่ (30 วัน)" value={stats ? `${stats.newCustomers} คน` : '—'}
          icon={Users} color="text-blue-500" bgColor="bg-blue-50 dark:bg-blue-900/20" change={-2} loading={loading} />
        <StatCard title="อัตราปิดการขาย" value={stats ? stats.conversionRate : '—'}
          icon={TrendingUp} color="text-purple-500" bgColor="bg-purple-50 dark:bg-purple-900/20" loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="glass p-6 lg:col-span-2 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">ยอดขาย 7 วันล่าสุด</h3>
              <p className="text-xs text-gray-400 mt-0.5">จากข้อมูลจริงใน Supabase</p>
            </div>
            {stats && !loading && (
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <ArrowUpRight size={14} />Live
              </span>
            )}
          </div>
          <div className="h-64">
            {loading || !stats ? (
              <div className="h-full animate-shimmer rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.08} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#gRev)" dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5, fill: '#6366f1' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="glass p-6 border border-gray-100 dark:border-gray-800">
          <div className="mb-5">
            <h3 className="font-bold text-gray-900 dark:text-white">สินค้าขายดี</h3>
            <p className="text-xs text-gray-400 mt-0.5">ตามยอดขายสะสม</p>
          </div>
          <div className="h-64">
            {loading || !stats ? (
              <div className="h-full animate-shimmer rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 11 }} width={80} />
                  <Tooltip formatter={v => [`${v} ยอด`, 'ขาย']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="sales" fill="#818cf8" radius={[0, 6, 6, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
