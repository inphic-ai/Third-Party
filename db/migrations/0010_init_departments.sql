-- 初始化部門資料
INSERT INTO departments (name, description) VALUES
('研發部', '負責產品研發與技術創新'),
('設計部', '負責產品設計與視覺設計'),
('業務部', '負責業務開發與客戶關係管理'),
('產品部', '負責產品規劃與專案管理')
ON CONFLICT (name) DO NOTHING;
