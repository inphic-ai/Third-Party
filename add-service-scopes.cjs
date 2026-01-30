const postgres = require('postgres');

const sql = postgres('postgresql://postgres:OHFnTJnPkOsbjElAeEnOlDScjOBOOChB@caboose.proxy.rlwy.net:23983/railway', {
  ssl: 'require'
});

async function addServiceScopes() {
  try {
    console.log('Adding service_scopes column...');
    await sql`
      ALTER TABLE vendors 
      ADD COLUMN service_scopes text[] DEFAULT '{}' NOT NULL
    `;
    console.log('✅ service_scopes column added successfully!');
    
    // Also add contact_address to contact_windows if missing
    console.log('Adding contact_address column to contact_windows...');
    await sql`
      ALTER TABLE contact_windows 
      ADD COLUMN IF NOT EXISTS contact_address text
    `;
    console.log('✅ contact_address column added successfully!');
    
    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addServiceScopes();
