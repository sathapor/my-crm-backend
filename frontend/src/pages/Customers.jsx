import { useState, useEffect, useCallback } from 'react';
import { Search, Star, Mail, Phone, ShoppingBag, Download, Plus, Edit2, Trash2, X, Save, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import api from '../api';

const TAG_STYLES = {
  VIP:     'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  LOYAL:   'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  NEW:     'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  REGULAR: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
};

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return <div className={`toast ${type === 'error' ? 'toast-error' : 'toast-success'}`}><span className="w-2 h-2 rounded-full bg-emerald-400" />{msg}</div>;
}

// ── Customer Avatar ───────────────────────────────────────────
function CustomerAvatar({ name, size = 'md' }) {
  const initials = name ? name.substring(0, 2) : 'NN';
  const colors = ['from-violet-500 to-indigo-500', 'from-rose-500 to-pink-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-cyan-500 to-blue-500'];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${colors[colorIdx]} text-white flex items-center justify-center font-bold shrink-0`}>
      {initials}
    </div>
  );
}

// ── Customer Modal ────────────────────────────────────────────
function CustomerModal({ customer, onClose, onSaved }) {
  const isEdit = !!customer;
  const [form, setForm] = useState(
    customer
      ? { name: customer.name, phone: customer.phone, email: customer.email || '', tags: (customer.tags || []).join(', ') }
      : { name: '', phone: '', email: '', tags: 'NEW' }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { setErr('กรุณากรอกชื่อและเบอร์โทรศัพท์'); return; }
    setSaving(true);
    const payload = { ...form, tags: form.tags.split(',').map(t => t.trim().toUpperCase()).filter(Boolean) };
    try {
      if (isEdit) await api.put(`/customers/${customer.id}`, payload);
      else await api.post('/customers', payload);
      onSaved(); onClose();
    } catch (e) { setErr('เกิดข้อผิดพลาด: ' + (e.response?.data?.error || e.message)); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-md p-7" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">{isEdit ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition"><X size={18} /></button>
        </div>
        {err && <div className="mb-4 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">ชื่อลูกค้า *</label>
            <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="ชื่อ-นามสกุล" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">เบอร์โทรศัพท์ *</label>
            <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08x-xxx-xxxx" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">อีเมล</label>
            <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">แท็ก (คั่นด้วย comma)</label>
            <input className="input-field font-mono" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="VIP, LOYAL, NEW" />
            <p className="text-xs text-gray-400 mt-1">เช่น VIP, LOYAL, NEW, REGULAR</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">ยกเลิก</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              <Save size={15} />{saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Confirm Delete ────────────────────────────────────────────
function ConfirmDelete({ customer, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-sm p-7 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-red-500" size={24} />
        </div>
        <h2 className="text-lg font-bold mb-2">ยืนยันการลบ</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">ต้องการลบ <span className="font-bold text-gray-900 dark:text-white">{customer?.name}</span> ออกจาก CRM?</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">ยกเลิก</button>
          <button onClick={onConfirm} className="btn-danger flex-1 justify-center"><Trash2 size={15} />ลบออก</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { params: filterTag !== 'all' ? { tag: filterTag } : {} });
      setCustomers(res.data.data);
    } catch { showToast('โหลดข้อมูลลูกค้าไม่สำเร็จ', 'error'); }
    finally { setLoading(false); }
  }, [filterTag]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/customers/${deleteTarget.id}`);
      setCustomers(prev => prev.filter(c => c.id !== deleteTarget.id));
      showToast(`ลบ "${deleteTarget.name}" แล้ว`);
    } catch { showToast('ลบลูกค้าไม่สำเร็จ', 'error'); }
    finally { setDeleteTarget(null); }
  };

  const handleExport = () => {
    const headers = ['ชื่อ', 'เบอร์โทร', 'อีเมล', 'ยอดใช้จ่าย', 'จำนวนออเดอร์', 'แท็ก'];
    const rows = customers.map(c => [c.name, c.phone, c.email || '-', c.total_spent, c.order_count, (c.tags || []).join('|')]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `customers_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const vipCount = customers.filter(c => (c.tags || []).includes('VIP')).length;
  const repeatRate = customers.length ? Math.round((customers.filter(c => c.order_count > 1).length / customers.length) * 100) : 0;
  const totalRevenue = customers.reduce((s, c) => s + Number(c.total_spent || 0), 0);

  return (
    <div className="page-container">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />
      {showModal && <CustomerModal customer={editTarget} onClose={() => { setShowModal(false); setEditTarget(null); }} onSaved={() => { fetchCustomers(); showToast(editTarget ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มลูกค้าใหม่แล้ว'); }} />}
      {deleteTarget && <ConfirmDelete customer={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="section-title">ฐานลูกค้า (CRM)</h1>
          <p className="section-subtitle">วิเคราะห์พฤติกรรมและประวัติการซื้อของลูกค้าทั้งหมด</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary"><Download size={16} />Export CSV</button>
          <button onClick={() => { setEditTarget(null); setShowModal(true); }} className="btn-primary"><Plus size={16} />เพิ่มลูกค้า</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'ลูกค้า VIP', value: `${vipCount} คน`, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'อัตราซื้อซ้ำ', value: `${repeatRate}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'ยอดการซื้อรวม', value: `฿${totalRevenue.toLocaleString()}`, icon: ShoppingBag, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        ].map((s, i) => (
          <div key={i} className="stat-card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.bg}`}><s.icon size={22} className={s.color} /></div>
            <div><p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{s.label}</p><p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden border border-gray-100 dark:border-gray-800">
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center gap-3 bg-white/50 dark:bg-gray-800/30">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, เบอร์, อีเมล..." className="input-field pl-9 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            {['all', 'VIP', 'NEW', 'LOYAL', 'REGULAR'].map(tag => (
              <button key={tag} onClick={() => setFilterTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterTag === tag ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {tag === 'all' ? 'ทั้งหมด' : tag}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ลูกค้า</th>
                <th>ข้อมูลติดต่อ</th>
                <th>ยอดใช้จ่าย</th>
                <th>ออเดอร์</th>
                <th>Tags</th>
                <th className="text-right">แอคชั่น</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="skeleton h-5 w-full" /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 opacity-30" /><p>ไม่พบลูกค้าที่ค้นหา</p>
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <CustomerAvatar name={c.name} />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.order_count > 5 ? 'ลูกค้าประจำ' : c.order_count > 1 ? 'ลูกค้ากลับมาซื้อซ้ำ' : 'ลูกค้าใหม่'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><Phone size={12} />{c.phone}</div>
                      {c.email && <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><Mail size={12} />{c.email}</div>}
                    </div>
                  </td>
                  <td><span className="font-bold text-emerald-600 dark:text-emerald-400">฿{Number(c.total_spent || 0).toLocaleString()}</span></td>
                  <td><span className="font-semibold text-gray-700 dark:text-gray-300">{c.order_count || 0} ครั้ง</span></td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {(c.tags || []).map(tag => (
                        <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TAG_STYLES[tag] || TAG_STYLES.REGULAR}`}>{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditTarget(c); setShowModal(true); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(c)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          <span className="text-xs text-gray-500">รวม {customers.length} คน | แสดง {filtered.length} คน</span>
        </div>
      </div>
    </div>
  );
}
