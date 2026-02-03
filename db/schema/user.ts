import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

/**
 * 用戶表 - 儲存系統用戶資訊
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  googleId: text("google_id").unique(),
  
  // 用戶角色：admin 或 user
  role: text("role").default("user").notNull(),
  
  // 用戶狀態
  isActive: boolean("is_active").default(true).notNull(),
  
  // 時間戳記
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
