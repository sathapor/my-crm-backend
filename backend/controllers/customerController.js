// ============================================================
// customerController.js – Full Supabase CRM CRUD
// ============================================================



exports.getCustomers = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { tag } = req.query;

  try {
    let query = supabase.from('customers').select('*').order('total_spent', { ascending: false });
    if (tag && tag !== 'all') {
      query = query.contains('tags', [tag]);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error('⚠️ Customers Fetch Error:', err.message);
    res.status(500).json({ success: false, error: 'Database error while fetching customers' });
  }
};

exports.createCustomer = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { name, phone, email, tags } = req.body;

  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([{ name, phone, email: email || null, tags: tags || ['NEW'], total_spent: 0, order_count: 0 }])
      .select();
    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (err) {
    console.error('⚠️ Customers Create Error:', err.message);
    res.status(500).json({ success: false, error: 'Database error while creating customer' });
  }
};

exports.updateCustomer = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { id } = req.params;
  const { name, phone, email, tags } = req.body;

  try {
    const { data, error } = await supabase
      .from('customers')
      .update({ name, phone, email: email || null, tags })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Customer not found');
    res.status(200).json({ success: true, data: data[0] });
  } catch (err) {
    console.error('⚠️ Customers Update Error:', err.message);
    res.status(500).json({ success: false, error: 'Database error while updating customer' });
  }
};

exports.deleteCustomer = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { id } = req.params;

  try {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    res.status(200).json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    console.error('⚠️ Customers Delete Error:', err.message);
    res.status(500).json({ success: false, error: 'Database error while deleting customer' });
  }
};
