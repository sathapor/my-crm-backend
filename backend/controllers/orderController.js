// ============================================================
// orderController.js – Full Supabase CRUD + CSV Export
// ============================================================



exports.getOrders = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { status, limit = 100, offset = 0 } = req.query;

  try {
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.status(200).json({ success: true, data, total: count });
  } catch (error) {
    console.error('⚠️ Orders Fetch Error:', error.message);
    res.status(500).json({ success: false, error: 'Database error while fetching orders' });
  }
};

exports.createOrder = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { customer_name, total_amount, payment_method, address, note } = req.body;
  const order_id = `ORD-${Date.now().toString().slice(-6)}`;

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        order_id,
        customer_name: customer_name || 'ลูกค้าทั่วไป',
        total_amount: Number(total_amount) || 0,
        payment_method: payment_method || 'โอนเงินสลิป',
        address: address || 'กรุงเทพมหานคร',
        status: 'รอชำระเงิน',
        shipping_status: 'รอจัดส่ง',
        note: note || null
      }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('⚠️ Orders Create Error:', error.message);
    res.status(500).json({ success: false, error: 'Database error while creating order' });
  }
};

exports.updateOrder = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { id } = req.params;
  const updates = req.body;

  try {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Order not found');
    res.status(200).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('⚠️ Orders Update Error:', error.message);
    res.status(500).json({ success: false, error: 'Database error while updating order' });
  }
};

exports.deleteOrder = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { id } = req.params;

  try {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
    res.status(200).json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error('⚠️ Orders Delete Error:', error.message);
    res.status(500).json({ success: false, error: 'Database error while deleting order' });
  }
};

// ── CSV Export ────────────────────────────────────────────────
exports.exportCSV = async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const headers = ['รหัสออเดอร์', 'ชื่อลูกค้า', 'สถานะ', 'วิธีชำระเงิน', 'ยอดรวม', 'ที่อยู่', 'วันที่สั่ง'];
    const rows = orders.map(o => [
      o.order_id, o.customer_name, o.status, o.payment_method,
      o.total_amount, o.address || '-', new Date(o.created_at).toLocaleDateString('th-TH')
    ]);

    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="orders_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('⚠️ Export CSV Error:', err.message);
    res.status(500).json({ success: false, error: 'Error generating CSV' });
  }
};
