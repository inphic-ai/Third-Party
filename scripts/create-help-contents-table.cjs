const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:VbtUndNeXOIHTyskhGVVUc1OcuMLmrHJ@tramway.proxy.rlwy.net:18152/railway';

async function createHelpContentsTable() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    // 建立 help_contents 表格
    await client.query(`
      CREATE TABLE IF NOT EXISTS help_contents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        page VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(200) NOT NULL,
        subtitle VARCHAR(200),
        content TEXT NOT NULL,
        principle_title VARCHAR(200),
        principle_content TEXT,
        updated_by UUID,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ help_contents table created');

    // 插入 tasks 頁面的初始資料
    await client.query(`
      INSERT INTO help_contents (page, title, subtitle, content, principle_title, principle_content)
      VALUES (
        'tasks',
        '歡迎來到日常戰術中心',
        '系統教學與提示',
        '這裡不只是日曆，而是您的每日行動指揮部。1. 左側月曆：快速切換日期。2. 智慧整合：系統會自動抓取「工單施工日」與「聯繫跟進日」顯示於右側。3. 手動待辦：您也可以隨時新增個人的臨時備忘。',
        '系統設計原則 (System Principle)',
        '將被動的「查詢」轉為主動的「執行」。透過整合不同來源的任務，減少您在不同頁面切換的時間，確保重要事項不遺漏。'
      )
      ON CONFLICT (page) DO UPDATE SET
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        content = EXCLUDED.content,
        principle_title = EXCLUDED.principle_title,
        principle_content = EXCLUDED.principle_content,
        updated_at = NOW();
    `);
    console.log('✅ Initial help content for tasks page inserted');

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createHelpContentsTable();
