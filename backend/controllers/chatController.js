// ============================================================
// chatController.js – Supabase JSONB chat messages + LINE Webhook
// ============================================================
const crypto = require('crypto');
const fs = require('fs');
const { uploadImageToDrive } = require('../services/googleDriveService');

let memoryConversations = [];
let lastSeenPublicUrl = process.env.PUBLIC_URL || '';

// --- ฟังก์ชันช่วยเหลือตรวจจับและส่ง Auto Reply ---
const checkAndSendAutoReply = async (req, conversationId, customerText) => {
  const supabase = req.app.get('supabase');
  try {
    const { data: replies } = await supabase.from('auto_replies').select('*').eq('is_active', true);
    if (!replies || replies.length === 0) return;
    
    // ตรวจสอบแบบ Contains (แค่มีคำในประโยคก็ตอบ)
    const matched = replies.find(r => customerText.toLowerCase().includes(r.keyword.toLowerCase()));
    if (matched) {
      console.log(`🤖 Auto-Reply matched keyword: "${matched.keyword}"`);
      const mockReq = { app: req.app, body: { conversationId, text: matched.reply_text, type: 'sent' } };
      const mockRes = { status: () => ({ json: () => {} }), json: () => {} };
      
      setTimeout(() => {
        exports.sendMessage(mockReq, mockRes).catch(err => console.error('Auto Reply Send Err:', err));
      }, 1000); // หน่วงเวลา 1 วิให้ดูเหมือนบอทกำลังพิมพ์
    }
  } catch (err) {
    console.error('Auto Reply Fetch Err:', err);
  }
};

// ── 1. ดึงข้อความทั้งหมดมาแสดงที่บอร์ด ─────────────────────────────────
exports.getChats = async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    // ดึงทั้ง LINE และ Facebook conversations
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error('getChats error:', err);
    res.status(200).json({ success: true, data: [] });
  }
};

// ── 2. ส่งข้อความจากระบบเราไปหาลูกค้า (และ Push ไปยัง LINE) ──────
exports.sendMessage = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { conversationId, text, type } = req.body;
  const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute:'2-digit' });
  const newMsg = { text, type: type || 'sent', time };

  try {
    // 1. ดึง conversation ปัจจุบัน
    const { data: conv, error: fetchErr } = await supabase.from('chat_conversations').select('*').eq('id', conversationId).single();
    if (fetchErr) throw fetchErr;

    const messages = [...(conv.messages || []), newMsg];

    // 2. อัปเดตกลับไปที่ Database
    const { data, error: updateErr } = await supabase.from('chat_conversations')
      .update({ messages, last_message: text, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select();
    if (updateErr) throw updateErr;

    // 3A. ถ้าลูกค้ามี line_user_id ให้ยิง Push Message กลับไปที่แอป LINE ของลูกค้า
    if (conv.line_user_id) {
      let token = process.env.LINE_ACCESS_TOKEN;
      if (conv.line_account_id) {
        const { data: lineAcc } = await supabase.from('line_accounts').select('access_token').eq('id', conv.line_account_id).single();
        if (lineAcc && lineAcc.access_token) token = lineAcc.access_token;
      }
      if (token) {
        console.log('Pushing to LINE: ', conv.line_user_id);
        const resPush = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ to: conv.line_user_id, messages: [{ type: 'text', text }] })
        });
        const pushText = await resPush.text();
        if (!resPush.ok) console.error('🚫 LINE Push Error:', resPush.status, pushText);
        else console.log(`✅ Push Message to LINE User ${conv.line_user_id} success!`);
      }
    }

    // 3B. ถ้าลูกค้ามี facebook_user_id ให้ส่งกลับผ่าน Facebook Graph API
    if (conv.facebook_user_id) {
      let fbToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
      if (conv.facebook_account_id) {
        const { data: fbAcc } = await supabase.from('facebook_accounts').select('access_token').eq('id', conv.facebook_account_id).single();
        if (fbAcc && fbAcc.access_token) fbToken = fbAcc.access_token;
      }
      if (fbToken) {
        console.log('Pushing to Facebook: ', conv.facebook_user_id);
        const fbRes = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${fbToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: conv.facebook_user_id },
            message: { text }
          })
        });
        const fbText = await fbRes.text();
        if (!fbRes.ok) {
          console.error('🚫 Facebook Send Error:', fbRes.status, fbText);
          throw new Error(`Facebook Error: ${fbText}`);
        } else {
          console.log(`✅ Push Message to Facebook User ${conv.facebook_user_id} success!`);
        }
      }
    }

    // 4. Emit via Socket.io - ส่ง full conversation data เพื่อให้ Frontend อัปเดททันที
    const io = req.app.get('io');
    if (io) {
      // สร้าง conversation อัปเดทล่าสุดจาก data[] ที่ supabase ส่งกลับมา (data = updated rows)
      const updatedRow = Array.isArray(data) ? data[0] : data;
      if (updatedRow) {
        io.emit('conversation_updated', updatedRow);
      } else {
        io.emit('force_refresh', { reason: 'send_message' });
      }
    }

    res.status(201).json({ success: true, data: newMsg });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ success: false, error: 'Push message failed' });
  }
};

// ── 3. รับข้อความจากลูกค้าที่พิมพ์ผ่านแอป LINE (Webhook) ───────────
exports.lineWebhook = async (req, res) => {
  const accountId = req.params.accountId;
  const supabase = req.app.get('supabase');
  
  console.log(`[LINE] Webhook POST received. accountId: ${accountId || 'none (default)'}`);

  // ดึงข้อมูลบัญชี LINE จาก Database เพื่อใช้ Channel Secret ป้องกันการปลอมแปลง
  let channelSecret = process.env.LINE_CHANNEL_SECRET;
  let accessToken = process.env.LINE_ACCESS_TOKEN;

  // ถ้ามีการติด accountId มา ให้ถือว่าเป็น webhook สำหรับร้านนั้นโดยเฉพาะ
  if (accountId && accountId !== 'default') {
    const { data: lineAcc } = await supabase.from('line_accounts').select('*').eq('id', accountId).single();
    if (lineAcc) {
      channelSecret = lineAcc.channel_secret;
      accessToken = lineAcc.access_token;
    } else {
      console.warn(`[SECURITY] Invalid LINE accountId: ${accountId}`);
      return res.status(404).send('Not Found');
    }
  }

  // [SECURITY] ยืนยัน x-line-signature ทุกครั้ง — ป้องกัน event ปลอม
  if (channelSecret && req.rawBody) {
    const signature = req.headers['x-line-signature'];
    const expectedHash = crypto
      .createHmac('SHA256', channelSecret)
      .update(req.rawBody)
      .digest('base64');
      
    if (!signature || signature !== expectedHash) {
      console.warn('[SECURITY] Invalid LINE webhook signature — rejected');
      return res.status(401).send('Unauthorized');
    }
  } else if (channelSecret) {
    console.warn('[SECURITY] Missing rawBody for sign verification — fallback to legacy');
    const signature = req.headers['x-line-signature'];
    const body = JSON.stringify(req.body);
    const expectedHash = crypto.createHmac('SHA256', channelSecret).update(body).digest('base64');
    if (!signature || signature !== expectedHash) {
      console.warn('[SECURITY] Legacy LINE signature verify failed');
      return res.status(401).send('Unauthorized');
    }
  }

  // ตอบกลับ 200 OK ให้ LINE ทันทีตามเอกสาร
  res.status(200).send('OK');

  // จำ URL จริงที่มีคนเรียกเข้ามา เอาไว้ใช้ส่งภาพ
  if (req.headers.host) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    lastSeenPublicUrl = `${proto}://${req.headers.host}`;
  }

  const events = req.body.events;
  if (!events || events.length === 0) return;

  for (const event of events) {
    if (event.type === 'message' && (event.message.type === 'text' || event.message.type === 'image')) {
      const lineUserId = event.source.userId;
      let text = '';
      let imageUrl = null;
      
      if (event.message.type === 'text') {
        text = event.message.text;
      } else if (event.message.type === 'image') {
        text = '🖼️ รูปภาพ';
        try {
          const messageId = event.message.id;
          if (accessToken) {
            const resLine = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
          if (resLine.ok) {
            const buffer = await resLine.arrayBuffer();
            const filename = `${Date.now()}-${messageId}.jpg`;
            const uploadDir = require('path').join(__dirname, '../public/uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            fs.writeFileSync(`${uploadDir}/${filename}`, Buffer.from(buffer));
              // เก็บเป็น relative path เสมอ — Frontend ต่อ URL เองจาก localhost
              imageUrl = `/uploads/${filename}`;
            }
          }
        } catch (err) {
          console.error('Error downloading image from LINE:', err);
        }
      }

      const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute:'2-digit' });
      const newMsg = { text, type: 'received', time };
      if (imageUrl) newMsg.imageUrl = imageUrl;

      try {
        // หาว่ามีลูกค้านี้ในระบบหรือยัง
        const { data: existUser, error: findErr } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('line_user_id', lineUserId)
          .single();

        let updatedConv = null; // ← ประกาศตัวแปรก่อนใช้

        if (existUser) {
          // ถ้ามีลูกค้าเดิม อัปเดตข้อความต่อท้าย
          const updatedMessages = [...(existUser.messages || []), newMsg];
          const { data: updatedRows } = await supabase.from('chat_conversations')
            .update({ messages: updatedMessages, last_message: text, updated_at: new Date().toISOString() })
            .eq('id', existUser.id)
            .select('*');
          updatedConv = (updatedRows && updatedRows.length > 0) ? updatedRows[0] : { ...existUser, messages: updatedMessages };
        } else {
          // ถ้าเป็นลูกค้าใหม่ (ทักมาครั้งแรก) ไปดึงชื่อและรูปจาก LINE API
          let customerName = 'ผู้ใช้ LINE ใหม่';
          let avatarUrl = 'LN';

          if (accessToken) {
            const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (profileRes.ok) {
              const profile = await profileRes.json();
              customerName = profile.displayName;
              avatarUrl = profile.pictureUrl || customerName.substring(0, 2);
            }
          }

          // สร้างลูกค้าใหม่ใน DB
          const { data: insertData } = await supabase.from('chat_conversations').insert([{
            line_user_id: lineUserId,
            customer: customerName,
            avatar: avatarUrl,
            messages: [newMsg],
            last_message: text,
            line_account_id: accountId !== 'default' ? accountId : null
          }]).select('*');

          if (insertData && insertData.length > 0) {
            updatedConv = insertData[0];
          }
        }

        console.log(`📥 Received LINE message from [${lineUserId}]: ${text} ${imageUrl ? '(Image)' : ''}`);

        const io = req.app.get('io');
        if (io && updatedConv) {
          io.emit('conversation_updated', updatedConv);
          // 🆕 บรอดแคสต์แจ้งเตือนใหม่ทั่วทั้งแอป
          io.emit('new_notification', {
            type: 'chat',
            title: `แชทใหม่จาก ${updatedConv.customer || 'ลูกค้า'}`,
            body: text || '(ส่งรูปภาพ)',
            time: 'เมื่อสักครู่'
          });
        } else if (io) {
          io.emit('force_refresh', { reason: 'new_message' });
        }

        // --- Trigger Auto Reply (LINE) ---
        if (updatedConv && text) {
          checkAndSendAutoReply(req, updatedConv.id, text);
        }

      } catch (err) {
        console.error('LINE Webhook processing error:', err.message);
      }
    }
  }
};

// ── 5. Facebook Webhook Verification (GET) ──────────────────────
exports.facebookWebhookVerify = async (req, res) => {
  const accountId = req.params.accountId;
  const supabase = req.app.get('supabase');
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`[FB] Webhook Verify attempt for account: ${accountId}`);

  if (mode !== 'subscribe') return res.status(400).send('Bad Request');

  try {
    // แยกแยะว่าเป็น UUID หรือ Page ID (ตัวเลขยาวๆ) เพื่อป้องกัน Error ในฐานข้อมูล
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(accountId);
    
    let query = supabase.from('facebook_accounts').select('verify_token, page_id, id');
    
    if (isUuid) {
      query = query.eq('id', accountId);
    } else {
      query = query.eq('page_id', accountId);
    }

    const { data: fbAcc, error: findErr } = await query.single();

    if (findErr || !fbAcc) {
      console.warn(`[FB] Verify failed: Account not found for ID ${accountId}`);
      // ดูว่ามีรหัสกลางไหม
      if (token === 'crm_facebook_verify_token_2024') {
         console.log('✅ Facebook Webhook verified using fallback token (Account not in DB yet)');
         return res.status(200).send(challenge);
      }
      return res.status(404).send('Account not found');
    }

    // รองรับรหัสกลางที่เราแปะไป หรือรหัสที่เก็บใน DB หรือรหัสจาก .env ของเซิร์ฟเวอร์
    const expectedToken = fbAcc.verify_token || process.env.FACEBOOK_VERIFY_TOKEN || 'crm_facebook_verify_token_2024';
    const fallbackToken = 'crm_facebook_verify_token_2024';

    if (token !== expectedToken && token !== fallbackToken) {
      console.warn(`[FB] Invalid verify_token. Received: ${token}, Expected: ${expectedToken}`);
      return res.status(403).send('Forbidden');
    }

    console.log(`✅ Facebook Webhook verified for page: ${fbAcc.page_id}`);
    return res.status(200).send(challenge);
  } catch (err) {
    console.warn('[FB] Verification process bypass (Initial Setup Mode):', err.message);
    
    // หากเกิด Error (เช่น ยังไม่มีข้อมูลเพจใน DB ระหว่างการ Verify ครั้งแรกบน Dashboard) 
    // ให้ยอมรับรหัสจาก .env หรือรหัสกลางไปก่อนเพื่อให้ Facebook ยอมรับ Callback URL ของเรา
    const serverToken = process.env.FACEBOOK_VERIFY_TOKEN || 'crm_facebook_verify_token_2024';
    if (token === serverToken || token === 'crm_facebook_verify_token_2024') {
      console.log('✅ Facebook Webhook verified using server-side or fallback token');
      return res.status(200).send(challenge);
    }
    return res.status(500).send('Error');
  }
};

// ── 6. Facebook Webhook Events (POST) ───────────────────────────
exports.facebookWebhook = async (req, res) => {
  const accountId = req.params.accountId;
  const supabase = req.app.get('supabase');
  
  console.log(`[FB] Webhook POST received. accountId: ${accountId || 'none (default)'}`);

  // ตอบกลับ 200 ทันที (Facebook มี Timeout 20 วิ)
  res.status(200).send('EVENT_RECEIVED');

  const body = req.body;
  console.log(`[FB] Webhook received for account: ${accountId}, object: ${body.object}`);
  if (body.object !== 'page') {
    console.log('[FB] Ignoring non-page event:', body.object);
    return;
  }

  // ดึงข้อมูลเพจจาก DB
  let fbToken = null;
  let fbAccountId = accountId;

  try {
    // รองรับทั้ง UUID และ Page ID (ตัวเลขยาวๆ)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(accountId);
    let query = supabase.from('facebook_accounts').select('*');

    if (isUuid) {
      query = query.eq('id', accountId);
    } else if (accountId && accountId !== 'default') {
      query = query.eq('page_id', accountId);
    } else {
      // ไม่มี accountId — ลอง lookup จาก page_id ที่ Facebook ส่งมาใน entry
      const pageIdFromEntry = body.entry?.[0]?.id;
      if (pageIdFromEntry) {
        console.log(`[FB] No accountId, trying to find page by entry.id: ${pageIdFromEntry}`);
        query = query.eq('page_id', pageIdFromEntry);
      } else {
        console.warn('[FB] Cannot determine page — no accountId and no entry.id');
        return;
      }
    }

    const { data: fbAcc, error: findErr } = await query.single();
    
    if (findErr || !fbAcc) {
      console.warn(`[FB] Account NOT FOUND in POST for ID: ${accountId}`);
      return; 
    }

    fbToken = fbAcc.access_token;
    fbAccountId = fbAcc.id; // ใช้ UUID เสมอสำหรับความสัมพันธ์ใน DB
  } catch (err) {
    console.error('[FB] Error fetching facebook account in POST:', err.message);
    return;
  }

  for (const entry of (body.entry || [])) {
    for (const event of (entry.messaging || [])) {
      // เฉพาะข้อความจากลูกค้า (ไม่ใช่ echo ที่แอดมินส่งเอง)
      if (!event.message || event.message.is_echo) continue;

      const fbUserId = event.sender.id;
      // จัดการทั้งข้อความและรูปภาพ/ไฟล์แนบจาก Facebook
      let msgText = event.message.text || '';
      let fbImageUrl = null;

      // จัดการ Attachments (รูปภาพ, วิดีโอ, สติ๊กเกอร์)
      if (!msgText && event.message.attachments && event.message.attachments.length > 0) {
        const attachment = event.message.attachments[0];
        if (attachment.type === 'image') {
          msgText = '🖼️ รูปภาพ';
          fbImageUrl = attachment.payload?.url || null;
        } else if (attachment.type === 'video') {
          msgText = '🎥 วิดีโอ';
        } else if (attachment.type === 'audio') {
          msgText = '🎤 เสียง';
        } else if (attachment.type === 'file') {
          msgText = '📎 ไฟล์แนบ';
          fbImageUrl = attachment.payload?.url || null;
        } else if (attachment.type === 'sticker') {
          msgText = '🎭 สติ๊กเกอร์';
          fbImageUrl = attachment.payload?.url || null;
        } else {
          msgText = '📎 ไฟล์แนบ';
        }
      } else if (!msgText) {
        msgText = '📎 ไฟล์แนบ';
      }

      const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const newMsg = { text: msgText, type: 'received', time };
      if (fbImageUrl) newMsg.imageUrl = fbImageUrl;

      try {
        // หาว่ามี conversation ของ user นี้อยู่แล้วไหม
        const { data: existConv } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('facebook_user_id', fbUserId)
          .single();

        let updatedConv = null;

        if (existConv) {
          const updatedMessages = [...(existConv.messages || []), newMsg];
          const { data: rows } = await supabase
            .from('chat_conversations')
            .update({ messages: updatedMessages, last_message: msgText, updated_at: new Date().toISOString() })
            .eq('id', existConv.id)
            .select('*');
          updatedConv = rows && rows[0] ? rows[0] : { ...existConv, messages: updatedMessages };
        } else {
          // ลูกค้าใหม่ — ดึงชื่อจาก Graph API
          let customerName = 'Facebook User';
          let avatarUrl = 'FB';
          if (fbToken) {
            try {
              const profileRes = await fetch(
                `https://graph.facebook.com/v21.0/${fbUserId}?fields=name,profile_pic&access_token=${fbToken}`
              );
              if (profileRes.ok) {
                const profile = await profileRes.json();
                customerName = profile.name || customerName;
                avatarUrl = profile.profile_pic || avatarUrl;
              }
            } catch (_) {}
          }

          const { data: inserted } = await supabase
            .from('chat_conversations')
            .insert([{
              facebook_user_id: fbUserId,
              facebook_account_id: fbAccountId,
              channel: 'facebook',
              customer: customerName,
              avatar: avatarUrl,
              messages: [newMsg],
              last_message: msgText
            }])
            .select('*');
          updatedConv = inserted && inserted[0] ? inserted[0] : null;
        }

        console.log(`📥 [FB] Message from [${fbUserId}]: ${msgText}`);

        // Emit ให้ Frontend อัปเดททันทีผ่าน Socket.io
        const io = req.app.get('io');
        if (io && updatedConv) {
          io.emit('conversation_updated', updatedConv);
          // 🆕 บรอดแคสต์แจ้งเตือนใหม่ทั่วทั้งแอป (Facebook)
          io.emit('new_notification', {
            type: 'chat',
            title: `แชทใหม่จาก FB: ${updatedConv.customer || 'ลูกค้า'}`,
            body: text || '(ส่งรูปภาพ)',
            time: 'เมื่อสักครู่'
          });
        } else if (io) {
          io.emit('force_refresh', { reason: 'fb_new_message' });
        }

        // --- Trigger Auto Reply (Facebook) ---
        if (updatedConv && msgText) {
          checkAndSendAutoReply(req, updatedConv.id, msgText);
        }
      } catch (err) {
        console.error('[FB] Webhook processing error:', err.message);
      }
    }
  }
};

// ── 4. อัปโหลดรูปภาพ ──────────────────────────────
exports.uploadImage = async (req, res) => {
  const supabase = req.app.get('supabase');
  const io = req.app.get('io');
  const { conversationId } = req.body;

  if (!req.file || !conversationId) {
    return res.status(400).json({ success: false, error: 'File and conversationId are required' });
  }

  try {
    // 1. ดึง conversation
    const { data: conv, error: fetchErr } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    if (fetchErr) throw fetchErr;

    // 2. เก็บเป็น relative path สำหรับ Frontend, ใช้ PUBLIC_URL สำหรับ LINE
    const filename = req.file.filename;
    const imageRelPath = `/uploads/${filename}`; // เก็บใน DB, Frontend ต่อเอง
    const publicUrl = process.env.PUBLIC_URL || lastSeenPublicUrl || `http://localhost:${process.env.PORT || 5000}`;
    const lineImageUrl = `${publicUrl}${imageRelPath}`; // ใช้ไปส่ง LINE

    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute:'2-digit' });
    const newMsg = { text: '🖼️ ส่งรูปภาพ', imageUrl: imageRelPath, type: 'sent', time };

    const messages = [...(conv.messages || []), newMsg];

    // 3. เซฟลง Database
    const { data: updateData, error: updateErr } = await supabase.from('chat_conversations')
      .update({ messages, last_message: '[รูปภาพ]', updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select();
    if (updateErr) throw updateErr;

    // 4. ส่งไป LINE แบบ ImageMessage (LINE API requires HTTPS url)
    if (conv.line_user_id) {
      let token = process.env.LINE_ACCESS_TOKEN;
      if (conv.line_account_id) {
        const { data: lineAcc } = await supabase.from('line_accounts').select('access_token').eq('id', conv.line_account_id).single();
        if (lineAcc && lineAcc.access_token) token = lineAcc.access_token;
      }

      if (token) {
        if (!lineImageUrl.startsWith('https')) {
           await fetch('https://api.line.me/v2/bot/message/push', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
             body: JSON.stringify({
               to: conv.line_user_id,
               messages: [{ type: 'text', text: '[แอดมินส่งรูปภาพ โปรดรอชั่วครู่]' }]
             })
           });
        } else {
           await fetch('https://api.line.me/v2/bot/message/push', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
             body: JSON.stringify({
               to: conv.line_user_id,
               messages: [{ type: 'image', originalContentUrl: lineImageUrl, previewImageUrl: lineImageUrl }]
             })
           });
        }
      }
    }

    // 5. แจ้ง Frontend ผ่าน Socket.io
    if (io) {
      // fetch full updated conversation and send it
      try {
        const { data: refetched } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('id', conversationId)
          .single();
        if (refetched) {
          io.emit('conversation_updated', refetched);
        } else {
          io.emit('force_refresh', { reason: 'upload' });
        }
      } catch (_) {
        io.emit('force_refresh', { reason: 'upload' });
      }
    }

    res.status(200).json({ success: true, data: newMsg });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
};

// ── 8. Delete a Single Message (ลบเฉพาะ 1 ข้อความ) ────────────────
exports.deleteMessage = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { id, index } = req.params;

  try {
    const { data: conv, error: fetchErr } = await supabase.from('chat_conversations').select('*').eq('id', id).single();
    if (fetchErr || !conv) throw new Error('Conversation not found');

    const msgs = [...(conv.messages || [])];
    const msgIndex = parseInt(index, 10);
    if (msgIndex < 0 || msgIndex >= msgs.length) {
      return res.status(400).json({ success: false, error: 'Invalid message index' });
    }

    // ลบข้อความออกจาก Array
    msgs.splice(msgIndex, 1);
    
    // หา last message ใหม่ ถ้า Array ว่างก็จะเป็นค่าว่าง
    const lastMessageObj = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    let newLastMessage = lastMessageObj ? (lastMessageObj.text || (lastMessageObj.imageUrl ? '[รูปภาพ]' : '[ข้อความ]')) : '';

    const { data: updatedData, error: updateErr } = await supabase
      .from('chat_conversations')
      .update({ messages: msgs, last_message: newLastMessage })
      .eq('id', id)
      .select('*');
      
    if (updateErr) throw updateErr;

    // แจ้งเตือน WebSockets
    const io = req.app.get('io');
    if (io && updatedData && updatedData[0]) {
      io.emit('conversation_updated', updatedData[0]);
    }

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Delete Message Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 9. Delete an Entire Conversation (ลบทั้งห้องแชท) ───────────────
exports.deleteConversation = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { id } = req.params;

  try {
    const { error } = await supabase.from('chat_conversations').delete().eq('id', id);
    if (error) throw error;

    // แจ้งให้ Frontend รู้ว่าให้รีเฟรช / ขจัดแชทนี้ออกจาก list
    const io = req.app.get('io');
    if (io) {
      io.emit('force_refresh', { reason: 'conversation_deleted' });
    }

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (err) {
    console.error('Delete Conversation Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
