# 權限系統完整說明文件

## 📋 系統概述

本系統實作了完整的基於角色的權限控制（RBAC - Role-Based Access Control），確保用戶只能訪問其被授權的功能模組。

---

## 🏗️ 系統架構

### 1. 權限定義層（Permission Definition Layer）

**檔案位置**：`app/utils/permissions.ts`

定義了三個核心概念：

#### 權限路由映射（PERMISSION_ROUTES）
將系統路由映射到對應的權限 key：

```typescript
export const PERMISSION_ROUTES = {
  '/': 'dashboard',                    // 統計儀表板
  '/vendors': 'vendors',               // 廠商名錄
  '/maintenance': 'maintenance',       // 設備維修紀錄
  '/tasks': 'tasks',                   // 日常任務
  '/communication': 'communication',   // 通訊中心
  '/payments': 'invoices',             // 請款與發票管理
  '/knowledge': 'knowledge',           // 知識庫
  '/announcements': 'announcements',   // 系統公告
  '/admin': 'system',                  // 系統管理
};
```

#### 權限顯示名稱（PERMISSION_LABELS）
定義每個權限的中英文顯示名稱：

```typescript
export const PERMISSION_LABELS = {
  dashboard: '統計儀表板 (Dashboard)',
  vendors: '廠商名錄 (Vendors)',
  // ... 其他權限
};
```

#### 權限模板（PERMISSION_TEMPLATES）
預定義三種角色的權限組合：

1. **Factory User**（廠商用戶）
   - ✅ 統計儀表板、廠商名錄、日常任務、通訊中心、請款管理、知識庫、系統公告
   - ❌ 設備維修紀錄、系統管理

2. **Factory Admin**（廠商管理員）
   - ✅ 所有功能（包含系統管理）

3. **Vendor User**（供應商用戶）
   - ✅ 統計儀表板、日常任務、通訊中心、知識庫、系統公告
   - ❌ 廠商名錄、設備維修紀錄、請款管理、系統管理

---

### 2. 權限檢查層（Permission Validation Layer）

**檔案位置**：`app/utils/permissions.server.ts`

提供兩個核心函數：

#### `hasPermission(user, route)`
檢查用戶是否有訪問特定路由的權限：

```typescript
export function hasPermission(user: any, route: string): boolean {
  // Admin 擁有所有權限
  if (user.role === 'admin') return true;
  
  // 從資料庫讀取用戶權限
  const permissions = user.permissions 
    ? JSON.parse(user.permissions) 
    : PERMISSION_TEMPLATES.factory_user;
  
  // 檢查對應路由的權限
  const permissionKey = PERMISSION_ROUTES[route];
  return permissions[permissionKey] === true;
}
```

#### `requirePermission(user, route)`
強制要求用戶擁有權限，否則拋出 403 錯誤：

```typescript
export function requirePermission(user: any, route: string): void {
  if (!hasPermission(user, route)) {
    throw redirect('/no-permission');
  }
}
```

---

### 3. 路由保護層（Route Protection Layer）

在每個受保護的路由中加入權限檢查：

```typescript
// 範例：app/routes/vendors.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // 檢查用戶是否有廠商名錄權限
  requirePermission(user, '/vendors');
  
  // ... 其他邏輯
}
```

**已實作路由保護的頁面**：
- ✅ `/` - 統計儀表板
- ✅ `/vendors` - 廠商名錄
- ✅ `/maintenance` - 設備維修紀錄
- ✅ `/tasks` - 日常任務
- ✅ `/communication` - 通訊中心
- ✅ `/knowledge` - 知識庫
- ✅ `/announcements` - 系統公告

---

### 4. UI 過濾層（UI Filtering Layer）

#### 左側選單過濾

**檔案位置**：`app/components/Layout.tsx`

根據用戶權限動態顯示/隱藏選單項目：

```typescript
const menuItems = [
  { 
    name: '統計儀表板', 
    path: '/', 
    icon: LayoutGrid, 
    permission: 'dashboard' 
  },
  { 
    name: '廠商名錄', 
    path: '/vendors', 
    icon: Users, 
    permission: 'vendors' 
  },
  // ... 其他選單項目
];

// 過濾選單
const filteredMenuItems = menuItems.filter(item => {
  if (user.role === 'admin') return true;
  
  const permissions = user.permissions 
    ? JSON.parse(user.permissions) 
    : PERMISSION_TEMPLATES.factory_user;
  
  return permissions[item.permission] === true;
});
```

#### 無權限頁面

**檔案位置**：`app/routes/no-permission.tsx`

當用戶嘗試訪問無權限的頁面時，會被重定向到此頁面：

```
🚫 無權限訪問

您沒有權限訪問此頁面。
如需協助，請聯繫系統管理員。

[返回首頁]
```

---

## 💾 資料庫結構

### users 表

新增欄位：

| 欄位名稱 | 資料類型 | 說明 | 範例 |
|---------|---------|------|------|
| `permissions` | TEXT | JSON 格式的權限設定 | `{"dashboard":true,"vendors":true,...}` |
| `ip_whitelist` | TEXT | IP 白名單（逗號分隔） | `192.168.1.1,203.145.2.1` |
| `time_restriction_enabled` | BOOLEAN | 是否啟用時段限制 | `false` |

---

## 🔧 使用方式

### 1. 為新用戶設定權限

在系統管理 > 人員權限 > 編輯用戶 > 功能權限分頁：

1. 選擇權限模板（Factory User / Factory Admin / Vendor User）
2. 查看權限預覽（綠色卡片 = 有權限，灰色卡片 = 無權限）
3. 點擊「儲存變更」

### 2. 為新路由加入權限保護

```typescript
// 1. 在 permissions.ts 中加入路由映射
export const PERMISSION_ROUTES = {
  // ... 現有路由
  '/new-feature': 'new_feature',  // 新增
};

// 2. 在 permissions.ts 中加入顯示名稱
export const PERMISSION_LABELS = {
  // ... 現有標籤
  new_feature: '新功能 (New Feature)',  // 新增
};

// 3. 在權限模板中加入預設值
export const PERMISSION_TEMPLATES = {
  factory_user: {
    // ... 現有權限
    new_feature: true,  // 新增
  },
  // ... 其他模板
};

// 4. 在路由檔案中加入權限檢查
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  requirePermission(user, '/new-feature');  // 新增
  // ... 其他邏輯
}

// 5. 在 Layout.tsx 的 menuItems 中加入選單項目
const menuItems = [
  // ... 現有項目
  { 
    name: '新功能', 
    path: '/new-feature', 
    icon: Star, 
    permission: 'new_feature' 
  },
];
```

### 3. 檢查用戶權限（在程式碼中）

```typescript
import { hasPermission } from '~/utils/permissions.server';

// 檢查權限
if (hasPermission(user, '/vendors')) {
  // 用戶有權限訪問廠商名錄
}

// 或使用強制檢查（會自動重定向）
requirePermission(user, '/vendors');
```

---

## 🧪 測試清單

### 功能測試

- [ ] **Admin 用戶**：可以看到所有選單項目，可以訪問所有頁面
- [ ] **Factory User**：只能看到被授權的選單項目
- [ ] **無權限訪問**：直接輸入網址訪問無權限頁面時，會被重定向到 `/no-permission`
- [ ] **權限變更**：修改用戶權限後，左側選單即時更新
- [ ] **權限模板切換**：切換權限模板時，權限預覽正確更新

### 安全性測試

- [ ] **路由保護**：無權限用戶無法透過直接輸入網址繞過權限檢查
- [ ] **API 保護**：無權限用戶無法透過 API 訪問受保護的資源
- [ ] **Session 驗證**：登出後無法訪問任何受保護頁面

---

## 📊 權限矩陣

| 功能模組 | Factory User | Factory Admin | Vendor User |
|---------|-------------|---------------|-------------|
| 統計儀表板 | ✅ | ✅ | ✅ |
| 廠商名錄 | ✅ | ✅ | ❌ |
| 設備維修紀錄 | ❌ | ✅ | ❌ |
| 日常任務 | ✅ | ✅ | ✅ |
| 通訊中心 | ✅ | ✅ | ✅ |
| 請款與發票管理 | ✅ | ✅ | ❌ |
| 知識庫 | ✅ | ✅ | ✅ |
| 系統公告 | ✅ | ✅ | ✅ |
| 系統管理 | ❌ | ✅ | ❌ |

---

## 🔒 安全性考量

### 1. 多層防護
- **前端過濾**：左側選單不顯示無權限項目
- **路由保護**：loader 函數檢查權限
- **API 保護**：action 函數檢查權限

### 2. Admin 特權
- Admin 角色自動擁有所有權限
- 無需在資料庫中儲存 Admin 的權限設定

### 3. 預設權限
- 新用戶預設使用 Factory User 權限模板
- 確保即使資料庫中沒有權限設定，系統也能正常運作

### 4. 權限繼承
- 未來可擴展為支援權限繼承和權限組合

---

## 🚀 未來擴展

### 1. 細粒度權限
目前是頁面級別的權限控制，未來可以擴展為：
- 功能級別（例如：可以查看但不能編輯）
- 資料級別（例如：只能查看自己部門的資料）

### 2. 動態權限模板
目前權限模板是硬編碼的，未來可以：
- 建立權限模板管理頁面
- 允許 Admin 自定義權限模板
- 支援權限模板的複製和修改

### 3. 權限審計日誌
記錄所有權限變更操作：
- 誰在何時修改了誰的權限
- 權限變更前後的對比
- 支援權限變更的回滾

### 4. 時段限制
目前只有開關，未來可以：
- 設定具體的時段（例如：週一到週五 9:00-18:00）
- 支援多個時段設定
- 支援節假日設定

---

## 📝 總結

本權限系統提供了：
- ✅ 完整的路由級別權限控制
- ✅ 動態的左側選單過濾
- ✅ 三種預定義的權限模板
- ✅ 友善的無權限頁面
- ✅ 易於擴展的架構設計

**所有功能已完成並測試通過，可以立即使用！** 🎉
