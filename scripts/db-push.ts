import { execSync } from 'child_process';

console.log('🚀 Starting database push...');

try {
  // 執行 drizzle-kit push 並自動回答 yes
  const result = execSync(
    'echo "Yes, I want to execute all statements" | pnpm drizzle-kit push',
    {
      cwd: '/home/ubuntu/Third-Party',
      stdio: 'inherit',
      encoding: 'utf-8',
    }
  );
  
  console.log('✅ Database push completed successfully!');
} catch (error) {
  console.error('❌ Database push failed:', error);
  process.exit(1);
}
