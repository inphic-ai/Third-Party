import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// 環境變數
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'partnerlink-pro';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

// 創建 S3 Client（R2 相容 S3 API）
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return json({ error: '沒有檔案' }, { status: 400 });
    }
    
    // 驗證檔案類型
    if (!file.type.startsWith('image/')) {
      return json({ error: '只能上傳圖片檔案' }, { status: 400 });
    }
    
    // 驗證檔案大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return json({ error: '圖片大小不能超過 5MB' }, { status: 400 });
    }
    
    // 生成唯一檔名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'jpg';
    const key = `announcements/${timestamp}-${randomStr}.${ext}`;
    
    // 將檔案轉換為 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    try {
      // 上傳到 R2
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      });
      
      await r2Client.send(command);
      
      // 返回公開 URL
      const url = `${R2_PUBLIC_URL}/${key}`;
      
      return json({ url, success: true });
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      return json({ error: '圖片上傳失敗' }, { status: 500 });
    }
  } catch (error) {
    console.error('API upload error:', error);
    return json({ error: '處理失敗' }, { status: 500 });
  }
}
