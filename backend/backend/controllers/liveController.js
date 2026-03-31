// ============================================================
// liveController.js – Live Session + CF Orders in Supabase
// ============================================================

let mockLiveStream = {
  viewers: 1420,
  comments: [
    { id: 1, name: 'Somying J.', text: 'เริ่มยังคะแอด', type: 'normal' },
    { id: 2, name: 'ลูกชิ้น ปิ้ง', text: 'วันนี้มีโปรอะไรบ้าง ทัก', type: 'normal' },
    { id: 3, name: 'มิ้นท์', text: 'CF1 2 ชิ้นค่า', type: 'cf' }
  ]
};

exports.getLiveFeed = async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !data) throw new Error('No active session');
    res.status(200).json({ success: true, data: { viewers: data.viewer_count, comments: data.comments || [] } });
  } catch (err) {
    res.status(200).json({ success: true, data: mockLiveStream });
  }
};

// สร้าง CF Order จากการไลฟ์ → บันทึกใน Supabase orders table
exports.createCFOrder = async (req, res) => {
  const supabase = req.app.get('supabase');
  const { customer_name, code } = req.body;
  const order_id = `CF-${Date.now().toString().slice(-6)}`;

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        order_id,
        customer_name: customer_name || 'ลูกค้า Live',
        status: 'รอชำระเงิน',
        payment_method: 'โอนเงินสลิป',
        total_amount: 0,
        note: `CF Code: ${code}`
      }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (err) {
    console.warn('⚠️ Live CF Order: Supabase unavailable.', err.message);
    res.status(201).json({ success: true, data: { order_id, customer_name, code, status: 'รอชำระเงิน' } });
  }
};
