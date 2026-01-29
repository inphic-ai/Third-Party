/**
 * Cloudflare R2 Storage Service
 * 此檔案僅在伺服器端執行，負責處理圖片上傳到 R2
 */

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

/**
 * 上傳圖片到 R2
 * @param file - base64 編碼的圖片資料（包含 data:image/...;base64, 前綴）
 * @param fileName - 檔案名稱
 * @returns 圖片的公開 URL
 */
export async function uploadImageToR2(
  base64Data: string,
  fileName: string
): Promise<string> {
  try {
    // 解析 base64 資料
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 data');
    }

    const contentType = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, 'base64');

    // 生成唯一的檔案名稱
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = contentType.split('/')[1] || 'jpg';
    const key = `maintenance/${timestamp}-${randomStr}-${fileName}.${extension}`;

    // 上傳到 R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    // 返回公開 URL
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('Failed to upload image to R2:', error);
    throw new Error('Image upload failed');
  }
}

/**
 * 批次上傳圖片到 R2
 * @param photos - 包含 base64 資料的照片陣列
 * @returns 包含 R2 URL 的照片陣列
 */
export async function uploadPhotosToR2(
  photos: { url: string; description?: string }[]
): Promise<{ id: string; url: string; description?: string; type: 'image'; uploadedAt: string }[]> {
  const uploadedPhotos = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    try {
      // 上傳到 R2
      const r2Url = await uploadImageToR2(photo.url, photo.description || `photo-${i}`);

      uploadedPhotos.push({
        id: `photo-${Date.now()}-${i}`,
        url: r2Url,
        description: photo.description || `施工前 ${i + 1}`,
        type: 'image' as const,
        uploadedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Failed to upload photo ${i}:`, error);
      // 繼續上傳其他照片
    }
  }

  return uploadedPhotos;
}
