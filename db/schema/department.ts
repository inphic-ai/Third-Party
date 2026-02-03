import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * 部門表 - 儲存組織部門資訊
 */
export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  
  // 時間戳記
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
