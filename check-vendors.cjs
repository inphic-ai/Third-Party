const postgres = require('postgres');

const sql = postgres('postgresql://postgres:OHFnTJnPkOsbjElAeEnOlDScjOBOOChB@caboose.proxy.rlwy.net:23983/railway', {
  ssl: 'require'
});

async function checkVendors() {
  try {
    const vendors = await sql`SELECT id, name, region, entity_type, service_types, categories FROM vendors ORDER BY created_at DESC LIMIT 10`;
    console.log('Vendors in database:');
    console.log(JSON.stringify(vendors, null, 2));
    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkVendors();
