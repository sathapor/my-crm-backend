import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, Activity, RefreshCw } from 'lucide-react';
import api from '../api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// ── Custom Tooltip ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl p-3 text-sm">
      <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-bold">฿{Number(p.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ monthlyData: [], categoryData: [] });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stats/analytics');
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const totalSales = data.monthlyData.reduce((s, d) => s + d.sales, 0);
  const totalProfit = data.monthlyData.reduce((s, d) => s + d.profit, 0);
  const latestMonth = data.monthlyData[data.monthlyData.length - 1];
  const prevMonth = data.monthlyData[data.monthlyData.length - 2];
  const growth = !loading && latestMonth && prevMonth && prevMonth.sales > 0
    ? (((latestMonth.sales - prevMonth.sales) / prevMonth.sales) * 100).toFixed(1)
    : null;

  const KpiCard = ({ label, value, sub, icon: Icon, color, borderColor }) => (
    <div className={`glass p-5 border-l-4 ${borderColor} shadow-sm`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
          {loading ? <div className="skeleton h-8 w-24 mt-2" /> : <h2 className={`text-2xl font-bold mt-1 ${color}`}>{value}</h2>}
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1.5">{sub}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${color.replace('text-', 'bg-').replace('-500', '-100')} dark:${color.replace('text-', 'bg-').replace('-500', '-900/20')}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="section-title">สถิติเชิงลึก</h1>
          <p className="section-subtitle">วิเคราะห์ยอดขาย กำไร และสัดส่วนหมวดสินค้าจากข้อมูลจริง</p>
        </div>
        <button onClick={fetchAnalytics} className="btn-secondary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />รีเฟรชข้อมูล
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="ยอดขายทั้งหมด (6 เดือน)" value={`฿${totalSales.toLocaleString()}`}
          sub={<><TrendingUp size={12} className="text-emerald-500" /> รวมจากฐานข้อมูลจริง</>}
          icon={TrendingUp} color="text-emerald-500" borderColor="border-emerald-400"
        />
        <KpiCard
          label="กำไรสุทธิ (6 เดือน)" value={`฿${totalProfit.toLocaleString()}`}
          sub={<><Activity size={12} className="text-indigo-500" /> หลังหักต้นทุน 35%</>}
          icon={Activity} color="text-indigo-500" borderColor="border-indigo-400"
        />
        <KpiCard
          label="อัตราเติบโต (MoM)" value={growth !== null ? `${growth > 0 ? '+' : ''}${growth}%` : '-'}
          sub={<><Target size={12} className={growth > 0 ? 'text-emerald-500' : 'text-red-500'} /> เทียบเดือนที่แล้ว</>}
          icon={growth > 0 ? TrendingUp : TrendingDown} color={growth > 0 ? 'text-emerald-500' : 'text-red-500'} borderColor={growth > 0 ? 'border-emerald-400' : 'border-red-400'}
        />
        <KpiCard
          label="ROI เฉลี่ย" value={totalSales > 0 ? `${((totalProfit / totalSales) * 100).toFixed(1)}%` : '0%'}
          sub={<><TrendingUp size={12} className="text-purple-500" /> อัตราผลตอบแทน</>}
          icon={TrendingUp} color="text-purple-500" borderColor="border-purple-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 glass p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">ยอดขายเทียบกำไร (6 เดือนล่าสุด)</h3>
              <p className="text-xs text-gray-400 mt-0.5">ข้อมูลจาก Supabase Database</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500" />ยอดขาย</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" />กำไร</span>
            </div>
          </div>
          <div className="h-72">
            {loading ? <div className="h-full animate-shimmer rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sales" name="ยอดขาย" stroke="#6366f1" strokeWidth={2.5} fill="url(#gSales)" dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="profit" name="กำไร" stroke="#10b981" strokeWidth={2.5} fill="url(#gProfit)" dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass p-6 border border-gray-100 dark:border-gray-800 flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">สัดส่วนหมวดสินค้า</h3>
            <p className="text-xs text-gray-400 mt-0.5">จำนวนสินค้าแต่ละหมวด</p>
          </div>
          <div className="flex-1 relative min-h-[200px]">
            {loading ? <div className="w-40 h-40 mx-auto animate-shimmer rounded-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryData} cx="50%" cy="50%" innerRadius="45%" outerRadius="70%"
                    paddingAngle={4} dataKey="value" stroke="none"
                  >
                    {data.categoryData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {!loading && data.categoryData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
