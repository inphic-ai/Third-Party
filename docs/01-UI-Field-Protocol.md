# 01｜UI Field Protocol

> **文件目的**：本文件定義所有 UI 欄位的中文顯示名稱、英文 Key、顯示順序、必填屬性與驗收標準，作為系統的「欄位協議」，確保資料結構不走樣、不偷欄位、不改語意、不亂命名。

---

## 核心設計理念 (Design Rationale)

### 1. 欄位命名原則
- **中文顯示名稱**：面向使用者，必須符合台灣商業用語習慣
- **英文 Key**：面向開發者，必須使用 camelCase，語意清晰
- **禁止縮寫**：除非是業界通用縮寫（如 ID、URL、AI），否則必須使用完整單字

### 2. 顯示順序固定性
- **核心欄位**：必須按照業務邏輯順序排列，禁止隨意調整
- **擴展欄位**：可依需求調整，但必須標註「可調整」
- **隱藏欄位**：僅在特定權限下顯示，必須標註「權限限制」

### 3. 必填屬性
- **強制必填**：標註 `[必填]`，前後端必須驗證
- **條件必填**：標註 `[條件必填]`，並說明觸發條件
- **選填**：標註 `[選填]`，可為空值

### 4. 資料類型
- **字串 (string)**：文字、ID、URL
- **數字 (number)**：金額、評分、數量
- **布林 (boolean)**：是/否、啟用/停用
- **列舉 (enum)**：固定選項（如地區、狀態）
- **陣列 (array)**：多選項目（如標籤、聯絡人）
- **物件 (object)**：結構化資料（如地址、聯絡窗口）

---

## 模組欄位協議

### ★ 廠商名錄 (Vendor)

#### 設計理念
廠商名錄是系統的核心資料實體，欄位順序必須遵循「識別 → 分類 → 聯絡 → 評價 → 歷史」的邏輯結構，確保資料完整性與可追溯性。

#### 欄位定義

| 顯示順序 | 中文顯示名稱 | 英文 Key | 資料類型 | 必填屬性 | 驗收標準 |
|---------|-------------|---------|---------|---------|---------|
| 1 | 廠商 ID | `id` | string | [系統自動] | UUID 格式 |
| 2 | 廠商名稱 | `name` | string | [必填] | 2-100 字元 |
| 3 | 統一編號 | `taxId` | string | [條件必填] | 公司類型必填，8 位數字 |
| 4 | 頭像 URL | `avatarUrl` | string | [必填] | 有效 URL 格式 |
| 5 | 地區 | `region` | enum | [必填] | 台灣/大陸 |
| 6 | 省份 | `province` | string | [選填] | 大陸地區建議填寫 |
| 7 | 實體類型 | `entityType` | enum | [必填] | 公司/個人 |
| 8 | 服務類型 | `serviceTypes` | array | [必填] | 至少選擇一項 |
| 9 | 主營類別 | `categories` | array | [必填] | 至少選擇一項 |
| 10 | 評分 | `rating` | number | [系統計算] | 0-5，小數點後一位 |
| 11 | 評分次數 | `ratingCount` | number | [系統計算] | 非負整數 |
| 12 | 建立者 | `createdBy` | string | [系統自動] | 使用者 ID |
| 13 | 價格區間 | `priceRange` | enum | [必填] | $/$$/$$$/$$$$  |
| 14 | 標籤 | `tags` | array | [選填] | 自定義標籤 |
| 15 | 黑名單狀態 | `isBlacklisted` | boolean | [必填] | 預設 false |
| 16 | 主要電話 | `mainPhone` | string | [選填] | 台灣格式：09XX-XXX-XXX |
| 17 | 地址 | `address` | string | [選填] | 完整地址 |
| 18 | 網站 | `website` | string | [選填] | 有效 URL 格式 |
| 19 | LINE ID | `lineId` | string | [選填] | 遮罩顯示 |
| 20 | WeChat ID | `wechatId` | string | [選填] | 遮罩顯示 |
| 21 | 聯絡窗口 | `contacts` | array | [選填] | ContactWindow 物件陣列 |
| 22 | 社群群組 | `socialGroups` | array | [選填] | SocialGroup 物件陣列 |
| 23 | 聯繫紀錄 | `contactLogs` | array | [系統自動] | ContactLog 物件陣列 |
| 24 | 交易紀錄 | `transactions` | array | [系統自動] | Transaction 物件陣列 |
| 25 | 服務區域 | `serviceArea` | string | [選填] | 文字描述 |
| 26 | 內部備註 | `internalNotes` | string | [選填] | 僅管理員可見 |
| 27 | 收藏狀態 | `isFavorite` | boolean | [使用者設定] | 預設 false |
| 28 | 未接聯繫次數 | `missedContactLogCount` | number | [系統計算] | 非負整數 |
| 29 | 電話查看次數 | `phoneViewCount` | number | [系統計算] | 非負整數 |
| 30 | 預約點擊次數 | `bookingClickCount` | number | [系統計算] | 非負整數 |

#### 服務類型列舉 (ServiceType)
| 中文名稱 | 英文 Key |
|---------|---------|
| 提供勞務 | `LABOR` |
| 提供商品 | `PRODUCT` |
| 製造商品 | `MANUFACTURING` |

#### 主營類別列舉 (VendorCategory)
| 中文名稱 | 英文 Key |
|---------|---------|
| 水電 | `PLUMBING` |
| 玻璃 | `GLASS` |
| 冷凍空調 | `HVAC` |
| 包裝耗材 | `PACKAGING` |
| 鐵工修復 | `IRONWORK` |
| 木工修復 | `WOODWORK` |
| 油壓設備 | `HYDRAULIC` |
| 機車維修 | `SCOOTER_REPAIR` |
| 通路平台 | `PLATFORM` |
| 國際運輸 | `INTL_LOGISTICS` |
| 國內運輸 | `DOMESTIC_LOGISTICS` |
| 平面設計 | `DESIGN` |
| 家電維修 | `APPLIANCE` |
| 電池 | `BATTERY` |
| 辦公文具 | `STATIONERY` |
| 燈具 | `LIGHTING` |
| 五金零件 | `HARDWARE` |
| 法律 | `LEGAL` |
| 檢驗單位 | `INSPECTION` |
| 軟硬體工程師 | `ENGINEER` |
| 銀行＆金流 | `BANKING` |
| 裝修工程 | `RENOVATION` |
| LALA司機 | `LALAMOVE` |
| 其它 | `OTHER` |

---

### ★ 聯絡窗口 (ContactWindow)

#### 設計理念
聯絡窗口是廠商的子實體，必須支援多窗口管理，並具備敏感資訊遮罩機制。

#### 欄位定義

| 顯示順序 | 中文顯示名稱 | 英文 Key | 資料類型 | 必填屬性 | 驗收標準 |
|---------|-------------|---------|---------|---------|---------|
| 1 | 窗口 ID | `id` | string | [系統自動] | UUID 格式 |
| 2 | 姓名 | `name` | string | [必填] | 2-50 字元 |
| 3 | 職位 | `role` | string | [必填] | 2-50 字元 |
| 4 | 手機 | `mobile` | string | [選填] | 遮罩顯示，權限解密 |
| 5 | Email | `email` | string | [選填] | 有效 Email 格式 |
| 6 | 主要聯絡人 | `isMainContact` | boolean | [必填] | 每個廠商僅一位 |
| 7 | LINE ID | `lineId` | string | [選填] | 遮罩顯示，權限解密 |
| 8 | WeChat ID | `wechatId` | string | [選填] | 遮罩顯示，權限解密 |

---

### ★ 社群群組 (SocialGroup)

#### 設計理念
社群群組用於管理 LINE/WeChat 專案群組，必須支援 QR Code 儲存與系統代碼追蹤。

#### 欄位定義

| 顯示順序 | 中文顯示名稱 | 英文 Key | 資料類型 | 必填屬性 | 驗收標準 |
|---------|-------------|---------|---------|---------|---------|
| 1 | 群組 ID | `id` | string | [系統自動] | UUID 格式 |
| 2 | 平台 | `platform` | enum | [必填] | LINE/WeChat |
| 3 | 群組名稱 | `groupName` | string | [必填] | 2-100 字元 |
| 4 | 系統代碼 | `systemCode` | string | [必填] | 唯一識別碼 |
| 5 | 邀請連結 | `inviteLink` | string | [選填] | 有效 URL 格式 |
| 6 | QR Code URL | `qrCodeUrl` | string | [選填] | R2 簽名 URL |
| 7 | 備註 | `note` | string | [選填] | 文字描述 |

---

### ★ 聯繫紀錄 (ContactLog)

#### 設計理念
聯繫紀錄用於追蹤與廠商的溝通歷史，必須支援 AI 摘要與預約管理。

#### 欄位定義

| 顯示順序 | 中文顯示名稱 | 英文 Key | 資料類型 | 必填屬性 | 驗收標準 |
|---------|-------------|---------|---------|---------|---------|
| 1 | 紀錄 ID | `id` | string | [系統自動] | UUID 格式 |
| 2 | 聯繫日期 | `date` | string | [必填] | ISO 8601 格式 |
| 3 | 聯繫狀態 | `status` | enum | [必填] | ContactStatus 列舉 |
| 4 | 備註 | `note` | string | [必填] | 1-1000 字元 |
| 5 | AI 摘要 | `aiSummary` | string | [AI 生成] | Gemini Flash 生成 |
| 6 | 下次跟進 | `nextFollowUp` | string | [選填] | ISO 8601 格式 |
| 7 | 是否預約 | `isReservation` | boolean | [必填] | 預設 false |
| 8 | 預約時間 | `reservationTime` | string | [條件必填] | 預約時必填 |
| 9 | 報價金額 | `quoteAmount` | number | [選填] | 非負數 |
| 10 | 關聯產品 ID | `relatedProductId` | string | [選填] | UUID 格式 |

#### 聯繫狀態列舉 (ContactStatus)
| 中文名稱 | 英文 Key |
|---------|---------|
| 聯繫成功 | `SUCCESS` |
| 在忙 | `BUSY` |
| 報價過高 | `TOO_HIGH` |
| 最近沒空 | `NO_TIME` |
| 態度不好 | `BAD_ATTITUDE` |
| 已預約 | `RESERVED` |

---

### ★ 維修紀錄 (MaintenanceRecord)

#### 設計理念
維修紀錄必須包含「施工前/後」影像對照，並支援產品標籤分類與 AI 報告生成。

#### 欄位定義

| 顯示順序 | 中文顯示名稱 | 英文 Key | 資料類型 | 必填屬性 | 驗收標準 |
|---------|-------------|---------|---------|---------|---------|
| 1 | 紀錄 ID | `id` | string | [系統自動] | UUID 格式 |
| 2 | 案件編號 | `caseId` | string | [必填] | 唯一識別碼 |
| 3 | 維修日期 | `date` | string | [必填] | ISO 8601 格式 |
| 4 | 設備名稱 | `deviceName` | string | [必填] | 2-100 字元 |
| 5 | 設備編號 | `deviceNo` | string | [必填] | 唯一識別碼 |
| 6 | 廠商名稱 | `vendorName` | string | [必填] | 關聯廠商 |
| 7 | 廠商 ID | `vendorId` | string | [必填] | UUID 格式 |
| 8 | 狀態 | `status` | enum | [必填] | MaintenanceStatus 列舉 |
| 9 | 描述 | `description` | string | [必填] | 1-1000 字元 |
| 10 | 產品標籤 | `productTags` | array | [必填] | 至少一項 |
| 11 | 施工前照片 | `beforePhotos` | array | [必填] | MediaItem 物件陣列 |
| 12 | 完工照片 | `afterPhotos` | array | [必填] | MediaItem 物件陣列 |
| 13 | AI 報告 | `aiReport` | string | [AI 生成] | Gemini Pro 生成 |

#### 維修狀態列舉 (MaintenanceStatus)
| 中文名稱 | 英文 Key |
|---------|---------|
| 已完成 | `COMPLETED` |
| 維修中 | `IN_PROGRESS` |
| 已歸檔 | `ARCHIVED` |
| 待處理 | `PENDING` |

---

### ★ 交易紀錄 (Transaction)

#### 設計理念
交易紀錄用於追蹤工單從施工到驗收的完整生命週期，必須支援勞務報酬單管理與 QA 提取。

#### 欄位定義

| 顯示順序 | 中文顯示名稱 | 英文 Key | 資料類型 | 必填屬性 | 驗收標準 |
|---------|-------------|---------|---------|---------|---------|
| 1 | 交易 ID | `id` | string | [系統自動] | UUID 格式 |
| 2 | 廠商 ID | `vendorId` | string | [必填] | UUID 格式 |
| 3 | 開始日期 | `date` | string | [必填] | ISO 8601 格式 |
| 4 | 完工日期 | `completionDate` | string | [選填] | ISO 8601 格式 |
| 5 | 客戶 ID | `customerId` | string | [必填] | UUID 格式 |
| 6 | 描述 | `description` | string | [必填] | 1-1000 字元 |
| 7 | 實際金額 | `amount` | number | [必填] | 非負數 |
| 8 | 初始報價 | `initialQuote` | number | [必填] | 非負數 |
| 9 | 狀態 | `status` | enum | [必填] | TransactionStatus 列舉 |
| 10 | 勞報單狀態 | `laborFormStatus` | enum | [必填] | N/A/Pending/Submitted/Paid |
| 11 | 施工前照片 | `photosBefore` | array | [必填] | MediaItem 物件陣列 |
| 12 | 完工照片 | `photosAfter` | array | [必填] | MediaItem 物件陣列 |
| 13 | 工時 | `timeSpentHours` | number | [必填] | 非負數 |
| 14 | 經理回饋 | `managerFeedback` | string | [選填] | 文字描述 |
| 15 | 品質評分 | `qualityRating` | number | [選填] | 1-5 |
| 16 | 驗收人 ID | `approverId` | string | [選填] | UUID 格式 |
| 17 | 驗收日期 | `approvalDate` | string | [選填] | ISO 8601 格式 |
| 18 | 驗收報告 | `acceptanceReport` | string | [選填] | 文字描述 |
| 19 | 生成 QA | `generatedQA` | array | [AI 生成] | KnowledgeBaseItem 物件陣列 |

#### 交易狀態列舉 (TransactionStatus)
| 中文名稱 | 英文 Key |
|---------|---------|
| 施工中 | `IN_PROGRESS` |
| 待驗收 | `PENDING_APPROVAL` |
| 已驗收/待撥款 | `APPROVED` |
| 已結案 | `PAID` |
| 驗收未過 | `REJECTED` |

---

### ★ 請款與發票 (InvoiceRecord)

#### 設計理念
請款與發票管理必須追蹤未請款、已請款、已付款三大階段，並支援 OCR 自動識別。

#### 欄位定義

| 顯示順序 | 中文顯示名稱 | 英文 Key | 資料類型 | 必填屬性 | 驗收標準 |
|---------|-------------|---------|---------|---------|---------|
| 1 | 發票 ID | `id` | string | [系統自動] | UUID 格式 |
| 2 | 廠商名稱 | `vendorName` | string | [必填] | 關聯廠商 |
| 3 | 維修 ID | `maintenanceId` | string | [選填] | UUID 格式 |
| 4 | 金額 | `amount` | number | [必填] | 非負數 |
| 5 | 日期 | `date` | string | [必填] | ISO 8601 格式 |
| 6 | 發票號碼 | `invoiceNo` | string | [必填] | 唯一識別碼 |
| 7 | 狀態 | `status` | enum | [必填] | PaymentStatus 列舉 |
| 8 | 附件 URL | `attachmentUrl` | string | [必填] | R2 簽名 URL |

#### 付款狀態列舉 (PaymentStatus)
| 中文名稱 | 英文 Key |
|---------|---------|
| 未請款 | `PENDING` |
| 已請款 | `BILLED` |
| 已付款 | `PAID` |

---

### ★ 知識庫 (KnowledgeBaseItem)

#### 設計理念
知識庫用於累積專案經驗，必須支援從交易紀錄自動提取 QA。

#### 欄位定義

| 顯示順序 | 中文顯示名稱 | 英文 Key | 資料類型 | 必填屬性 | 驗收標準 |
|---------|-------------|---------|---------|---------|---------|
| 1 | 知識 ID | `id` | string | [系統自動] | UUID 格式 |
| 2 | 問題 | `question` | string | [必填] | 5-500 字元 |
| 3 | 答案 | `answer` | string | [必填] | 10-2000 字元 |
| 4 | 來源交易 ID | `sourceTransactionId` | string | [選填] | UUID 格式 |
| 5 | 標籤 | `tags` | array | [必填] | 至少一項 |
| 6 | 建立時間 | `createdAt` | string | [系統自動] | ISO 8601 格式 |

---

### ★ 系統公告 (Announcement)

#### 設計理念
系統公告必須支援精準推播（地區、身分），並具備緊急通知機制。

#### 欄位定義

| 顯示順序 | 中文顯示名稱 | 英文 Key | 資料類型 | 必填屬性 | 驗收標準 |
|---------|-------------|---------|---------|---------|---------|
| 1 | 公告 ID | `id` | string | [系統自動] | UUID 格式 |
| 2 | 標題 | `title` | string | [必填] | 5-100 字元 |
| 3 | 內容 | `content` | string | [必填] | 10-2000 字元 |
| 4 | 日期 | `date` | string | [必填] | ISO 8601 格式 |
| 5 | 優先級 | `priority` | enum | [必填] | High/Normal |
| 6 | 作者 | `author` | string | [選填] | 使用者 ID |
| 7 | 標籤 | `tags` | array | [選填] | 自定義標籤 |
| 8 | 目標身分 | `targetIdentity` | array | [選填] | ServiceType 列舉 |
| 9 | 目標地區 | `targetRegion` | enum | [選填] | Region 列舉 |

---

### ★ 人員權限 (AdminUser)

#### 設計理念
人員權限必須實作 RBAC 模型，並支援 IP 白名單與時間限制。

#### 欄位定義

| 顯示順序 | 中文顯示名稱 | 英文 Key | 資料類型 | 必填屬性 | 驗收標準 |
|---------|-------------|---------|---------|---------|---------|
| 1 | 使用者 ID | `id` | string | [系統自動] | UUID 格式 |
| 2 | 姓名 | `name` | string | [必填] | 2-50 字元 |
| 3 | Email | `email` | string | [必填] | 有效 Email 格式 |
| 4 | 頭像 URL | `avatarUrl` | string | [選填] | 有效 URL 格式 |
| 5 | 部門 | `department` | string | [必填] | 關聯部門 |
| 6 | 角色 | `role` | enum | [必填] | UserRole 列舉 |
| 7 | 狀態 | `status` | enum | [必填] | Active/Inactive |
| 8 | 累積獎金 | `accumulatedBonus` | number | [系統計算] | 非負數 |
| 9 | Google 連結 | `googleLinked` | boolean | [系統自動] | 預設 false |
| 10 | Google Email | `googleEmail` | string | [選填] | 有效 Email 格式 |
| 11 | 權限設定 | `permissions` | object | [必填] | UserPermissions 物件 |
| 12 | 安全設定 | `securitySettings` | object | [選填] | SecuritySettings 物件 |

#### 角色列舉 (UserRole)
| 中文名稱 | 英文 Key | 權限說明 |
|---------|---------|---------|
| 系統管理員 | `System Admin` | 完整權限 |
| 經理 | `Manager` | 可讀寫核心模組，可審核交易 |
| 編輯 | `Editor` | 可讀寫核心模組，無審核權限 |
| 觀察員 | `Viewer` | 僅可讀取，無寫入權限 |

#### 權限設定 (UserPermissions)
| 中文名稱 | 英文 Key | 預設值 (Admin) | 預設值 (Manager) | 預設值 (Editor) | 預設值 (Viewer) |
|---------|---------|---------------|----------------|---------------|----------------|
| 查看戰情室 | `viewWarRoom` | ✓ | ✓ | ✓ | ✓ |
| 查看廠商 | `viewVendors` | ✓ | ✓ | ✓ | ✓ |
| 查看任務 | `viewTasks` | ✓ | ✓ | ✓ | ✓ |
| 查看通訊 | `viewCommunication` | ✓ | ✓ | ✓ | ✓ |
| 查看財務 | `viewPayments` | ✓ | ✓ | ✓ | ✓ |
| 查看知識庫 | `viewKnowledge` | ✓ | ✓ | ✓ | ✓ |
| 查看公告 | `viewAnnouncements` | ✓ | ✓ | ✓ | ✓ |
| 存取後台 | `accessAdminPanel` | ✓ | ✓ | ✗ | ✗ |
| 管理類別 | `canManageCategories` | ✓ | ✓ | ✗ | ✗ |
| 管理使用者 | `canManageUsers` | ✓ | ✗ | ✗ | ✗ |
| 刪除廠商 | `canDeleteVendors` | ✓ | ✗ | ✗ | ✗ |

---

### ★ 審計日誌 (SystemLog)

#### 設計理念
審計日誌必須記錄「誰、在什麼時間、對什麼物件、做了什麼變更」，確保可追溯性。

#### 欄位定義

| 顯示順序 | 中文顯示名稱 | 英文 Key | 資料類型 | 必填屬性 | 驗收標準 |
|---------|-------------|---------|---------|---------|---------|
| 1 | 日誌 ID | `id` | string | [系統自動] | UUID 格式 |
| 2 | 時間戳記 | `timestamp` | string | [系統自動] | ISO 8601 格式 |
| 3 | 使用者 | `user` | string | [系統自動] | 使用者 ID |
| 4 | 操作 | `action` | string | [系統自動] | 動詞描述 |
| 5 | 目標 | `target` | string | [系統自動] | 物件類型與 ID |
| 6 | 詳細資訊 | `details` | string | [系統自動] | JSON 格式變更對比 |
| 7 | IP 位址 | `ip` | string | [系統自動] | IPv4/IPv6 格式 |
| 8 | User Agent | `userAgent` | string | [系統自動] | 瀏覽器資訊 |
| 9 | 狀態 | `status` | enum | [系統自動] | Update/Create/Delete/System |

---

## 驗收標準

### 欄位完整性
- [ ] 所有欄位必須按照本文件定義實作
- [ ] 禁止新增未定義欄位（除非業務需求變更並更新本文件）
- [ ] 禁止刪除已定義欄位（除非業務需求變更並更新本文件）

### 命名一致性
- [ ] 中文顯示名稱必須與本文件一致
- [ ] 英文 Key 必須使用 camelCase
- [ ] 禁止使用縮寫（除非本文件明確定義）

### 資料驗證
- [ ] 所有 [必填] 欄位必須在前後端驗證
- [ ] 所有 [條件必填] 欄位必須實作觸發條件驗證
- [ ] 所有列舉欄位必須限制為定義值

### 顯示順序
- [ ] 表單與詳細頁面必須按照「顯示順序」欄位排列
- [ ] 列表頁面可依需求調整，但核心欄位必須優先顯示

---

## 版本歷史

| 版本 | 日期 | 變更內容 |
|------|------|----------|
| 1.0 | 2026-01-28 | 初始版本，定義所有核心模組欄位協議 |
