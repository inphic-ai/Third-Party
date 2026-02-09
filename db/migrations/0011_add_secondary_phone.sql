-- 為 vendors 表新增 secondary_phone 欄位
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(20);
