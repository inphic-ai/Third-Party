import { pgTable, uuid, varchar, text, integer, decimal, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { vendors } from './vendor';
import { maintenanceRecords } from './operations';

// ============================================
// 列舉定義 (Enums)
// ============================================

export const transactionStatusEnum = pgEnum('transaction_status', [
  'IN_PROGRESS',
  'PENDING_APPROVAL',
  'APPROVED',
  'PAID',
  'REJECTED'
]);

export const laborFormStatusEnum = pgEnum('labor_form_status', [
  'N/A',
  'PENDING',
  'SUBMITTED',
  'PAID'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'BILLED',
  'PAID'
]);

// ============================================
// 交易紀錄 (Transaction)
// ============================================

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  customerId: uuid('customer_id').notNull(),
  
  date: timestamp('date').notNull(),
  completionDate: timestamp('completion_date'),
  description: text('description').notNull(),
  
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  initialQuote: decimal('initial_quote', { precision: 10, scale: 2 }).notNull(),
  
  status: transactionStatusEnum('status').notNull(),
  laborFormStatus: laborFormStatusEnum('labor_form_status').notNull().default('N/A'),
  
  // 使用 JSONB 儲存 MediaItem 陣列
  photosBefore: jsonb('photos_before').notNull(), // MediaItem[]
  photosAfter: jsonb('photos_after').notNull(), // MediaItem[]
  
  timeSpentHours: decimal('time_spent_hours', { precision: 5, scale: 2 }).notNull(),
  
  managerFeedback: text('manager_feedback'),
  qualityRating: integer('quality_rating'), // 1-5
  
  approverId: uuid('approver_id'),
  approvalDate: timestamp('approval_date'),
  acceptanceReport: text('acceptance_report'),
  
  // 使用 JSONB 儲存 KnowledgeBaseItem 陣列
  generatedQA: jsonb('generated_qa'), // KnowledgeBaseItem[]
  
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// 請款與發票 (InvoiceRecord)
// ============================================

export const invoiceRecords = pgTable('invoice_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  vendorName: varchar('vendor_name', { length: 100 }).notNull(),
  maintenanceId: uuid('maintenance_id').references(() => maintenanceRecords.id),
  
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  date: timestamp('date').notNull(),
  invoiceNo: varchar('invoice_no', { length: 50 }).notNull().unique(),
  
  status: paymentStatusEnum('status').notNull(),
  attachmentUrl: text('attachment_url').notNull(),
  
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
