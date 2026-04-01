// ==========================================
// lineAccountController.js – Manage LINE OAs
// ==========================================

// @desc    Get all LINE accounts
// @route   GET /api/line-accounts
exports.getLineAccounts = async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    let query = supabase
      .from('line_accounts')
      .select('*');

    // 🛡️ Multi-tenant Security: กรองเฉพาะของ User คนนี้ หรือข้อมูลเก่าที่ยังไม่มีเจ้าของ (Legacy data)
    const userId = req.user?.id;
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error('getLineAccounts error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Add a new LINE account
// @route   POST /api/line-accounts
exports.addLineAccount = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { name, channel_secret, access_token, picture_url } = req.body;

  if (!name || !channel_secret || !access_token) {
    return res.status(400).json({ success: false, error: 'Please provide name, channel secret, and access token' });
  }

  try {
    // 🛡️ ระบุเจ้าของด้วย
    const userId = req.user?.id;

    const { data, error } = await supabase
      .from('line_accounts')
      .insert([{ name, channel_secret, access_token, picture_url, user_id: userId }])
      .select('*')
      .single();

    if (error) throw error;

    // ── Auto-register Webhook URL ไปยัง LINE Messaging API ──
    // เหมือน Page365 คือกดบันทึกแล้วระบบตั้งค่า Webhook ให้เองทันที
    const publicUrl = process.env.PUBLIC_URL || '';
    if (publicUrl && data?.id) {
      const webhookUrl = `${publicUrl}/api/chats/webhook/${data.id}`;
      try {
        const lineRes = await fetch('https://api.line.me/v2/bot/channel/webhook/endpoint', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
          },
          body: JSON.stringify({ webhookEndpointUrl: webhookUrl })
        });
        const lineData = await lineRes.json();
        if (lineRes.ok) {
          console.log(`✅ [LINE] Auto-registered webhook URL: ${webhookUrl}`);
        } else {
          console.warn(`⚠️ [LINE] Could not auto-register webhook:`, lineData);
        }
      } catch (webhookErr) {
        console.warn('[LINE] Webhook registration error:', webhookErr.message);
      }
    }

    res.status(201).json({ success: true, data });

  } catch (err) {
    console.error('addLineAccount error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete a LINE account
// @route   DELETE /api/line-accounts/:id
exports.deleteLineAccount = async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    const { error } = await supabase
      .from('line_accounts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error('deleteLineAccount error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
