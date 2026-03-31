require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const path = require('path');

// Serve static uploaded files locally
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Socket.io for Realtime Tracking & Omni-channel chat (Mock API)
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowed = [
        'http://localhost:5173',
        'http://localhost:5174',
        process.env.FRONTEND_URL,
        'https://finance-app-five-hazel.vercel.app',
      ].filter(Boolean);
      if (!origin || allowed.includes(origin)) callback(null, true);
      else callback(new Error(`Socket CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);

// ===================
// SECURITY MIDDLEWARE
// ===================

// Trust proxy for Render/Vercel (Helps Rate Limiter)
app.set('trust proxy', 1);

// Helmet ensures secure HTTP headers (prevents XSS, strict transport security, etc.)
// ปิด contentSecurityPolicy หรือปรับแต่งเพื่อไม่ให้ Helmet block Facebook webhook
app.use(helmet({
  contentSecurityPolicy: false, // ปิด CSP ที่อาจ block external webhook POST
  crossOriginResourcePolicy: false,
}));

// CORS Policy: อนุญาตเฉพาะ Domain ที่ทราบไว้ ไม่เปิดให้ทุก Origin
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
  'https://finance-app-five-hazel.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // อนุญาต Postman / server-to-server (origin = undefined) หรือ domain ที่ whitelist ไว้
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true
}));

// Express built-in body parsing
// เพิ่ม limit สำหรับ Webhook routes (Facebook ส่ง events หลายอันในครั้งเดียว)
// เพิ่ม verify เพื่อดักเอา `rawBody` ไว้ใช้ตรวจสอบ Signature (สำคัญมากสำหรับ LINE/FB)
app.use(express.json({ 
  limit: '2mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Logging / Monitoring for Auth and general usage
app.use(morgan('combined')); // Better production logging

// Global Rate Limiting — 1000 requests per 15 minutes (ปรับเพิ่มให้รองรับการใช้งานจริง)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down and try again later.' }
});
app.use('/api', globalLimiter);

// Specific Rate Limit for Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, // เพิ่มให้มากขึ้นสำหรับการทดสอบและใช้งานในทีม
  message: 'Too many login attempts, please try again after 15 minutes.'
});
app.use('/api/auth/login', loginLimiter);

// ===================
// ROUTES (Mounting)
// ===================
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chats', chatRoutes);

const statsRoutes = require('./routes/statsRoutes');
app.use('/api/stats', statsRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const customerRoutes = require('./routes/customerRoutes');
app.use('/api/customers', customerRoutes);

const liveRoutes = require('./routes/liveRoutes');
app.use('/api/live', liveRoutes);

const lineAccountRoutes = require('./routes/lineAccountRoutes');
app.use('/api/line-accounts', lineAccountRoutes);

const facebookAccountRoutes = require('./routes/facebookAccountRoutes');
app.use('/api/facebook-accounts', facebookAccountRoutes);


// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is securely running' });
});

// ===================
// SUPABASE DATABASE & SERVER START
// ===================
const PORT = process.env.PORT || 5000;

// Initialize Supabase Backend Client
// เซิร์ฟเวอร์หลังบ้านจำเป็นต้องใช้ SERVICE_ROLE_KEY เพื่อทำงานข้ามเงื่อนไข RLS (เช่น webhook อ่าน/เขียนข้อมูลโดยไม่มี user login)
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
app.set('supabase', supabase);

console.log(`✅ Supabase Client initialized → ${process.env.SUPABASE_URL || 'NO URL SET'}`);

server.listen(PORT, () => {
  console.log(`Server running securely on port ${PORT}`);
});

// ===================
// RENDER SELF-PING (FREE TIER)
// ===================
// ป้องกัน Render หลับหลังจากไม่มีกิจกรรม 15 นาที เพื่อให้ Webhook ทำงานได้ต่อเนื่อง
const SELF_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
if (process.env.NODE_ENV === 'production' || process.env.PUBLIC_URL) {
  setInterval(async () => {
    try {
      const res = await fetch(`${SELF_URL}/health`);
      console.log(`📡 [SELF-PING] Awake... status: ${res.status}`);
    } catch (err) {
      console.warn('📡 [SELF-PING] Failed to ping self:', err.message);
    }
  }, 14 * 60 * 1000); // 14 นาที
}

// Socket.io connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
