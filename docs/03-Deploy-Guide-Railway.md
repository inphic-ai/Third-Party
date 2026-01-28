# 03｜Deploy Guide - Railway

> **文件目的**：本文件提供 Remix SSR 專案在 Railway 平台的完整部署指南，解決常見部署問題（如環境變數配置、資料庫連線、Remix 專屬設定），確保專案能順利上線並穩定運作。

---

## 一、Railway 平台簡介

### 1.1 為什麼選擇 Railway？

Railway 是一個現代化的雲端部署平台，特別適合 Remix SSR 專案：

- **自動檢測框架**：自動識別 Remix 專案並配置正確的建置指令
- **內建 PostgreSQL**：一鍵新增 Railway PostgreSQL 資料庫
- **GitHub 整合**：推送程式碼自動觸發部署（CI/CD）
- **環境變數管理**：安全管理敏感資訊（API Key、資料庫連線）
- **免費額度**：提供每月 $5 美元免費額度（足夠小型專案使用）

---

## 二、部署前準備

### 2.1 檢查清單

在開始部署前，請確認以下項目：

#### 專案結構
- [ ] 專案根目錄包含 `package.json`
- [ ] 專案根目錄包含 `remix.config.js`（或 `remix.config.ts`）
- [ ] 專案包含 `app/` 資料夾（Remix 路由與組件）
- [ ] 專案包含 `.env.example`（環境變數範本）

#### 環境變數
- [ ] 已準備 `DATABASE_URL`（Railway PostgreSQL 連線字串）
- [ ] 已準備 `JWT_SECRET`（至少 32 字元隨機字串）
- [ ] 已準備 `SESSION_SECRET`（至少 32 字元隨機字串）
- [ ] 已準備 `GEMINI_API_KEY`（Google Gemini API 金鑰）
- [ ] 已準備 R2 相關變數（`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`）

#### Git 設定
- [ ] `.env` 已加入 `.gitignore`
- [ ] 程式碼已推送至 GitHub
- [ ] Repository 設定為 Private（保護敏感資訊）

---

### 2.2 建立 railway.toml

在專案根目錄建立 `railway.toml` 檔案，定義部署配置：

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm run start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
```

#### 配置說明
- **builder**：使用 Nixpacks 自動檢測專案類型
- **buildCommand**：安裝依賴並建置 Remix 專案
- **startCommand**：啟動 Remix 伺服器
- **restartPolicyType**：失敗時自動重啟
- **NODE_ENV**：設定為正式環境

---

### 2.3 更新 package.json

確保 `package.json` 包含正確的建置與啟動指令：

```json
{
  "scripts": {
    "dev": "remix dev --manual",
    "build": "remix build",
    "start": "remix-serve ./build/index.js",
    "typecheck": "tsc"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 指令說明
- **dev**：本地開發模式
- **build**：建置 Remix 專案（生成 `build/` 資料夾）
- **start**：啟動 Remix 伺服器（使用 `remix-serve`）
- **engines**：指定 Node.js 版本（Railway 將使用此版本）

---

## 三、Railway 部署步驟

### 3.1 建立 Railway 專案

#### Step 1：登入 Railway
前往 [Railway 官網](https://railway.app/) 並使用 GitHub 帳號登入。

#### Step 2：建立新專案
1. 點擊 **"New Project"**
2. 選擇 **"Deploy from GitHub repo"**
3. 選擇 `inphic-ai/Third-Party` Repository
4. 點擊 **"Deploy Now"**

#### Step 3：等待初始部署
Railway 將自動檢測 Remix 專案並開始建置。此時部署會失敗（因為缺少環境變數），這是正常現象。

---

### 3.2 新增 PostgreSQL 資料庫

#### Step 1：新增資料庫服務
1. 在 Railway 專案頁面，點擊 **"New"**
2. 選擇 **"Database"** → **"Add PostgreSQL"**
3. Railway 將自動建立 PostgreSQL 實例

#### Step 2：取得資料庫連線字串
1. 點擊 PostgreSQL 服務
2. 切換到 **"Connect"** 頁籤
3. 複製 **"Postgres Connection URL"**（格式：`postgresql://user:password@host:port/database`）

#### Step 3：連結資料庫到專案
1. 回到專案服務（Remix 應用）
2. 切換到 **"Variables"** 頁籤
3. 點擊 **"Add Reference"**
4. 選擇 PostgreSQL 服務的 `DATABASE_URL`
5. Railway 將自動注入環境變數

---

### 3.3 配置環境變數

在 Railway 專案的 **"Variables"** 頁籤中，新增以下環境變數：

#### 必填變數

| 變數名稱 | 範例值 | 說明 |
|---------|--------|------|
| `DATABASE_URL` | `postgresql://...` | 由 Railway 自動注入 |
| `JWT_SECRET` | `your-random-32-char-secret` | JWT 簽發密鑰 |
| `SESSION_SECRET` | `your-random-32-char-secret` | Remix Session 密鑰 |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API 金鑰 |
| `NODE_ENV` | `production` | 環境類型 |

#### R2 相關變數

| 變數名稱 | 範例值 | 說明 |
|---------|--------|------|
| `R2_ACCOUNT_ID` | `abc123...` | Cloudflare R2 帳號 ID |
| `R2_ACCESS_KEY_ID` | `xyz789...` | R2 存取金鑰 ID |
| `R2_SECRET_ACCESS_KEY` | `secret...` | R2 存取金鑰密碼 |
| `R2_BUCKET_NAME` | `partnerlink-pro` | R2 儲存桶名稱 |
| `R2_PUBLIC_URL` | `https://partnerlink-pro.r2.dev` | R2 公開 URL |

#### 產生隨機密鑰

使用以下指令產生安全的隨機密鑰：

```bash
# 產生 32 字元隨機字串
openssl rand -base64 32
```

---

### 3.4 執行資料庫遷移

#### Step 1：安裝 Railway CLI

```bash
npm install -g @railway/cli
```

#### Step 2：登入 Railway

```bash
railway login
```

#### Step 3：連結專案

```bash
cd /path/to/Third-Party
railway link
```

選擇對應的專案與服務。

#### Step 4：執行遷移腳本

```bash
# 方法一：使用 Drizzle Kit
railway run npx drizzle-kit push:pg

# 方法二：使用自訂 SQL 腳本
railway run psql $DATABASE_URL < schema.sql
```

#### Step 5：驗證資料表

```bash
railway run psql $DATABASE_URL -c "\dt"
```

應該會看到所有資料表列表（如 `vendors`, `contact_logs`, `transactions` 等）。

---

### 3.5 觸發重新部署

#### 方法一：手動觸發
1. 在 Railway 專案頁面，點擊 **"Deployments"**
2. 點擊 **"Redeploy"**

#### 方法二：推送程式碼
```bash
git add .
git commit -m "chore(deploy): 配置 Railway 環境變數"
git push origin main
```

Railway 將自動檢測推送並觸發部署。

---

### 3.6 檢查部署狀態

#### Step 1：查看建置日誌
1. 在 Railway 專案頁面，點擊 **"Deployments"**
2. 點擊最新的部署
3. 查看 **"Build Logs"** 與 **"Deploy Logs"**

#### Step 2：確認部署成功
- **Build Logs** 應顯示 `✓ Build completed successfully`
- **Deploy Logs** 應顯示 `Remix server started on port 3000`

#### Step 3：取得公開 URL
1. 在 Railway 專案頁面，點擊 **"Settings"**
2. 切換到 **"Domains"** 頁籤
3. 點擊 **"Generate Domain"**
4. Railway 將自動產生公開 URL（如 `https://partnerlink-pro-production.up.railway.app`）

---

## 四、Remix SSR 專屬配置

### 4.1 Remix 伺服器設定

Remix 使用 `remix-serve` 作為預設伺服器，但在 Railway 上需要特別注意以下設定：

#### 監聽正確的 Port

Railway 會自動分配 Port（透過 `PORT` 環境變數），Remix 預設會監聽此 Port，無需額外配置。

如果使用自訂伺服器（如 Express），必須監聽 `process.env.PORT`：

```typescript
// server.ts
import express from 'express';
import { createRequestHandler } from '@remix-run/express';

const app = express();

app.all('*', createRequestHandler({
  build: require('./build'),
}));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Remix server started on port ${port}`);
});
```

---

### 4.2 環境變數存取

在 Remix 中，環境變數僅能在 Server-Side 存取（loader/action），禁止在前端組件中使用。

#### ✅ 正確（在 loader 中存取）

```typescript
// app/routes/vendors._index.tsx
export async function loader() {
  const apiKey = process.env.GEMINI_API_KEY;
  // ...
}
```

#### ❌ 錯誤（在前端組件中存取）

```typescript
// app/routes/vendors._index.tsx
export default function VendorsPage() {
  const apiKey = process.env.GEMINI_API_KEY; // 禁止！
  // ...
}
```

---

### 4.3 靜態資源處理

Remix 會自動處理靜態資源（如 CSS、JS、圖片），但需要確保 `public/` 資料夾中的檔案正確部署。

#### 資料夾結構

```
Third-Party/
├── app/
├── public/
│   ├── favicon.ico
│   ├── logo.png
│   └── ...
├── build/          # 建置輸出（自動生成）
├── package.json
└── remix.config.js
```

#### Remix 配置

```javascript
// remix.config.js
module.exports = {
  serverBuildPath: "build/index.js",
  publicPath: "/build/",
  assetsBuildDirectory: "public/build",
};
```

---

### 4.4 Session 管理

Remix 使用 Session 管理使用者狀態，必須設定 `SESSION_SECRET` 環境變數。

#### 建立 Session Storage

```typescript
// app/session.server.ts
import { createCookieSessionStorage } from '@remix-run/node';

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 天
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET!],
    secure: process.env.NODE_ENV === 'production',
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
```

#### 在 loader 中使用 Session

```typescript
// app/routes/vendors._index.tsx
import { getSession } from '~/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get('userId');
  
  if (!userId) {
    throw redirect('/login');
  }
  
  // ...
}
```

---

## 五、常見問題排查

### 5.1 部署失敗：找不到模組

#### 錯誤訊息
```
Error: Cannot find module '@remix-run/node'
```

#### 解決方法
確認 `package.json` 中包含所有必要依賴：

```json
{
  "dependencies": {
    "@remix-run/node": "^2.17.2",
    "@remix-run/react": "^2.17.2",
    "@remix-run/serve": "^2.17.2",
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  }
}
```

然後推送程式碼觸發重新部署。

---

### 5.2 資料庫連線失敗

#### 錯誤訊息
```
Error: connect ECONNREFUSED
```

#### 解決方法
1. 確認 `DATABASE_URL` 環境變數已正確設定
2. 確認 PostgreSQL 服務正在運作（在 Railway 專案頁面檢查）
3. 確認資料庫連線字串格式正確：
   ```
   postgresql://user:password@host:port/database
   ```

---

### 5.3 環境變數未生效

#### 錯誤訊息
```
Error: process.env.GEMINI_API_KEY is undefined
```

#### 解決方法
1. 確認環境變數已在 Railway 專案的 **"Variables"** 頁籤中設定
2. 確認環境變數名稱拼寫正確（區分大小寫）
3. 觸發重新部署（環境變數變更需要重新部署才會生效）

---

### 5.4 Remix 路由 404 錯誤

#### 問題描述
首頁可以正常開啟，但重新整理內頁時出現 404 錯誤。

#### 原因
這是 SPA 路由的常見問題，但 **Remix SSR 不應該出現此問題**，因為 Remix 會在伺服器端處理所有路由。

#### 解決方法
1. 確認使用 `remix-serve` 啟動伺服器（而非靜態檔案伺服器）
2. 確認 `package.json` 的 `start` 指令正確：
   ```json
   {
     "scripts": {
       "start": "remix-serve ./build/index.js"
     }
   }
   ```
3. 如果使用自訂伺服器（如 Express），確認所有路由都導向 Remix：
   ```typescript
   app.all('*', createRequestHandler({
     build: require('./build'),
   }));
   ```

---

### 5.5 效能問題：載入速度慢

#### 原因
- 資料庫查詢未優化（N+1 問題）
- 缺少資料庫索引
- AI API 調用過多

#### 解決方法

##### 1. 優化資料庫查詢

```typescript
// ❌ 錯誤（N+1 問題）
const vendors = await db.select().from(vendorsTable);
for (const vendor of vendors) {
  vendor.contacts = await db.select()
    .from(contactsTable)
    .where(eq(contactsTable.vendorId, vendor.id));
}

// ✅ 正確（使用 JOIN）
const vendors = await db.select()
  .from(vendorsTable)
  .leftJoin(contactsTable, eq(vendorsTable.id, contactsTable.vendorId));
```

##### 2. 新增資料庫索引

```sql
-- 針對常用查詢欄位新增索引
CREATE INDEX idx_vendors_region ON vendors(region);
CREATE INDEX idx_vendors_rating ON vendors(rating);
CREATE INDEX idx_contact_logs_vendor_id ON contact_logs(vendor_id);
```

##### 3. 快取 AI 回應

```typescript
// 使用 Remix 的 Cache-Control
export async function loader({ request }: LoaderFunctionArgs) {
  const summary = await generateAISummary(note);
  
  return json({ summary }, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // 快取 1 小時
    },
  });
}
```

---

## 六、生產環境最佳實踐

### 6.1 監控與日誌

#### 使用 Railway 內建日誌
1. 在 Railway 專案頁面，點擊 **"Deployments"**
2. 點擊最新的部署
3. 查看 **"Deploy Logs"**（即時日誌）

#### 整合第三方監控（選填）
- **Sentry**：錯誤追蹤
- **LogRocket**：使用者行為錄製
- **Datadog**：效能監控

---

### 6.2 自動備份資料庫

Railway PostgreSQL 提供自動備份功能：

1. 在 Railway 專案頁面，點擊 PostgreSQL 服務
2. 切換到 **"Settings"** 頁籤
3. 啟用 **"Automated Backups"**（每日自動備份）

---

### 6.3 設定自訂網域

#### Step 1：新增自訂網域
1. 在 Railway 專案頁面，點擊 **"Settings"**
2. 切換到 **"Domains"** 頁籤
3. 點擊 **"Add Custom Domain"**
4. 輸入網域名稱（如 `partnerlink.example.com`）

#### Step 2：配置 DNS
1. 前往網域註冊商（如 Cloudflare、GoDaddy）
2. 新增 CNAME 記錄：
   ```
   Type: CNAME
   Name: partnerlink
   Value: partnerlink-pro-production.up.railway.app
   ```
3. 等待 DNS 傳播（通常 5-30 分鐘）

#### Step 3：啟用 HTTPS
Railway 會自動為自訂網域申請 SSL 憑證（Let's Encrypt），無需手動配置。

---

### 6.4 設定 CI/CD 流程

Railway 預設已啟用 CI/CD（推送程式碼自動部署），但可以進一步優化：

#### 設定部署分支
1. 在 Railway 專案頁面，點擊 **"Settings"**
2. 切換到 **"Service"** 頁籤
3. 設定 **"Branch"** 為 `main`（僅 main 分支推送會觸發部署）

#### 設定部署通知
1. 在 Railway 專案頁面，點擊 **"Settings"**
2. 切換到 **"Integrations"** 頁籤
3. 整合 Slack 或 Discord（部署成功/失敗時通知）

---

## 七、部署檢查清單

### 7.1 部署前檢查

- [ ] 程式碼已推送至 GitHub
- [ ] `.env` 已加入 `.gitignore`
- [ ] `railway.toml` 已建立
- [ ] `package.json` 包含正確的 `build` 與 `start` 指令
- [ ] 所有環境變數已準備完成

### 7.2 部署中檢查

- [ ] Railway 專案已建立
- [ ] PostgreSQL 資料庫已新增
- [ ] 環境變數已配置
- [ ] 資料庫遷移已執行
- [ ] 部署成功（無錯誤訊息）

### 7.3 部署後檢查

- [ ] 公開 URL 可正常存取
- [ ] 首頁正常顯示
- [ ] 內頁重新整理正常（無 404）
- [ ] 資料庫連線正常（可查詢資料）
- [ ] AI 功能正常（可生成摘要）
- [ ] 影像上傳正常（R2 整合）
- [ ] 權限控制正常（不同角色存取限制）

---

## 八、回滾與災難復原

### 8.1 回滾到先前版本

#### 方法一：使用 Railway 介面
1. 在 Railway 專案頁面，點擊 **"Deployments"**
2. 找到先前成功的部署
3. 點擊 **"Redeploy"**

#### 方法二：使用 Git
```bash
# 回滾到先前 Commit
git revert HEAD
git push origin main

# 或強制回滾（謹慎使用）
git reset --hard <commit-hash>
git push --force origin main
```

---

### 8.2 資料庫復原

#### 從備份復原
1. 在 Railway 專案頁面，點擊 PostgreSQL 服務
2. 切換到 **"Backups"** 頁籤
3. 選擇備份點
4. 點擊 **"Restore"**

#### 手動備份
```bash
# 匯出資料庫
railway run pg_dump $DATABASE_URL > backup.sql

# 匯入資料庫
railway run psql $DATABASE_URL < backup.sql
```

---

## 九、成本優化

### 9.1 Railway 計費說明

Railway 採用用量計費模式：

- **免費額度**：每月 $5 美元（約 500 小時運行時間）
- **超出額度**：$0.000231/GB-hour（記憶體）+ $0.000463/vCPU-hour（CPU）

### 9.2 節省成本技巧

#### 1. 使用 Sleep Mode（開發環境）
開發環境可設定閒置時自動休眠：

1. 在 Railway 專案頁面，點擊 **"Settings"**
2. 啟用 **"Sleep on Idle"**（閒置 5 分鐘後休眠）

#### 2. 優化資料庫查詢
減少不必要的資料庫查詢，降低 CPU 使用率。

#### 3. 快取 AI 回應
避免重複調用 AI API，使用 Remix 的 Cache-Control。

---

## 版本歷史

| 版本 | 日期 | 變更內容 |
|------|------|----------|
| 1.0 | 2026-01-28 | 初始版本，提供完整 Remix SSR 部署指南 |
