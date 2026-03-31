require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function mockChats() {
  console.log("Starting mock chat insertion...");

  const mockData = [
    {
      line_user_id: 'mock_line_id_1',
      customer: 'สถาพร แสงสุรกูล',
      avatar: 'ส',
      is_vip: false,
      last_message: 'รอพัสดุครับ',
      messages: [
        { text: 'สวัสดีครับ สนใจสั่งของครับ', type: 'received', time: '10:00' },
        { text: 'ยินดีครับ รับสินค้าตัวไหนดีครับ?', type: 'sent', time: '10:02' },
        { text: 'ขอแบบในรูปเลยครับ', type: 'received', time: '10:05' },
        { text: 'ได้ครับ ผมสรุปยอดให้นะครับ', type: 'sent', time: '10:06' },
        { text: 'รอพัสดุครับ', type: 'received', time: '17:10' }
      ]
    },
    {
      line_user_id: 'mock_line_id_2',
      customer: 'ธนกฤต จิตรนอก',
      avatar: 'ธ',
      is_vip: false,
      last_message: 'โอนเงินแล้วนะครับ',
      messages: [
        { text: 'สอบถามสินค้าตัวนี้ครับ', type: 'received', time: '09:00' },
        { text: 'ยังมีของครับผม', type: 'sent', time: '09:15' },
        { text: 'รับ 1 ชิ้นครับ ส่งแฟลชได้ไหม', type: 'received', time: '09:30' },
        { text: 'ได้ครับผม ยอดทั้งหมด 200 บาทครับ', type: 'sent', time: '09:35' },
        { text: 'โอนเงินแล้วนะครับ', type: 'received', time: '10:44' }
      ]
    }
  ];

  for (const user of mockData) {
    // Check if exists
    const { data: existing } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('customer', user.customer)
      .single();

    if (existing) {
      console.log(`User ${user.customer} already exists. Skipping.`);
    } else {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert([user])
        .select();
      
      if (error) {
        console.error(`Error inserting ${user.customer}:`, error.message);
      } else {
        console.log(`Successfully inserted ${user.customer}`);
      }
    }
  }

  console.log("Mock completed.");
}

mockChats();
