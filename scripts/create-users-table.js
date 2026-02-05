import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Creating users table...');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;

async function createUsersTable() {
  let client;
  
  try {
    client = postgres(connectionString, { connect_timeout: 10 });
    
    await client`SELECT 1`;
    console.log('✅ Database connection established');
    
    // 檢查 users 表是否已存在
    const existingTables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `;
    
    if (existingTables.length > 0) {
      console.log('⚠️  users table already exists. Skipping creation.');
      return;
    }
    
    // 建立 users 表
    await client`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" text NOT NULL UNIQUE,
        "name" text NOT NULL,
        "avatar_url" text,
        "google_id" text UNIQUE,
        "role" text DEFAULT 'user' NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "department" text,
        "approved_by" uuid,
        "approved_at" timestamp,
        "rejection_reason" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "ip_whitelist" text,
        "time_restriction_enabled" boolean DEFAULT false,
        "permissions" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "last_login_at" timestamp
      )
    `;
    
    console.log('✅ users table created successfully!');
    
    // 驗證表是否建立成功
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `;
    
    if (tables.length > 0) {
      console.log('✅ Verified: users table exists');
    } else {
      console.error('❌ Failed to create users table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('⚠️  Continuing deployment despite error...');
  } finally {
    if (client) {
      await client.end();
      console.log('✅ Database connection closed');
    }
  }
}

createUsersTable();
