-- Migration: 建立系統設定表
-- Date: 2026-02-10
-- Description: 建立 system_settings 表用於儲存系統設定

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  data_type VARCHAR(20) NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_by UUID
);

-- 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- 插入預設設定值（Phase 1 的 10 項核心設定）

-- 1. 交易金額審核閾值
INSERT INTO system_settings (key, value, category, description, data_type) VALUES
('transaction_approval_threshold', '50000', 'transaction', '超過此金額需要主管審核（新台幣）', 'number'),
('transaction_second_approval_threshold', '100000', 'transaction', '超過此金額需要二級審核（新台幣）', 'number');

-- 2. 勞報單提交期限與逾期警示
INSERT INTO system_settings (key, value, category, description, data_type) VALUES
('labor_form_submission_deadline', '7', 'transaction', '交易完成後需在 N 天內提交勞報單', 'number'),
('labor_form_overdue_alert', 'true', 'transaction', '是否啟用勞報單逾期警示', 'boolean');

-- 3. 廠商評價警示閾值
INSERT INTO system_settings (key, value, category, description, data_type) VALUES
('vendor_min_rating_threshold', '3.0', 'vendor', '低於此評分的廠商會標記為「需注意」', 'number');

-- 4. 用戶審核設定
INSERT INTO system_settings (key, value, category, description, data_type) VALUES
('user_auto_approval', 'false', 'user', '新用戶是否自動審核通過', 'boolean'),
('user_auto_approval_domains', '[]', 'user', '允許自動通過的 Email 網域清單（JSON 陣列）', 'json');

-- 5. 登入逾時時間
INSERT INTO system_settings (key, value, category, description, data_type) VALUES
('login_timeout_minutes', '30', 'security', '使用者閒置多久後自動登出（分鐘）', 'number');

-- 6. 日誌保留期限
INSERT INTO system_settings (key, value, category, description, data_type) VALUES
('system_log_retention_days', '90', 'data', '操作日誌保留天數', 'number'),
('login_log_retention_days', '180', 'data', '登入日誌保留天數', 'number');

-- 7. 檔案上傳限制
INSERT INTO system_settings (key, value, category, description, data_type) VALUES
('file_upload_max_size_mb', '10', 'storage', '單一檔案上傳大小限制（MB）', 'number'),
('file_upload_allowed_types', '["jpg","jpeg","png","gif","webp","pdf","doc","docx","xls","xlsx","zip","rar"]', 'storage', '允許上傳的檔案類型（JSON 陣列）', 'json');

-- 8. 系統維護模式
INSERT INTO system_settings (key, value, category, description, data_type) VALUES
('maintenance_mode', 'false', 'system', '是否啟用系統維護模式', 'boolean'),
('maintenance_message', '系統維護中，請稍後再試。', 'system', '維護模式顯示的訊息', 'string');

-- 9. 每頁顯示筆數
INSERT INTO system_settings (key, value, category, description, data_type) VALUES
('pagination_page_size', '10', 'ui', '列表頁面每頁顯示的資料筆數', 'number');

-- 10. Email 通知開關
INSERT INTO system_settings (key, value, category, description, data_type) VALUES
('email_notification_user_approval', 'true', 'notification', '用戶審核通過/拒絕時發送 Email', 'boolean'),
('email_notification_transaction_approval', 'true', 'notification', '交易需要審核時通知審核者', 'boolean'),
('email_notification_labor_form_overdue', 'true', 'notification', '勞報單逾期時通知相關人員', 'boolean'),
('email_notification_payment_overdue', 'true', 'notification', '付款逾期時通知財務人員', 'boolean');
