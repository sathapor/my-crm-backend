import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Store, Bell, Shield, Wallet, PaintBucket, Save, CheckSquare, Check, MessageCircle, Copy, Plus, Trash2, Facebook, Zap, Edit3, Terminal, ShoppingCart, CreditCard, MessageSquare } from 'lucide-react';
import api from '../api';

// Toast component
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="fixed top-6 right-6 z-50 animate-fade-in bg-gray-900 dark:bg-gray-700 text-white px-5 py-3 rounded-xl shadow-xl font-medium text-sm flex items-center gap-2">
      <Check size={16} className="text-green-400" /> {msg}
    </div>
  );
}

// Toggle Switch component
function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group py-1">
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-brand-DEFAULT transition-colors">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 ${checked ? 'bg-brand-DEFAULT shadow-lg shadow-brand-DEFAULT/30' : 'bg-gray-400/80 dark:bg-gray-600 ring-2 ring-gray-200 dark:ring-gray-700'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${checked ? 'translate-x-6 scale-110' : 'translate-x-1 scale-100'}`} />
      </div>
    </label>
  );
}

// Facebook Page Selector — Mimics Facebook OAuth Dialog
function FbPageSelector({ pages, connectedAccounts, connectingPageId, onConnect, onClose }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(pages.filter(p => !connectedAccounts.some(a => a.page_id === p.id)).map(p => p.id)));

  const toggle = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleContinue = async () => {
    const toConnect = pages.filter(p => selectedIds.has(p.id) && !connectedAccounts.some(a => a.page_id === p.id));
    for (const page of toConnect) {
      await onConnect(page);
    }
  };

  const isProcessing = !!connectingPageId;

  return (
    <div className="rounded-2xl border border-gray-200 shadow-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center">
            <Facebook size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">เลือกเพจที่คุณต้องการให้ ขขขข เข้าถึง</p>
            <p className="text-xs text-gray-400">คุณสามารถตรวจสอบสิ่งที่ ขขขข จะสามารถดำเนินการกับเพจที่คุณเลือกได้ในภายหลัง</p>
          </div>
        </div>

        {/* Select current/future radio style */}
        <div className="mt-3 space-y-2">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-[#1877F2] bg-blue-50 cursor-pointer">
            <div className="w-4 h-4 rounded-full border-2 border-[#1877F2] bg-[#1877F2] flex items-center justify-center mt-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">เลือกใช้เพจปัจจุบันเท่านั้น</p>
              <p className="text-xs text-gray-500">การตั้งค่านี้จะมอบสิทธิ์การเข้าถึงเฉพาะเพจที่คุณเลือก ขขขข เท่านั้น</p>
            </div>
          </label>
        </div>
      </div>

      {/* Page list */}
      <div className="px-5 py-3 space-y-1 max-h-72 overflow-y-auto">
        <label className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">เลือกทั้งหมด</span>
          <span className="text-xs text-gray-400">เลือกสินทรัพย์แล้ว {selectedIds.size} รายการ</span>
        </label>

        {pages.map(page => {
          const alreadyConnected = connectedAccounts.some(a => a.page_id === page.id);
          const checked = alreadyConnected || selectedIds.has(page.id);
          return (
            <label
              key={page.id}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${checked ? 'bg-blue-50' : 'hover:bg-gray-50'} ${alreadyConnected ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={() => !alreadyConnected && toggle(page.id)}
            >
              {/* Checkbox */}
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${checked ? 'border-[#1877F2] bg-[#1877F2]' : 'border-gray-300 bg-white'}`}>
                {checked && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>

              {/* Page avatar */}
              <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                <Facebook size={18} className="text-[#1877F2]" />
              </div>

              {/* Page info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{page.name}</p>
                <p className="text-xs text-gray-400 font-mono">{page.id}</p>
              </div>

              {alreadyConnected && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">✓ เชื่อมต่อแล้ว</span>
              )}
            </label>
          );
        })}
      </div>

      {/* Footer Buttons */}
      <div className="px-5 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50">
        <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 border border-gray-300 rounded-full hover:bg-gray-100 transition">
          ย้อนกลับ
        </button>
        <button
          onClick={handleContinue}
          disabled={isProcessing || selectedIds.size === 0}
          className="px-6 py-2.5 text-sm font-bold text-white bg-[#1877F2] hover:bg-blue-700 rounded-full transition disabled:opacity-60 flex items-center gap-2 shadow-md shadow-blue-500/20"
        >
          {isProcessing
            ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> กำลังเชื่อมต่อ...</>
            : 'ดำเนินการต่อ'}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('store');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // LINE accounts state
  const [lineAccounts, setLineAccounts] = useState([]);
  const [newLineAccount, setNewLineAccount] = useState({ name: '', channel_secret: '', access_token: '', picture_url: '' });
  const [isAddingLine, setIsAddingLine] = useState(false);

  useEffect(() => {
    if (activeTab === 'line_oa') {
      fetchLineAccounts();
    }
    if (activeTab === 'auto_reply') {
      fetchAutoReplies();
    }
  }, [activeTab]);

  // === Auto Reply State ===
  const [autoReplies, setAutoReplies] = useState([]);
  const [isAddingReply, setIsAddingReply] = useState(false);
  const [replyForm, setReplyForm] = useState({ id: null, keyword: '', reply_text: '', is_active: true });

  const fetchAutoReplies = async () => {
    try {
      const res = await api.get('/auto-replies');
      if (res.data.success) setAutoReplies(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveAutoReply = async () => {
    if (!replyForm.keyword || !replyForm.reply_text) return showToast('⚠️ กรุณากรอกคีย์เวิร์ดและคำตอบ');
    try {
      if (replyForm.id) {
        await api.put(`/auto-replies/${replyForm.id}`, replyForm);
        showToast('✅ แก้ไขข้อความตอบกลับสำเร็จ');
      } else {
        await api.post('/auto-replies', replyForm);
        showToast('✅ เพิ่มข้อความตอบกลับอัตโนมัติสำเร็จ');
      }
      setIsAddingReply(false);
      setReplyForm({ id: null, keyword: '', reply_text: '', is_active: true });
      fetchAutoReplies();
    } catch (err) {
      showToast('❌ ไม่สามารถบันทึกได้');
    }
  };

  const toggleAutoReply = async (id, currentStatus) => {
    try {
      await api.put(`/auto-replies/${id}`, { is_active: !currentStatus });
      setAutoReplies(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
    } catch (err) {
      showToast('❌ เปลี่ยนสถานะไม่สำเร็จ');
    }
  };

  const deleteAutoReply = async (id) => {
    if (!window.confirm('ต้องการลบคีย์เวิร์ดนี้ใช่หรือไม่?')) return;
    try {
      await api.delete(`/auto-replies/${id}`);
      showToast('🗑️ ลบสำเร็จ');
      fetchAutoReplies();
    } catch (err) {
      showToast('❌ ลบไม่สำเร็จ');
    }
  };

  const fetchLineAccounts = async () => {
    try {
      const res = await api.get('/line-accounts');
      if (res.data.success) {
        setLineAccounts(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('❌ ไม่สามารถดึงข้อมูลบัญชี LINE ได้');
    }
  };

  const handleCreateLineAccount = async () => {
    try {
      if (!newLineAccount.name || !newLineAccount.channel_secret || !newLineAccount.access_token) {
        return showToast('⚠️ กรุณากรอกข้อมูลสำคัญให้ครบถ้วน');
      }
      setIsAddingLine('loading');
      const res = await api.post('/line-accounts', newLineAccount);
      if (res.data.success) {
        showToast('✅ เชื่อมต่อ LINE OA สำเร็จ! ระบบลงทะเบียน Webhook ให้อัตโนมัติแล้ว 🎉');
        setIsAddingLine(false);
        setNewLineAccount({ name: '', channel_secret: '', access_token: '', picture_url: '' });
        fetchLineAccounts();
      }
    } catch (err) {
      showToast('❌ เกิดข้อผิดพลาดในการเพิ่มบัญชี');
      setIsAddingLine(false);
    }
  };

  const handleDeleteLineAccount = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี LINE นี้? แชทเก่าที่เคยลิงก์จะแสดงผลได้ แต่ไม่สามารถตอบกลับไปที่ LINE ได้อีกต่อไป')) return;
    try {
      const res = await api.delete(`/line-accounts/${id}`);
      if (res.data.success) {
        showToast('🗑️ ลบบัญชีสำเร็จ');
        fetchLineAccounts();
      }
    } catch (err) {
      showToast('❌ เลิกเชื่อมต่อไม่สำเร็จ');
    }
  };

  const handleTestNotification = async (type) => {
    try {
      showToast('📡 กำลังส่งคำขอแจ้งเตือนทดสอบ...');
      const res = await api.get(`/stats/test-notification?type=${type}`);
      if (res.data.success) {
        showToast(`✅ ส่งคำขอแจ้งเตือน [${type}] สำเร็จ!`);
      }
    } catch (err) {
      console.error('Test Notif Err:', err);
      showToast('❌ ส่งแจ้งเตือนทดสอบไม่สำเร็จ');
    }
  };

  // === Facebook Page state ===
  const [facebookAccounts, setFacebookAccounts] = useState([]);
  const [fbAvailablePages, setFbAvailablePages] = useState([]); // Pages returned after FB Login
  const [fbLoginStatus, setFbLoginStatus] = useState('idle'); // idle | loading | selecting | done | error
  const [isFbReady, setIsFbReady] = useState(false);
  const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID || '1263587315899560'; // Priority: Env > Master ID (Remove localStorage fallback to avoid 'dfg')
  const [connectingPageId, setConnectingPageId] = useState(null); // page currently being saved

  useEffect(() => {
    if (activeTab === 'facebook_page') {
      fetchFacebookAccounts();
      initFbSdk();
    }
  }, [activeTab]);

  const initFbSdk = () => {
    return new Promise((resolve) => {
      console.log('🎬 Initializing FB SDK with ID:', fbAppId);
      if (!fbAppId) return resolve(false);
      
      const setupFB = () => {
        try {
          window.FB.init({
            appId: fbAppId,
            cookie: true,
            xfbml: true,
            version: 'v19.0'
          });
          console.log('✅ FB.init() successful');
          setIsFbReady(true);
          resolve(true);
        } catch (err) {
          console.error('❌ FB.init() failed:', err);
          setIsFbReady(false);
          resolve(false);
        }
      };

      if (window.FB) {
        setupFB();
        return;
      }
      
      window.fbAsyncInit = function () {
        setupFB();
      };
      
      if (!document.getElementById('facebook-jssdk')) {
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      } else {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.FB) {
            clearInterval(interval);
            setupFB();
          } else if (attempts > 50) {
            clearInterval(interval);
            resolve(false);
          }
        }, 100);
      }
    });
  };

  const handleFbLogin = async () => {
    if (!fbAppId) {
      showToast('⚠️ กรุณาใส่ Facebook App ID ก่อนครับ');
      return;
    }

    setFbLoginStatus('loading');

    // รอ SDK ให้พร้อมจริงๆ ก่อนเรียก login (Fix: FB.login() called before FB.init())
    const ready = await initFbSdk();
    if (!ready || !window.FB) {
      showToast('❌ Facebook SDK โหลดไม่สำเร็จ กรุณาตรวจสอบ App ID หรือ Internet ชื่อต่อ');
      setFbLoginStatus('idle');
      return;
    }

    window.FB.login((response) => {
      if (response.authResponse) {
        const userToken = response.authResponse.accessToken;
        // ดึงรายชื่อเพจที่ login user เป็น Admin
        window.FB.api('/me/accounts', { access_token: userToken }, (pagesRes) => {
          if (pagesRes && pagesRes.data && pagesRes.data.length > 0) {
            setFbAvailablePages(pagesRes.data);
            setFbLoginStatus('selecting');
          } else {
            setFbLoginStatus('idle');
            showToast('⚠️ ไม่พบเพจที่คุณเป็นผู้ดูแล หรือยังไม่ได้อนุมัติสิทธิ์');
          }
        });
      } else {
        setFbLoginStatus('idle');
        showToast('ยกเลิกการเข้าสู่ระบบ');
      }
    }, { scope: 'pages_messaging,pages_show_list,pages_manage_metadata,public_profile' });
  };


  const handleConnectPage = async (page) => {
    setConnectingPageId(page.id);
    // Auto-generate verify token
    const verifyToken = 'crm_' + Math.random().toString(36).substring(2, 18);
    try {
      // ดึงรูปเพจ (optional)
      let pictureUrl = null;
      try {
        const picRes = await new Promise(resolve => {
          window.FB.api(`/${page.id}/picture`, { type: 'large', redirect: false, access_token: page.access_token }, resolve);
        });
        if (picRes?.data?.url) pictureUrl = picRes.data.url;
      } catch (_) {}

      const res = await api.post('/facebook-accounts', {
        name: page.name,
        page_id: page.id,
        access_token: page.access_token,
        verify_token: verifyToken,
        picture_url: pictureUrl
      });
      if (res.data.success) {
        showToast(`✅ เชื่อมต่อ "${page.name}" สำเร็จ!`);
        // Remove from available list
        setFbAvailablePages(prev => prev.filter(p => p.id !== page.id));
        fetchFacebookAccounts();
      }
    } catch (err) {
      // Page might already be connected
      showToast(`⚠️ เพจ "${page.name}" อาจเชื่อมต่อไปแล้ว หรือเกิดข้อผิดพลาด`);
    } finally {
      setConnectingPageId(null);
    }
  };

  const fetchFacebookAccounts = async () => {
    try {
      const res = await api.get('/facebook-accounts');
      if (res.data.success) setFacebookAccounts(res.data.data);
    } catch (err) {
      showToast('❌ ไม่สามารถดึงข้อมูลบัญชี Facebook ได้');
    }
  };

  const handleDeleteFbAccount = async (id) => {
    if (!window.confirm('ต้องการยกเลิกการเชื่อมต่อ Facebook Page นี้?')) return;
    try {
      const res = await api.delete(`/facebook-accounts/${id}`);
      if (res.data.success) {
        showToast('🗑️ ยกเลิกการเชื่อมต่อสำเร็จ');
        fetchFacebookAccounts();
      }
    } catch (err) {
      showToast('❌ ลบไม่สำเร็จ');
    }
  };

  // Notification states
  const [notifications, setNotifications] = useState({
    newOrder: true,
    lowStock: true,
    newMessage: true,
    paymentSlip: true,
    dailySummary: false,
    lineNotify: false,
  });

  // Security states
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactor: false,
  });



  const saveSettings = () => {
    showToast('บันทึกการตั้งค่าสำเร็จ!');
  };

  const savePassword = () => {
    if (!security.currentPassword) { showToast('⚠️ กรุณากรอกรหัสผ่านปัจจุบัน'); return; }
    if (security.newPassword.length < 8) { showToast('⚠️ รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    if (security.newPassword !== security.confirmPassword) { showToast('⚠️ รหัสผ่านใหม่ไม่ตรงกัน'); return; }
    setSecurity({ ...security, currentPassword: '', newPassword: '', confirmPassword: '' });
    showToast('✅ เปลี่ยนรหัสผ่านสำเร็จ!');
  };

  return (
    <div className="space-y-6 fade-in pb-10 max-w-5xl mx-auto">
      <Toast msg={toastMsg} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><SettingsIcon className="text-brand-DEFAULT" /> ตั้งค่าระบบ (Settings)</h1>
          <p className="text-gray-500 mt-1">จัดการหน้าร้าน ข้อมูลการเงิน และความเป็นส่วนตัว</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">

        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          {[
            { id: 'store', label: 'ภาพรวมร้านค้า', icon: Store },
            { id: 'payment', label: 'บัญชีธนาคารรับเงิน', icon: Wallet },
            { id: 'theme', label: 'ธีมและโทนสี', icon: PaintBucket },
            { id: 'notification', label: 'การแจ้งเตือน', icon: Bell },
            { id: 'auto_reply', label: 'ระบบตอบอัตโนมัติ', icon: Zap },
            { id: 'line_oa', label: 'เชื่อมต่อ LINE OA', icon: MessageCircle },
            { id: 'facebook_page', label: 'เชื่อมต่อ Facebook Page', icon: Facebook },
            { id: 'security', label: 'รหัสผ่านและความปลอดภัย', icon: Shield },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl font-medium transition shadow-sm ${activeTab === t.id ? 'bg-brand-DEFAULT text-white shadow-brand-DEFAULT/30' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <t.icon size={18} /> {t.label}
            </button>
          ))}
        </div>

        {/* Form Container */}
        <div className="flex-1 glass p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">

          {/* Store Info */}
          {activeTab === 'store' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold border-b border-gray-200 dark:border-gray-700 pb-3">แก้ไขข้อมูลร้านค้าเบื้องต้น</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">ชื่อร้านค้า</label>
                  <input type="text" defaultValue="Beauty Shop by N." className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-DEFAULT focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">เบอร์โทรศัพท์ร้าน</label>
                  <input type="text" defaultValue="081-999-9999" className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-DEFAULT focus:outline-none" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">รายละเอียดลิงก์เว็บ (URL)</label>
                  <div className="flex bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <span className="p-3 bg-gray-200 dark:bg-gray-800 text-gray-500 text-sm">omnipage.app/</span>
                    <input type="text" defaultValue="beautyshop" className="w-full p-3 bg-transparent focus:outline-none" />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">ที่อยู่ร้าน / โกดัง</label>
                  <textarea rows={3} defaultValue="123 ซอยลาดพร้าว 15 กรุงเทพมหานคร 10240" className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-DEFAULT focus:outline-none resize-none" />
                </div>
              </div>
            </div>
          )}

          {/* Payment */}
          {activeTab === 'payment' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold border-b border-gray-200 dark:border-gray-700 pb-3">บัญชีรับโอนเงินลูกค้า (Payment Gateway)</h2>
              <div className="p-5 border-2 border-green-500/20 bg-green-50 dark:bg-green-900/10 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg text-white font-bold flex items-center justify-center text-xs">KBank</div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">ธนาคารกสิกรไทย</h3>
                    <p className="text-gray-500 font-mono text-sm">123-4-56789-0</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">ยืนยันแล้ว</span>
              </div>
              <button onClick={() => showToast('ฟีเจอร์ผูกบัญชีใหม่เตรียมเปิดใช้ในเร็วๆ นี้')} className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                + เพิ่มบัญชีธนาคาร หรือ PromptPay
              </button>
            </div>
          )}

          {/* Theme */}
          {activeTab === 'theme' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold border-b border-gray-200 dark:border-gray-700 pb-3">ปรับแต่งโทนสีระบบแอดมิน</h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">เลือกชุดสีหลักของระบบ</p>
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-brand-DEFAULT ring-4 ring-brand-DEFAULT/30 cursor-pointer shadow-lg relative">
                    <CheckSquare className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" />
                  </div>
                  {[['bg-pink-500', 'สีชมพู'], ['bg-orange-500', 'สีส้ม'], ['bg-emerald-500', 'สีเขียว']].map(([color, label]) => (
                    <div key={color} onClick={() => showToast(`จำลองเปลี่ยนธีม${label}แล้ว! (Production จะใช้งานได้จริง)`)} className={`w-16 h-16 rounded-full border border-gray-300 ${color} hover:scale-110 cursor-pointer transition flex items-center justify-center`} title={label} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notification' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold border-b border-gray-200 dark:border-gray-700 pb-3">ตั้งค่าการแจ้งเตือน</h2>
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">การแจ้งเตือนในแอป</p>
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Toggle checked={notifications.newOrder} onChange={v => setNotifications({...notifications, newOrder: v})} label="มีออเดอร์ใหม่เข้ามา" />
                  <Toggle checked={notifications.lowStock} onChange={v => setNotifications({...notifications, lowStock: v})} label="แจ้งเตือนสินค้าใกล้หมด (น้อยกว่า 10 ชิ้น)" />
                  <Toggle checked={notifications.newMessage} onChange={v => setNotifications({...notifications, newMessage: v})} label="มีข้อความจากลูกค้าใหม่" />
                  <Toggle checked={notifications.paymentSlip} onChange={v => setNotifications({...notifications, paymentSlip: v})} label="ลูกค้าส่งสลิปมาใหม่" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4">การแจ้งเตือนภายนอก</p>
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Toggle checked={notifications.dailySummary} onChange={v => setNotifications({...notifications, dailySummary: v})} label="สรุปยอดขายรายวันทางอีเมล" />
                  <Toggle checked={notifications.lineNotify} onChange={v => setNotifications({...notifications, lineNotify: v})} label="แจ้งเตือนผ่าน LINE Notify" />
                  {notifications.lineNotify && (
                    <div className="mt-2">
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 block mb-1">LINE Notify Token</label>
                      <input type="text" placeholder="วาง Token จาก notify.line.me ที่นี่..." className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-DEFAULT focus:outline-none text-sm font-mono" />
                    </div>
                  )}
                </div>

                {/* 🆕 Testing Tools for Real-time Notifications */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Terminal size={18} className="text-indigo-500" />
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">💡 ส่วนทดลองระบบ (Testing Tools)</p>
                  </div>
                  <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-2xl">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-4 font-medium">ใช้เพื่อตรวจสอบว่าระบบแจ้งเตือนแบบ Real-time และกระดิ่งมุมขวาทำงานปกติหรือไม่</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button 
                        onClick={() => handleTestNotification('order')}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition shadow-sm"
                      >
                        <ShoppingCart size={14} /> เทสออเดอร์ใหม่
                      </button>
                      <button 
                        onClick={() => handleTestNotification('chat')}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition shadow-sm"
                      >
                        <MessageSquare size={14} /> เทสแชทใหม่
                      </button>
                      <button 
                        onClick={() => handleTestNotification('payment')}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition shadow-sm"
                      >
                        <CreditCard size={14} /> เทสสลิปใหม่
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LINE OA Integration */}
          {activeTab === 'line_oa' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#00B900] flex items-center justify-center text-white">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">เชื่อมต่อ LINE Official Account</h2>
                  <p className="text-xs text-gray-400">ดึงแชทจาก LINE มาตอบในหน้าระบบ CRM เดียวกัน</p>
                </div>
              </div>
              
              {!isAddingLine ? (
                <div className="space-y-4">
                  {lineAccounts.length === 0 ? (
                    <div className="p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-gray-50/50 dark:bg-gray-900/20">
                      <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                        <MessageCircle size={40} className="text-[#00B900] opacity-40" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">ยังไม่มีการเชื่อมต่อ LINE</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">เชื่อมต่อ LINE Official Account เพื่อรับข้อความและจัดการออเดอร์จากลูกค้าได้โดยตรง</p>
                      
                      <button 
                        onClick={() => setIsAddingLine(true)} 
                        className="px-8 py-3.5 bg-[#00B900] hover:bg-[#009900] text-white font-bold rounded-2xl shadow-xl shadow-green-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                      >
                        <Plus size={20} /> เชื่อมต่อ LINE OA
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lineAccounts.map(account => {
                        const apiBase = import.meta.env.VITE_API_URL || 'https://my-crm-apis.onrender.com';
                        const webhookUrl = `${apiBase}/api/chats/line/webhook/${account.id}`;
                        
                        return (
                          <div key={account.id} className="p-6 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-sm space-y-4 transition hover:shadow-md">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-[#00B900] rounded-2xl text-white flex items-center justify-center overflow-hidden shadow-inner">
                                  {account.picture_url ? <img src={account.picture_url} alt="Profile" className="w-full h-full object-cover" /> : <MessageCircle size={28} />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{account.name}</h3>
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-green-200 dark:border-green-800">Online</span>
                                  </div>
                                  <p className="text-xs text-gray-400 font-mono mt-0.5 font-semibold">Channel ID: {account.id.split('-').shift()}****</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleDeleteLineAccount(account.id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition" title="ลบการเชื่อมต่อ">
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3">
                              <div className="flex-1 min-w-0 w-full">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Zap size={10} className="text-amber-500" /> Webhook URL</p>
                                <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 font-mono text-[11px] text-gray-600 dark:text-gray-400 break-all select-all">
                                  {webhookUrl}
                                </div>
                              </div>
                              <button onClick={() => { navigator.clipboard.writeText(webhookUrl); showToast('คัดลอก Webhook URL แล้ว!'); }} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm group">
                                <Copy size={18} className="text-gray-400 group-hover:text-[#00B900]" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <button 
                        onClick={() => setIsAddingLine(true)} 
                        className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={20} /> เพิ่มร้านค้า LINE OA อื่นๆ
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl">
                  <div className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-xl">เชื่อมต่อ LINE OA</h3>
                      <p className="text-sm text-gray-400 mt-1">คัดลอกข้อมูลจากหน้า LINE Developers</p>
                    </div>
                    <button onClick={() => setIsAddingLine(false)} className="p-2 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 transition"><X size={20} className="text-gray-400" /></button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">ชื่อร้านที่จะแสดงในระบบ <span className="text-red-500">*</span></label>
                      <input type="text" value={newLineAccount.name} onChange={e => setNewLineAccount({...newLineAccount, name: e.target.value})} placeholder="เช่น ร้านกระเป๋าแฟชั่น" className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-[#00B900] focus:border-[#00B900] focus:outline-none transition-all font-medium" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Channel Secret <span className="text-red-500">*</span></label>
                      <input type="password" value={newLineAccount.channel_secret} onChange={e => setNewLineAccount({...newLineAccount, channel_secret: e.target.value})} placeholder="จากแท็บ Basic Settings" className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-[#00B900] focus:border-[#00B900] focus:outline-none transition-all" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Channel Access Token <span className="text-red-500">*</span></label>
                        <a href="https://manager.line.biz" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-[#00B900] hover:underline uppercase tracking-widest font-mono">คู่มือหา Token 👉</a>
                      </div>
                      <textarea rows={3} value={newLineAccount.access_token} onChange={e => setNewLineAccount({...newLineAccount, access_token: e.target.value})} placeholder="จากแท็บ Messaging API" className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-[#00B900] focus:border-[#00B900] focus:outline-none transition-all resize-none font-mono text-xs" />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex flex-col gap-3">
                    <button onClick={handleCreateLineAccount} disabled={isAddingLine === 'loading'} className="w-full py-4 bg-[#00B900] hover:bg-[#009900] disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 transition-all flex justify-center items-center gap-2 text-lg">
                      {isAddingLine === 'loading' ? (
                        <><span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" /> กำลังตรวจสอบระบบ...</>
                      ) : (
                        <><MessageCircle size={22} /> บันทึกการเชื่อมต่อ LINE</>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-gray-400 font-medium italic">ใช้เวลาเพียง 1-2 นาที เมื่อบันทึกสำเร็จระบบจะดึงแชทล่าสุดให้ทันที</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* Facebook Page Integration — Page365 Style   */}
          {/* ============================================ */}
          {activeTab === 'facebook_page' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center text-white">
                  <Facebook size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">เชื่อมต่อ Facebook Page</h2>
                  <p className="text-xs text-gray-400">รับแชทจาก Messenger เข้ามาในระบบ CRM</p>
                </div>
              </div>

              {/* Step 1: ถ้ายังไม่มี App ID */}
              {!fbAppId && (
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 border border-blue-100 dark:border-gray-700 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm shrink-0">
                      <span className="text-2xl">🔑</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">เริ่มต้นเชื่อมต่อ Facebook</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">คัดลอก <strong>App ID</strong> จากหน้า <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Facebook Developers</a> มาใส่ที่นี่เพื่อเริ่มต้นการเชื่อมต่อแบบอัตโนมัติ</p>
                    </div>
                  </div>
                  <div className="flex gap-2 bg-white dark:bg-gray-900 p-1 rounded-xl border border-blue-200 dark:border-gray-700 shadow-sm focus-within:ring-2 focus-within:ring-blue-400 transition-all">
                    <input
                      type="text"
                      value={fbAppIdInput}
                      onChange={e => setFbAppIdInput(e.target.value)}
                      placeholder="วาง App ID ของคุณที่นี่..."
                      className="flex-1 p-3 bg-transparent focus:outline-none font-mono text-sm dark:text-white"
                    />
                    <button onClick={saveAppId} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm shadow-blue-500/20">
                      ยืนยัน
                    </button>
                  </div>
                </div>
              )}

              {/* APP ID ตั้งค่าแล้ว */}
              {fbAppId && (
                <>
                  {/* Connected Pages */}
                  {facebookAccounts.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">เพจที่เชื่อมต่อแล้ว ({facebookAccounts.length})</p>
                      {facebookAccounts.map(account => {
                        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                        const webhookUrl = `${apiBase}/api/chats/facebook/webhook/${account.id}`;
                        return (
                          <div key={account.id} className="p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-[#1877F2] flex items-center justify-center text-white overflow-hidden shrink-0">
                                  {account.picture_url ? <img src={account.picture_url} alt="" className="w-full h-full object-cover" /> : <Facebook size={22} />}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 dark:text-white">{account.name}</p>
                                  <p className="text-xs text-green-500 font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span> เชื่อมต่อแล้ว
                                  </p>
                                </div>
                              </div>
                              <button onClick={() => handleDeleteFbAccount(account.id)} className="text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition">
                                <Trash2 size={16} />
                              </button>
                            </div>
                            {/* Webhook info (collapsed) */}
                            <details className="mt-3">
                              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">แสดง Webhook URL สำหรับ Facebook App Dashboard ▾</summary>
                              <div className="mt-2 space-y-2">
                                <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-between">
                                  <code className="text-xs text-blue-600 dark:text-blue-400 break-all font-mono">{webhookUrl}</code>
                                  <button onClick={() => { navigator.clipboard.writeText(webhookUrl); showToast('คัดลอก Webhook URL แล้ว!'); }} className="ml-2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                                    <Copy size={13} className="text-gray-500" />
                                  </button>
                                </div>
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
                                  <span className="text-xs text-gray-500 mr-2">Verify Token:</span>
                                  <code className="text-xs text-blue-700 font-mono flex-1">{account.verify_token}</code>
                                  <button onClick={() => { navigator.clipboard.writeText(account.verify_token); showToast('คัดลอก Verify Token แล้ว!'); }} className="p-1.5 hover:bg-blue-100 rounded">
                                    <Copy size={13} className="text-blue-600" />
                                  </button>
                                </div>
                              </div>
                            </details>
                          </div>
                        );
                      })}
                    </div>
                  )}


                  {/* Page Selector (shown after FB Login) — Facebook OAuth Style */}
                  {fbLoginStatus === 'selecting' && fbAvailablePages.length > 0 && (
                    <FbPageSelector
                      pages={fbAvailablePages}
                      connectedAccounts={facebookAccounts}
                      connectingPageId={connectingPageId}
                      onConnect={handleConnectPage}
                      onClose={() => { setFbLoginStatus('idle'); setFbAvailablePages([]); }}
                    />
                  )}

                  {/* Main Connect Button */}
                  {fbLoginStatus !== 'selecting' && (
                    <div className="pt-2">
                      <button
                        onClick={handleFbLogin}
                        disabled={fbLoginStatus === 'loading'}
                        className="w-full py-4 bg-[#1877F2] hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-2xl transition flex items-center justify-center gap-3 text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                      >
                        {fbLoginStatus === 'loading' ? (
                          <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> กำลังเชื่อมต่อ Facebook...</>
                        ) : (
                          <><Facebook size={22} /> {facebookAccounts.length > 0 ? 'เพิ่มเพจ Facebook อื่น' : 'เชื่อมต่อด้วย Facebook'}</>
                        )}
                      </button>
                      <div className="mt-4 text-center">
                        <p className="text-[10px] text-gray-500 bg-gray-50 py-2 px-3 rounded-lg border border-gray-100 italic">
                          ℹ️ ระบบเชื่อมต่ออัตโนมัติ 100% โดย OmniPage SaaS - หมดกังวลเรื่องตั้งค่า Webhook ผู้ใช้เพียงล็อคอินเท่านั้น!
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* === Auto Reply Section (Page365 Style) === */}
          {activeTab === 'auto_reply' && (
            <div className="space-y-6 animate-fade-in relative">
              <div className="flex justify-between flex-wrap gap-4 items-end border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Zap className="text-purple-600" /> ตอบรับอัตโนมัติ
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">ตั้งค่าเปิด-ปิด การใช้งานแยกเป็นคำถาม</p>
                </div>
                {!isAddingReply && (
                  <button onClick={() => { setReplyForm({ id: null, keyword: '', reply_text: '', is_active: true }); setIsAddingReply(true); }} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm font-semibold flex items-center gap-2 transition">
                    <Plus size={16} /> สร้างคำตอบใหม่
                  </button>
                )}
              </div>

              {isAddingReply && (
                <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-800/30 mb-6">
                  <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-4">{replyForm.id ? 'แก้ไขข้อมูล' : 'สร้างคำตอบอัตโนมัติใหม่'}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">คำถาม / คีย์เวิร์ด (ลูกค้าพิมพ์คำนี้)</label>
                      <input type="text" placeholder="เช่น หน้าร้านอยู่ที่ไหน" value={replyForm.keyword} onChange={e => setReplyForm({...replyForm, keyword: e.target.value})} className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">คำตอบ (บอทจะตอบสิ่งนี้)</label>
                      <textarea rows={3} placeholder="ร้านของเราขายเฉพาะช่องทางออนไลน์ค่ะ ^^" value={replyForm.reply_text} onChange={e => setReplyForm({...replyForm, reply_text: e.target.value})} className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"></textarea>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setIsAddingReply(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
                      <button onClick={saveAutoReply} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold">บันทึกข้อมูล</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {autoReplies.map((reply) => (
                  <div key={reply.id} className="flex flex-col md:flex-row md:items-center py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition px-2">
                    <div className="md:w-1/3 mb-2 md:mb-0">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">"{reply.keyword}"</span>
                    </div>
                    <div className="md:w-1/6 mb-2 md:mb-0">
                      <Toggle 
                        checked={reply.is_active} 
                        onChange={() => toggleAutoReply(reply.id, reply.is_active)} 
                        label={reply.is_active ? 'เปิด' : 'ปิด'}
                      />
                    </div>
                    <div className="md:w-1/2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span className="truncate pr-4">{reply.reply_text}</span>
                      <div className="flex gap-2">
                        <button onClick={() => { setReplyForm(reply); setIsAddingReply(true); }} className="text-gray-400 hover:text-blue-500 transition px-2 py-1 flex items-center text-xs">
                           <Edit3 size={14} className="mr-1" /> แก้ไข
                        </button>
                        <button onClick={() => deleteAutoReply(reply.id)} className="text-gray-400 hover:text-red-500 transition px-2 py-1">
                           <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {autoReplies.length === 0 && !isAddingReply && (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    ยังไม่มีการตั้งค่าคำตอบอัตโนมัติ<br/>
                    ลองเพิ่มคำถามที่เจอบ่อยๆ ดูสิครับ!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold border-b border-gray-200 dark:border-gray-700 pb-3">รหัสผ่านและความปลอดภัย</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">รหัสผ่านปัจจุบัน</label>
                  <input type="password" value={security.currentPassword} onChange={e => setSecurity({...security, currentPassword: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-DEFAULT focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">รหัสผ่านใหม่</label>
                  <input type="password" value={security.newPassword} onChange={e => setSecurity({...security, newPassword: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-DEFAULT focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">ยืนยันรหัสผ่านใหม่</label>
                  <input type="password" value={security.confirmPassword} onChange={e => setSecurity({...security, confirmPassword: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-DEFAULT focus:outline-none" />
                </div>
                <button onClick={savePassword} className="w-full py-3 bg-brand-DEFAULT text-white font-bold rounded-xl hover:bg-brand-dark transition">
                  เปลี่ยนรหัสผ่าน
                </button>
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Toggle checked={security.twoFactor} onChange={v => setSecurity({...security, twoFactor: v})} label="เปิดการยืนยัน 2 ขั้นตอน (2FA)" />
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
            <button onClick={activeTab === 'security' ? savePassword : saveSettings} className="px-6 py-2.5 bg-brand-DEFAULT text-white font-bold rounded-xl shadow-lg hover:bg-brand-dark transition flex items-center gap-2">
              <Save size={18} /> ยืนยันการตั้งค่า
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
