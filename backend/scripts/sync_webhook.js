const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const port = process.env.PORT || 5000;
const lineToken = process.env.LINE_ACCESS_TOKEN;
const envPath = path.join(__dirname, '../.env');

if (!lineToken) {
  console.error("❌ LINE_ACCESS_TOKEN is missing in .env");
  process.exit(1);
}

// Helper: อัปเดท PUBLIC_URL ใน .env file
function updateEnvPublicUrl(url) {
  let content = fs.readFileSync(envPath, 'utf-8');
  if (content.includes('PUBLIC_URL=')) {
    content = content.replace(/PUBLIC_URL=.*/g, `PUBLIC_URL=${url}`);
  } else {
    content += `\nPUBLIC_URL=${url}`;
  }
  fs.writeFileSync(envPath, content);
  console.log(`📝 Updated .env => PUBLIC_URL=${url}`);
}

console.log("🚀 Starting Auto-Sync Webhook Script...");
console.log("⏳ Starting Localtunnel to connect real LINE to Backend...");

const lt = exec(`npx localtunnel --port ${port}`);

lt.stdout.on('data', async (data) => {
  const output = data.toString();
  console.log(output.trim());
  
  const match = output.match(/your url is: (https:\/\/[^\s]+)/);
  if (match) {
    const tunnelUrl = match[1];
    const webhookUrl = `${tunnelUrl}/api/chats/webhook`;
    
    console.log(`\n🔗 Tunnel is live! URL: ${tunnelUrl}`);

    // 1. เขียน PUBLIC_URL ลง .env เพื่อให้รูปภาพอัปโหลดใช้ URL จริง
    updateEnvPublicUrl(tunnelUrl);
    
    // 2. ตั้ง LINE Webhook อัตโนมัติ
    console.log(`🤖 Auto-configuring LINE Webhook to: ${webhookUrl}...`);
    
    try {
      const response = await fetch('https://api.line.me/v2/bot/channel/webhook/endpoint', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${lineToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint: webhookUrl })
      });
      
      if (response.ok) {
        console.log("✅ LINE Webhook synced!");
        console.log(`\n🎯 ระบบพร้อมแล้ว 100%:`);
        console.log(`   • Webhook URL  : ${webhookUrl}`);
        console.log(`   • Image Base   : ${tunnelUrl}/uploads/`);
        console.log(`   • ลูกค้าส่งแชท/รูปผ่าน LINE → ขึ้นหน้าจอ CRM ทันที`);
        console.log(`   • แอดมินส่งรูปผ่าน CRM → ลูกค้าเห็นใน LINE ทันที`);
        console.log(`\n⚠️  กรุณารอ ~3 วินาที ให้ Backend server restart รับ PUBLIC_URL ใหม่\n`);
      } else {
        const errText = await response.text();
        console.error("❌ Failed to set LINE webhook:", response.status, errText);
      }
    } catch (error) {
       console.error("❌ Error setting webhook:", error);
    }
  }
});

lt.stderr.on('data', (data) => console.error(data.toString()));
lt.on('close', (code) => {
  console.log(`⚠️  Localtunnel disconnected. กรุณารัน "npm run sync:webhook" ใหม่`);
  process.exit(code);
});
