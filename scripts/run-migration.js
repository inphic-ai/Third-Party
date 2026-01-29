import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

console.log('🚀 Starting database migration...');

// 確保 DATABASE_URL 存在
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;

async function runMigration() {
  let client;
  
  try {
    // 建立連接
    client = postgres(connectionString);
    
    console.log('✅ Database connection established');
    
    // 讀取 migration SQL 檔案
    const migrationPath = join(__dirname, '../db/migrations/0000_narrow_dragon_man.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Reading migration file...');
    
    // 分割 SQL 語句（使用 --> statement-breakpoint 作為分隔符）
    const statements = sql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements`);
    
    // 檢查是否已有資料表
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    if (tables.length > 0) {
      console.log(`⚠️  Database already has ${tables.length} tables. Skipping migration.`);
      console.log('📋 Existing tables:', tables.map(t => t.table_name).join(', '));
      return;
    }
    
    // 執行每個 SQL 語句
    console.log('🔄 Executing migration...');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await client.unsafe(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (error) {
        // 忽略已存在的錯誤
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1}/${statements.length} skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // 驗證資料表
    const finalTables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log(`✅ Database now has ${finalTables.length} tables`);
    console.log('📋 Tables:', finalTables.map(t => t.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('✅ Database connection closed');
    }
  }
}

runMigration();
