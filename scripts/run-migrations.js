#!/usr/bin/env node

/**
 * Migration Script
 * 在部署時自動執行資料庫 migration
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');

    // Migration 1: Add contact_id to contact_logs
    try {
      await sql`ALTER TABLE contact_logs ADD COLUMN contact_id uuid`;
      console.log('✅ Added contact_id column to contact_logs');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⏭️  contact_id column already exists, skipping');
      } else {
        throw error;
      }
    }

    // Migration 2: Add company_address to vendors (if needed)
    try {
      await sql`ALTER TABLE vendors ADD COLUMN company_address text`;
      console.log('✅ Added company_address column to vendors');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⏭️  company_address column already exists, skipping');
      } else {
        throw error;
      }
    }

    // Migration 3: Set default for service_scopes
    try {
      await sql`ALTER TABLE vendors ALTER COLUMN service_scopes SET DEFAULT '{}'`;
      console.log('✅ Set default for service_scopes column');
    } catch (error) {
      console.log('⚠️  Could not set default for service_scopes:', error.message);
    }

    console.log('✅ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
