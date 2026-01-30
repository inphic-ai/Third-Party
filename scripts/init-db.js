import postgres from 'postgres';
import * as dotenv from 'dotenv';
// import * as schema from '../db/schema/index.js';

dotenv.config();

console.log('🚀 Starting database initialization...');

// 確保 DATABASE_URL 存在
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;

async function initDatabase() {
  let client;
  
  try {
    // 建立連接
    client = postgres(connectionString);
    
    console.log('✅ Database connection established');
    
    // 測試連接
    await client`SELECT 1`;
    console.log('✅ Database connection test passed');
    
    // 檢查是否已有資料表
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    if (tables.length > 0) {
      console.log(`✅ Database already initialized with ${tables.length} tables`);
      console.log('📋 Existing tables:', tables.map(t => t.table_name).join(', '));
    } else {
      console.log('⚠️  No tables found. Please run "pnpm db:push" manually to initialize the database.');
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('✅ Database connection closed');
    }
  }
}

initDatabase();
