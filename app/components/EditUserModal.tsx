import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { X, User, Lock, Shield } from "lucide-react";
import { PERMISSIONS, PERMISSION_LABELS, type Permission } from '~/utils/permissions';
import clsx from "clsx";

type User = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: string;
  status: string;
  isActive: boolean;
  ipWhitelist?: string | null;
  timeRestrictionEnabled?: boolean | null;
  permissions?: string | null;
};

type Department = {
  id: string;
  name: string;
  description?: string | null;
};

type EditUserModalProps = {
  user: User;
  departments: Department[];
  onClose: () => void;
};

export function EditUserModal({ user, departments, onClose }: EditUserModalProps) {
  const fetcher = useFetcher();
  const [activeTab, setActiveTab] = useState<'basic' | 'security' | 'permissions'>('basic');
  
  // 基本資訊狀態
  const [name, setName] = useState(user.name);
  const [department, setDepartment] = useState(user.department || '');
  const [status, setStatus] = useState(user.status);
  const [isActive, setIsActive] = useState(user.isActive);
  
  // 安全資訊狀態
  const [ipWhitelist, setIpWhitelist] = useState(user.ipWhitelist || '');
  const [timeRestrictionEnabled, setTimeRestrictionEnabled] = useState(user.timeRestrictionEnabled || false);
  
  // 功能權限狀態 - 從用戶現有權限初始化
  const [permissionsData, setPermissionsData] = useState<{
    modules: Permission[];
    deletePermissions: string[];
  }>(() => {
    if (user.permissions) {
      try {
        const parsed = JSON.parse(user.permissions);
        // 向後兼容：舊格式是陣列，新格式是物件
        if (Array.isArray(parsed)) {
          return { modules: parsed, deletePermissions: [] };
        } else if (parsed.modules) {
          return {
            modules: parsed.modules || [],
            deletePermissions: parsed.deletePermissions || [],
          };
        }
      } catch {}
    }
    return { modules: [], deletePermissions: [] };
  });

  // 切換單個權限
  const togglePermission = (permission: Permission) => {
    setPermissionsData(prev => {
      const newModules = prev.modules.includes(permission)
        ? prev.modules.filter(p => p !== permission)
        : [...prev.modules, permission];
      return { ...prev, modules: newModules };
    });
  };

  // 檢查是否有某個權限
  const hasPermission = (permission: Permission) => {
    return permissionsData.modules.includes(permission);
  };

  // 切換刪除權限
  const toggleDeletePermission = (module: string) => {
    setPermissionsData(prev => {
      const newDeletePermissions = prev.deletePermissions.includes(module)
        ? prev.deletePermissions.filter(m => m !== module)
        : [...prev.deletePermissions, module];
      return { ...prev, deletePermissions: newDeletePermissions };
    });
  };

  // 檢查是否有刪除權限
  const hasDeletePermission = (module: string) => {
    return permissionsData.deletePermissions.includes(module);
  };

  const handleSubmit = () => {
    const formData = {
      intent: 'updateUser',
      userId: user.id,
      name,
      department,
      status,
      isActive,
      ipWhitelist,
      timeRestrictionEnabled,
      permissions: JSON.stringify(permissionsData),
    };

    fetcher.submit(formData, { method: 'post' });
  };

  // 監聽提交狀態
  const isSubmitting = fetcher.state === 'submitting';
  const isSuccess = fetcher.data?.success;

  // 成功後關閉 Modal
  if (isSuccess && !isSubmitting) {
    setTimeout(() => onClose(), 500);
  }

  // 所有可用的權限列表（按照顯示順序）
  const allPermissions: Permission[] = [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.VENDORS,
    PERMISSIONS.MAINTENANCE,
    PERMISSIONS.TASKS,
    PERMISSIONS.COMMUNICATION,
    PERMISSIONS.INVOICES,
    PERMISSIONS.KNOWLEDGE,
    PERMISSIONS.ANNOUNCEMENTS,
    PERMISSIONS.SYSTEM,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal 內容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
            <User size={24} className="text-slate-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800">編輯人員與安全設定</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* 分頁導航 */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('basic')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition",
              activeTab === 'basic'
                ? "text-slate-800 border-b-2 border-slate-800"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <User size={18} />
            基本資訊
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition",
              activeTab === 'security'
                ? "text-slate-800 border-b-2 border-slate-800"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Lock size={18} />
            安全設定
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition",
              activeTab === 'permissions'
                ? "text-slate-800 border-b-2 border-slate-800"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Shield size={18} />
            功能權限
          </button>
        </div>

        {/* 分頁內容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* 姓名 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  姓名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="請輸入姓名"
                />
              </div>

              {/* EMAIL（不可編輯） */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* 所屬部門 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  所屬部門
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">請選擇部門</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 刪除用戶區域 */}
              <div className="pt-6 border-t border-slate-200">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">危險操作</h4>
                  <p className="text-sm text-red-600 mb-4">
                    刪除此用戶將會停用其帳號，該用戶將無法登入系統。此操作可以在「已拒絕」頁籤中恢復。
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`確定要刪除用戶「${user.name}」嗎？`)) {
                        fetcher.submit(
                          { intent: 'deleteUser', userId: user.id },
                          { method: 'post' }
                        );
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    刪除用戶
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* IP 限制（白名單） */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  IP 限制（白名單）
                </label>
                <input
                  type="text"
                  value={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: 192.168.1.1, 203.145.2.1 (留空代表不限制)"
                />
                <p className="text-xs text-slate-500 mt-2">
                  多個 IP 請用逗號分隔，留空代表不限制
                </p>
              </div>

              {/* 啟用時段限制 */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="timeRestriction"
                  checked={timeRestrictionEnabled}
                  onChange={(e) => setTimeRestrictionEnabled(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="timeRestriction" className="text-sm font-medium text-slate-700">
                  啟用時段限制
                </label>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              {/* 說明文字 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  請勾選此員工可以訪問的功能模組。未勾選的功能將不會顯示在左側選單中，且無法直接訪問。
                </p>
              </div>

              {/* 功能權限勾選列表 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">
                  功能模組權限
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {allPermissions.map((permission) => {
                    const isChecked = hasPermission(permission);
                    return (
                      <button
                        key={permission}
                        type="button"
                        onClick={() => togglePermission(permission)}
                        className={clsx(
                          "p-4 rounded-lg border-2 flex items-center gap-3 transition-all cursor-pointer hover:shadow-md",
                          isChecked
                            ? "bg-green-50 border-green-300"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className={clsx(
                          "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                          isChecked ? "bg-green-500" : "bg-slate-300"
                        )}>
                          {isChecked && <span className="text-white text-sm font-bold">✓</span>}
                        </div>
                        <span className="text-sm font-medium text-slate-700 text-left">
                          {PERMISSION_LABELS[permission]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 已選擇的權限數量 */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-600">
                  已選擇 <span className="font-bold text-slate-800">{permissionsData.modules.length}</span> 個功能模組
                </p>
              </div>

              {/* 刪除權限區塊 */}
              <div className="border-t border-slate-200 pt-6 mt-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-bold text-amber-800 mb-1">刪除權限設定</h4>
                  <p className="text-xs text-amber-600">
                    請勾選此員工可以刪除資料的功能模組。未勾選的模組將不顯示刪除按鈕。
                  </p>
                </div>

                <label className="block text-sm font-medium text-slate-700 mb-4">
                  模組刪除權限
                </label>
                <div className="space-y-3">
                  {[
                    { key: 'vendors', label: '廠商名錄', permission: 'vendors' as Permission },
                    { key: 'maintenance', label: '設備維修紀錄', permission: 'maintenance' as Permission },
                    { key: 'tasks', label: '日常任務', permission: 'tasks' as Permission },
                    { key: 'payments', label: '請款與發票管理', permission: 'payments' as Permission },
                    { key: 'communication', label: '通訊中心', permission: 'communication' as Permission },
                  ].map((module) => {
                    const hasModulePermission = hasPermission(module.permission);
                    const hasDelete = hasDeletePermission(module.key);
                    
                    return (
                      <div key={module.key} className="bg-white border border-slate-200 rounded-lg p-4">
                        {/* 模組名稱 */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className={clsx(
                            "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                            hasModulePermission ? "bg-green-500" : "bg-slate-300"
                          )}>
                            {hasModulePermission && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{module.label}</span>
                        </div>
                        
                        {/* 刪除權限勾選框 */}
                        <button
                          type="button"
                          onClick={() => toggleDeletePermission(module.key)}
                          disabled={!hasModulePermission}
                          className={clsx(
                            "w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all",
                            !hasModulePermission && "opacity-50 cursor-not-allowed",
                            hasModulePermission && "cursor-pointer hover:shadow-md",
                            hasDelete && hasModulePermission
                              ? "bg-amber-50 border-amber-300"
                              : "bg-slate-50 border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <div className={clsx(
                            "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                            hasDelete && hasModulePermission ? "bg-amber-500" : "bg-slate-300"
                          )}>
                            {hasDelete && hasModulePermission && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <span className="text-xs font-medium text-slate-600">
                            允許刪除
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* 已選擇的刪除權限數量 */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-amber-600">
                    已選擇 <span className="font-bold text-amber-800">{permissionsData.deletePermissions.length}</span> 個模組的刪除權限
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                儲存中...
              </>
            ) : (
              <>
                <span>✓</span>
                儲存變更
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
