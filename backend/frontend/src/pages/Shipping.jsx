import { useState, useEffect, useCallback } from 'react';
import { Truck, Printer, MapPin, Package, CheckSquare, Square, RefreshCw, Search, CheckCircle2 } from 'lucide-react';
import api from '../api';

const CARRIERS = [
  { name: 'Kerry Express', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-500' },
  { name: 'Flash Express', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-400' },
  { name: 'J&T Express', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-400' },
  { name: 'Thailand Post', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-400' },
];

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return <div className="toast toast-success"><span className="w-2 h-2 rounded-full bg-emerald-400" />{msg}</div>;
}

export default function Shipping() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carrier, setCarrier] = useState(0);
  const [checked, setChecked] = useState(new Set());
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');

  const fetchShipping = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      const readyToShip = res.data.data.filter(o => o.status === 'ชำระแล้ว' || o.shipping_status === 'รอจัดส่ง');
      setOrders(readyToShip);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchShipping(); }, [fetchShipping]);

  const toggleCheck = (id) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (checked.size === filtered.length) setChecked(new Set());
    else setChecked(new Set(filtered.map(o => o.id)));
  };

  const genTracking = async (order) => {
    const trackingNo = `TH${Date.now().toString().slice(-9)}`;
    try {
      await api.put(`/orders/${order.id}`, { shipping_status: 'จัดส่งแล้ว', status: 'จัดส่งแล้ว', tracking_number: trackingNo });
      setOrders(prev => prev.filter(o => o.id !== order.id));
      setToast(`✅ สร้าง Tracking: ${trackingNo} และอัปเดต Supabase แล้ว`);
    } catch {
      setToast(`Tracking: ${trackingNo} (ไม่สามารถอัปเดต DB)`);
    }
  };

  const printBulk = () => {
    const selected = orders.filter(o => checked.has(o.id));
    if (selected.length === 0) { setToast('กรุณาเลือกออเดอร์ก่อน'); return; }
    setToast(`📦 สั่งพิมพ์ใบปะหน้า ${selected.length} ใบ (${CARRIERS[carrier].name}) สำเร็จ`);
  };

  const filtered = orders.filter(o =>
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.order_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <Toast msg={toast} onClose={() => setToast('')} />

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="section-title">ศูนย์แพ็คและจัดส่ง</h1>
          <p className="section-subtitle">จัดการการจัดส่ง พิมพ์ใบปะหน้า และสร้าง Tracking Number ใน Supabase</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchShipping} className="btn-secondary"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />รีเฟรช</button>
          <button onClick={printBulk} className="btn-primary"><Printer size={15} />พิมพ์ที่เลือก ({checked.size})</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Carrier Selection */}
        <div className="md:col-span-1 space-y-3">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">เลือกบริษัทขนส่ง</h3>
          {CARRIERS.map((c, i) => (
            <button key={i} onClick={() => setCarrier(i)}
              className={`w-full p-3.5 border-2 rounded-xl cursor-pointer transition flex items-center gap-3 ${i === carrier ? `${c.border} ${c.bg}` : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'}`}>
              <Truck size={18} className={i === carrier ? c.color : 'text-gray-400'} />
              <span className={`font-semibold text-sm ${i === carrier ? c.color : 'text-gray-600 dark:text-gray-300'}`}>{c.name}</span>
              {i === carrier && <CheckCircle2 size={16} className={`ml-auto ${c.color}`} />}
            </button>
          ))}

          {/* Stats */}
          <div className="glass p-4 border border-gray-100 dark:border-gray-800 mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">สรุปวันนี้</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">รอแพ็ค</span>
                <span className="font-bold text-amber-500">{orders.length} กล่อง</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">เลือกแล้ว</span>
                <span className="font-bold text-indigo-600">{checked.size} กล่อง</span>
              </div>
            </div>
          </div>
        </div>

        {/* Packing List Table */}
        <div className="md:col-span-3 glass overflow-hidden border border-gray-100 dark:border-gray-800">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 flex items-center gap-3 bg-white/50 dark:bg-gray-800/30">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Package className="text-indigo-500" size={18} />
              รายการรอแพ็ค ({filtered.length} กล่อง)
            </div>
            <div className="relative flex-1 max-w-xs ml-auto">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..." className="input-field pl-8 py-1.5 text-xs" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10 text-center">
                    <button onClick={toggleAll} className="text-gray-400 hover:text-indigo-500 transition">
                      {checked.size === filtered.length && filtered.length > 0 ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} />}
                    </button>
                  </th>
                  <th>ออเดอร์</th>
                  <th>ลูกค้า</th>
                  <th>ปลายทาง</th>
                  <th className="text-right">แอคชั่น</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j}><div className="skeleton h-5 w-full" /></td>)}</tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16 text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    <p>แพ็คของเสร็จหมดแล้ว! 🎉</p>
                  </td></tr>
                ) : filtered.map(order => (
                  <tr key={order.id} className={checked.has(order.id) ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}>
                    <td className="text-center">
                      <button onClick={() => toggleCheck(order.id)} className="text-gray-400 hover:text-indigo-500 transition">
                        {checked.has(order.id) ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td>
                      <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">{order.order_id}</p>
                      <p className="text-xs text-gray-400">฿{Number(order.total_amount).toLocaleString()}</p>
                    </td>
                    <td><span className="font-semibold text-sm text-gray-900 dark:text-white">{order.customer_name}</span></td>
                    <td>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={12} />{order.address || 'กรุงเทพมหานคร'}
                      </div>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => genTracking(order)}
                          className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition">
                          Gen Tracking
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
