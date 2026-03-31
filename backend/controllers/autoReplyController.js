const getSupabase = (req) => req.app.get('supabase');

exports.getAutoReplies = async (req, res) => {
  const supabase = getSupabase(req);
  try {
    const { data, error } = await supabase.from('auto_replies').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching auto replies:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createAutoReply = async (req, res) => {
  const supabase = getSupabase(req);
  const { keyword, reply_text, is_active } = req.body;
  
  if (!keyword || !reply_text) {
    return res.status(400).json({ success: false, error: 'keyword and reply_text are required' });
  }

  try {
    const { data, error } = await supabase.from('auto_replies').insert([{ 
      keyword, 
      reply_text, 
      is_active: is_active !== undefined ? is_active : true 
    }]).select();
    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (err) {
    console.error('Error creating auto reply:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateAutoReply = async (req, res) => {
  const supabase = getSupabase(req);
  const { id } = req.params;
  const { keyword, reply_text, is_active } = req.body;

  try {
    const updates = {};
    if (keyword !== undefined) updates.keyword = keyword;
    if (reply_text !== undefined) updates.reply_text = reply_text;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase.from('auto_replies').update(updates).eq('id', id).select();
    if (error) throw error;
    if (!data.length) return res.status(404).json({ success: false, error: 'Not found' });
    
    res.json({ success: true, data: data[0] });
  } catch (err) {
    console.error('Error updating auto reply:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteAutoReply = async (req, res) => {
  const supabase = getSupabase(req);
  const { id } = req.params;

  try {
    const { error } = await supabase.from('auto_replies').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error deleting auto reply:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
