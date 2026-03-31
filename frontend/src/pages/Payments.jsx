import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Search, Image as ImageIcon, CheckCircle, XCircle, RefreshCw, Clock, DollarSign } from 'lucide-react';
import api from '../api';

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return <div className={`toast ${type === 'error' ? 'toast-error' : 'toast-success'}`}><span className="w-2 h-2 rounded-full bg-emerald-400" />{msg}</div>;
}

export default function Payments() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      const pending = res.data.data.filter(o =>
        o.status === 'รอชำระเงิน' || o.payment_method === 'โอนเงินสลิป'
      );
      setPendingOrders(pending);
    } catch { showToast('โหลดข้อมูลไม่สำเร็จ', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const updateOrderStatus = async (id, status) => {
    setProcessing(true);
    try {
      await api.put(`/orders/${id}`, { status });
      setPendingOrders(prev => prev.filter(o => o.id !== id));
      setSelectedSlip(null);
      showToast(status === 'ชำระแล้ว' ? '✅ อนุมัติสลิปและอัปเดตสถานะแล้ว' : '❌ ปฏิเสธสลิปและอัปเดตสถานะแล้ว', status === 'ชำระแล้ว' ? 'success' : 'error');
    } catch { showToast('อัปเดตสถานะไม่สำเร็จ', 'error'); }
    finally { setProcessing(false); }
  };

  const filtered = pendingOrders.filter(o =>
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.order_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="section-title">ตรวจสอบสลิปการชำระเงิน</h1>
          <p className="section-subtitle">รีวิวและอนุมัติสลิปโอนเงินจากลูกค้า อัปเดตสถานะใน Supabase ทันที</p>
        </div>
        <button onClick={fetchPayments} className="btn-secondary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />รีเฟรช
        </button>
      </div>

      {/* Stats Strip */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm font-semibold">
          <Clock size={16} />{pendingOrders.length} รายการรอตรวจสอบ
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-400 text-sm font-semibold">
          <DollarSign size={16} />฿{pendingOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0).toLocaleString()} รอรับเงิน
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order List */}
        <div className="lg:col-span-1 glass overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700/60 bg-white/50 dark:bg-gray-800/30 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหาออเดอร์..." className="input-field pl-9 py-2 text-sm" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 flex flex-col items-center gap-3 text-gray-400">
                <RefreshCw size={24} className="animate-spin" />
                <p className="text-sm">กำลังโหลดรายการ...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 flex flex-col items-center gap-3 text-gray-400">
                <ShieldCheck size={40} className="text-emerald-500 opacity-50" />
                <p className="text-sm font-medium">ไม่มีสลิปรอตรวจสอบ</p>
                <p className="text-xs text-center">ออเดอร์ทั้งหมดได้รับการตรวจสอบแล้ว</p>
              </div>
            ) : filtered.map(order => (
              <div key={order.id} onClick={() => setSelectedSlip(order)}
                className={`p-4 cursor-pointer transition border-b border-gray-100 dark:border-gray-800 border-l-4 ${selectedSlip?.id === order.id ? 'border-l-indigo-500 bg-indigo-50/40 dark:bg-indigo-900/10' : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{order.customer_name}</span>
                  <span className="badge badge-warning text-[10px]">รอตรวจ</span>
                </div>
                <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{order.order_id}</p>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>฿{Number(order.total_amount).toLocaleString()}</span>
                  <span className="flex items-center gap-1 text-blue-500"><ImageIcon size={10} />มีสลิปแนบ</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inspection Panel */}
        <div className="lg:col-span-2 glass flex flex-col border border-gray-100 dark:border-gray-800" style={{ minHeight: 'calc(100vh - 280px)' }}>
          {selectedSlip ? (
            <div className="flex flex-col h-full p-6 animate-fade-in">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedSlip.order_id}</h2>
                  <p className="text-sm text-gray-500">{selectedSlip.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">฿{Number(selectedSlip.total_amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">ยอดที่ต้องชำระ</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 bg-gray-50 dark:bg-gray-900/30 p-5 rounded-2xl overflow-y-auto">
                {/* Slip Preview */}
                <div className="h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden group cursor-pointer hover:border-indigo-400 transition">
                  <ImageIcon size={40} className="opacity-30 mb-2" />
                  <p className="text-sm font-medium">สลิปโอนเงิน</p>
                  <p className="text-xs text-gray-400 mt-1">ลูกค้าแนบสลิปมาแล้ว</p>
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 animate-scan opacity-0 group-hover:opacity-100 transition" />
                </div>

                {/* AI Analysis */}
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                      <div>
                        <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">AI ตรวจสอบ: สลิปแท้ 98%</h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">QR Code ตรงกับหมายเลขอ้างอิงธนาคาร</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl space-y-2.5">
                    <h4 className="font-bold text-sm border-b border-gray-100 dark:border-gray-700 pb-2">รายละเอียดจากการสแกน</h4>
                    {[
                      ['บัญชีผู้รับ', 'นาย สมชาย ทดสอบ'],
                      ['ธนาคาร', 'ธนาคารกสิกรไทย (KBank)'],
                      ['วันที่ส่ง', new Date().toLocaleDateString('th-TH')],
                      ['ยอดในสลิป', `฿${Number(selectedSlip.total_amount).toLocaleString()}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-gray-500">{k}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button onClick={() => updateOrderStatus(selectedSlip.id, 'ชำระแล้ว')} disabled={processing}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50">
                      <CheckCircle size={18} />{processing ? 'กำลังอัปเดต...' : 'อนุมัติ & อัปเดต Supabase'}
                    </button>
                    <button onClick={() => updateOrderStatus(selectedSlip.id, 'ยกเลิก')} disabled={processing}
                      className="w-full py-3 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 rounded-xl font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50">
                      <XCircle size={18} />ปฏิเสธ / สลิปปลอม
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 p-8">
              <Search size={56} className="opacity-15" />
              <p className="text-lg font-semibold">เลือกรายการจากด้านซ้าย</p>
              <p className="text-sm text-center max-w-xs">คลิกที่ออเดอร์ที่รอตรวจสอบเพื่อดูสลิปและอนุมัติการชำระเงิน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
