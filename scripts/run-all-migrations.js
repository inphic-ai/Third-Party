import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
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

if (process.env.SKIP_DB_MIGRATION === 'true') {
  console.log('⚠️  SKIP_DB_MIGRATION=true, skipping migration.');
  process.exit(0);
}

const connectionString = process.env.DATABASE_URL;

async function runMigrations() {
  let client;
  
  try {
    // 建立連接
    try {
      client = postgres(connectionString, { connect_timeout: 10 });
    } catch (error) {
      console.warn(`⚠️  Invalid DATABASE_URL format. Skipping migration.`);
      console.log('ℹ️  Hint: DATABASE_URL should be in format: postgresql://user:password@host:port/database');
      return;
    }
    
    try {
      await client`SELECT 1`;
    } catch (error) {
      const message = error?.message ?? '';
      const isNetworkError =
        message.includes('ENOTFOUND') ||
        message.includes('ECONNREFUSED') ||
        message.includes('ETIMEDOUT') ||
        message.includes('EHOSTUNREACH');
      if (isNetworkError && process.env.MIGRATION_STRICT !== 'true') {
        console.warn(
          `⚠️  Database not reachable (${message}). Skipping migration. ` +
            'Set MIGRATION_STRICT=true to fail on connection errors.'
        );
        return;
      }
      throw error;
    }
    
    console.log('✅ Database connection established');
    
    // 建立 migration 追蹤表
    await client`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Migration tracking table ready');
    
    // 讀取所有 migration 檔案
    const migrationsDir = join(__dirname, '../db/migrations');
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // 按檔名排序，確保按順序執行
    
    console.log(`📂 Found ${files.length} migration files`);
    
    // 取得已執行的 migrations
    const executedMigrations = await client`
      SELECT hash FROM __drizzle_migrations
    `;
    const executedHashes = new Set(executedMigrations.map(m => m.hash));
    
    console.log(`📋 Already executed: ${executedHashes.size} migrations`);
    
    // 執行每個 migration 檔案
    for (const file of files) {
      const hash = file; // 使用檔名作為 hash
      
      if (executedHashes.has(hash)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`🔄 Executing ${file}...`);
      
      const migrationPath = join(migrationsDir, file);
      const sql = readFileSync(migrationPath, 'utf-8');
      
      // 分割 SQL 語句
      const statements = sql
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      console.log(`   Found ${statements.length} statements`);
      
      // 執行每個 SQL 語句
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          await client.unsafe(statement);
          console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          // 忽略已存在的錯誤
          if (error.message.includes('already exists')) {
            console.log(`   ⚠️  Statement ${i + 1}/${statements.length} skipped (already exists)`);
          } else {
            console.error(`   ❌ Statement ${i + 1}/${statements.length} failed:`, error.message);
            throw error;
          }
        }
      }
      
      // 記錄已執行的 migration
      await client`
        INSERT INTO __drizzle_migrations (hash) VALUES (${hash})
      `;
      
      console.log(`✅ ${file} completed`);
    }
    
    console.log('✅ All migrations completed successfully!');
    
    // 驗證資料表
    const finalTables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`✅ Database now has ${finalTables.length} tables`);
    console.log('📋 Tables:', finalTables.map(t => t.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('⚠️  Migration failed but deployment will continue.');
    // Don't exit with error code to allow deployment to continue
  } finally {
    if (client) {
      await client.end();
      console.log('✅ Database connection closed');
    }
  }
}

runMigrations();
