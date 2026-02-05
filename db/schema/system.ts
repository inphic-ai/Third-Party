import { pgTable, uuid, varchar, text, boolean, decimal, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';

// ============================================
// 列舉定義 (Enums)
// ============================================

export const priorityEnum = pgEnum('priority', ['HIGH', 'NORMAL']);
export const userRoleEnum = pgEnum('user_role', ['System Admin', 'Manager', 'Editor', 'Viewer']);
export const systemLogStatusEnum = pgEnum('system_log_status', ['UPDATE', 'CREATE', 'DELETE', 'SYSTEM']);

// ============================================
// 知識庫 (KnowledgeBaseItem)
// ============================================

export const knowledgeBaseItems = pgTable('knowledge_base_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  question: varchar('question', { length: 500 }).notNull(),
  answer: text('answer').notNull(),
  
  sourceTransactionId: uuid('source_transaction_id'),
  tags: text('tags').array().notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// 系統公告 (Announcement)
// ============================================

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  title: varchar('title', { length: 100 }).notNull(),
  content: text('content').notNull(),
  date: timestamp('date').notNull(),
  
  priority: priorityEnum('priority').notNull(),
  author: uuid('author'),
  
  tags: text('tags').array().default([]),
  targetIdentity: text('target_identity').array(), // ServiceType[]
  targetRegion: varchar('target_region', { length: 20 }), // Region
  
  imageUrl: text('image_url'), // Optional image URL for announcement
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// 人員權限 (AdminUser)
// ============================================

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  name: varchar('name', { length: 50 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  avatarUrl: text('avatar_url'),
  
  department: varchar('department', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull(),
  
  isActive: boolean('is_active').default(true),
  accumulatedBonus: decimal('accumulated_bonus', { precision: 10, scale: 2 }).default('0.00'),
  
  googleLinked: boolean('google_linked').default(false),
  googleEmail: varchar('google_email', { length: 100 }),
  
  // 使用 JSONB 儲存權限設定與安全設定
  permissions: jsonb('permissions').notNull(), // UserPermissions
  securitySettings: jsonb('security_settings'), // SecuritySettings
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at')
});

// ============================================
// 審計日誌 (SystemLog)
// ============================================

export const systemLogs = pgTable('system_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  user: uuid('user').notNull(),
  
  action: varchar('action', { length: 100 }).notNull(),
  target: varchar('target', { length: 200 }).notNull(),
  details: text('details').notNull(), // JSON 格式變更對比
  
  ip: varchar('ip', { length: 45 }).notNull(), // IPv4/IPv6
  userAgent: text('user_agent').notNull(),
  
  status: systemLogStatusEnum('status').notNull()
});

// ============================================
// 使用說明內容 (HelpContent)
// ============================================

export const helpContents = pgTable('help_contents', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  page: varchar('page', { length: 100 }).notNull().unique(), // 'tasks', 'vendors', etc.
  title: varchar('title', { length: 200 }).notNull(),
  subtitle: varchar('subtitle', { length: 200 }),
  content: text('content').notNull(),
  principleTitle: varchar('principle_title', { length: 200 }),
  principleContent: text('principle_content'),
  
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
