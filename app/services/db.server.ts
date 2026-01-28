
/**
 * DB & Storage Server Module
 * 此檔案僅在伺服器端執行，負責處理 Postgres 溝通與 R2 授權
 */

import { MaintenanceStatus, PaymentStatus, Region, ServiceType } from "../types";

// 模擬 R2 簽名 URL 生成
export async function getSignedR2Url(key: string) {
  // 實際環境：return await getSignedUrl(r2Bucket, new GetObjectCommand({ Bucket: 'assets', Key: key }), { expiresIn: 3600 });
  return `https://r2-mock-storage.com/${key}?token=signed_at_${Date.now()}`;
}

// 模擬 Postgres 資料庫操作
export const db = {
  maintenance: {
    findMany: async () => {
      // 這裡模擬從 Postgres 讀取並經過 R2 簽名的數據
      return [
        {
          id: 'm-1',
          caseId: 'CASE-202405-001',
          date: '2024-05-10',
          deviceName: '主會客室中央空調系統',
          deviceNo: 'HVAC-A01-X99',
          vendorName: '大發水電工程行',
          status: MaintenanceStatus.COMPLETED,
          productTags: ['空調', '動力設備'],
          beforePhotos: [
            { id: 'b1', url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc', description: '檢查內部軸承鏽蝕' },
            { id: 'b2', url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837', description: '冷媒壓力異常讀數' }
          ],
          afterPhotos: [
            { id: 'a1', url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1', description: '完工後運轉測試' }
          ],
        }
      ];
    },
    create: async (data: any) => {
      console.log("Postgres Insert:", data);
      return { success: true };
    }
  },
  announcements: {
    findMany: async () => {
      return [
        { id: '1', title: '2024 年度廠商評鑑開始', content: '請各部門於月底前完成主要合作廠商的年度評分。', date: '2024-05-20', priority: 'High', targetIdentity: [ServiceType.LABOR] },
        { id: '2', title: '華南地區報關流程更新', content: '針對大陸地區廠商有新格式要求。', date: '2024-05-18', priority: 'Normal', targetRegion: Region.CHINA }
      ];
    }
  }
};
