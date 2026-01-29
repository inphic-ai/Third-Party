// 備份檔案：原始假數據（2026-01-28）
// 此檔案保留原始的 MOCK_MAINTENANCE 資料，供未來參考使用

import { MaintenanceRecord, MaintenanceStatus } from './types';

export const MOCK_MAINTENANCE_BACKUP: MaintenanceRecord[] = [
  {
    id: 'm-1',
    caseId: 'CASE-202405-001',
    date: '2024-05-10',
    deviceName: '主會客室中央空調系統',
    deviceNo: 'HVAC-A01-X99',
    vendorName: '大發水電工程行',
    vendorId: 'C2024001',
    status: MaintenanceStatus.COMPLETED,
    description: '空調壓縮機運轉音過大，經檢查為軸承磨損。已更換原廠軸承並重新充填冷媒。',
    productTags: ['冷氣空調', '動力設備'],
    beforePhotos: [
      { id: 'b1', url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '檢查內部軸承鏽蝕' },
      { id: 'b1-2', url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '冷媒壓力異常讀數' },
      { id: 'b1-3', url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '壓縮機外觀檢查' },
      { id: 'b1-4', url: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '電路板檢測' },
      { id: 'b1-5', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '冷凝器清潔前' },
      { id: 'b1-6', url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '管路檢查' },
      { id: 'b1-7', url: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '風扇葉片檢查' },
      { id: 'b1-8', url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '溫度感測器測試' },
      { id: 'b1-9', url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '控制面板檢查' },
      { id: 'b1-10', url: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '排水管路檢查' },
      { id: 'b1-11', url: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '電源線路檢查' },
      { id: 'b1-12', url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '保護裝置測試' },
      { id: 'b1-13', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '絕緣電阻測試' },
      { id: 'b1-14', url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '接地電阻測試' },
      { id: 'b1-15', url: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '最終檢查報告' }
    ],
    afterPhotos: [
      { id: 'a1', url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-10', description: '完工後運轉測試' }
    ],
    aiReport: '本次維修主要更換易損零件，預計可延長設備壽命約 24 個月。建議下次定期保養時加強潤滑。'
  },
  {
    id: 'm-2',
    caseId: 'CASE-202405-005',
    date: '2024-05-15',
    deviceName: '員工休息區落地窗玻璃',
    deviceNo: 'GLS-B02-01',
    vendorName: '大發水電工程行',
    vendorId: 'C2024001',
    status: MaintenanceStatus.ARCHIVED,
    description: '玻璃出現裂痕，具安全性疑慮。已進行整片更換為強化玻璃。',
    productTags: ['玻璃工程', '裝修'],
    beforePhotos: [
      { id: 'b2', url: 'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-15', description: '裂痕分佈情況' }
    ],
    afterPhotos: [
      { id: 'a2', url: 'https://images.unsplash.com/photo-1527264835624-91337446e534?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-15', description: '安裝完成' },
      { id: 'a2-2', url: 'https://images.unsplash.com/photo-1521133573832-34c1040e8101?auto=format&fit=crop&q=80&w=800', type: 'image', uploadedAt: '2024-05-15', description: '密封膠收邊檢查' }
    ],
    aiReport: '已由普通玻璃升級為 8mm 強化玻璃，耐衝擊係數提升 300%。'
  }
];
