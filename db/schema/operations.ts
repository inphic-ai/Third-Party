import { pgTable, uuid, varchar, text, boolean, integer, decimal, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { vendors } from './vendor';

// ============================================
// 列舉定義 (Enums)
// ============================================

export const contactStatusEnum = pgEnum('contact_status', [
  'SUCCESS',
  'BUSY',
  'TOO_HIGH',
  'NO_TIME',
  'BAD_ATTITUDE',
  'RESERVED'
]);

export const maintenanceStatusEnum = pgEnum('maintenance_status', [
  'COMPLETED',
  'IN_PROGRESS',
  'ARCHIVED',
  'PENDING'
]);

export const taskPriorityEnum = pgEnum('task_priority', [
  'HIGH',
  'MEDIUM',
  'LOW'
]);

export const taskStatusEnum = pgEnum('task_status', [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
]);

// ============================================
// 聯繫紀錄 (ContactLog)
// ============================================

export const contactLogs = pgTable('contact_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id'),
  
  date: timestamp('date').notNull(),
  status: contactStatusEnum('status').notNull(),
  note: text('note').notNull(),
  aiSummary: text('ai_summary'),
  
  nextFollowUp: timestamp('next_follow_up'),
  isReservation: boolean('is_reservation').default(false),
  reservationTime: timestamp('reservation_time'),
  
  quoteAmount: decimal('quote_amount', { precision: 10, scale: 2 }),
  relatedProductId: uuid('related_product_id'),
  
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// 維修紀錄 (MaintenanceRecord)
// ============================================

export const maintenanceRecords = pgTable('maintenance_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: varchar('case_id', { length: 50 }).notNull().unique(),
  
  date: timestamp('date').notNull(),
  deviceName: varchar('device_name', { length: 100 }).notNull(),
  deviceNo: varchar('device_no', { length: 50 }).notNull(),
  
  vendorName: varchar('vendor_name', { length: 100 }).notNull(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  
  status: maintenanceStatusEnum('status').notNull(),
  description: text('description').notNull(),
  productTags: text('product_tags').array().notNull(),
  
  // 使用 JSONB 儲存 MediaItem 陣列
  beforePhotos: jsonb('before_photos').notNull(), // MediaItem[]
  afterPhotos: jsonb('after_photos').notNull(), // MediaItem[]
  
  aiReport: text('ai_report'),
  
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// 日常任務 (Task)
// ============================================

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  
  priority: taskPriorityEnum('priority').notNull().default('MEDIUM'),
  status: taskStatusEnum('status').notNull().default('PENDING'),
  
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  
  assignedTo: uuid('assigned_to'),
  vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
  
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
