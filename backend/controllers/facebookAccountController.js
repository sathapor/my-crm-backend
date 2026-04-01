// ============================================================
// facebookAccountController.js – Manage Facebook Pages
// ============================================================

// @desc    Get all Facebook accounts
// @route   GET /api/facebook-accounts
exports.getFacebookAccounts = async (req, res) => {
  const supabase = req.app.get('supabase');
  const userId = req.user?.id; // ดึงจาก JWT Middleware

  try {
    let query = supabase
      .from('facebook_accounts')
      .select('id, name, page_id, verify_token, picture_url, created_at');
    
    // 🛡️ Multi-tenant Security: กรองเฉพาะของ User คนนี้เท่านั้น
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error('getFacebookAccounts error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Add a new Facebook Page
// @route   POST /api/facebook-accounts
exports.addFacebookAccount = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { name, page_id, access_token, verify_token, app_secret, picture_url } = req.body;

  if (!name || !page_id || !access_token || !verify_token) {
    return res.status(400).json({
      success: false,
      error: 'Please provide name, page_id, access_token, and verify_token'
    });
  }

  try {
    const publicUrl = process.env.PUBLIC_URL || '';

    // 1. ลงทะเบียน Webhook URL + Subscribe fields กับ Facebook Graph API อัตโนมัติ
    // เหมือน Page365 คือกดเชื่อมต่อแล้วข้อความเริ่มเข้าทันที ไม่ต้องไปกรอกใน Developer Console
    if (publicUrl) {
      try {
        const callbackUrl = `${publicUrl}/api/chats/facebook/webhook`;
        const verifyTokenToUse = verify_token || process.env.FACEBOOK_VERIFY_TOKEN || 'my_crm_verify_token';
        const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '202208148688114';
        const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || app_secret;

        // Subscribe the Page to receive Webhook events
        const fields = 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads,messaging_referrals';
        const subRes = await fetch(
          `https://graph.facebook.com/v21.0/${page_id}/subscribed_apps?subscribed_fields=${fields}&access_token=${access_token}`,
          { method: 'POST' }
        );
        const subData = await subRes.json();
        if (subRes.ok) console.log(`✅ [FB] Auto-subscribed page "${name}" to webhooks`);
        else console.warn('[FB] Auto-subscription warning:', subData);

      } catch (err) {
        console.warn('[FB] Could not auto-register webhook:', err.message);
      }
    }

    // 2. บันทึกลง Database - ใช้ upsert เพื่อรองรับการเชื่อมต่อซ้ำ (Reconnect)
    // โดยใช้ page_id เป็นตัวเช็คความซ้ำ (Conflict)
    const userId = req.user?.id;
    const { data, error } = await supabase
      .from('facebook_accounts')
      .upsert([{ 
        name, 
        page_id, 
        access_token, 
        verify_token, 
        user_id: userId, // 🛡️ ผูกกับ User ID ของผู้ที่ล็อกอิน
        app_secret: app_secret || null, 
        picture_url: picture_url || null,
        updated_at: new Date().toISOString()
      }], { onConflict: 'page_id' })
      .select('id, name, page_id, verify_token, picture_url, created_at')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });

  } catch (err) {
    console.error('addFacebookAccount error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete a Facebook Page
// @route   DELETE /api/facebook-accounts/:id
exports.deleteFacebookAccount = async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    const { error } = await supabase
      .from('facebook_accounts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error('deleteFacebookAccount error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
