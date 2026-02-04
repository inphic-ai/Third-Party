/**
 * 權限檢查 Server 端工具函數
 * 用於在 loader 和 action 中檢查用戶權限
 */

import { redirect } from '@remix-run/node';
import type { Permission } from './permissions';
import { parsePermissions, canAccessRoute } from './permissions';

/**
 * 檢查用戶是否有訪問指定路由的權限
 * 如果沒有權限，則拋出 redirect 到無權限頁面
 * @param user - 用戶對象（包含 permissions 欄位）
 * @param route - 要訪問的路由
 */
export function requirePermission(
  user: { permissions: string | null; role?: string },
  route: string
): void {
  // Admin 角色擁有所有權限
  if (user.role === 'admin') {
    return;
  }

  const userPermissions = parsePermissions(user.permissions);
  
  if (!canAccessRoute(userPermissions, route)) {
    throw redirect('/no-permission');
  }
}

/**
 * 獲取用戶的權限陣列
 * @param user - 用戶對象（包含 permissions 欄位）
 * @returns 權限陣列
 */
export function getUserPermissions(user: {
  permissions: string | null;
  role?: string;
}): Permission[] {
  // Admin 角色擁有所有權限
  if (user.role === 'admin') {
    return [
      'dashboard',
      'vendors',
      'maintenance',
      'tasks',
      'communication',
      'invoices',
      'knowledge',
      'announcements',
      'system',
    ] as Permission[];
  }

  return parsePermissions(user.permissions);
}

/**
 * 檢查用戶是否有指定權限
 * @param user - 用戶對象
 * @param permission - 需要的權限
 * @returns 是否有權限
 */
export function checkPermission(
  user: { permissions: string | null; role?: string },
  permission: Permission
): boolean {
  if (user.role === 'admin') {
    return true;
  }

  const userPermissions = parsePermissions(user.permissions);
  return userPermissions.includes(permission);
}
