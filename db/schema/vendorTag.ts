import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const vendorTags = pgTable('vendor_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: text('category').notNull(), // '聯絡標籤', '服務標籤', '網站標籤'
  color: text('color').notNull().default('blue'), // 標籤顏色
  displayOrder: text('display_order'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
