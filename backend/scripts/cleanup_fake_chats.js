/**
 * cleanup_fake_chats.js
 * ลบข้อมูลแชทปลอมออกจาก Supabase
 * LINE User ID จริงๆ จะขึ้นต้นด้วย 'U' และยาว 33 ตัวอักษร
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// LINE User ID จริงๆ ขึ้นต้นด้วย 'U' และมีความยาว 33 ตัวอักษรเสมอ
function isRealLineUserId(id) {
  return typeof id === 'string' && id.startsWith('U') && id.length === 33;
}

async function main() {
  console.log('🔍 กำลังดึงข้อมูล chat_conversations ทั้งหมดจาก Supabase...\n');

  const { data: allChats, error: fetchErr } = await supabase
    .from('chat_conversations')
    .select('id, customer, line_user_id, created_at')
    .order('created_at', { ascending: true });

  if (fetchErr) {
    console.error('❌ ดึงข้อมูลไม่สำเร็จ:', fetchErr.message);
    process.exit(1);
  }

  console.log(`📋 พบข้อมูลทั้งหมด ${allChats.length} รายการ:`);
  allChats.forEach(c => {
    const isReal = isRealLineUserId(c.line_user_id);
    console.log(`  ${isReal ? '✅ จริง' : '❌ ปลอม'} [${c.id}] "${c.customer}" | line_user_id: ${c.line_user_id || '(ไม่มี)'} (len=${c.line_user_id?.length || 0})`);
  });

  const fakeChats = allChats.filter(c => !isRealLineUserId(c.line_user_id));

  if (fakeChats.length === 0) {
    console.log('\n✨ ไม่พบข้อมูลปลอม ฐานข้อมูลมีแต่ข้อมูลจาก LINE OA จริงๆ!');
    return;
  }

  const fakeIds = fakeChats.map(c => c.id);
  console.log(`\n🗑️  กำลังลบข้อมูลปลอม ${fakeIds.length} รายการ...`);
  fakeChats.forEach(c => console.log(`   - "${c.customer}" (${c.line_user_id})`));

  const { error: deleteErr } = await supabase
    .from('chat_conversations')
    .delete()
    .in('id', fakeIds);

  if (deleteErr) {
    console.error('❌ ลบไม่สำเร็จ:', deleteErr.message);
    process.exit(1);
  }

  console.log(`\n✅ ลบข้อมูลปลอมออก ${fakeIds.length} รายการเรียบร้อยแล้ว!`);
  
  // แสดงข้อมูลที่เหลืออยู่
  const { data: remaining } = await supabase
    .from('chat_conversations')
    .select('customer, line_user_id')
    .order('created_at', { ascending: true });
  
  console.log(`\n📊 ข้อมูลที่เหลือจาก LINE OA จริง: ${remaining?.length || 0} รายการ`);
  remaining?.forEach(c => console.log(`   ✅ "${c.customer}" (${c.line_user_id})`));
}

main().catch(console.error);
