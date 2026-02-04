import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { X, User, Lock, Shield } from "lucide-react";
import { PERMISSION_TEMPLATES, PERMISSIONS, getPermissionsByTemplate, type Permission } from '~/utils/permissions';
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
  
  // 功能權限狀態
  const [permissionTemplate, setPermissionTemplate] = useState('factory_user');
  const [permissions, setPermissions] = useState<Permission[]>(getPermissionsByTemplate('factory_user'));
  
  // 當權限模板變更時，更新權限
  useEffect(() => {
    const newPermissions = getPermissionsByTemplate(permissionTemplate);
    setPermissions(newPermissions);
  }, [permissionTemplate]);

  // 輔助函數：檢查是否有某個權限
  const hasPermission = (permission: Permission) => {
    return permissions.includes(permission);
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
      permissions: JSON.stringify(permissions),
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

  // 獲取當前選擇的模板名稱
  const currentTemplate = PERMISSION_TEMPLATES.find(t => t.id === permissionTemplate);
  const currentTemplateName = currentTemplate?.name || 'Factory User';

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
              {/* 權限模板 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  權限模板 (PERMISSION TEMPLATE)
                </label>
                <select
                  value={permissionTemplate}
                  onChange={(e) => setPermissionTemplate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PERMISSION_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  使用者的權限統一由模板設定，如需調整權限請至「權限模板」進行編輯。
                </p>
              </div>

              {/* 模板權限預覽 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-700">
                    模板權限預覽 (READ-ONLY)
                  </label>
                  <span className="text-sm text-blue-600">
                    已選擇: {currentTemplateName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* 統計儀表板 */}
                  <div className={clsx(
                    "p-4 rounded-lg border-2 flex items-center gap-3",
                    hasPermission(PERMISSIONS.DASHBOARD)
                      ? "bg-green-50 border-green-300"
                      : "bg-slate-50 border-slate-200"
                  )}>
                    <div className={clsx(
                      "w-6 h-6 rounded flex items-center justify-center",
                      hasPermission(PERMISSIONS.DASHBOARD) ? "bg-green-500" : "bg-slate-300"
                    )}>
                      {hasPermission(PERMISSIONS.DASHBOARD) && <span className="text-white text-sm">✓</span>}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      統計儀表板 (Dashboard)
                    </span>
                  </div>

                  {/* 廠商名錄 */}
                  <div className={clsx(
                    "p-4 rounded-lg border-2 flex items-center gap-3",
                    hasPermission(PERMISSIONS.VENDORS)
                      ? "bg-green-50 border-green-300"
                      : "bg-slate-50 border-slate-200"
                  )}>
                    <div className={clsx(
                      "w-6 h-6 rounded flex items-center justify-center",
                      hasPermission(PERMISSIONS.VENDORS) ? "bg-green-500" : "bg-slate-300"
                    )}>
                      {hasPermission(PERMISSIONS.VENDORS) && <span className="text-white text-sm">✓</span>}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      廠商名錄 (Vendors)
                    </span>
                  </div>

                  {/* 設備維修紀錄 */}
                  <div className={clsx(
                    "p-4 rounded-lg border-2 flex items-center gap-3",
                    hasPermission(PERMISSIONS.MAINTENANCE)
                      ? "bg-green-50 border-green-300"
                      : "bg-slate-50 border-slate-200"
                  )}>
                    <div className={clsx(
                      "w-6 h-6 rounded flex items-center justify-center",
                      hasPermission(PERMISSIONS.MAINTENANCE) ? "bg-green-500" : "bg-slate-300"
                    )}>
                      {hasPermission(PERMISSIONS.MAINTENANCE) && <span className="text-white text-sm">✓</span>}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      設備維修紀錄 (Maintenance)
                    </span>
                  </div>

                  {/* 日常任務 */}
                  <div className={clsx(
                    "p-4 rounded-lg border-2 flex items-center gap-3",
                    hasPermission(PERMISSIONS.TASKS)
                      ? "bg-green-50 border-green-300"
                      : "bg-slate-50 border-slate-200"
                  )}>
                    <div className={clsx(
                      "w-6 h-6 rounded flex items-center justify-center",
                      hasPermission(PERMISSIONS.TASKS) ? "bg-green-500" : "bg-slate-300"
                    )}>
                      {hasPermission(PERMISSIONS.TASKS) && <span className="text-white text-sm">✓</span>}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      日常任務 (Tasks)
                    </span>
                  </div>

                  {/* 通訊中心 */}
                  <div className={clsx(
                    "p-4 rounded-lg border-2 flex items-center gap-3",
                    hasPermission(PERMISSIONS.COMMUNICATION)
                      ? "bg-green-50 border-green-300"
                      : "bg-slate-50 border-slate-200"
                  )}>
                    <div className={clsx(
                      "w-6 h-6 rounded flex items-center justify-center",
                      hasPermission(PERMISSIONS.COMMUNICATION) ? "bg-green-500" : "bg-slate-300"
                    )}>
                      {hasPermission(PERMISSIONS.COMMUNICATION) && <span className="text-white text-sm">✓</span>}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      通訊中心 (Communication)
                    </span>
                  </div>

                  {/* 請款與發票管理 */}
                  <div className={clsx(
                    "p-4 rounded-lg border-2 flex items-center gap-3",
                    hasPermission(PERMISSIONS.INVOICES)
                      ? "bg-green-50 border-green-300"
                      : "bg-slate-50 border-slate-200"
                  )}>
                    <div className={clsx(
                      "w-6 h-6 rounded flex items-center justify-center",
                      hasPermission(PERMISSIONS.INVOICES) ? "bg-green-500" : "bg-slate-300"
                    )}>
                      {hasPermission(PERMISSIONS.INVOICES) && <span className="text-white text-sm">✓</span>}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      請款與發票管理 (Invoices)
                    </span>
                  </div>

                  {/* 知識庫 */}
                  <div className={clsx(
                    "p-4 rounded-lg border-2 flex items-center gap-3",
                    hasPermission(PERMISSIONS.KNOWLEDGE)
                      ? "bg-green-50 border-green-300"
                      : "bg-slate-50 border-slate-200"
                  )}>
                    <div className={clsx(
                      "w-6 h-6 rounded flex items-center justify-center",
                      hasPermission(PERMISSIONS.KNOWLEDGE) ? "bg-green-500" : "bg-slate-300"
                    )}>
                      {hasPermission(PERMISSIONS.KNOWLEDGE) && <span className="text-white text-sm">✓</span>}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      知識庫 (Knowledge)
                    </span>
                  </div>

                  {/* 系統公告 */}
                  <div className={clsx(
                    "p-4 rounded-lg border-2 flex items-center gap-3",
                    hasPermission(PERMISSIONS.ANNOUNCEMENTS)
                      ? "bg-green-50 border-green-300"
                      : "bg-slate-50 border-slate-200"
                  )}>
                    <div className={clsx(
                      "w-6 h-6 rounded flex items-center justify-center",
                      hasPermission(PERMISSIONS.ANNOUNCEMENTS) ? "bg-green-500" : "bg-slate-300"
                    )}>
                      {hasPermission(PERMISSIONS.ANNOUNCEMENTS) && <span className="text-white text-sm">✓</span>}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      系統公告 (Announcements)
                    </span>
                  </div>

                  {/* 系統管理 */}
                  <div className={clsx(
                    "p-4 rounded-lg border-2 flex items-center gap-3",
                    hasPermission(PERMISSIONS.SYSTEM)
                      ? "bg-green-50 border-green-300"
                      : "bg-slate-50 border-slate-200"
                  )}>
                    <div className={clsx(
                      "w-6 h-6 rounded flex items-center justify-center",
                      hasPermission(PERMISSIONS.SYSTEM) ? "bg-green-500" : "bg-slate-300"
                    )}>
                      {hasPermission(PERMISSIONS.SYSTEM) && <span className="text-white text-sm">✓</span>}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      系統管理 (System)
                    </span>
                  </div>
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
