const express = require('express');
const multer = require('multer');
const { getChats, sendMessage, lineWebhook, uploadImage, facebookWebhookVerify, facebookWebhook } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const router = express.Router();


// กรองรับเฉพาะไฟล์ภาพ - ป้องกัน upload ไฟล์อันตราย
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const upload = multer({ 
  storage: multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
      const ext = file.originalname.split('.').pop().toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}.${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp) are allowed'), false);
    }
  }
});

// /webhook/:accountId ต้องเปิด public เพราะ LINE server เรียก โดยไม่มี JWT
router.post('/webhook/:accountId?', lineWebhook);

// Facebook Webhook routes (public เช่นกัน)
router.get('/facebook/webhook/:accountId?', facebookWebhookVerify);
router.post('/facebook/webhook/:accountId?', facebookWebhook);

// Routes อื่นต้องล็อกด้วย JWT
router.get('/',                          protect, getChats);
router.post('/',                         protect, sendMessage);
router.post('/upload', protect, upload.single('image'), uploadImage);

module.exports = router;

