// ============================================================
// api.js – Centralized API Service (Axios instance)
// ============================================================
import axios from 'axios';

const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const rawBaseURL = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : 'https://my-crm-apis.onrender.com');

const api = axios.create({
  baseURL: `${rawBaseURL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// ── Request Interceptor: แนบ JWT token อัตโนมัติทุก request ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: จัดการ error กลาง ──────────────────
api.interceptors.response.use(
  res => res,
  err => {
    const status = err?.response?.status;
    if (status === 401) {
      // token หมดอายุหรือไม่ถูกต้อง — logout อัตโนมัติ
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      // redirect ไปหน้า login ถ้าไม่ได้อยู่ที่นั่นแล้ว
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    console.error('[API Error]', err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default api;

// ── Helpers ───────────────────────────────────────────────────
export const handleExportCSV = () => {
  const token = localStorage.getItem('token');
  const url = `${api.defaults.baseURL}/orders/export/csv`;
  // สร้าง link ที่แนบ token เพื่อ download
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', 'orders.csv');
  // ใช้ fetch แทนเพื่อส่ง header ไปด้วย
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.blob())
    .then(blob => {
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    });
};
