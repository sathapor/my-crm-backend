// ============================================================
// productController.js – Full Supabase CRUD + Category Filter
// ============================================================



exports.getProducts = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { category } = req.query;

  try {
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('⚠️ Products Fetch Error:', err.message);
    res.status(500).json({ success: false, error: 'Database error while fetching products' });
  }
};

exports.createProduct = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { name, sku, price, stock, category, description, image_url } = req.body;

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([{ name, sku, price: Number(price), stock: Number(stock), category: category || 'ทั่วไป', description: description || '', image_url: image_url || null }])
      .select();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('⚠️ Products Create Error:', err.message);
    res.status(500).json({ success: false, error: 'Database error while creating product' });
  }
};

exports.updateProduct = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { id } = req.params;
  const { name, sku, price, stock, category, description, image_url } = req.body;
  const updates = { name, sku, price: Number(price), stock: Number(stock), category: category || 'ทั่วไป', description: description || '' };
  if (image_url !== undefined) updates.image_url = image_url;

  try {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select();
    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('⚠️ Products Update Error:', err.message);
    res.status(500).json({ success: false, error: 'Database error while updating product' });
  }
};

exports.deleteProduct = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { id } = req.params;

  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('⚠️ Products Delete Error:', err.message);
    res.status(500).json({ success: false, error: 'Database error while deleting product' });
  }
};
