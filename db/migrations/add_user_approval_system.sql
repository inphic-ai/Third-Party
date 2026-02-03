-- ============================================
-- Migration: Add User Approval System
-- ============================================
-- 此 migration 新增用戶審核系統所需的欄位和資料表

-- 1. 新增 departments 資料表
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 2. 為 users 資料表新增審核相關欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. 為現有用戶設定狀態為 approved（避免影響已存在的用戶）
UPDATE users 
SET status = 'approved' 
WHERE status = 'pending' AND created_at < now();

-- 4. 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- 5. 新增一些預設部門（可選）
INSERT INTO departments (name, description) VALUES
  ('資訊技術部', '負責系統開發、維護和技術支援'),
  ('人力資源部', '負責人員招募、培訓和員工關係'),
  ('財務部', '負責財務規劃、會計和預算管理'),
  ('業務部', '負責業務拓展和客戶關係管理'),
  ('行政部', '負責行政事務和後勤支援')
ON CONFLICT (name) DO NOTHING;

-- 完成
SELECT 'Migration completed: User approval system added successfully!' AS status;
