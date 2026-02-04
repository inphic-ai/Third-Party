/**
 * 權限系統常數定義
 * 定義所有功能模組的權限 key 和對應的路由
 */

// 權限 Key 定義
export const PERMISSIONS = {
  DASHBOARD: 'dashboard',
  VENDORS: 'vendors',
  MAINTENANCE: 'maintenance',
  TASKS: 'tasks',
  COMMUNICATION: 'communication',
  INVOICES: 'invoices',
  KNOWLEDGE: 'knowledge',
  ANNOUNCEMENTS: 'announcements',
  SYSTEM: 'system',
} as const;

// 權限類型
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// 權限模板定義
export interface PermissionTemplate {
  id: string;
  name: string;
  permissions: Permission[];
}

// 預設權限模板
export const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'factory_user',
    name: 'Factory User',
    permissions: [
      PERMISSIONS.DASHBOARD,
      PERMISSIONS.VENDORS,
      PERMISSIONS.TASKS,
      PERMISSIONS.COMMUNICATION,
      PERMISSIONS.INVOICES,
      PERMISSIONS.KNOWLEDGE,
      PERMISSIONS.ANNOUNCEMENTS,
    ],
  },
  {
    id: 'factory_admin',
    name: 'Factory Admin',
    permissions: [
      PERMISSIONS.DASHBOARD,
      PERMISSIONS.VENDORS,
      PERMISSIONS.MAINTENANCE,
      PERMISSIONS.TASKS,
      PERMISSIONS.COMMUNICATION,
      PERMISSIONS.INVOICES,
      PERMISSIONS.KNOWLEDGE,
      PERMISSIONS.ANNOUNCEMENTS,
      PERMISSIONS.SYSTEM,
    ],
  },
  {
    id: 'vendor_user',
    name: 'Vendor User',
    permissions: [
      PERMISSIONS.DASHBOARD,
      PERMISSIONS.TASKS,
      PERMISSIONS.COMMUNICATION,
      PERMISSIONS.INVOICES,
      PERMISSIONS.KNOWLEDGE,
      PERMISSIONS.ANNOUNCEMENTS,
    ],
  },
];

// 權限顯示名稱映射
export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.DASHBOARD]: '統計儀表板',
  [PERMISSIONS.VENDORS]: '廠商名錄',
  [PERMISSIONS.MAINTENANCE]: '設備維修紀錄',
  [PERMISSIONS.TASKS]: '日常任務',
  [PERMISSIONS.COMMUNICATION]: '通訊中心',
  [PERMISSIONS.INVOICES]: '請款與發票管理',
  [PERMISSIONS.KNOWLEDGE]: '知識庫',
  [PERMISSIONS.ANNOUNCEMENTS]: '系統公告',
  [PERMISSIONS.SYSTEM]: '系統管理',
};

// 權限對應的路由路徑
export const PERMISSION_ROUTES: Record<Permission, string> = {
  [PERMISSIONS.DASHBOARD]: '/',
  [PERMISSIONS.VENDORS]: '/vendors',
  [PERMISSIONS.MAINTENANCE]: '/maintenance',
  [PERMISSIONS.TASKS]: '/tasks',
  [PERMISSIONS.COMMUNICATION]: '/communication',
  [PERMISSIONS.INVOICES]: '/invoices',
  [PERMISSIONS.KNOWLEDGE]: '/knowledge',
  [PERMISSIONS.ANNOUNCEMENTS]: '/announcements',
  [PERMISSIONS.SYSTEM]: '/admin',
};

// 路由對應的權限（反向映射）
export const ROUTE_PERMISSIONS: Record<string, Permission> = Object.entries(
  PERMISSION_ROUTES
).reduce((acc, [permission, route]) => {
  acc[route] = permission as Permission;
  return acc;
}, {} as Record<string, Permission>);

/**
 * 解析權限字串為權限陣列
 * @param permissionsStr - JSON 陣列字串或逗號分隔的權限字串
 * @returns 權限陣列
 */
export function parsePermissions(permissionsStr: string | null): Permission[] {
  if (!permissionsStr) return [];
  
  // 嘗試解析 JSON 陣列格式：["dashboard","vendors"]
  if (permissionsStr.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(permissionsStr);
      if (Array.isArray(parsed)) {
        return parsed as Permission[];
      }
    } catch (error) {
      console.error('Failed to parse permissions as JSON:', error);
    }
  }
  
  // 降級為逗號分隔格式：dashboard,vendors
  return permissionsStr.split(',').filter(Boolean) as Permission[];
}

/**
 * 將權限陣列轉換為字串
 * @param permissions - 權限陣列
 * @returns 逗號分隔的權限字串
 */
export function stringifyPermissions(permissions: Permission[]): string {
  return permissions.join(',');
}

/**
 * 檢查用戶是否有指定權限
 * @param userPermissions - 用戶的權限陣列
 * @param requiredPermission - 需要的權限
 * @returns 是否有權限
 */
export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * 檢查用戶是否可以訪問指定路由
 * @param userPermissions - 用戶的權限陣列
 * @param route - 路由路徑
 * @returns 是否可以訪問
 */
export function canAccessRoute(
  userPermissions: Permission[],
  route: string
): boolean {
  const requiredPermission = ROUTE_PERMISSIONS[route];
  if (!requiredPermission) return true; // 未定義權限的路由默認可訪問
  return hasPermission(userPermissions, requiredPermission);
}

/**
 * 根據權限模板 ID 獲取權限陣列
 * @param templateId - 權限模板 ID
 * @returns 權限陣列
 */
export function getPermissionsByTemplate(templateId: string): Permission[] {
  const template = PERMISSION_TEMPLATES.find((t) => t.id === templateId);
  return template ? template.permissions : [];
}
