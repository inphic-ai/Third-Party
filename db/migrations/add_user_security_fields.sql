-- 加入用戶安全資訊欄位
-- 執行日期: 2026-02-03

-- 加入 IP 白名單欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_whitelist TEXT;

-- 加入時段限制啟用欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS time_restriction_enabled BOOLEAN DEFAULT FALSE;

-- 加入權限設定欄位（JSON 格式）
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT;

-- 註解說明
COMMENT ON COLUMN users.ip_whitelist IS 'IP 白名單，多個 IP 用逗號分隔';
COMMENT ON COLUMN users.time_restriction_enabled IS '是否啟用時段限制';
COMMENT ON COLUMN users.permissions IS '用戶權限設定（JSON 格式）';
