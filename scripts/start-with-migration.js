import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting application with migration...');

// 先執行 migration
const migrationScript = join(__dirname, 'run-all-migrations.js');

console.log('📦 Step 1: Running migrations...');

const migration = spawn('node', [migrationScript], {
  stdio: 'inherit',
  env: process.env
});

migration.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Migration failed with code ${code}`);
    // 繼續啟動應用，即使 migration 失敗
    console.log('⚠️  Continuing to start application despite migration failure...');
  } else {
    console.log('✅ Migration completed');
  }
  
  console.log('📦 Step 2: Starting application...');
  
  // 啟動應用
  const app = spawn('remix-serve', ['./build/server/index.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  app.on('close', (code) => {
    console.log(`Application exited with code ${code}`);
    process.exit(code);
  });
  
  app.on('error', (err) => {
    console.error('Failed to start application:', err);
    process.exit(1);
  });
});

migration.on('error', (err) => {
  console.error('Failed to run migration:', err);
  console.log('⚠️  Continuing to start application despite migration error...');
  
  // 啟動應用
  const app = spawn('remix-serve', ['./build/server/index.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  app.on('close', (code) => {
    process.exit(code);
  });
});
