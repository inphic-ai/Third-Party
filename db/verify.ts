import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const verifyDatabase = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  console.log('🔍 Verifying database schema...\n');

  const sql = postgres(process.env.DATABASE_URL);

  try {
    // 查詢所有資料表
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    console.log(`✅ Found ${tables.length} tables:\n`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });

    // 查詢所有列舉類型
    const enums = await sql`
      SELECT t.typname as enum_name
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      GROUP BY t.typname
      ORDER BY t.typname
    `;

    console.log(`\n✅ Found ${enums.length} enum types:\n`);
    enums.forEach((enumType, index) => {
      console.log(`   ${index + 1}. ${enumType.enum_name}`);
    });

    console.log('\n✅ Database schema verification completed!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
};

verifyDatabase();
