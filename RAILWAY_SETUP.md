# Railway 部署設定指南

## Test 環境資料庫設定

### 1. 環境變數設定

在 Railway 的 **test Third-Party** 服務中，設定以下環境變數：

```
DATABASE_URL=postgresql://postgres:OHFnTJnPkOsbjElAeEnOlDScjOBOOChB@caboose.proxy.rlwy.net:23983/railway
```

### 2. 資料庫初始化

由於 `drizzle-kit push` 需要互動式確認，無法在自動部署中執行，請手動執行以下步驟：

#### 方法 A：使用 Railway CLI（推薦）

1. 安裝 Railway CLI：
   ```bash
   npm install -g @railway/cli
   ```

2. 登入 Railway：
   ```bash
   railway login
   ```

3. 連接到 test 專案：
   ```bash
   railway link
   ```

4. 執行資料庫初始化：
   ```bash
   railway run pnpm db:push
   ```
   
   當提示確認時，輸入：`Yes, I want to execute all statements`

#### 方法 B：直接連接資料庫執行 SQL

1. 使用任何 PostgreSQL 客戶端（如 pgAdmin, DBeaver, psql）連接到：
   ```
   Host: caboose.proxy.rlwy.net
   Port: 23983
   Database: railway
   Username: postgres
   Password: OHFnTJnPkOsbjElAeEnOlDScjOBOOChB
   ```

2. 執行以下 SQL 腳本（從 drizzle-kit 生成的 migration）：

   參考 `db/migrations/` 目錄中的 SQL 檔案，或執行：
   ```bash
   pnpm db:generate
   ```
   
   然後手動執行生成的 SQL。

### 3. 驗證資料庫

部署完成後，應用程式會自動執行 `scripts/init-db.js` 檢查資料庫連接和資料表狀態。

查看 Railway 部署日誌，應該會看到：
```
✅ Database connection established
✅ Database connection test passed
✅ Database already initialized with X tables
```

## 資料表結構

系統包含以下資料表：

### 廠商管理（Vendor Management）
- `vendors` - 廠商基本資料
- `contact_windows` - 聯繫窗口
- `social_groups` - 社群群組
- `contact_logs` - 聯繫紀錄

### 營運管理（Operations）
- `maintenance_records` - 維修紀錄
- `transactions` - 交易記錄

### 財務管理（Financial）
- `invoice_records` - 請款記錄

### 系統管理（System）
- `admin_users` - 管理員用戶
- `announcements` - 系統公告
- `knowledge_base_items` - 知識庫
- `system_logs` - 系統日誌

## 常見問題

### Q: 部署後出現 "DATABASE_URL is not defined" 錯誤
A: 請確認已在 Railway 環境變數中設定 `DATABASE_URL`

### Q: 部署後出現 "relation does not exist" 錯誤
A: 資料表尚未初始化，請按照上述步驟執行資料庫初始化

### Q: 如何重置資料庫？
A: 
1. 在 Railway 刪除 test Postgres 服務
2. 重新建立 test Postgres 服務
3. 更新 `DATABASE_URL` 環境變數
4. 重新執行資料庫初始化步驟

## 聯絡資訊

如有問題，請聯繫開發團隊。
