/**
 * DB & Storage Server Module
 * 此檔案僅在伺服器端執行，負責處理 PostgreSQL 資料庫連線與 R2 授權
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../db/schema';

// 環境變數
const DATABASE_URL = process.env.DATABASE_URL;

// 建立資料庫連線
const connectionString = DATABASE_URL || '';
const client = postgres(connectionString, { 
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Drizzle ORM 實例
export const db = drizzle(client, { schema });

// R2 簽名 URL 生成（實際環境）
export async function getSignedR2Url(key: string) {
  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-example.r2.dev';
  return `${R2_PUBLIC_URL}/${key}`;
}

// 匯出 schema 供其他地方使用
export { schema };
