/**
 * 解析使用者的 permissions 欄位
 * 向後兼容：舊格式是陣列，新格式是物件
 */
export function parseUserPermissions(permissionsString: string | null): {
  modules: string[];
  deletePermissions: string[];
} {
  if (!permissionsString) {
    return { modules: [], deletePermissions: [] };
  }

  try {
    const parsed = JSON.parse(permissionsString);
    
    // 向後兼容：舊格式是陣列
    if (Array.isArray(parsed)) {
      return { modules: parsed, deletePermissions: [] };
    }
    
    // 新格式：物件
    if (parsed && typeof parsed === 'object') {
      return {
        modules: parsed.modules || [],
        deletePermissions: parsed.deletePermissions || [],
      };
    }
  } catch {
    // 解析失敗，返回空權限
  }

  return { modules: [], deletePermissions: [] };
}

/**
 * 檢查使用者是否有刪除權限
 * @param user 使用者物件
 * @param module 模組名稱 ('vendors', 'maintenance', 'tasks', 'payments', 'communication')
 * @returns 是否有刪除權限
 */
export function canUserDelete(
  user: { role: string; permissions: string | null },
  module: string
): boolean {
  // 管理員自動擁有所有刪除權限
  if (user.role === 'admin') {
    return true;
  }

  // 解析權限
  const { deletePermissions } = parseUserPermissions(user.permissions);
  
  // 檢查是否有該模組的刪除權限
  return deletePermissions.includes(module);
}
