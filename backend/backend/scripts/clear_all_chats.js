require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function main() {
  // ดึงรายการทั้งหมดก่อน
  const { data } = await supabase.from('chat_conversations').select('id');
  if (!data || data.length === 0) {
    console.log('ฐานข้อมูลว่างอยู่แล้ว!');
    process.exit(0);
  }
  const ids = data.map(r => r.id);
  console.log(`กำลังลบ ${ids.length} รายการ...`);

  const { error } = await supabase.from('chat_conversations').delete().in('id', ids);
  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
  console.log('✅ ลบข้อมูลแชทเก่าทั้งหมดออกแล้ว!');
  console.log('🎯 ระบบจะแสดงเฉพาะแชทที่มาจาก LINE OA จริงๆ เท่านั้น');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
