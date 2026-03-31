// ==========================================
// lineAccountController.js – Manage LINE OAs
// ==========================================

// @desc    Get all LINE accounts
// @route   GET /api/line-accounts
exports.getLineAccounts = async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    const { data, error } = await supabase
      .from('line_accounts')
      .select('*')
      .order('created_at', { ascending: false });

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
    const { data, error } = await supabase
      .from('line_accounts')
      .insert([{ name, channel_secret, access_token, picture_url }])
      .select('*')
      .single();

    if (error) throw error;
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
