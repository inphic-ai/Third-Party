import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

// 確保 DATABASE_URL 存在
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// 建立 PostgreSQL 連線
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);

// 建立 Drizzle 實例
export const db = drizzle(client, { 
  schema,
  casing: 'snake_case'
});

// 匯出所有 schema
export * from './schema';
