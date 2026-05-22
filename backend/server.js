require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_here_change_in_production';

// ===================
// SUPABASE CLIENT
// ===================
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://byhkgaxqcpngdzwlvita.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY, // ต้องตั้งค่าใน .env
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
app.set('supabase', supabase);

// ===================
// MIDDLEWARES
// ===================
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(morgan('combined'));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
  'https://easy-order-box.vercel.app',
  'https://frontend-sathapors-projects.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('CORS policy: Not allowed'));
  },
  credentials: true
}));

app.use(express.json({ 
  limit: '2mb', 
  verify: (req, res, buf) => { req.rawBody = buf; } 
}));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ===================
// SOCKET.IO
// ===================
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
    } catch (err) { console.warn('Socket Auth Error:', err.message); }
  }
  next();
});

io.on('connection', (socket) => {
  if (socket.user?.id) socket.join(socket.user.id);
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});
app.set('io', io);

// ===================
// ROUTES
// ===================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/live', require('./routes/liveRoutes'));
app.use('/api/line-accounts', require('./routes/lineAccountRoutes'));
app.use('/api/facebook-accounts', require('./routes/facebookAccountRoutes'));
app.use('/api/auto-replies', require('./routes/autoReplyRoutes'));

app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// ===================
// SERVER START
// ===================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Self-ping to prevent Render sleep
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    try { await fetch(`${process.env.PUBLIC_URL || 'http://localhost:' + PORT}/health`); }
    catch (err) { console.warn('Ping failed'); }
  }, 14 * 60 * 1000);
}
