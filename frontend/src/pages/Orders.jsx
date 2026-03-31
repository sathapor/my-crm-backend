import { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Trash2, Edit, ChevronDown, X, Save, AlertTriangle, RefreshCw, Search, Printer, CheckCircle2, Circle } from 'lucide-react';
import api, { handleExportCSV } from '../api';

// ── Status config ─────────────────────────────────────────────
const STATUS_LIST = ['ร่าง', 'รอชำระเงิน', 'โอนแล้ว', 'เตรียมส่ง', 'จัดส่งแล้ว', 'ยกเลิก'];

const TABS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'ร่าง', label: 'ร่าง' },
  { key: 'รอชำระเงิน', label: 'ยังไม่จ่าย' },
  { key: 'โอนแล้ว', label: 'โอนแล้ว' },
  { key: 'เตรียมส่ง', label: 'เตรียมส่ง' },
  { key: 'จัดส่งแล้ว', label: 'ส่งแล้ว' },
  { key: 'หมดอายุ', label: 'หมดอายุ' },
  { key: 'ยกเลิก', label: 'ยกเลิก' },
];

function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white font-semibold text-sm animate-fade-in ${type === 'error' ? 'bg-red-500' : 'bg-[#20A486]'}`}>
      {msg}
    </div>
  );
}

// ── Order Modal (Add/Edit) ────────────────────────────────────
function OrderModal({ order, onClose, onSaved }) {
  const isEdit = !!order;
  const [form, setForm] = useState(
    order
      ? { customer_name: order.customer_name, total_amount: order.total_amount, payment_method: order.payment_method || 'โอนเงินสลิป', address: order.address || '', note: order.note || '', status: order.status }
      : { customer_name: '', total_amount: '', payment_method: 'โอนเงินสลิป', address: '', note: '', status: 'รอชำระเงิน' }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.total_amount) { setErr('กรุณากรอกชื่อลูกค้าและยอดเงิน'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/orders/${order.id}`, form);
      } else {
        await api.post('/orders', form);
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr('เกิดข้อผิดพลาด: ' + (e.response?.data?.error || e.message));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{isEdit ? 'แก้ไขออเดอร์' : 'สร้างออเดอร์ใหม่'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-500 transition"><X size={18} /></button>
        </div>
        {err && <div className="mb-4 p-2 bg-red-50 text-red-600 rounded text-sm font-semibold">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">ชื่อลูกค้า *</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#20A486] focus:outline-none" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="ชื่อ-นามสกุล" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ยอดรวม (฿) *</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#20A486] focus:outline-none" type="number" min="0" step="0.01" value={form.total_amount} onChange={e => set('total_amount', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">วิธีชำระเงิน</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#20A486] focus:outline-none" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                {['โอนเงินสลิป', 'บัตรเครดิต', 'เงินสด', 'QR Code'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            {isEdit && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">สถานะ</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#20A486] focus:outline-none" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div className={isEdit ? '' : 'col-span-2'}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ที่อยู่จัดส่ง</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#20A486] focus:outline-none" value={form.address} onChange={e => set('address', e.target.value)} placeholder="ที่อยู่..." />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2 border border-gray-300 rounded font-semibold text-sm hover:bg-gray-50 text-gray-700 transition">ยกเลิก</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-[#20A486] text-white rounded font-semibold text-sm hover:bg-[#1C8D73] transition shadow-sm">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Batch Print Helper ──────────────────────────────────────────
const printAddressLabels = (ordersToPrint) => {
  if (ordersToPrint.length === 0) return alert('กรุณาเลือกออเดอร์อย่างน้อย 1 รายการเพื่อพิมพ์');
  const win = window.open('', '_blank', 'width=1000,height=800');
  if (!win) return alert('Pop-up ถูกบล็อก กรุณาอนุญาต Pop-up แล้วลองใหม่');

  let labelsHtml = '';
  // Limit to an A4 layout, multiple pages if many
  ordersToPrint.forEach(order => {
    const orderId = order.order_id || 'OD' + Date.now().toString().slice(-6);
    const trackNo = `TH${Date.now().toString().slice(-8)}`;
    const custName = order.customer_name || '-';
    // Assume note contains address if address field is empty in this context
    const address = order.address || order.note || '-';
    
    labelsHtml += `
      <div class="label" style="page-break-inside: avoid; background-color: white;">
        <div class="sender-header">
          <div class="sender-info"><strong>ผู้ส่ง</strong><br/>OmniPage SaaS<br/>กรุงเทพมหานคร 10120</div>
          <div class="postage-box">
            <div style="font-size:10px;">ไปรษณีย์ไทย</div><div style="font-size:8px;">(e-commerce)</div>
          </div>
        </div>
        <div class="barcode-section">
          <div class="barcode-title">EMS Tracking no.</div><div class="barcode-val">${trackNo}</div>
          <svg class="barcode-svg" js-barcode-val="${trackNo}"></svg>
        </div>
        <div class="receiver-section">
          <div class="receiver-title">กรุณาจัดส่งที่</div>
          <div class="receiver-name">${custName}</div>
          <div class="receiver-addr">${address}</div>
        </div>
        <div style="position: absolute; top: 10px; right: 0; background: black; color: white; padding: 2px 8px; font-weight: bold; font-size: 12px;">#${orderId.slice(-4)}</div>
      </div>
    `;
  });

  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8" />
      <title>พิมพ์ใบปะหน้า</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Sarabun', sans-serif; }
        body { background: #525659; padding: 20px; text-align: center; }
        .page { background: white; width: 297mm; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background-color: #ccc; margin: 0 auto 20px auto; border: 1px solid #aaa; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .label { padding: 20px; display: flex; flex-direction: column; position: relative; height: 100mm; text-align: left; }
        .sender-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .sender-info { font-size: 11px; line-height: 1.5; color: #333; }
        .sender-info strong { font-size: 14px; }
        .postage-box { border: 1px solid #333; padding: 5px; text-align: center; width: 80px; height: 40px; }
        .barcode-section { margin-bottom: 15px; text-align: left; }
        .barcode-title { font-size: 10px; color: #666; }
        .barcode-val { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
        .barcode-svg { height: 40px; width: 100%; max-width: 180px; }
        .receiver-section { margin-top: auto; border-top: 1px solid #000; padding-top: 10px; }
        .receiver-title { font-size: 12px; font-weight: bold; margin-bottom: 5px; }
        .receiver-name { font-size: 14px; font-weight: bold; margin-bottom: 3px; }
        .receiver-addr { font-size: 11px; line-height: 1.4; }
        @media print {
          body { background: white; padding: 0; display: block; }
          .no-print { display: none; }
          .page { width: 100%; box-shadow: none; border: none; margin: 0; }
          @page { size: A4 landscape; margin: 0; }
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    </head>
    <body>
      <div class="page">${labelsHtml}</div>
      <div class="no-print" style="position:fixed; bottom:30px; right:30px; z-index:100;">
        <button onclick="window.print()" style="background:#4f46e5;color:white;padding:12px 30px;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);">🖨️ พิมพ์</button>
      </div>
      <script>
        window.onload = () => {
          document.querySelectorAll('.barcode-svg').forEach(svg => {
            JsBarcode(svg, svg.getAttribute('js-barcode-val'), { format: "CODE128", displayValue: false, height: 40, width: 1.5, margin: 0 });
          });
        };
      </script>
    </body>
    </html>
  `;
  win.document.write(html);
  win.document.close();
};

function StatusDropdown({ order, onUpdate }) {
  const [open, setOpen] = useState(false);
  let color = 'text-[#20A486]';
  if (['รอชำระเงิน', 'ร่าง'].includes(order.status)) color = 'text-gray-400';
  if (order.status === 'โอนแล้ว') color = 'text-amber-500';
  if (order.status === 'เตรียมส่ง' || order.status === 'จัดส่งแล้ว') color = 'text-[#3B82F6]';

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className={`text-[13px] font-semibold hover:opacity-80 transition flex items-center gap-1 ${color}`}>
        {order.status || 'รอชำระเงิน'}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-32 z-30 bg-white rounded shadow-xl border border-gray-100 py-1" onMouseLeave={() => setOpen(false)}>
          {STATUS_LIST.map(s => (
            <button key={s} onClick={() => { onUpdate(order.id, s); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[13px] font-semibold hover:bg-gray-50 flex items-center gap-2 transition ${s === order.status ? 'text-[#20A486]' : 'text-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('เตรียมส่ง'); // Default like image
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [selectedIds, setSelectedIds] = useState([]);
  
  // New States for functional buttons
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [showNotice, setShowNotice] = useState(true);
  const [batchStatusOpen, setBatchStatusOpen] = useState(false);
  const [batchPrintOpen, setBatchPrintOpen] = useState(false);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      // Normalize statuses from old data to new
      let data = res.data.data.map(o => {
        let st = o.status;
        if (st === 'ชำระแล้ว') st = 'โอนแล้ว';
        return { ...o, status: st };
      });
      setOrders(data);
    } catch (err) {
      showToast('ไม่สามารถโหลดข้อมูลบิลได้', 'error');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdateStatus = async (id, status) => {
    try {
      let backendStatus = status;
      if (status === 'โอนแล้ว') backendStatus = 'ชำระแล้ว';
      await api.put(`/orders/${id}`, { status: backendStatus });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      showToast('อัปเดตสถานะสำเร็จ');
    } catch { showToast('อัปเดตไม่สำเร็จ', 'error'); }
  };

  const handleBatchStatusUpdate = async (status) => {
    if (selectedIds.length === 0) return;
    setBatchStatusOpen(false);
    try {
      let backendStatus = status;
      if (status === 'โอนแล้ว') backendStatus = 'ชำระแล้ว';
      await Promise.all(selectedIds.map(id => api.put(`/orders/${id}`, { status: backendStatus })));
      setOrders(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, status } : o));
      showToast(`เปลี่ยนสถานะ ${selectedIds.length} รายการเป็น ${status} สำเร็จ`);
      setSelectedIds([]);
    } catch {
      showToast('อัปเดตสถานะบางรายการไม่สำเร็จ', 'error');
    }
  };

  const handleBatchPrint = () => {
    setBatchPrintOpen(false);
    const toPrint = orders.filter(o => selectedIds.includes(o.id));
    printAddressLabels(toPrint);
  };

  const getFiltered = () => {
    return orders.filter(o => 
      (filterStatus === 'all' || o.status === filterStatus) &&
      (o.customer_name?.toLowerCase().includes(search.toLowerCase()) || o.order_id?.toLowerCase().includes(search.toLowerCase()))
    );
  };

  const filtered = getFiltered();

  const getCount = (key) => key === 'all' ? orders.length : orders.filter(o => o.status === key).length;

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(o => o.id));
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col bg-[#F3F4F6] font-sans">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />
      {showModal && <OrderModal order={editTarget} onClose={() => { setShowModal(false); setEditTarget(null); }} onSaved={() => { fetchOrders(); showToast(editTarget ? 'แก้ไขออเดอร์สำเร็จ' : 'สร้างออเดอร์ใหม่สำเร็จ'); }} />}
      
      {/* ── Tabs Area (Page365 Style) ── */}
      <div className="bg-[#F3F4F6] px-6 pt-6 pb-4">
        <div className="flex gap-[2px]">
          {TABS.map(tab => {
            const count = getCount(tab.key);
            const active = filterStatus === tab.key;
            return (
              <button 
                key={tab.key} 
                onClick={() => setFilterStatus(tab.key)}
                className={`flex flex-col items-center justify-center w-24 py-2 transition-colors ${
                  active 
                    ? 'bg-[#3B82F6] text-white shadow-md z-10' 
                    : 'bg-[#CBD5E1] text-[#475569] hover:bg-[#94A3B8] hover:text-white'
                }`}
              >
                <span className="text-lg font-bold leading-tight">{count}</span>
                <span className="text-[11px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Bar */}
        <div className="mt-4 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2 w-full max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหา..." className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#20A486]" />
            </div>
          </div>
          <div className="flex gap-2 relative">
            
            {/* Batch Status Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setBatchStatusOpen(!batchStatusOpen); setBatchPrintOpen(false); }}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm font-semibold hover:bg-gray-50 flex items-center gap-1 transition"
              >
                เปลี่ยนสถานะ ({selectedIds.length}) <ChevronDown size={14} />
              </button>
              {batchStatusOpen && (
                <div className="absolute top-full right-0 mt-1 w-40 z-30 bg-white shadow-lg border border-gray-200 rounded py-1 animate-fade-in" onMouseLeave={() => setBatchStatusOpen(false)}>
                  <div className="px-3 py-1 text-xs text-gray-400 font-semibold border-b border-gray-100 mb-1">เลือกสถานะใหม่</div>
                  {STATUS_LIST.map(s => (
                    <button key={s} onClick={() => handleBatchStatusUpdate(s)} className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-50 text-gray-700 transition">{s}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Batch Print Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setBatchPrintOpen(!batchPrintOpen); setBatchStatusOpen(false); }}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm font-semibold hover:bg-gray-50 flex items-center gap-1 transition"
              >
                พิมพ์ ({selectedIds.length}) <ChevronDown size={14} />
              </button>
              {batchPrintOpen && (
                <div className="absolute top-full right-0 mt-1 w-32 z-30 bg-white shadow-lg border border-gray-200 rounded py-1 animate-fade-in" onMouseLeave={() => setBatchPrintOpen(false)}>
                  <button onClick={handleBatchPrint} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2 transition"><Printer size={14} /> พิมพ์ใบปะหน้า</button>
                </div>
              )}
            </div>

            <button 
              onClick={() => { setEditTarget(null); setShowModal(true); }}
              className="bg-[#20A486] text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-[#1C8D73] shadow-sm flex items-center gap-2 transition"
            >
              <Plus size={14} /> เปิดบิล
            </button>
          </div>
        </div>
      </div>

      {/* ── Notice Banner ── */}
      {showNotice && (
        <div className="mx-6 mb-4 bg-white p-4 border border-blue-100 rounded shadow-sm flex items-start gap-4 animate-fade-in">
          <div className="w-10 h-6 bg-blue-600 rounded flex shrink-0 mt-1"></div>
          <div>
            <h4 className="font-bold text-gray-800 text-[13px]">ระบบรับชำระผ่านบัตรเครดิตรูปแบบเดิมจะปิดการใช้งานภายในพฤศจิกายนนี้!</h4>
            <p className="text-[12px] text-gray-600 mt-1"><span className="text-[#3B82F6] cursor-pointer hover:underline">สมัครใช้งานระบบใหม่</span> ขอความร่วมมือร้านค้าที่ยังใช้บริการรับชำระผ่านบัตรเครดิตแบบเดิม เริ่มต้นสมัครและใช้งานระบบใหม่ได้แล้ววันนี้</p>
          </div>
          <button onClick={() => setShowNotice(false)} className="ml-auto text-gray-400 hover:text-gray-600 transition p-1"><X size={16}/></button>
        </div>
      )}

      {/* ── Table Area ── */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-white shadow border border-gray-300">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#64748B] text-white text-[13px]">
                <th className="w-10 py-2.5 px-3 text-center border-r border-[#475569]">
                  <button onClick={toggleAll}>
                    {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckCircle2 size={16} fill="white" className="text-[#64748B]" /> : <Circle size={16} className="text-gray-300 opacity-50" />}
                  </button>
                </th>
                <th className="py-2.5 px-4 font-semibold border-r border-[#475569] w-24">เลขที่บิล</th>
                <th className="py-2.5 px-4 font-semibold border-r border-[#475569] w-28">วันเปิดบิล</th>
                <th className="py-2.5 px-4 font-semibold border-r border-[#475569]">ผู้สั่งสินค้า</th>
                <th className="py-2.5 px-4 font-semibold border-r border-[#475569] w-32">ยอดสุทธิ</th>
                <th className="py-2.5 px-4 font-semibold w-48">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={6} className="py-10 text-center text-gray-400">กำลังโหลดข้อมูล...</td></tr>
              ) : filtered.length === 0 ? (
                 <tr><td colSpan={6} className="py-10 text-center text-gray-400">ไม่พบบิล</td></tr>
              ) : (
                filtered.map(order => {
                  const isChecked = selectedIds.includes(order.id);
                  const isPaid = order.status === 'โอนแล้ว' || order.status === 'เตรียมส่ง' || order.status === 'จัดส่งแล้ว';
                  return (
                    <tr key={order.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${isChecked ? 'bg-blue-50/40' : ''}`}>
                      <td className="py-2.5 px-3 text-center border-r border-gray-200">
                        <button onClick={() => toggleOne(order.id)}>
                          {isChecked ? <CheckCircle2 size={16} fill="#20A486" className="text-white" /> : <Circle size={16} className="text-gray-300" />}
                        </button>
                      </td>
                      <td className="py-2.5 px-4 border-r border-gray-200">
                        <span className={`text-[13px] font-semibold ${isPaid ? 'text-gray-800' : 'text-gray-500'}`}>#{order.order_id.substring(0,6).toUpperCase()}</span>
                      </td>
                      <td className="py-2.5 px-4 border-r border-gray-200 text-[13px] text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-2.5 px-4 border-r border-gray-200 text-[14px] font-semibold text-gray-800">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">🏠</span>
                          {order.customer_name}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 border-r border-gray-200 text-[13px] text-gray-600">
                        {Number(order.total_amount).toLocaleString('th-TH', {minimumFractionDigits: 2})} บาท
                      </td>
                      <td className="py-2.5 px-4 text-[13px]">
                        <div className="flex items-center gap-4">
                          <StatusDropdown order={order} onUpdate={handleUpdateStatus} />
                          {/* Tracking number mock input */}
                          {order.status === 'เตรียมส่ง' || order.status === 'จัดส่งแล้ว' ? (
                            <div className="flex items-center gap-2 text-gray-500 flex-1">
                              <span className="font-mono text-xs">{order.note?.match(/TH\d+/)?.[0] || 'EF58293910TH'}</span>
                              <Printer size={14} className="cursor-pointer hover:text-gray-800" />
                            </div>
                          ) : (
                            order.status === 'โอนแล้ว' && <span className="text-amber-500 text-[10px] flex items-center gap-1"><AlertTriangle size={12}/> โอนเกินยอด</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
