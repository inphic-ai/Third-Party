-- 初始化廠商標籤資料

-- 聯絡標籤
INSERT INTO vendor_tags (name, category, color, display_order) VALUES
('報價中', '聯絡標籤', 'blue', '01'),
('已預約', '聯絡標籤', 'blue', '02'),
('無人接聽', '聯絡標籤', 'blue', '03'),
('已確認檔期', '聯絡標籤', 'blue', '04'),
('等待報價', '聯絡標籤', 'blue', '05'),
('報價過高', '聯絡標籤', 'blue', '06'),
('態度良好', '聯絡標籤', 'blue', '07'),
('需要主管確認', '聯絡標籤', 'blue', '08'),
('約定場勘', '聯絡標籤', 'blue', '09');

-- 服務標籤
INSERT INTO vendor_tags (name, category, color, display_order) VALUES
('夜間施工', '服務標籤', 'green', '10'),
('急件處理', '服務標籤', 'green', '11'),
('含廢棄物清運', '服務標籤', 'green', '12'),
('需支付訂金', '服務標籤', 'green', '13'),
('可配合輪班', '服務標籤', 'green', '14'),
('自有工班', '服務標籤', 'green', '15');

-- 網站標籤
INSERT INTO vendor_tags (name, category, color, display_order) VALUES
('優良廠商', '網站標籤', 'purple', '16'),
('配合度高', '網站標籤', 'purple', '17'),
('價格實惠', '網站標籤', 'purple', '18'),
('CP值高', '網站標籤', 'purple', '19'),
('老字號', '網站標籤', 'purple', '20'),
('新創團隊', '網站標籤', 'purple', '21');
