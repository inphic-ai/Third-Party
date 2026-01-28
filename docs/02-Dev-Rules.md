# 02｜Dev Rules

> **文件目的**：本文件定義開發流程、變更留痕機制、安全規則與 PR 駁回標準，確保 Manus 不會偏離規範或造成系統風險。

---

## 一、開發規範 (Development Rules)

### 1.1 資料流與架構 (Remix 優先)

#### Server-Side First 原則
- **優先使用 Remix loader 處理資料讀取**：所有資料查詢必須在 Server-Side 進行，禁止在前端組件中直接調用 API。
- **優先使用 Remix action 處理資料變更**：所有表單提交、資料更新、刪除操作必須透過 Remix action 處理。
- **禁止使用傳統 REST API**：除非有特殊需求（如第三方整合），否則必須使用 Remix 的 loader/action 模式。

#### 型別安全
- **所有 API 回傳與元件 Props 必須嚴格定義於 `types.ts`**。
- **禁止使用 `any` 型別**：必須使用明確的型別定義或 `unknown`。
- **loader/action 回傳值必須使用 `TypedResponse`**：確保型別推斷正確。

```typescript
// ✅ 正確
export async function loader(): Promise<TypedResponse<VendorListLoaderData>> {
  const vendors = await db.select().from(vendorsTable);
  return json({ vendors });
}

// ❌ 錯誤
export async function loader() {
  const vendors = await db.select().from(vendorsTable);
  return json({ vendors }); // 缺少型別定義
}
```

#### 環境變數
- **API Key 必須嚴格從 `process.env` 讀取**，不得硬編碼。
- **環境變數僅能在 Server-Side 使用**（loader/action），禁止傳遞至前端。
- **所有環境變數必須在 `.env.example` 中定義**。

```typescript
// ✅ 正確（在 loader 中使用）
export async function loader() {
  const apiKey = process.env.GEMINI_API_KEY;
  const response = await fetch('https://api.gemini.com', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  return json({ data: await response.json() });
}

// ❌ 錯誤（在前端組件中使用）
function MyComponent() {
  const apiKey = process.env.GEMINI_API_KEY; // 禁止！
  // ...
}
```

---

### 1.2 UI/UX 設計原則 (Aesthetics)

#### 視覺語言
延續「戰情室」風格，必須遵循以下設計規範：

- **大圓角**：`rounded-[2.5rem]`（卡片、按鈕、輸入框）
- **毛玻璃效果**：`glass-card`（使用 backdrop-blur 與半透明背景）
- **深色背景**：`slate-900`（主要背景色）
- **高對比文字**：`text-white` 或 `text-slate-100`

#### 狀態顏色
- **台灣地區**：`text-blue-600`（Taiwan Pulse）
- **大陸地區**：`text-red-600`（China Pulse）
- **緊急公告**：`text-rose-500` + `animate-pulse`
- **成功狀態**：`text-green-500`
- **警告狀態**：`text-yellow-500`
- **錯誤狀態**：`text-red-500`

#### 響應式設計
- **所有看板與表格必須支援 Mobile 檢視**。
- **複雜表格應在手機端轉換為 Card 佈局**。
- **使用 Tailwind 的響應式斷點**：`sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)

---

### 1.3 影像與存取管理

#### Evidence Tracking（證據追蹤）
- **維修紀錄必須包含「Before/After」對比**：`beforePhotos` 與 `afterPhotos` 欄位必須實作。
- **影像應串接 R2 簽名連結**：確保安全性與時效性。
- **影像上傳必須在 Remix action 中處理**：使用 `unstable_parseMultipartFormData` 處理檔案上傳。

```typescript
// ✅ 正確（在 action 中處理影像上傳）
export async function action({ request }: ActionFunctionArgs) {
  const formData = await unstable_parseMultipartFormData(
    request,
    async ({ name, data }) => {
      // 上傳至 R2
      const url = await uploadToR2(data);
      return url;
    }
  );
  // ...
}
```

#### 資料屏蔽（Data Masking）
- **非管理員權限者，聯絡電話與通訊 ID 應預設進行遮罩**。
- **需點擊並觸發「聯繫紀錄」後方可解密**。
- **遮罩格式**：
  - 電話：`09XX-XXX-XXX` → `09XX-***-***`
  - LINE ID：`john_doe123` → `joh****123`
  - WeChat ID：`wechat_user` → `wec****ser`

```typescript
// ✅ 正確（在 loader 中實作遮罩）
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticateUser(request);
  const vendor = await db.select().from(vendorsTable).where(eq(vendorsTable.id, params.id));
  
  if (!user.permissions.canViewSensitiveData) {
    vendor.mainPhone = maskPhone(vendor.mainPhone);
    vendor.lineId = maskId(vendor.lineId);
  }
  
  return json({ vendor });
}
```

---

### 1.4 AI 整合規範

#### Gemini 模型選擇
- **Gemini 3 Pro**：用於複雜邏輯（如供應鏈優化建議、合規審查、深度分析）
- **Gemini 3 Flash**：用於即時摘要（如聯繫筆記總結、QA 提取、快速回應）

#### 調用規範
- **AI 調用必須在 Remix loader/action 中進行**，禁止在前端組件中調用。
- **必須實作錯誤處理與重試機制**（最多重試 3 次）。
- **必須設定 Timeout**（建議 30 秒）。

```typescript
// ✅ 正確（在 action 中調用 AI）
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const note = formData.get('note') as string;
  
  try {
    const summary = await generateAISummary(note, {
      model: 'gemini-3-flash',
      timeout: 30000,
      retries: 3
    });
    return json({ summary });
  } catch (error) {
    return json({ error: 'AI 服務暫時無法使用' }, { status: 500 });
  }
}
```

---

## 二、Git Commit 格式規範

### 2.1 Conventional Commits 標準

#### 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type (類型)
| Type | 說明 | 範例 |
|------|------|------|
| `feat` | 新增功能 | `feat(vendor): 實作兩岸廠商身分屬性標籤系統` |
| `fix` | 修補錯誤 | `fix(payment): 修正勞務報酬單上傳時的 OCR 辨識誤差` |
| `docs` | 文件修改 | `docs(readme): 更新 Remix 專案結構說明` |
| `style` | 不影響程式邏輯的代碼樣式改動 | `style(ui): 統一所有 Modal 的大圓角與毛玻璃樣式` |
| `refactor` | 重構（既不是新增功能也非修補錯誤） | `refactor(auth): 重構 JWT 驗證邏輯` |
| `perf` | 效能優化 | `perf(warroom): 優化 SSR 模式下數據看板的載入速度` |
| `test` | 新增或修改測試 | `test(vendor): 新增廠商 CRUD 測試` |
| `chore` | 建置程序或輔助工具的變動 | `chore(deps): 更新 Remix 至 2.17.2` |

#### Scope (影響範圍)
| Scope | 說明 |
|-------|------|
| `warroom` | 儀表板相關 |
| `vendor` | 廠商名錄與資料管理 |
| `maint` | 維修紀錄與影像系統 |
| `payment` | 請款、發票與財務 |
| `ai` | Gemini 模型與規則設定 |
| `auth` | 權限、人員與安全設定 |
| `comm` | 通訊中心與群組管理 |
| `task` | 日常任務與日曆 |
| `knowledge` | 知識庫 |
| `admin` | 後台管理 |
| `deploy` | 部署與 CI/CD |

#### Subject (主旨)
- 使用繁體中文
- 簡潔描述變更內容（不超過 50 字元）
- 不需要句號結尾

#### Body (內文，選填)
- 詳細描述變更原因與影響
- 使用繁體中文
- 每行不超過 72 字元

#### Footer (頁尾，選填)
- 關聯 Issue：`Closes #123`
- 破壞性變更：`BREAKING CHANGE: 描述`

---

### 2.2 變更留痕機制

#### 必須附上檔案清單
每次 Commit 必須在 Body 中列出變更的檔案清單與變更原因。

```
feat(vendor): 實作廠商標籤系統

變更檔案：
- app/routes/vendors._index.tsx (新增標籤篩選 UI)
- app/routes/vendors.$id.edit.tsx (新增標籤編輯功能)
- app/models/vendor.server.ts (新增標籤資料庫查詢)
- types.ts (新增 VendorTag 型別定義)

變更原因：
根據 01-UI-Field-Protocol.md 第 14 項欄位定義，實作自定義標籤功能，
方便快速檢索廠商特質（如：優良廠商、配合度高、急件處理）。

測試結果：
- ✅ 標籤新增/編輯/刪除功能正常
- ✅ 標籤篩選功能正常
- ✅ 權限控制正確（僅 Editor 以上可編輯）
```

#### TODOLIST 備份機制
- **每次變更前必須備份 TODOLIST**：將當前 TODO 項目記錄在 Commit Body 中。
- **每次變更後必須更新 TODOLIST**：標記已完成項目，新增待辦項目。

```
feat(auth): 實作 JWT 認證系統

變更前 TODOLIST：
- [ ] 實作 JWT 認證系統
- [ ] 實作 RBAC 權限控制
- [ ] 實作資料遮罩機制

變更後 TODOLIST：
- [x] 實作 JWT 認證系統
- [ ] 實作 RBAC 權限控制
- [ ] 實作資料遮罩機制
- [ ] 新增 Session 過期處理

新增待辦原因：
在實作 JWT 認證時發現需要處理 Session 過期情況，
新增至 TODOLIST 以確保後續實作完整性。
```

---

## 三、安全規則

### 3.1 環境變數管理

#### .env 禁止入庫
- **`.env` 檔案必須加入 `.gitignore`**。
- **禁止將任何包含敏感資訊的檔案提交至 Git**。
- **必須提供 `.env.example` 範本**。

#### .gitignore 嚴格版
```
# Environment Variables
.env
.env.local
.env.production

# Database
*.db
*.sqlite

# Logs
logs
*.log
npm-debug.log*

# Dependencies
node_modules/

# Build
build/
dist/
.cache/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Remix
.remix/
```

---

### 3.2 敏感資料處理

#### 禁止硬編碼
- **API Key**：必須從 `process.env` 讀取
- **資料庫連線字串**：必須從 `process.env.DATABASE_URL` 讀取
- **JWT Secret**：必須從 `process.env.JWT_SECRET` 讀取

#### 禁止前端暴露
- **環境變數僅能在 Server-Side 使用**（loader/action）
- **禁止將敏感資訊傳遞至前端組件**
- **禁止在前端 Console 輸出敏感資訊**

---

### 3.3 資料庫安全

#### SQL Injection 防護
- **必須使用 Drizzle ORM 的參數化查詢**，禁止字串拼接 SQL。
- **禁止使用 `db.execute()`**，除非有特殊需求並經過審核。

```typescript
// ✅ 正確（使用參數化查詢）
const vendors = await db.select()
  .from(vendorsTable)
  .where(eq(vendorsTable.name, userInput));

// ❌ 錯誤（字串拼接 SQL）
const vendors = await db.execute(
  `SELECT * FROM vendors WHERE name = '${userInput}'`
);
```

#### 權限控制
- **所有 loader/action 必須驗證使用者權限**。
- **禁止跳過權限檢查**。

```typescript
// ✅ 正確（驗證權限）
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticateUser(request);
  if (!user.permissions.viewVendors) {
    throw new Response("Forbidden", { status: 403 });
  }
  // ...
}

// ❌ 錯誤（跳過權限檢查）
export async function loader({ request }: LoaderFunctionArgs) {
  const vendors = await db.select().from(vendorsTable);
  return json({ vendors });
}
```

---

## 四、PR 駁回標準

### 4.1 自動駁回條件

以下情況將**自動駁回 PR**，無需討論：

#### 環境變數外洩
- ❌ `.env` 檔案被提交
- ❌ 程式碼中包含硬編碼的 API Key
- ❌ 程式碼中包含硬編碼的資料庫連線字串

#### 欄位協議違反
- ❌ 新增未定義欄位（未更新 `01-UI-Field-Protocol.md`）
- ❌ 刪除已定義欄位（未更新 `01-UI-Field-Protocol.md`）
- ❌ 更改欄位中文顯示名稱（未更新 `01-UI-Field-Protocol.md`）
- ❌ 更改欄位英文 Key（未更新 `01-UI-Field-Protocol.md`）

#### 型別安全違反
- ❌ 使用 `any` 型別
- ❌ loader/action 缺少型別定義
- ❌ 缺少 Zod 驗證

#### 架構違反
- ❌ 在前端組件中直接調用 API
- ❌ 在前端組件中使用環境變數
- ❌ 使用傳統 REST API（而非 Remix loader/action）

---

### 4.2 需討論條件

以下情況需要**討論後決定是否駁回**：

#### 效能問題
- ⚠️ N+1 查詢問題
- ⚠️ 缺少資料庫索引
- ⚠️ 過度使用 AI API（成本考量）

#### UI/UX 變更
- ⚠️ 調整欄位顯示順序（需說明原因）
- ⚠️ 變更視覺風格（需說明原因）
- ⚠️ 調整響應式佈局（需說明原因）

#### 業務邏輯變更
- ⚠️ 調整權限控制邏輯（需說明原因）
- ⚠️ 調整資料驗證規則（需說明原因）
- ⚠️ 調整 AI 模型選擇（需說明原因）

---

### 4.3 PR 檢查清單

提交 PR 前必須確認以下項目：

#### 程式碼品質
- [ ] 所有型別定義正確（無 `any`）
- [ ] 所有 loader/action 包含權限檢查
- [ ] 所有表單提交包含 Zod 驗證
- [ ] 所有環境變數從 `process.env` 讀取

#### 文件更新
- [ ] 若新增/修改欄位，已更新 `01-UI-Field-Protocol.md`
- [ ] 若變更環境變數，已更新 `.env.example`
- [ ] 若變更 API，已更新 API 文件
- [ ] 若變更部署流程，已更新 `03-Deploy-Guide-Railway.md`

#### Commit 規範
- [ ] Commit Message 符合 Conventional Commits 格式
- [ ] Commit Body 包含檔案清單與變更原因
- [ ] 若有 TODOLIST 變更，已在 Commit Body 中記錄

#### 測試驗證
- [ ] 功能測試通過
- [ ] 權限控制測試通過
- [ ] 響應式佈局測試通過（Desktop + Mobile）
- [ ] 無 Console 錯誤或警告

---

## 五、程式碼規範補充

### 5.1 Zod 欄位驗證

所有表單提交必須使用 Zod 進行驗證。

```typescript
// ✅ 正確（使用 Zod 驗證）
import { z } from 'zod';

const vendorSchema = z.object({
  name: z.string().min(2).max(100),
  taxId: z.string().length(8).optional(),
  region: z.enum(['台灣', '大陸']),
  entityType: z.enum(['公司', '個人']),
  serviceTypes: z.array(z.enum(['提供勞務', '提供商品', '製造商品'])).min(1),
  categories: z.array(z.string()).min(1),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const result = vendorSchema.safeParse(Object.fromEntries(formData));
  
  if (!result.success) {
    return json({ errors: result.error.flatten() }, { status: 400 });
  }
  
  // 繼續處理...
}
```

---

### 5.2 錯誤處理

所有 loader/action 必須實作錯誤處理。

```typescript
// ✅ 正確（實作錯誤處理）
export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const vendor = await db.select()
      .from(vendorsTable)
      .where(eq(vendorsTable.id, params.id));
    
    if (!vendor) {
      throw new Response("Not Found", { status: 404 });
    }
    
    return json({ vendor });
  } catch (error) {
    console.error('Failed to load vendor:', error);
    throw new Response("Internal Server Error", { status: 500 });
  }
}
```

---

## 版本歷史

| 版本 | 日期 | 變更內容 |
|------|------|----------|
| 1.0 | 2026-01-28 | 初始版本，定義完整開發規範與 PR 駁回標準 |
