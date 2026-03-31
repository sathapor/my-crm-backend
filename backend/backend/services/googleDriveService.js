const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const FOLDER_ID = '1z5tYGx3K1x3uD1V1YrBfWS8tOBtVJOdP';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-credentials.json');

let driveApi = null;

if (fs.existsSync(CREDENTIALS_PATH)) {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  driveApi = google.drive({ version: 'v3', auth });
} else {
  console.log('⚠️ google-credentials.json not found. Using Mock Drive Upload.');
}

exports.uploadImageToDrive = async (filePath, mimeType, originalName) => {
  if (!driveApi) {
    console.warn('⚠️ No google-credentials.json found. Mocking successful upload to Google Drive.');
    // Return a mock URL for MVP testing
    return {
      success: true,
      url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&w=400&q=80',
      fileId: 'mock-id-123'
    };
  }

  try {
    const fileMetadata = {
      name: `Upload_${Date.now()}_${originalName}`,
      parents: [FOLDER_ID],
    };
    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };

    const file = await driveApi.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    // ให้สิทธิ์การดูแบบ public เพื่อที่เราจะสามารถนำลิงก์ไปส่งให้ LINE ผ่าน API ได้
    await driveApi.permissions.create({
      fileId: file.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    return {
      success: true,
      // webContentLink จะทำให้โหลดภาพตรงๆ ได้ในบางกรณี แต่ใน LINE Messaging API อาจต้อง proxy ผ่าน backend ของเราเองถ้า URL ไม่ผ่าน
      url: file.data.webContentLink || file.data.webViewLink,
      fileId: file.data.id
    };
  } catch (err) {
    console.error('Google Drive Upload Error:', err.message);
    throw err;
  }
};
