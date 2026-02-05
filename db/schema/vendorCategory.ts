import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const vendorCategories = pgTable('vendor_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  displayOrder: text('display_order'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
