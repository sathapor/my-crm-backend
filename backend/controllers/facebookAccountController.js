// ============================================================
// facebookAccountController.js – Manage Facebook Pages
// ============================================================

// @desc    Get all Facebook accounts
// @route   GET /api/facebook-accounts
exports.getFacebookAccounts = async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    const { data, error } = await supabase
      .from('facebook_accounts')
      .select('id, name, page_id, verify_token, picture_url, created_at')
      .order('created_at', { ascending: false });
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
    // 1. สั่งให้ Facebook ส่ง Webhook มาหาแอปเรา (Auto-subscribe)
    // นี่คือสิ่งที่ทำให้เหมือน Page365 คือกดเชื่อมต่อแล้วข้อความเริ่มเข้าทันที
    try {
      const fields = 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads,messaging_referrals';
      const subRes = await fetch(`https://graph.facebook.com/v18.0/${page_id}/subscribed_apps?subscribed_fields=${fields}&access_token=${access_token}`, {
        method: 'POST'
      });
      const subData = await subRes.json();
      if (!subRes.ok) console.warn('[FB] Auto-subscription warning:', subData);
      else console.log('[FB] Auto-subscription success for page:', name);
    } catch (err) {
      console.warn('[FB] Could not auto-subscribe page:', err.message);
    }

    // 2. บันทึกลง Database
    const { data, error } = await supabase
      .from('facebook_accounts')
      .insert([{ name, page_id, access_token, verify_token, app_secret: app_secret || null, picture_url: picture_url || null }])
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
