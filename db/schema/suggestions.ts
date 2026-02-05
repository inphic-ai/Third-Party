import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// ============================================
// 列舉定義 (Enums)
// ============================================

export const suggestionStatusEnum = pgEnum('suggestion_status', ['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'COMPLETED']);
export const suggestionPageEnum = pgEnum('suggestion_page', ['客戶管理', '設備管理', '工單系統', '統計報表', '訂單中心', '其他']);
export const suggestionImpactEnum = pgEnum('suggestion_impact', ['幾乎不影響', '偶爾會卡住', '幾乎每天都會遇到', '會直接影響成交/作業效率']);
export const suggestionUrgencyEnum = pgEnum('suggestion_urgency', ['可慢慢來', '近期希望改善', '很急，已影響工作']);

// ============================================
// 功能建議 (Suggestion)
// ============================================

export const suggestions = pgTable('suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // 提交者資訊
  submitterId: uuid('submitter_id').notNull(), // 關聯到 admin_users
  submitterName: varchar('submitter_name', { length: 50 }).notNull(),
  submitterEmail: varchar('submitter_email', { length: 100 }).notNull(),
  
  // 建議內容
  problem: text('problem'), // 你現在遇到什麼問題？
  improvement: text('improvement').notNull(), // 你希望系統怎麼幫你改善？（必填）
  page: suggestionPageEnum('page').notNull(), // 發生問題的頁面是？
  impact: suggestionImpactEnum('impact').notNull(), // 影響程度？
  consequence: text('consequence'), // 如果不改，會發生什麼後果？
  urgency: suggestionUrgencyEnum('urgency').notNull(), // 你覺得這個修改急不急？
  
  // 附件
  attachments: text('attachments').array().default([]), // 圖片/影片 URL 陣列
  
  // 狀態與審核
  status: suggestionStatusEnum('status').default('PENDING').notNull(),
  reviewerId: uuid('reviewer_id'), // 審核者 ID
  reviewerName: varchar('reviewer_name', { length: 50 }),
  reviewNote: text('review_note'), // 審核備註
  reviewedAt: timestamp('reviewed_at'),
  
  // 時間戳記
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
