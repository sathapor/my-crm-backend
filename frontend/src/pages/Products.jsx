import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Edit2, Trash2, X, Save, AlertTriangle, RefreshCw, Tag, BarChart2 } from 'lucide-react';
import api from '../api';

const CATEGORIES = ['ทั้งหมด', 'ลิปสติก', 'รองพื้น', 'ตา', 'ผิว', 'ทั่วไป'];

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return <div className={`toast ${type === 'error' ? 'toast-error' : 'toast-success'}`}><span className="w-2 h-2 rounded-full bg-emerald-400" />{msg}</div>;
}

// ── Product Modal ─────────────────────────────────────────────
function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState(
    product
      ? { name: product.name, sku: product.sku, price: product.price, stock: product.stock, category: product.category || 'ทั่วไป', description: product.description || '', image_url: product.image_url || '' }
      : { name: '', sku: '', price: '', stock: '', category: 'ทั่วไป', description: '', image_url: '' }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku || form.price === '' || form.stock === '') { setErr('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
    setSaving(true);
    try {
      if (isEdit) await api.put(`/products/${product.id}`, form);
      else await api.post('/products', form);
      onSaved();
      onClose();
    } catch (e) { setErr('เกิดข้อผิดพลาด: ' + (e.response?.data?.error || e.message)); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-lg p-7" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">{isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition"><X size={18} /></button>
        </div>
        {err && <div className="mb-4 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">ชื่อสินค้า *</label>
              <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="เช่น ลิปสติกเนื้อแมท สีแดง" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">รหัส SKU *</label>
              <input className="input-field font-mono" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="LIP-001" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">หมวดหมู่</label>
              <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">ราคาขาย (฿) *</label>
              <input className="input-field" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">สต็อค (ชิ้น) *</label>
              <input className="input-field" type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">คำอธิบายสินค้า</label>
              <textarea className="input-field resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="รายละเอียดสินค้า..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">URL รูปภาพสินค้า</label>
              <input className="input-field" value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://example.com/product.jpg" />
              {form.image_url && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={form.image_url} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm" onError={e => { e.target.style.display='none'; }} />
                  <span className="text-xs text-gray-400">ตัวอย่างรูปภาพ</span>
                </div>
              )}
            </div>
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
function ConfirmDelete({ product, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-sm p-7 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-red-500" size={24} />
        </div>
        <h2 className="text-lg font-bold mb-2">ยืนยันการลบ</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">ต้องการลบ <span className="font-bold text-gray-900 dark:text-white">{product?.name}</span> ออกจากระบบ?</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">ยกเลิก</button>
          <button onClick={onConfirm} className="btn-danger flex-1 justify-center"><Trash2 size={15} />ลบออก</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ทั้งหมด');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: category !== 'ทั้งหมด' ? { category } : {} });
      setProducts(res.data.data);
    } catch { showToast('โหลดข้อมูลสินค้าไม่สำเร็จ', 'error'); }
    finally { setLoading(false); }
  }, [category]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
      showToast(`ลบ "${deleteTarget.name}" แล้ว`);
    } catch { showToast('ลบสินค้าไม่สำเร็จ', 'error'); }
    finally { setDeleteTarget(null); }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = products.filter(p => p.stock <= 5 && p.stock > 0).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  const getStockBadge = (stock) => {
    if (stock === 0) return <span className="badge badge-danger">สินค้าหมด</span>;
    if (stock <= 5) return <span className="badge badge-warning">ใกล้หมด ({stock})</span>;
    if (stock <= 15) return <span className="badge badge-info">{stock} ชิ้น</span>;
    return <span className="badge badge-success">{stock} ชิ้น</span>;
  };

  return (
    <div className="page-container">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />
      {showModal && <ProductModal product={editTarget} onClose={() => { setShowModal(false); setEditTarget(null); }} onSaved={() => { fetchProducts(); showToast(editTarget ? 'แก้ไขสินค้าสำเร็จ' : 'เพิ่มสินค้าใหม่แล้ว'); }} />}
      {deleteTarget && <ConfirmDelete product={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="section-title">คลังสินค้า</h1>
          <p className="section-subtitle">จัดการสินค้า ราคา และสต็อคคงเหลือทั้งหมด</p>
        </div>
        <button onClick={() => { setEditTarget(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> เพิ่มสินค้า
        </button>
      </div>

      {/* Alert Banners */}
      {(lowStock > 0 || outOfStock > 0) && (
        <div className="flex gap-3 flex-wrap">
          {outOfStock > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
              <AlertTriangle size={16} /> {outOfStock} รายการสินค้าหมด (Stock = 0)
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm font-medium">
              <BarChart2 size={16} /> {lowStock} รายการสต็อคใกล้หมด (≤5 ชิ้น)
            </div>
          )}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${category === cat ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}>
            <Tag size={10} className="inline mr-1" />{cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 flex items-center gap-3 bg-white/50 dark:bg-gray-800/30">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อหรือ SKU..." className="input-field pl-9 py-2 text-sm" />
          </div>
          <button onClick={fetchProducts} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>SKU</th>
                <th>หมวดหมู่</th>
                <th>ราคา</th>
                <th>สต็อค</th>
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
                  <Package size={32} className="mx-auto mb-2 opacity-30" /><p>ไม่พบสินค้าที่ค้นหา</p>
                </td></tr>
              ) : filtered.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {/* Product thumbnail */}
                      <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                        ) : null}
                        <Package size={18} className={`text-indigo-400 ${product.image_url ? 'hidden' : 'flex'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{product.name}</p>
                        {product.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{product.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td><span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md">{product.sku}</span></td>
                  <td><span className="badge badge-purple">{product.category || 'ทั่วไป'}</span></td>
                  <td><span className="font-bold text-gray-900 dark:text-white">฿{Number(product.price).toLocaleString()}</span></td>
                  <td>{getStockBadge(product.stock)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditTarget(product); setShowModal(true); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(product)}
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
          <span className="text-xs text-gray-500">รวม {products.length} รายการ | แสดง {filtered.length} รายการ</span>
        </div>
      </div>
    </div>
  );
}
