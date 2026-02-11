import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

// ============================================
// 系統設定表 (System Settings)
// ============================================

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  description: text('description'),
  dataType: varchar('data_type', { length: 20 }).notNull(), // 'string', 'number', 'boolean', 'json'
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: uuid('updated_by'), // 可選，記錄最後修改者
});
