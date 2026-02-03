# 郵件服務設定指南

本系統使用 [Resend](https://resend.com/) 作為郵件發送服務，用於發送用戶審核通知。

## 功能說明

系統會在以下情況自動發送郵件通知：

1. **批准通知**：當管理員批准用戶申請時，系統會發送歡迎郵件，包含：
   - 批准確認訊息
   - 用戶的部門資訊
   - 登入系統的連結

2. **拒絕通知**：當管理員拒絕用戶申請時，系統會發送通知郵件，包含：
   - 拒絕確認訊息
   - 拒絕原因說明
   - 聯繫管理員的提示

## 設定步驟

### 1. 註冊 Resend 帳號

1. 前往 [Resend 官網](https://resend.com/) 註冊帳號
2. 驗證您的電子郵件地址
3. 完成帳號設定

### 2. 設定網域（Domain）

Resend 需要您驗證發信網域：

1. 登入 Resend Dashboard
2. 前往 **Domains** 頁面
3. 點擊 **Add Domain**
4. 輸入您的網域名稱（例如：`yourdomain.com`）
5. 按照指示在您的 DNS 設定中新增 TXT、MX 和 CNAME 記錄
6. 等待 DNS 記錄生效（通常需要 5-30 分鐘）
7. 驗證網域設定是否成功

> **注意**：如果您沒有自己的網域，Resend 提供測試用的 `onboarding@resend.dev` 地址，但只能發送到您註冊的郵箱。

### 3. 取得 API Key

1. 在 Resend Dashboard 中，前往 **API Keys** 頁面
2. 點擊 **Create API Key**
3. 輸入 Key 名稱（例如：`Third-Party Production`）
4. 選擇權限：**Full Access** 或 **Sending Access**
5. 複製生成的 API Key（只會顯示一次！）

### 4. 設定環境變數

在您的 `.env` 檔案中加入以下設定：

```env
# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Third-Party 管理系統
APP_URL=https://your-production-url.com
```

**參數說明：**

- `RESEND_API_KEY`：從 Resend Dashboard 取得的 API Key
- `FROM_EMAIL`：發信者郵件地址（必須是已驗證的網域）
- `FROM_NAME`：發信者顯示名稱
- `APP_URL`：系統的完整 URL（用於郵件中的登入連結）

### 5. Railway 部署設定

如果您使用 Railway 部署，需要在 Railway Dashboard 中設定環境變數：

1. 登入 Railway Dashboard
2. 選擇您的專案
3. 前往 **Variables** 頁面
4. 新增以下環境變數：
   - `RESEND_API_KEY`
   - `FROM_EMAIL`
   - `FROM_NAME`
   - `APP_URL`

## 測試郵件功能

### 本地測試

1. 確保 `.env` 檔案中已設定正確的環境變數
2. 啟動開發伺服器：`pnpm dev`
3. 以管理員身份登入系統
4. 前往 **系統管理 > 人員權限** 頁面
5. 嘗試批准或拒絕一個待審核用戶
6. 檢查目標用戶的郵箱是否收到通知郵件

### 生產環境測試

1. 部署到 Railway 後，確認環境變數已正確設定
2. 建立一個測試用戶帳號
3. 以管理員身份批准該測試帳號
4. 確認測試郵箱收到批准通知

## 郵件範本自訂

如果您想自訂郵件內容，可以編輯以下檔案：

```
app/services/email.server.ts
```

該檔案包含兩個函數：

- `sendApprovalEmail()` - 批准通知郵件
- `sendRejectionEmail()` - 拒絕通知郵件

您可以修改 HTML 內容、樣式和文字訊息。

## 常見問題

### Q: 郵件沒有發送成功？

**A:** 請檢查以下項目：

1. `RESEND_API_KEY` 是否正確設定
2. `FROM_EMAIL` 的網域是否已在 Resend 中驗證
3. 查看伺服器日誌中是否有錯誤訊息
4. 確認 Resend 帳號是否有足夠的配額

### Q: 郵件被標記為垃圾郵件？

**A:** 這可能是因為：

1. 網域的 SPF、DKIM 記錄未正確設定
2. 發信頻率過高
3. 郵件內容包含可疑關鍵字

建議：
- 確保 DNS 記錄完整設定
- 使用專業的郵件內容
- 避免過度使用促銷性語言

### Q: 可以使用其他郵件服務嗎？

**A:** 可以！您可以替換 `app/services/email.server.ts` 中的實作，使用其他服務如：

- **SendGrid**
- **Mailgun**
- **AWS SES**
- **Nodemailer** (配合 SMTP)

只需要保持函數介面一致即可。

## 郵件發送限制

Resend 免費方案限制：

- 每月 3,000 封郵件
- 每日 100 封郵件
- 僅支援已驗證的網域

如需更高配額，請升級到付費方案。

## 技術支援

如有任何問題，請參考：

- [Resend 官方文件](https://resend.com/docs)
- [Resend API 參考](https://resend.com/docs/api-reference)
- 聯繫系統管理員

---

**最後更新：** 2026-02-03
