import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, ChevronDown, Check, MoreVertical, Plus, Minus, X, Share2,
  FileText, Smartphone, Send, Package, Truck, User, CreditCard,
  Star, Tag, Filter, RefreshCw, CheckCircle, Clock, Printer, ZoomIn,
  Bell, MessageSquare, ShoppingCart, ChevronRight, Trash2, AlertCircle,
  Image as ImageIcon, Loader2, Facebook, Smile, Mic, Gift, Paperclip
} from 'lucide-react';
import api from '../api';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper: แปลง imageUrl ให้ถูกต้องเสมอ ไม่ว่าจะเก็บเป็น relative หรือ absolute
// พิเศษ: หากรันบน localhost ให้บังคับใช้ localhost:5000 เสมอ เพื่อหลีกเลี่ยง LocalTunnel 503 Anti-Abuse Block
const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const EFFECTIVE_API_BASE = isLocal ? 'http://localhost:5000' : import.meta.env.VITE_API_URL || 'https://my-crm-api.onrender.com';

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http') && !imageUrl.includes('localhost')) return imageUrl; // full URL from external source
  
  // แกะเอาเฉพาะ part ของ /uploads/ หรือรูป
  const pathOnly = imageUrl.includes('/uploads/') ? imageUrl.substring(imageUrl.indexOf('/uploads/')) : imageUrl;
  
  if (pathOnly.startsWith('/')) return `${EFFECTIVE_API_BASE}${pathOnly}`;
  return `${EFFECTIVE_API_BASE}/uploads/${pathOnly}`;
};

// ─── Print helper ───────────────────────────────────────────────
const printAddressLabel = (customerInfo, shippingOption, currentOrder, storeName = 'OmniPage SaaS') => {
  const win = window.open('', '_blank', 'width=1000,height=800');
  if (!win) return alert('Pop-up ถูกบล็อก กรุณาอนุญาต Pop-up แล้วลองใหม่');
  
  const orderId = currentOrder?.order_id || 'OD' + Date.now().toString().slice(-6);
  const trackNo = `TH${Date.now().toString().slice(-8)}`;

  const labelHtml = `
    <div class="label" style="page-break-inside: avoid; background-color: white;">
      <div class="sender-header">
        <div class="sender-info">
          <strong>ผู้ส่ง</strong><br/>
          ${storeName}<br/>
          8/2 ซอยโชคชัยจงเจริญ<br/>
          ถนนพระรามสาม ยานนาวา<br/>
          ยานนาวา กรุงเทพมหานคร 10120
        </div>
        <div class="postage-box">
          <div style="font-size:10px;">ไปรษณีย์ไทย (e-commerce)</div>
          <div style="font-size:8px;">ใบอนุญาตพิเศษเลขที่ 1/2565</div>
          <div style="margin:5px 0;"><strong>มูลค่าสินค้า<br/>0 บาท</strong></div>
          <div style="font-size:8px;">(ไม่มีเก็บเงินปลายทาง)</div>
        </div>
      </div>
      
      <div class="barcode-section">
        <div class="barcode-title">EMS Tracking no.</div>
        <div class="barcode-val">${trackNo}</div>
        <svg class="barcode-svg" js-barcode-val="${trackNo}"></svg>
      </div>

      <div class="barcode-section">
        <div class="barcode-title">Invoice no.</div>
        <div class="barcode-val">INV-${orderId}</div>
        <svg class="barcode-svg" js-barcode-val="INV-${orderId}"></svg>
      </div>

      <div class="barcode-section">
        <div class="barcode-title">Internal Order no.</div>
        <div class="barcode-val">${orderId}</div>
        <svg class="barcode-svg" js-barcode-val="${orderId}"></svg>
      </div>

      <div class="receiver-section">
        <div class="receiver-title">กรุณาจัดส่งที่</div>
        <div class="receiver-name">${customerInfo.name || '-'}</div>
        <div class="receiver-addr">${customerInfo.address || '-'}</div>
        <div class="receiver-phone">โทร: ${customerInfo.phone || '-'}</div>
        <div style="font-size:8px; margin-top:10px; color:#666;">*หากไม่สามารถติดต่อผู้รับได้ กรุณาตีคืนสินค้ากลับที่พัสดุผู้ส่งด้วยนะครับ</div>
        <div class="order-badge">#${orderId.slice(-3)}</div>
      </div>
    </div>
  `;

  // Provide a robust HTML template similar to the working one in Orders.jsx
  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8" />
      <title>ใบปะหน้าพัสดุ</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Sarabun', sans-serif; }
        body { background: #525659; padding: 20px; text-align: center; display: block; overflow-y: auto; }
        .page { background: white; width: 297mm; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background-color: #ccc; margin: 0 auto 20px auto; border: 1px solid #aaa; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .label { padding: 30px; display: flex; flex-direction: column; position: relative; height: 100mm; text-align: left; background-color: white; }
        .label:not(:last-child) { border-right: 1px dashed #ccc; }
        .sender-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .sender-info { font-size: 11px; line-height: 1.5; color: #333; }
        .sender-info strong { font-size: 14px; }
        .postage-box { border: 1px solid #333; padding: 8px; text-align: center; font-size: 10px; width: 140px; height: 100px; display: flex; flex-direction: column; justify-content: center; }
        .barcode-section { margin-bottom: 15px; text-align: left; }
        .barcode-title { font-size: 10px; color: #666; }
        .barcode-val { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
        .barcode-svg { height: 40px; width: 100%; max-width: 180px; }
        .receiver-section { margin-top: auto; border-top: 2px solid #000; padding-top: 15px; position: relative; }
        .receiver-title { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
        .receiver-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .receiver-addr { font-size: 12px; line-height: 1.5; margin-bottom: 5px; }
        .receiver-phone { font-size: 12px; font-weight: bold; }
        .order-badge { position: absolute; top: 15px; right: 0; background: #000; color: #fff; font-size: 14px; font-weight: bold; padding: 4px 12px; }
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
      <div class="page">
        ${labelHtml}
        ${labelHtml}
        ${labelHtml}
      </div>
      <div class="no-print" style="position:fixed; bottom:30px; right:30px; z-index:100;">
        <button onclick="window.print()" style="background:#4f46e5;color:white;padding:12px 30px;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);">🖨️ พิมพ์ใบปะหน้า</button>
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

// ─── Status configs ─────────────────────────────────────────────
const ORDER_STATUS = {
  'รอชำระเงิน': { color: 'bg-amber-100 text-amber-700 border-amber-300', dot: 'bg-amber-500', label: 'รอโอนเงิน' },
  'ชำระแล้ว':   { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500', label: 'รับยอดแล้ว' },
  'จัดส่งแล้ว': { color: 'bg-blue-100 text-blue-700 border-blue-300', dot: 'bg-blue-500', label: 'จัดส่งแล้ว' },
  'ยกเลิก':     { color: 'bg-red-100 text-red-700 border-red-300', dot: 'bg-red-500', label: 'ยกเลิก' },
};

const SHIPPING_OPTIONS = [
  { id: 'ems', label: 'EMS', cost: 50 },
  { id: 'kerry', label: 'Kerry', cost: 40 },
  { id: 'flash', label: 'Flash', cost: 35 },
  { id: 'thaipost', label: 'ไปรษณีย์', cost: 30 },
];

// ─── Helper: format time ────────────────────────────────────────
const fmtTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'เพิ่งตอนนี้';
  if (diffMins < 60) return `${diffMins} นาที`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ชม.`;
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
};

// ─── Badge component ────────────────────────────────────────────
function OrderBadge({ status }) {
  const cfg = ORDER_STATUS[status];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Toast ──────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    if (msg) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }
  }, [msg]);
  if (!msg) return null;
  return (
    <div className={`fixed top-4 right-4 z-[999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-fade-in ${type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
      <CheckCircle size={16} /> {msg}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
export default function Chat() {
  // ─── State ────────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // preview รูปก่อนส่ง
  const fileInputRef = useRef(null);
  const [filter, setFilter] = useState('all');  // all | unread | starred | waiting
  const [searchLine, setSearchLine] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [imageErrors, setImageErrors] = useState({}); // เก็บสถานะรูปที่โหลดเสีย

  // Order panel
  const [activeTab, setActiveTab] = useState('items');
  const [cart, setCart] = useState([]);
  const [shippingOption, setShippingOption] = useState(SHIPPING_OPTIONS[0]);
  const [discount, setDiscount] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '', courier: '' });
  const [showProductDrawer, setShowProductDrawer] = useState(false);
  const [savingBill, setSavingBill] = useState(false);

  // === LINE Accounts ===
  const [lineAccounts, setLineAccounts] = useState([]);
  const [facebookAccounts, setFacebookAccounts] = useState([]);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('all');
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const messagesEndRef = useRef(null);
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // ─── Play notification sound ──────────────────────────────────
  const playPing = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (e) {
      console.warn('Could not play notification sound');
    }
  };

  // ─── Fetch all data ────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [chatsRes, ordersRes, prodsRes, lineRes, fbRes] = await Promise.all([
        api.get('/chats').catch(() => ({ data: { data: [] } })),
        api.get('/orders').catch(() => ({ data: { data: [] } })),
        api.get('/products').catch(() => ({ data: { data: [] } })),
        api.get('/line-accounts').catch(() => ({ data: { data: [] } })),
        api.get('/facebook-accounts').catch(() => ({ data: { data: [] } }))
      ]);
      const chats = chatsRes.data.data || [];
      setConversations(chats);
      setOrders(ordersRes.data.data || []);
      setProducts(prodsRes.data.data || []);
      setLineAccounts(lineRes.data.data || []);
      setFacebookAccounts(fbRes.data.data || []);

      if (chats.length > 0) {
        setActiveChat(prev => {
          if (!prev) return chats[0];
          const updated = chats.find(c => c.id === prev.id);
          return updated || prev;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // ── Initial Fetch ──
    fetchData();

    // ── Setup Sockets ──
    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsSocketConnected(true);
    });
    socket.on('disconnect', () => setIsSocketConnected(false));

    // ── Real-time: LINE/FB ส่งข้อความเข้า ──────────────────────────
    socket.on('conversation_updated', (updatedConv) => {
      if (!updatedConv?.id) return;
      console.log('📨 conversation_updated received for:', updatedConv.customer);
      
      playPing(); // เล่นเสียงแจ้งเตือนเมื่อมีข้อความเข้า!

      // อัปเดทรายการแชท
      setConversations(prev => {
        const exists = prev.find(c => c.id === updatedConv.id);
        if (exists) {
          return prev.map(c => c.id === updatedConv.id ? updatedConv : c)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }
        // ลูกค้าใหม่ที่ยังไม่เคยอยู่ในรายการ
        return [updatedConv, ...prev];
      });

      // อัปเดทหน้าจอแชทที่กำลังเปิดอยู่
      setActiveChat(prev => {
        if (prev?.id === updatedConv.id) return updatedConv;
        return prev;
      });
    });

    // Fallback: force_refresh -> fetch API ถ้าไม่ได้ข้อมูลเต็ม
    socket.on('force_refresh', () => fetchData(true));
    socket.on('new_message', () => fetchData(true));
    socket.on('chat_updated', () => fetchData(true));

    return () => {
      socket.disconnect();
    };
  }, [fetchData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  // ─── Find current order linked to active chat ──────────────────
  const currentOrder = activeChat
    ? orders.find(o => o.note && o.note.includes(`[ChatID: ${activeChat.id}]`))
    : null;

  // ─── When switching chat ───────────────────────────────────────
  useEffect(() => {
    if (!activeChat) return;
    if (currentOrder) {
      setCustomerInfo({
        name: currentOrder.customer_name || '',
        phone: currentOrder.note?.match(/Phone: ([\d-]+)/)?.[1] || '',
        address: currentOrder.address || '',
        courier: currentOrder.payment_method || '',
      });
      setActiveTab('status');
    } else {
      setCart([]);
      setDiscount(0);
      setShippingOption(SHIPPING_OPTIONS[0]);
      setCustomerInfo({ name: activeChat.customer || '', phone: '', address: '', courier: '' });
      setActiveTab('items');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat?.id]);

  // ─── Send message ──────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeChat) return;
    const text = inputText.trim();
    setInputText('');
    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    // Optimistic update: แสดงข้อความทันทีบนหน้าจอ ก่อน API ตอบกลับ
    const tempMsg = { text, type: 'sent', time };
    setActiveChat(c => ({ ...c, messages: [...(c.messages || []), tempMsg], last_message: text }));
    setConversations(prev => prev.map(c => c.id === activeChat.id
      ? { ...c, last_message: text, updated_at: new Date().toISOString() }
      : c));

    try {
      await api.post('/chats', { conversationId: activeChat.id, text, type: 'sent' });
      // socket 'conversation_updated' จะมาอัปเดต state ซ้ำอีกครั้งให้ถูกต้อง
    } catch {
      showToast('ไม่สามารถส่งข้อความได้', 'error');
      // rollback
      setActiveChat(c => ({ ...c, messages: (c.messages || []).filter(m => m !== tempMsg) }));
    }
  };

  // ─── Upload image / file ───────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target?.files?.[0] || e.files?.[0];
    if (!file || !activeChat) return;
    if (file.size > 10 * 1024 * 1024) return showToast('ขนาดไฟล์ต้องไม่เกิน 10MB', 'error');
    
    // แสดง preview ก่อนส่ง (เฉพาะรูปภาพ)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviewUrl(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreviewUrl(null);
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('conversationId', activeChat.id);

    try {
      const { data } = await api.post('/chats/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // OPTIMISTIC update
      const optimistic = [...(activeChat.messages || []), data.data];
      setActiveChat(c => ({ ...c, messages: optimistic, last_message: file.type.startsWith('image/') ? '[รูปภาพ]' : '[ไฟล์แนบ]' }));
      showToast(file.type.startsWith('image/') ? 'ส่งรูปภาพสำเร็จ ✓' : 'ส่งไฟล์สำเร็จ ✓');
    } catch (err) {
      showToast('ไม่สามารถอัปโหลดไฟล์ได้', 'error');
    } finally {
      setUploading(false);
      setImagePreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  // ─── Cart helpers ──────────────────────────────────────────────
  const addToCart = (prod) => {
    if (currentOrder) return;
    setCart(prev => {
      const exists = prev.find(i => i.id === prod.id);
      if (exists) return prev.map(i => i.id === prod.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...prod, qty: 1, note: '' }];
    });
    setProductSearch('');
    setShowProductDrawer(false);
  };
  const updateQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const cartSubtotal = cart.reduce((t, i) => t + i.price * i.qty, 0);
  const cartShipping = shipping => Number(shipping?.cost ?? shippingOption.cost);
  const cartTotal = cartSubtotal + cartShipping(shippingOption) - Number(discount || 0);

  // ─── Create bill & send ────────────────────────────────────────
  const handleSendBill = async () => {
    if (!activeChat || cart.length === 0) return showToast('กรุณาเพิ่มสินค้าก่อน', 'error');
    if (!customerInfo.name) return showToast('กรุณาระบุชื่อลูกค้าในแท็บ "จัดส่ง"', 'error');
    setSavingBill(true);
    try {
      const total = cartTotal > 0 ? cartTotal : 0;
      const itemsJson = JSON.stringify(cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, image_url: i.image_url })));
      
      await api.post('/orders', {
        customer_name: customerInfo.name,
        total_amount: total,
        payment_method: 'โอนเงินสลิป',
        status: 'รอชำระเงิน',
        address: customerInfo.address || 'รอระบุ',
        note: `[ChatID: ${activeChat.id}] Phone: ${customerInfo.phone || '-'} | ITEMS: ${itemsJson}`,
      });

      // Build bill message
      let bill = `🛍️ รายการสั่งซื้อ\n══════════════════\n`;
      cart.forEach((item, i) => {
        bill += `${i + 1}. ${item.name}\n   ${item.qty} x ฿${Number(item.price).toLocaleString()} = ฿${(item.qty * item.price).toLocaleString()}\n`;
      });
      bill += `══════════════════\n`;
      bill += `📦 ค่าส่ง (${shippingOption.label}): ฿${shippingOption.cost}\n`;
      if (Number(discount) > 0) bill += `🏷️ ส่วนลด: -฿${Number(discount).toLocaleString()}\n`;
      bill += `══════════════════\n`;
      bill += `💰 ยอดชำระสุทธิ: ฿${total.toLocaleString()}\n`;
      bill += `══════════════════\n`;
      bill += `📮 จัดส่งไปยัง:\n${customerInfo.name}${customerInfo.phone ? '\nโทร: ' + customerInfo.phone : ''}\n${customerInfo.address || 'รอระบุที่อยู่'}\n`;
      bill += `\n✅ กรุณาโอนเงินและส่งสลิปมาทางแชทนี้ครับ`;

      await api.post('/chats', { conversationId: activeChat.id, text: bill, type: 'sent' });
      showToast('ส่งบิลเรียบร้อย!');
      await fetchData(true);
      setActiveTab('status');
    } catch (err) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setSavingBill(false);
    }
  };

  // ─── Update order status ───────────────────────────────────────
  const handleUpdateOrderStatus = async (newStatus) => {
    if (!currentOrder) return;
    try {
      await api.put(`/orders/${currentOrder.id}`, { status: newStatus });
      let msg = '';
      if (newStatus === 'ชำระแล้ว') msg = `✅ ยืนยันรับเงินเรียบร้อยแล้วครับ\nกำลังเตรียมจัดส่งสินค้าให้ท่าน รอรับพัสดุได้เลยครับ!`;
      if (newStatus === 'จัดส่งแล้ว') msg = `🚚 จัดส่งพัสดุแล้ว\nขนส่ง: ${shippingOption.label}\nสามารถติดตามสถานะพัสดุผ่านเว็บไซต์ขนส่งได้เลยครับ!`;
      if (msg) await api.post('/chats', { conversationId: activeChat.id, text: msg, type: 'sent' });
      showToast(`อัปเดตสถานะ: ${newStatus}`);
      await fetchData(true);
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  // ─── Filter conversations ──────────────────────────────────────
  const findOrderByChat = (chatId) => orders.find(o => o.note?.includes(`[ChatID: ${chatId}]`));

  const filteredConversations = conversations.filter(c => {
    const order = findOrderByChat(c.id);
    const matchSearch = !searchLine || c.customer?.toLowerCase().includes(searchLine.toLowerCase()) || c.last_message?.toLowerCase().includes(searchLine.toLowerCase());
    if (!matchSearch) return false;

    // Channel/Store Filter
    if (selectedAccountFilter === 'facebook') {
      if (c.channel !== 'facebook') return false;
    } else if (selectedAccountFilter !== 'all') {
      if (selectedAccountFilter === 'default' && (c.line_account_id || c.facebook_account_id)) return false;
      if (selectedAccountFilter !== 'default' && c.line_account_id !== selectedAccountFilter && c.facebook_account_id !== selectedAccountFilter) return false;
    }

    if (filter === 'waiting') return order?.status === 'รอชำระเงิน';
    if (filter === 'starred') return c.is_vip;
    return true;
  });

  const unreadCount = conversations.filter(c => findOrderByChat(c.id)?.status === 'รอชำระเงิน').length;
  const filteredProducts = products.filter(p => !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase()));

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="h-[calc(100vh-100px)] flex font-sans text-gray-800 overflow-hidden border-t border-gray-200 bg-[#f0f2f5]">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />

      {/* ═══════════════════════════════════
          LEFT: Inbox sidebar
         ═══════════════════════════════════ */}
      <div className="w-[300px] bg-white border-r border-gray-200 flex flex-col shrink-0">

        {/* Inbox header */}
        <div className="px-3 pt-3 pb-2 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="font-extrabold text-gray-900 text-base tracking-tight">กล่องข้อความ</h2>
            <div className="flex items-center gap-1">
              <button onClick={() => fetchData(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"><RefreshCw size={14} /></button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
            <input
              type="text" value={searchLine} onChange={e => setSearchLine(e.target.value)}
              placeholder="ค้นหา..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Store/Channel Filter Dropdown */}
          <div className="mb-2">
            <select
              value={selectedAccountFilter}
              onChange={(e) => setSelectedAccountFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none"
            >
              <option value="all">รวมทุกช่องทาง</option>
              <optgroup label="🟢 LINE Official Account">
                {lineAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </optgroup>
              <optgroup label="🔵 Facebook Page">
                {facebookAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
                <option value="facebook">ทุก Facebook Page</option>
              </optgroup>
              <option value="default">ร้านทั่วไป (ไม่ได้ระบุ)</option>
            </select>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {[
              { key: 'all', label: 'ทั้งหมด', count: conversations.length },
              { key: 'waiting', label: 'รอโอน', count: unreadCount },
              { key: 'starred', label: 'VIP', count: conversations.filter(c => c.is_vip).length },
            ].map(({ key, label, count }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${filter === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label} {count > 0 && <span className={`${filter === key ? 'bg-white/30' : 'bg-gray-300'} text-[10px] px-1 rounded-full ml-0.5`}>{count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-xs">ไม่พบข้อความ</div>
          ) : (
            filteredConversations.map(chat => {
              const order = findOrderByChat(chat.id);
              const isActive = activeChat?.id === chat.id;
              return (
                <div key={chat.id} onClick={() => setActiveChat(chat)}
                  className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition relative ${isActive ? 'bg-indigo-50/60 border-l-2 border-l-indigo-500' : ''}`}>
                  
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {chat.avatar && chat.avatar.startsWith('http') ? (
                      <img src={chat.avatar} alt="avatar" className="w-11 h-11 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        chat.channel === 'facebook'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                          : 'bg-gradient-to-br from-violet-500 to-indigo-600'
                      }`}>
                        {chat.customer?.substring(0, 2)?.toUpperCase() || 'C'}
                      </div>
                    )}
                    {/* Channel badge */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 border-2 border-white rounded-full flex items-center justify-center ${
                      chat.channel === 'facebook' ? 'bg-[#1877F2]' : 'bg-[#06C755]'
                    }`}>
                      {chat.channel === 'facebook'
                        ? <Facebook size={8} className="text-white" />
                        : <Smartphone size={8} className="text-white" />}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs text-gray-900 truncate max-w-[120px]">{chat.customer || 'ลูกค้า'}</span>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] text-gray-400 mb-1">{fmtTime(chat.updated_at)}</span>
                        {/* Green Dot on Right (Waiting for payment / New) */}
                        {order?.status === 'รอชำระเงิน' && (
                          <div className="w-3 h-3 bg-[#00C853] rounded-full shadow-sm animate-pulse" />
                        )}
                      </div>
                    </div>
                    {/* Store/Channel Name Badge */}
                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mb-1 ${
                      chat.channel === 'facebook'
                        ? 'text-[#1877F2] bg-[#1877F2]/10'
                        : 'text-[#00B900] bg-[#00B900]/10'
                    }`}>
                      {chat.channel === 'facebook'
                        ? (facebookAccounts.find(a => a.id === chat.facebook_account_id)?.name || '🔵 Facebook')
                        : (lineAccounts.find(a => a.id === chat.line_account_id)?.name || 'ร้านทั่วไป (Default)')}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate mb-1">{chat.last_message || 'เริ่มการสนทนา'}</div>
                    {order && <OrderBadge status={order.status} />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════
          MIDDLE: Chat area
         ═══════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {activeChat ? (
          <>
            {/* Chat header */}
            <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {activeChat.avatar?.startsWith('http') ? (
                    <img src={activeChat.avatar} className="w-9 h-9 rounded-full border border-gray-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {activeChat.customer?.substring(0, 2)?.toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#06C755] border-2 border-white rounded-full" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm leading-tight">{activeChat.customer}</p>
                  <p className="text-[10px] text-[#06C755] font-semibold flex items-center gap-1">
                    {lineAccounts.find(a => a.id === activeChat.line_account_id)?.name || 'ร้านทั่วไป (Default)'}
                    <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} title={isSocketConnected ? 'Connected' : 'Disconnected'} />
                  </p>
                </div>
                {currentOrder && <OrderBadge status={currentOrder.status} />}
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex flex-col items-end mr-2">
                  <span className={`text-[9px] font-bold ${isSocketConnected ? 'text-green-500' : 'text-red-500'}`}>
                    {isSocketConnected ? 'LIVE' : 'OFFLINE'}
                  </span>
                </div>
                <button onClick={() => fetchData(true)} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><RefreshCw size={15} /></button>
              </div>
            </div>


            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#efeae2] space-y-3" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4c8b8\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2L40 38v-2zm0 4L80 0v2L42 40h-2zm4 0L80 4v2L46 40h-2zm4 0L80 8v2L50 40h-2zm4 0L80 12v2L54 40h-2zm4 0L80 16v2L58 40h-2zm4 0L80 20v2L62 40h-2zm4 0L80 24v2L66 40h-2zm4 0L80 28v2L70 40h-2zm4 0L80 32v2L74 40h-2zm4 0L80 36v2L78 40h-2zm4 0L80 40v0h-2z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}>
              
              {/* Date divider */}
              <div className="flex items-center justify-center">
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold px-3 py-0.5 rounded-full shadow-sm">
                  วันนี้
                </div>
              </div>

              {(activeChat.messages || []).map((msg, idx) => {
                const isSent = msg.type === 'sent';
                return (
                  <div key={idx} className={`flex items-end gap-2 ${isSent ? 'justify-end' : 'justify-start'}`}>
                    {/* Received avatar */}
                    {!isSent && (
                      <div className="shrink-0 mb-1">
                        {activeChat.avatar?.startsWith('http') ? (
                          <img src={activeChat.avatar} className="w-7 h-7 rounded-full border border-gray-200" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {activeChat.customer?.substring(0, 1)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`group max-w-[70%] flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
                      {msg.imageUrl ? (
                        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 mt-1 cursor-pointer"
                          onClick={() => window.open(resolveImageUrl(msg.imageUrl), '_blank')}>
                          {imageErrors[msg.imageUrl] ? (
                             <div className="px-4 py-8 text-xs text-gray-400 bg-gray-50 flex flex-col items-center gap-2">
                               <ImageIcon size={20} />
                               <span>ไม่สามารถโหลดรูปได้</span>
                             </div>
                          ) : (
                            <img
                              src={resolveImageUrl(msg.imageUrl)}
                              alt="รูปภาพ"
                              className="max-w-[240px] max-h-[320px] object-cover"
                              onError={() => setImageErrors(prev => ({ ...prev, [msg.imageUrl]: true }))}
                            />
                          )}
                        </div>
                      ) : msg.fileUrl ? (
                        <a
                          href={resolveImageUrl(msg.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-sm border text-sm font-semibold hover:opacity-80 transition ${
                            isSent ? 'bg-[#d9fdd3] border-green-200 text-gray-800 rounded-br-sm' : 'bg-white border-gray-200 text-gray-800 rounded-bl-sm'
                          }`}
                        >
                          <FileText size={18} className="shrink-0 text-[#1877F2]" />
                          <span className="truncate max-w-[160px]">{msg.fileName || 'ไฟล์แนบ'}</span>
                        </a>
                      ) : (
                        <div className={`px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                          isSent
                            ? 'bg-[#d9fdd3] text-gray-800 rounded-2xl rounded-br-sm'
                            : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100'
                        }`}>
                          {msg.text}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition">
                        <span className="text-[10px] text-gray-400">{msg.time}</span>
                        {isSent && <Check size={12} className="text-blue-500" />}
                      </div>
                    </div>

                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area — Messenger style */}
            <div className="bg-white border-t border-gray-200 shrink-0">
              {/* Image preview before send */}
              {imagePreviewUrl && !uploading && (
                <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                  <div className="relative inline-block">
                    <img
                      src={imagePreviewUrl}
                      className="h-20 rounded-xl object-cover border border-gray-200 shadow-sm"
                      alt="preview"
                    />
                    <button
                      onClick={() => { setImagePreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              )}

              {/* Icon toolbar */}
              <div className="flex items-center gap-1 px-2 pt-1">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" hidden id="chat-file-input" />
                {/* Image upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-blue-50 text-[#1877F2] transition"
                  title="รูปภาพ / วิดีโอ"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                </button>
                {/* File attachment */}
                <button
                  onClick={() => { const el = document.createElement('input'); el.type='file'; el.onchange = handleFileUpload; el.click(); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 transition"
                  title="แนบไฟล์"
                >
                  <Paperclip size={18} />
                </button>
                {/* GIF/Sticker */}
                <button
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 transition"
                  title="GIF"
                >
                  <Gift size={18} />
                </button>
              </div>

              {/* Text input row */}
              <div className="flex items-end gap-2 px-3 pb-3 pt-1">
                <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 border border-gray-200 focus-within:border-[#1877F2] focus-within:bg-white transition">
                  <textarea
                    rows={1}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    className="w-full bg-transparent text-sm focus:outline-none resize-none max-h-24 leading-5"
                    placeholder="Aa"
                    style={{ height: 'auto', minHeight: '20px' }}
                  />
                </div>
                {/* Emoji */}
                <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-yellow-50 text-yellow-500 transition shrink-0" title="อิโมจิ">
                  <Smile size={20} />
                </button>
                {/* Send or Mic */}
                {inputText.trim() || uploading ? (
                  <button
                    onClick={handleSendMessage}
                    disabled={uploading}
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition shadow-sm bg-[#1877F2] hover:bg-blue-700 text-white">
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  </button>
                ) : (
                  <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 transition shrink-0" title="ส่งเสียง">
                    <Mic size={20} />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#efeae2] text-gray-500">
            <div className="w-20 h-20 bg-white/60 rounded-full flex items-center justify-center mb-4 shadow">
              <MessageSquare size={36} className="text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-600">เลือกบทสนทนา</p>
            <p className="text-xs mt-1 text-gray-400">เลือกลูกค้าจากรายการซ้ายเพื่อเริ่มการสนทนา</p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════
          RIGHT: Order panel (Page365-style)
         ═══════════════════════════════════ */}
      <div className={`w-[380px] shrink-0 border-l border-gray-200 flex flex-col bg-white transition-opacity ${!activeChat ? 'opacity-50 pointer-events-none' : ''}`}>

        {/* Order pipeline indicator */}
        <div className="bg-white border-b border-gray-200 px-4 py-2.5 shrink-0">
          <div className="flex items-center justify-between">
            {/* Step indicators */}
            {[
              { label: 'แชท', active: !currentOrder, done: !!currentOrder },
              { label: 'รอโอน', active: currentOrder?.status === 'รอชำระเงิน', done: ['ชำระแล้ว', 'จัดส่งแล้ว'].includes(currentOrder?.status) },
              { label: 'ชำระแล้ว', active: currentOrder?.status === 'ชำระแล้ว', done: currentOrder?.status === 'จัดส่งแล้ว' },
              { label: 'จัดส่งแล้ว', active: currentOrder?.status === 'จัดส่งแล้ว', done: false },
            ].map((step, i, arr) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition ${
                    step.done ? 'bg-emerald-500 border-emerald-500 text-white' :
                    step.active ? 'bg-indigo-600 border-indigo-600 text-white' :
                    'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {step.done ? <Check size={12} /> : i + 1}
                  </div>
                  <span className={`text-[9px] font-semibold mt-0.5 whitespace-nowrap ${step.active ? 'text-indigo-600' : step.done ? 'text-emerald-500' : 'text-gray-400'}`}>{step.label}</span>
                </div>
                {i < arr.length - 1 && <div className={`flex-1 h-[2px] mx-1 mb-3 rounded ${step.done ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-b border-gray-200 shrink-0">
          {[
            { key: 'items', icon: <ShoppingCart size={14} />, label: 'สินค้า' },
            { key: 'customer', icon: <User size={14} />, label: 'ที่อยู่' },
            { key: 'status', icon: <CreditCard size={14} />, label: 'สถานะ' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold transition border-b-2 ${activeTab === tab.key ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">

          {/* ─── TAB: ITEMS ─── */}
          {activeTab === 'items' && (
            <div className="p-3 space-y-2">
              {currentOrder && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-700 font-semibold flex items-center gap-2">
                  <AlertCircle size={14} /> บิลถูกส่งแล้ว ไม่สามารถแก้ไขสินค้าได้
                </div>
              )}

              {/* Cart items */}
              {currentOrder ? (
                <div className="space-y-2">
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center mb-3">
                    <p className="text-xs text-gray-500 mb-1">รหัสออเดอร์</p>
                    <p className="font-black text-indigo-600 text-lg">{currentOrder.order_id}</p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">ยอดรวมสุทธิ</p>
                      <p className="text-2xl font-black text-gray-900">฿{Number(currentOrder.total_amount).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* List of items in currentOrder */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase">สินค้าในออเดอร์</div>
                    {(() => {
                      try {
                        const match = currentOrder.note?.match(/ITEMS: (\[.*\])/);
                        if (!match) return <div className="p-4 text-center text-xs text-gray-400">ไม่พบรายการสินค้า</div>;
                        const items = JSON.parse(match[1]);
                        return items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2.5 border-b border-gray-50 last:border-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              ) : <Package size={18} className="text-gray-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                              <p className="text-[10px] text-gray-400">฿{Number(item.price).toLocaleString()} x {item.qty}</p>
                            </div>
                          </div>
                        ));
                      } catch { return <div className="p-4 text-center text-xs text-gray-400">ไม่พบรายการสินค้า</div>; }
                    })()}
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-gray-400">
                  <ShoppingCart size={36} className="mb-2 opacity-40" />
                  <p className="text-sm font-medium">ยังไม่มีสินค้า</p>
                  <p className="text-xs mt-1">กดปุ่ม + เพื่อเพิ่มสินค้า</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl shadow-sm group relative overflow-hidden">
                    <div className="flex items-stretch">
                      {/* Product Image - Page365 style */}
                      <div className="w-16 h-16 shrink-0 bg-gray-100 overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = ''; e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-indigo-50"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'#a5b4fc\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z\'></path></svg></div>'; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
                            <Package size={22} className="text-indigo-300" />
                          </div>
                        )}
                      </div>

                      {/* Info + Controls */}
                      <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-800 truncate leading-tight">{item.name}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          {/* Qty controls */}
                          <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-1.5 py-0.5 border border-gray-200">
                            <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-100 text-gray-500 hover:text-red-500 transition"><Minus size={10}/></button>
                            <span className="w-5 text-center text-xs font-black text-gray-800">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-green-100 text-gray-500 hover:text-green-600 transition"><Plus size={10}/></button>
                          </div>
                          {/* Price */}
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400">฿{Number(item.price).toLocaleString()} x {item.qty}</p>
                            <p className="text-xs font-black text-indigo-700">฿{(item.price * item.qty).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Delete */}
                    <button onClick={() => removeItem(item.id)} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center bg-white/80 border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 transition shadow-sm">
                      <X size={10} />
                    </button>
                  </div>
                ))
              )}

              {/* Add product button */}
              {!currentOrder && (
                <button onClick={() => setShowProductDrawer(true)}
                  className="w-full py-2.5 border-2 border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition">
                  <Plus size={16} /> ค้นหาและเพิ่มสินค้า
                </button>
              )}
            </div>
          )}

          {/* ─── TAB: CUSTOMER INFO ─── */}
          {activeTab === 'customer' && (
            <div className="p-3 space-y-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">ข้อมูลผู้รับ</h3>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">ชื่อ-นามสกุล ผู้รับ *</label>
                  <input type="text" value={customerInfo.name} onChange={e => setCustomerInfo(c => ({ ...c, name: e.target.value }))} disabled={!!currentOrder}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${currentOrder ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-300'}`}
                    placeholder="สมชาย ใจดี" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">เบอร์ติดต่อ</label>
                  <input type="text" value={customerInfo.phone} onChange={e => setCustomerInfo(c => ({ ...c, phone: e.target.value }))} disabled={!!currentOrder}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${currentOrder ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-300'}`}
                    placeholder="081-234-5678" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">ที่อยู่จัดส่ง</label>
                  <textarea rows="3" value={customerInfo.address} onChange={e => setCustomerInfo(c => ({ ...c, address: e.target.value }))} disabled={!!currentOrder}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none ${currentOrder ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-300'}`}
                    placeholder="บ้านเลขที่ / ซอย / ถนน / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์" />
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">ขนส่ง</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SHIPPING_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => !currentOrder && setShippingOption(opt)} disabled={!!currentOrder}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition text-left ${shippingOption.id === opt.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'} ${currentOrder ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="font-extrabold">{opt.label}</div>
                      <div className={`${shippingOption.id === opt.id ? 'text-indigo-200' : 'text-gray-400'}`}>฿{opt.cost}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Print Address Button */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">พิมพ์ / Export</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => printAddressLabel(customerInfo, shippingOption, currentOrder)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition active:scale-[0.97]"
                  >
                    <Printer size={14} /> พิมพ์ที่อยู่ (Label)
                  </button>
                  <button
                    onClick={() => printAddressLabel(customerInfo, shippingOption, currentOrder)}
                    className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100 text-xs font-bold rounded-lg transition"
                  >
                    <FileText size={14} /> PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: STATUS ─── */}
          {activeTab === 'status' && (
            <div className="p-3 space-y-3">
              {currentOrder ? (
                <>
                  {/* Order info card */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">รหัสออเดอร์</p>
                        <p className="text-base font-black text-gray-900">{currentOrder.order_id}</p>
                      </div>
                      <OrderBadge status={currentOrder.status} />
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">ยอดชำระ</span>
                      <span className="text-xl font-black text-indigo-600">฿{Number(currentOrder.total_amount).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">{currentOrder.address}</div>
                  </div>

                  {/* Packing List - Items with images */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                      <span className="text-[10px] font-black text-indigo-700 uppercase">เตรียมของแพ็คส่ง / Items to pack</span>
                      <Package size={12} className="text-indigo-600" />
                    </div>
                    <div className="divide-y divide-gray-50">
                      {(() => {
                        try {
                          const match = currentOrder.note?.match(/ITEMS: (\[.*\])/);
                          if (!match) return <div className="p-6 text-center text-xs text-gray-400">รอดึงข้อมูลสินค้า...</div>;
                          const items = JSON.parse(match[1]);
                          return items.map((item, idx) => (
                            <div key={idx} className="p-3 flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl border border-gray-200 overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : <Package size={20} className="text-gray-300" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-gray-900 leading-tight mb-0.5">{item.name}</p>
                                <p className="text-[11px] text-gray-500">จำนวน: <span className="text-indigo-600 font-black">{item.qty} ชิ้น</span></p>
                              </div>
                              <div className="w-6 h-6 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-200 shrink-0">
                                <Check size={14} />
                              </div>
                            </div>
                          ));
                        } catch { return <div className="p-6 text-center text-xs text-gray-400">รอดึงข้อมูลสินค้า...</div>; }
                      })()}
                    </div>
                  </div>

                  {/* Action cards */}
                  {currentOrder.status === 'รอชำระเงิน' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
                          <Clock size={16} className="text-amber-700" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-amber-800">รอการโอนเงิน</p>
                          <p className="text-[11px] text-amber-600">รอลูกค้าส่งสลิป</p>
                        </div>
                      </div>
                      <button onClick={() => handleUpdateOrderStatus('ชำระแล้ว')}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-lg shadow transition flex items-center justify-center gap-2">
                        <CheckCircle size={16} /> ยืนยันรับเงิน / รับสลิปแล้ว
                      </button>
                    </div>
                  )}

                  {currentOrder.status === 'ชำระแล้ว' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center">
                          <CheckCircle size={16} className="text-emerald-700" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-emerald-800">รับเงินแล้ว</p>
                          <p className="text-[11px] text-emerald-600">พร้อมแพ็คและจัดส่ง</p>
                        </div>
                      </div>

                      {/* Shipping selector for dispatch */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {SHIPPING_OPTIONS.map(opt => (
                          <button key={opt.id} onClick={() => setShippingOption(opt)}
                            className={`py-1.5 text-xs font-bold rounded-lg border ${shippingOption.id === opt.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <button onClick={() => handleUpdateOrderStatus('จัดส่งแล้ว')}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-lg shadow transition flex items-center justify-center gap-2">
                        <Truck size={16} /> จัดส่งพัสดุแล้ว / แจ้งลูกค้า
                      </button>
                    </div>
                  )}

                  {currentOrder.status === 'จัดส่งแล้ว' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center mx-auto mb-2">
                        <Truck size={20} className="text-blue-700" />
                      </div>
                      <p className="font-black text-blue-800">ปิดออเดอร์เรียบร้อย</p>
                      <p className="text-xs text-blue-600 mt-1">สินค้าถูกจัดส่งแล้ว</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <FileText size={24} className="text-gray-300" />
                  </div>
                  <p className="font-bold text-gray-700 text-sm">ยังไม่มีออเดอร์</p>
                  <p className="text-xs text-gray-400 mt-1">เพิ่มสินค้าในแท็บ "สินค้า" แล้วกดส่งบิล</p>
                  <button onClick={() => setActiveTab('items')} className="mt-3 text-indigo-600 text-xs font-bold hover:underline">ไปที่แท็บสินค้า →</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        {!currentOrder && (
          <div className="bg-white border-t border-gray-200 p-3 shrink-0 shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.1)]">
            {/* Summary */}
            <div className="flex justify-between text-xs text-gray-600 mb-2 px-1">
              <span>{cart.reduce((t, i) => t + i.qty, 0)} ชิ้น | ค่าส่ง: ฿{shippingOption.cost}</span>
              {Number(discount) > 0 && <span className="text-red-500">ลด: -฿{discount}</span>}
            </div>
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-sm font-bold text-gray-700">ยอดสุทธิ</span>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-black text-emerald-600">{cartTotal.toLocaleString()}</span>
                <span className="text-xs text-gray-400 font-normal mb-0.5">฿</span>
              </div>
            </div>

            {/* Discount input */}
            <div className="flex items-center gap-2 mb-2.5">
              <label className="text-xs text-gray-500 whitespace-nowrap">ส่วนลด (฿)</label>
              <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} min="0"
                className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-red-400 text-right" />
            </div>

            <button
              onClick={handleSendBill}
              disabled={savingBill || cart.length === 0}
              className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98] ${cart.length === 0 ? 'bg-gray-200 text-gray-400' : 'bg-[#1bb394] hover:bg-[#18a689] text-white'}`}>
              {savingBill ? (
                <><RefreshCw size={15} className="animate-spin" /> กำลังส่งบิล...</>
              ) : (
                <><Share2 size={16} /> ส่งบิล / เปิดบิลชำระเงิน</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════
          PRODUCT DRAWER
         ═══════════════════════════════ */}
      {showProductDrawer && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowProductDrawer(false)}>
          <div className="flex-1" />
          <div
            className="w-[380px] bg-white h-full shadow-2xl flex flex-col border-l border-gray-200 animate-slide-in-right"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-extrabold text-gray-800">เลือกสินค้า</h3>
              <button onClick={() => setShowProductDrawer(false)} className="p-1.5 rounded-lg hover:bg-gray-200 transition"><X size={16} /></button>
            </div>
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  placeholder="ค้นหาชื่อสินค้า / รหัส SKU..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">ไม่พบสินค้า</div>
              ) : (
                filteredProducts.map(p => {
                  const inCart = cart.find(i => i.id === p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition group">
                      {/* Product thumbnail with real image */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ display: p.image_url ? 'none' : 'flex' }}
                        >
                          <Package size={22} className="text-indigo-300" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-800 truncate">{p.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{p.sku}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-black text-indigo-600">฿{Number(p.price).toLocaleString()}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            p.stock > 10 ? 'bg-emerald-100 text-emerald-700' :
                            p.stock > 0 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {p.stock > 0 ? `คงเหลือ ${p.stock}` : 'หมด'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(p)}
                        disabled={p.stock === 0}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition font-bold ${
                          inCart ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' :
                          p.stock === 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' :
                          'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        }`}>
                        {inCart ? <Check size={14} /> : <Plus size={16} />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
