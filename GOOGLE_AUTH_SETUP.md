# Google OAuth 登入系統設定指南

## 📋 概述

本系統已整合 Google OAuth 登入功能，使用 Remix Auth 框架實作。以下是完整的設定步驟。

---

## 🔧 Railway 環境變數設定

### **必要環境變數**

請在 Railway 專案的環境變數中新增以下 4 個變數：

```bash
# Google OAuth 憑證
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Google OAuth 回調 URL
GOOGLE_CALLBACK_URL=https://your-railway-app.up.railway.app/auth/google/callback

# Session 加密密鑰（請使用隨機字串）
SESSION_SECRET=your_random_secret_key_here
```

### **SESSION_SECRET 生成方式**

可以使用以下方式生成隨機密鑰：

```bash
# 方法 1：使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法 2：使用 OpenSSL
openssl rand -hex 32

# 方法 3：線上生成器
# 訪問 https://generate-secret.vercel.app/32
```

---

## 🔑 Google OAuth 憑證申請步驟

### **步驟 1：前往 Google Cloud Console**

1. 訪問 [Google Cloud Console](https://console.cloud.google.com/)
2. 登入您的 Google 帳號

### **步驟 2：建立或選擇專案**

1. 點擊頂部的專案選擇器
2. 點擊「新增專案」或選擇現有專案
3. 輸入專案名稱（例如：「PartnerLink Pro」）
4. 點擊「建立」

### **步驟 3：啟用 Google+ API**

1. 在左側選單中，點擊「API 和服務」→「資料庫」
2. 搜尋「Google+ API」
3. 點擊「啟用」

### **步驟 4：建立 OAuth 2.0 憑證**

1. 在左側選單中，點擊「API 和服務」→「憑證」
2. 點擊「建立憑證」→「OAuth 用戶端 ID」
3. 如果是第一次建立，需要先設定「OAuth 同意畫面」：
   - 選擇「外部」（如果是公開應用）或「內部」（如果只給組織內部使用）
   - 填寫應用程式名稱：「精英團隊 - 全球協力廠商戰略名錄」
   - 填寫使用者支援電子郵件
   - 填寫開發人員聯絡資訊
   - 點擊「儲存並繼續」
   - 在「範圍」頁面，點擊「新增或移除範圍」
   - 選擇以下範圍：
     - `userinfo.email`
     - `userinfo.profile`
   - 點擊「更新」→「儲存並繼續」
   - 在「測試使用者」頁面，新增測試用戶的 Email（可選）
   - 點擊「儲存並繼續」

4. 回到「憑證」頁面，再次點擊「建立憑證」→「OAuth 用戶端 ID」
5. 選擇應用程式類型：「網頁應用程式」
6. 輸入名稱：「PartnerLink Pro Web」
7. 在「已授權的重新導向 URI」中新增：
   - **開發環境：** `http://localhost:3000/auth/google/callback`
   - **生產環境：** `https://your-railway-app.up.railway.app/auth/google/callback`
     - ⚠️ **重要：** 請將 `your-railway-app.up.railway.app` 替換為您的 Railway 應用實際網址
8. 點擊「建立」
9. 複製「用戶端 ID」和「用戶端密碼」

### **步驟 5：設定 Railway 環境變數**

1. 前往 Railway 專案設定
2. 點擊「Variables」標籤
3. 新增以下環境變數：
   ```
   GOOGLE_CLIENT_ID=<剛才複製的用戶端 ID>
   GOOGLE_CLIENT_SECRET=<剛才複製的用戶端密碼>
   GOOGLE_CALLBACK_URL=https://your-railway-app.up.railway.app/auth/google/callback
   SESSION_SECRET=<使用上面方法生成的隨機密鑰>
   ```
4. 點擊「Save」

---

## 🗄️ 資料庫遷移

### **自動遷移（推薦）**

Railway 部署時會自動執行資料庫遷移，建立 `users` 表。

### **手動遷移（如需要）**

如果需要手動執行遷移：

```bash
# 在 Railway 的 Shell 中執行
pnpm drizzle-kit push
```

或者直接在 PostgreSQL 中執行 SQL：

```sql
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "avatar_url" text,
  "google_id" text UNIQUE,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "last_login_at" timestamp
);
```

---

## 🧪 測試登入流程

### **1. 訪問應用**

前往您的 Railway 應用網址（例如：`https://your-railway-app.up.railway.app`）

### **2. 自動跳轉**

如果未登入，會自動跳轉到登入頁面（`/login`）

### **3. 點擊「使用 Google 帳號登入」**

### **4. Google 授權**

- 選擇 Google 帳號
- 授權應用存取您的基本資料和 Email

### **5. 登入成功**

- 自動跳轉回首頁
- 右上角顯示您的頭像、姓名和 Email
- 可以點擊「登出」按鈕登出

---

## 🔒 安全性注意事項

### **1. SESSION_SECRET**

- ⚠️ **絕對不要**將 `SESSION_SECRET` 提交到 Git
- ⚠️ **務必使用**至少 32 字元的隨機字串
- ⚠️ **定期更換**密鑰以提高安全性

### **2. GOOGLE_CLIENT_SECRET**

- ⚠️ **絕對不要**將 `GOOGLE_CLIENT_SECRET` 提交到 Git
- ⚠️ **僅在伺服器端**使用，不要暴露給前端

### **3. HTTPS**

- ✅ Railway 自動提供 HTTPS
- ✅ Cookie 在生產環境中會自動設為 `secure: true`

### **4. 回調 URL**

- ⚠️ **務必確認** `GOOGLE_CALLBACK_URL` 與 Google Console 中設定的一致
- ⚠️ **使用完整 URL**，包含 `https://` 協議

---

## 📁 檔案結構

```
app/
├── routes/
│   ├── _index.tsx              # 首頁（已保護）
│   ├── vendors.tsx             # 廠商名錄（已保護）
│   ├── login.tsx               # 登入頁面
│   ├── logout.tsx              # 登出路由
│   ├── auth.google.tsx         # Google 登入觸發
│   └── auth.google.callback.tsx # Google 回調處理
├── services/
│   ├── auth.server.ts          # 認證服務
│   ├── session.server.ts       # Session 管理
│   └── db.server.ts            # 資料庫連線
db/
├── schema/
│   ├── user.ts                 # User Schema
│   └── index.ts                # Schema 匯出
└── migrations/
    └── 0003_daffy_jamie_braddock.sql # User 表遷移
```

---

## 🎯 功能特點

### **✅ 完整的認證流程**

- Google OAuth 2.0 登入
- 自動建立或更新用戶資料
- Session 管理（30 天有效期）
- 登出功能

### **✅ 路由保護**

- 未登入用戶自動跳轉到登入頁
- 使用 `requireUser()` 保護路由
- 使用 `getUser()` 取得當前用戶（不強制登入）

### **✅ 用戶資訊顯示**

- 首頁顯示用戶頭像、姓名、Email
- 登出按鈕

### **✅ 資料庫整合**

- PostgreSQL 儲存用戶資料
- Drizzle ORM 管理 Schema
- 自動記錄最後登入時間

---

## 🐛 常見問題

### **Q1: 登入後跳轉到錯誤頁面**

**A:** 檢查 `GOOGLE_CALLBACK_URL` 是否正確設定，必須與 Google Console 中的回調 URL 完全一致。

### **Q2: 顯示「redirect_uri_mismatch」錯誤**

**A:** 前往 Google Cloud Console，確認「已授權的重新導向 URI」中包含您的回調 URL。

### **Q3: 登入後無法保持登入狀態**

**A:** 檢查 `SESSION_SECRET` 是否已設定，且不為空字串。

### **Q4: 資料庫中沒有 users 表**

**A:** 執行資料庫遷移：
```bash
pnpm drizzle-kit push
```

### **Q5: 本地開發時無法登入**

**A:** 確保在 Google Console 中新增了 `http://localhost:3000/auth/google/callback` 作為回調 URL。

---

## 📞 技術支援

如有任何問題，請聯繫開發團隊或查看以下資源：

- [Remix Auth 文件](https://github.com/sergiodxa/remix-auth)
- [Google OAuth 文件](https://developers.google.com/identity/protocols/oauth2)
- [Drizzle ORM 文件](https://orm.drizzle.team/)

---

## ✅ 檢查清單

部署前請確認：

- [ ] 已在 Google Cloud Console 建立 OAuth 憑證
- [ ] 已在 Railway 設定 4 個環境變數
- [ ] `GOOGLE_CALLBACK_URL` 與 Google Console 設定一致
- [ ] `SESSION_SECRET` 已使用隨機字串
- [ ] 資料庫遷移已執行
- [ ] 已測試登入和登出流程
- [ ] 未將敏感資訊提交到 Git

---

**🎉 設定完成後，您的系統就擁有完整的 Google 登入功能了！**
