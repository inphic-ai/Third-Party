import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.log('⚠️  DATABASE_URL is not set. Skipping column migration.');
  process.exit(0);
}

const sql = postgres(DATABASE_URL, { ssl: 'require' });

async function migrateAddColumns() {
  try {
    console.log('[Migration] Adding missing columns...');
    
    // Check if service_scopes column exists
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vendors' AND column_name = 'service_scopes'
    `;
    
    if (columns.length === 0) {
      console.log('[Migration] Adding service_scopes column to vendors table...');
      await sql`
        ALTER TABLE vendors 
        ADD COLUMN service_scopes text[] DEFAULT '{}' NOT NULL
      `;
      console.log('✅ service_scopes column added');
    } else {
      console.log('✅ service_scopes column already exists');
    }
    
    // Check if contact_address column exists in contact_windows
    const contactColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contact_windows' AND column_name = 'contact_address'
    `;
    
    if (contactColumns.length === 0) {
      console.log('[Migration] Adding contact_address column to contact_windows table...');
      await sql`
        ALTER TABLE contact_windows 
        ADD COLUMN contact_address text
      `;
      console.log('✅ contact_address column added');
    } else {
      console.log('✅ contact_address column already exists');
    }

    // Check if company_address column exists in vendors
    const companyAddressColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vendors' AND column_name = 'company_address'
    `;
    
    if (companyAddressColumns.length === 0) {
      console.log('[Migration] Adding company_address column to vendors table...');
      await sql`
        ALTER TABLE vendors 
        ADD COLUMN company_address text
      `;
      console.log('✅ company_address column added');
    } else {
      console.log('✅ company_address column already exists');
    }
    
    console.log('[Migration] All columns migrated successfully!');
    await sql.end();
  } catch (error) {
    console.error('[Migration] Error:', error);
    console.log('⚠️  Column migration failed. This is not critical for deployment.');
    await sql.end().catch(() => {});
    process.exit(0);
  }
}

migrateAddColumns();
