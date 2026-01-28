# 00｜Project Scope

## 專案基本資訊

- **專案名稱**：PartnerLink Pro (協力廠商戰情室)
- **架構類型**：Remix (SSR) + TypeScript
- **目前狀態**：靜態 Mock Data 版本（前端完整實作，無後端 API/DB）

---

## 專案目標

這份專案名為 **PartnerLink Pro (協力廠商戰情室)**，是一個專為台灣與大陸地區協力廠商設計的綜合管理系統。其核心功能與特色簡述如下：

### 核心功能模組

1. **廠商身分管理**：針對廠商進行身分屬性分類，區分為「提供勞務」、「提供商品」及「製造商品」三大類，並支援兩岸不同地區的區域化管理。

2. **戰略戰術看板 (War Room)**：提供即時數據儀表板，分析供應鏈健康度、財務水位、區域績效，並結合 AI 提供優化建議。

3. **維修與資產管理**：包含詳細的設備維修紀錄，支援「施工前/後」多圖對照、產品標籤分類及 R2 雲端儲存整合。

4. **支付與財務追蹤**：管理請款單據、發票與勞務報酬單，監控資金流向與核銷異常。

5. **通訊與任務中心**：統一管理 LINE/WeChat 的專案群組與聯絡窗口，並結合日曆系統管理每日跟進任務與預約。

6. **智能輔助系統**：
   - **AI 助手**：自動生成驗收 QA、總結聯繫筆記、提供廠商媒合建議。
   - **知識庫**：累積專案經驗與異常處理技巧，實現企業經驗傳承。

7. **後台管理權限**：具備完善的人員權限控管 (RBAC)、操作審計日誌、AI 模型訓練規則設定及系統公告發布。

### 技術架構

- **全棧框架**：Remix (SSR) + TypeScript
- **資料庫**：Railway PostgreSQL
- **ORM**：Drizzle ORM
- **雲端儲存**：Cloudflare R2
- **UI 框架**：Tailwind CSS + Lucide Icons
- **圖表庫**：Recharts
- **AI 服務**：Google Gemini (Pro/Flash)
- **驗證庫**：Zod
- **認證**：JWT

---

## Manus 接手範圍

### ✅ 在範圍內 (In Scope)

Manus 將負責以下任務，將靜態 Mock Data 版本升級為 Remix SSR 全棧應用：

#### 1. Remix 架構轉換
- **將現有 Vite + React 專案遷移至 Remix SSR 架構**
- 使用 Remix 的 `loader` 處理資料讀取（Server-Side Data Fetching）
- 使用 Remix 的 `action` 處理資料變更（Form Submissions & Mutations）
- 實作 Remix 的路由系統（app/routes/）
- 配置 Remix 的 SSR 渲染機制

#### 2. 資料庫設計與實作
- 使用 **Drizzle ORM** + **Railway PostgreSQL**
- 根據 `types.ts` 與 `01-UI-Field-Protocol.md` 設計資料表結構
- 實作資料遷移腳本（schema.sql）
- 建立索引與全文搜尋（PostgreSQL tsvector）
- 在 Remix loader 中實作資料庫查詢邏輯

#### 3. 雲端儲存整合
- 整合 **Cloudflare R2** 用於維修紀錄影像儲存
- 實作簽名 URL 生成機制（Before/After 影像對照）
- 在 Remix action 中處理檔案上傳邏輯

#### 4. AI 服務整合
- 整合 **Google Gemini API**
  - **Gemini Pro**：用於複雜邏輯（供應鏈優化建議、合規審查）
  - **Gemini Flash**：用於即時摘要（聯繫筆記總結、QA 提取）
- 在 Remix loader/action 中調用 AI API
- 實作 AI 回應的錯誤處理與重試機制

#### 5. 權限與安全
- 實作 **JWT 認證系統**（Session Management）
- 建立 **RBAC 權限控制**（系統管理員、經理、編輯、觀察員）
- 敏感資料遮罩機制（聯絡電話、通訊 ID）
- 在 Remix loader 中實作權限檢查邏輯

#### 6. 資料驗證
- 使用 **Zod** 實作前後端資料驗證
- 在 Remix action 中驗證表單提交資料
- 確保所有欄位符合 `01-UI-Field-Protocol.md` 規範

#### 7. 部署與 CI/CD
- 配置 **Railway 自動部署**（GitHub → Railway）
- 設定 Remix 專屬的 Railway 配置（railway.toml）
- 設定環境變數管理（.env.example 範本）
- 確保 Remix SSR 在 Railway 上正常運作

---

### ❌ 不在範圍內 (Out of Scope)

以下事項 **不在 Manus 接手範圍內**，請勿進行：

#### 1. UI/UX 重構
- **禁止修改現有 UI 組件結構**（components/ 資料夾）
- **禁止變更設計風格**（大圓角、毛玻璃效果、配色方案）
- **禁止調整欄位顯示順序**（除非 `01-UI-Field-Protocol.md` 明確要求）

#### 2. 欄位語意變更
- **禁止更改欄位中文顯示名稱**
- **禁止修改欄位英文 Key**（除非修正明顯錯誤）
- **禁止新增或刪除欄位**（除非業務需求明確變更）

#### 3. 技術棧變更
- **禁止使用 MySQL**（必須使用 PostgreSQL）
- **禁止使用 Prisma**（必須使用 Drizzle ORM）
- **禁止使用 AWS S3**（必須使用 Cloudflare R2）
- **禁止使用 Next.js**（必須使用 Remix）

#### 4. 本地資料庫
- **禁止要求本地安裝資料庫**（開發環境應直接連接 Railway PostgreSQL）

---

## 環境變數需求

### 核心基礎設施配置

#### 資料庫連線
```
DATABASE_URL=postgresql://user:password@host:port/database
```
定義系統對接 Railway PostgreSQL 的存取路徑，確保資料讀寫的穩定性。

#### 安全認證密鑰
```
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here
```
- `JWT_SECRET`：用於 JWT Token 簽發與驗證
- `SESSION_SECRET`：用於 Remix Session 管理

### 第三方服務整合

#### AI 服務配置
```
GEMINI_API_KEY=your-gemini-api-key
```
設定 Google Gemini 系列模型的調用憑證，用於啟動智能摘要、供應鏈優化建議與 QA 提取功能。

#### 雲端存取設定
```
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.dev
```
定義 Cloudflare R2 儲存桶的存取參數，用於處理設備維修紀錄的「施工前/後」影像儲存與簽名連結生成。

### Remix 專屬配置

#### 部署環境
```
NODE_ENV=production
```
用於區分開發與正式環境，影響 Remix 的渲染模式與錯誤處理。

### 多環境部署標準

#### 環境區分基準
- **開發環境 (Dev)**：使用 Railway Dev 資料庫，啟用詳細錯誤訊息
- **測試環境 (Staging)**：使用 Railway Staging 資料庫，模擬正式環境配置
- **正式環境 (Production)**：使用 Railway Production 資料庫，啟用效能優化

#### 安全性審查指引
- **禁止硬編碼**：所有敏感資訊必須透過環境變數讀取
- **禁止前端暴露**：API Key 必須僅在 Remix loader/action 中使用，不得傳遞至前端
- **禁止版本控制**：.env 檔案必須加入 .gitignore

### 開發者引導

#### 配置範本檔 (.env.example)
```
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here

# AI Service
GEMINI_API_KEY=your-gemini-api-key

# Cloud Storage
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Environment
NODE_ENV=development
```

---

## Remix 架構規範

### Server-Side First 原則

#### Loader（資料讀取）
所有資料讀取必須在 Remix loader 中進行，禁止在前端組件中直接調用 API。

```typescript
// app/routes/vendors._index.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  // 1. 驗證使用者權限
  const user = await authenticateUser(request);
  if (!user.permissions.viewVendors) {
    throw new Response("Forbidden", { status: 403 });
  }

  // 2. 查詢資料庫
  const vendors = await db.select().from(vendorsTable);

  // 3. 回傳資料
  return json({ vendors });
}
```

#### Action（資料變更）
所有資料變更必須透過 Remix action 處理，禁止使用傳統 REST API。

```typescript
// app/routes/vendors.$id.edit.tsx
export async function action({ request, params }: ActionFunctionArgs) {
  // 1. 驗證使用者權限
  const user = await authenticateUser(request);
  if (!user.permissions.canDeleteVendors) {
    throw new Response("Forbidden", { status: 403 });
  }

  // 2. 驗證表單資料
  const formData = await request.formData();
  const result = vendorSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return json({ errors: result.error.flatten() }, { status: 400 });
  }

  // 3. 更新資料庫
  await db.update(vendorsTable)
    .set(result.data)
    .where(eq(vendorsTable.id, params.id));

  // 4. 重導向
  return redirect(`/vendors/${params.id}`);
}
```

### 型別安全

所有 loader/action 回傳值必須嚴格定義型別，禁止使用 `any`。

```typescript
// types.ts
export interface VendorListLoaderData {
  vendors: Vendor[];
  totalCount: number;
  currentPage: number;
}

// app/routes/vendors._index.tsx
export async function loader(): Promise<TypedResponse<VendorListLoaderData>> {
  // ...
  return json({ vendors, totalCount, currentPage });
}
```

---

## 驗收標準

### 功能驗收
- [ ] 所有 Mock Data 替換為 Remix loader 資料讀取
- [ ] 所有表單提交透過 Remix action 處理
- [ ] 資料庫 CRUD 操作正常運作
- [ ] AI 功能（摘要、建議）正常回應
- [ ] 影像上傳與 R2 簽名 URL 正常顯示
- [ ] 權限控制正確限制不同角色存取
- [ ] SSR 渲染正常（首屏無閃爍、SEO 友善）

### 技術驗收
- [ ] 所有資料讀取使用 Remix loader
- [ ] 所有資料變更使用 Remix action
- [ ] 使用 Zod 進行資料驗證
- [ ] 環境變數正確配置（無硬編碼）
- [ ] Railway 部署成功且 Remix SSR 正常運作
- [ ] 所有欄位符合 `01-UI-Field-Protocol.md` 規範

### 文件驗收
- [ ] 更新 README.md 包含 Remix 專案結構說明
- [ ] 提供 .env.example 範本
- [ ] 更新 API 文件（loader/action 規範）
- [ ] 提供 Remix 路由結構文件

---

## 專案交付清單

當 Manus 完成開發後，應交付以下項目：

1. **完整 Remix 專案原始碼**（含 app/routes/ 結構）
2. **資料庫遷移腳本**（schema.sql + Drizzle 遷移檔案）
3. **環境變數範本**（.env.example）
4. **Remix 路由文件**（loader/action 規範）
5. **Railway 部署配置**（railway.toml）
6. **測試報告**（功能測試結果）

---

## 版本歷史

| 版本 | 日期 | 變更內容 |
|------|------|----------|
| 1.1 | 2026-01-28 | 更新為 Remix SSR 架構規範 |
| 1.0 | 2026-01-28 | 初始版本 |
