-- 更新 system_log_status enum 的值
-- 先刪除舊的 enum 值，再新增新的值

-- 由於 PostgreSQL 不支援直接修改 enum，我們需要：
-- 1. 建立新的 enum
-- 2. 更新 column 使用新的 enum
-- 3. 刪除舊的 enum

-- 建立新的 enum
CREATE TYPE system_log_status_new AS ENUM ('success', 'failed');

-- 更新 system_logs 表使用新的 enum（如果表中有資料，需要先清空或轉換）
ALTER TABLE system_logs ALTER COLUMN status TYPE system_log_status_new USING 'success'::system_log_status_new;

-- 刪除舊的 enum
DROP TYPE system_log_status;

-- 重新命名新的 enum
ALTER TYPE system_log_status_new RENAME TO system_log_status;
