import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// ============================================
// 列舉定義 (Enums)
// ============================================

export const loginStatusEnum = pgEnum('login_status', ['SUCCESS', 'FAILED']);

// ============================================
// 登入日誌 (LoginLog)
// ============================================

export const loginLogs = pgTable('login_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  userId: uuid('user_id'), // 可能為 null（登入失敗時）
  email: varchar('email', { length: 100 }).notNull(),
  userName: varchar('user_name', { length: 100 }), // 可能為 null（登入失敗時）
  
  ip: varchar('ip', { length: 45 }).notNull(), // IPv4/IPv6
  userAgent: text('user_agent').notNull(),
  
  // 從 User-Agent 解析出來的資訊
  browser: varchar('browser', { length: 50 }), // Chrome, Safari, Firefox, Edge
  os: varchar('os', { length: 50 }), // Mac, Windows, iPhone, Android
  device: varchar('device', { length: 100 }), // 組合顯示用，如 "Chrome / Mac"
  
  status: loginStatusEnum('status').notNull(),
  failureReason: text('failure_reason'), // 失敗原因
  
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
