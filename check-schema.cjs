const postgres = require('postgres');

const sql = postgres('postgresql://postgres:OHFnTJnPkOsbjElAeEnOlDScjOBOOChB@caboose.proxy.rlwy.net:23983/railway', {
  ssl: 'require'
});

async function checkSchema() {
  try {
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendors' 
      ORDER BY ordinal_position
    `;
    console.log('Vendors table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
