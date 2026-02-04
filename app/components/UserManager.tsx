import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { Plus, Check, X, UserCheck, Clock, ShieldX, Edit2 } from "lucide-react";
import clsx from "clsx";
import { EditUserModal } from "~/components/EditUserModal";

type User = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: string;
  status: string;
  createdAt: string;
  rejectionReason: string | null;
  isActive: boolean;
  ipWhitelist?: string | null;
  timeRestrictionEnabled?: boolean | null;
};

type Department = {
  id: string;
  name: string;
  description?: string | null;
};

type UserManagerProps = {
  users: User[];
  departments: Department[];
};

export function UserManager({ users, departments }: UserManagerProps) {
  const fetcher = useFetcher();
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // 依狀態篩選用戶
  const approvedUsers = users.filter(u => u.status === 'approved' && u.isActive);
  const pendingUsers = users.filter(u => u.status === 'pending' && u.isActive);
  const deletedUsers = users.filter(u => !u.isActive); // 已刪除的用戶（isActive === false）

  const currentUsers = activeTab === 'approved' ? approvedUsers :
                       activeTab === 'pending' ? pendingUsers :
                       deletedUsers;

  const handleApprove = (user: User) => {
    setSelectedUser(user);
    setSelectedDepartment('');
    setShowApprovalModal(true);
  };

  const handleReject = (user: User) => {
    setSelectedUser(user);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const confirmApprove = () => {
    if (!selectedDepartment) {
      alert('請選擇部門');
      return;
    }

    fetcher.submit(
      { intent: 'approveUser', userId: selectedUser!.id, departmentId: selectedDepartment },
      { method: 'post' }
    );
    setShowApprovalModal(false);
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      alert('請輸入拒絕原因');
      return;
    }

    fetcher.submit(
      { intent: 'rejectUser', userId: selectedUser!.id, reason: rejectionReason },
      { method: 'post' }
    );
    setShowRejectionModal(false);
  };

  const handleUnblock = (user: User) => {
    if (confirm(`確定要解除封鎖用戶「${user.name}」嗎？`)) {
      fetcher.submit(
        { intent: 'unblockUser', userId: user.id },
        { method: 'post' }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">人員權限管理</h2>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition">
          <Plus size={16} /> 新增人員
        </button>
      </div>

      {/* 分頁標籤 */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('approved')}
          className={clsx(
            "px-4 py-2 font-bold text-sm transition flex items-center gap-2",
            activeTab === 'approved'
              ? "text-green-600 border-b-2 border-green-600"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <UserCheck size={16} />
          已啟用 ({approvedUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={clsx(
            "px-4 py-2 font-bold text-sm transition flex items-center gap-2",
            activeTab === 'pending'
              ? "text-yellow-600 border-b-2 border-yellow-600"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Clock size={16} />
          待審核 ({pendingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={clsx(
            "px-4 py-2 font-bold text-sm transition flex items-center gap-2",
            activeTab === 'rejected'
              ? "text-red-600 border-b-2 border-red-600"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <ShieldX size={16} />
          已拒絕 ({deletedUsers.length})
        </button>
      </div>

      {/* 用戶列表 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-slate-500 font-bold">
              <th className="px-6 py-4 text-left">人員</th>
              <th className="px-6 py-4 text-left">部門</th>
              <th className="px-6 py-4 text-left">角色</th>
              <th className="px-6 py-4 text-center">申請時間</th>
              <th className="px-6 py-4 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  {activeTab === 'approved' && '目前沒有已啟用的用戶'}
                  {activeTab === 'pending' && '目前沒有待審核的用戶'}
                  {activeTab === 'rejected' && '目前沒有已刪除的用戶'}
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                        {activeTab === 'rejected' && user.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">原因: {user.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {user.department ? 
                      departments.find(d => d.id === user.department)?.name || user.department
                      : <span className="text-slate-400">未設定</span>
                    }
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "px-2 py-1 rounded text-xs font-bold",
                      user.role === 'admin' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {activeTab === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(user)}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition flex items-center gap-1"
                          >
                            <Check size={14} /> 批准
                          </button>
                          <button
                            onClick={() => handleReject(user)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition flex items-center gap-1"
                          >
                            <X size={14} /> 拒絕
                          </button>
                        </>
                      )}
                       {activeTab === 'rejected' && (
                        <button
                          onClick={() => {
                            if (confirm(`確定要恢復用戶「${user.name}」嗎？`)) {
                              fetcher.submit(
                                { intent: 'restoreUser', userId: user.id },
                                { method: 'post' }
                              );
                            }
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition"
                        >
                          恢復用戶
                        </button>
                      )}
                      {activeTab === 'approved' && (
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="text-slate-400 hover:text-slate-600 transition"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 批准對話框 */}
      {showApprovalModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">批准用戶申請</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  用戶資訊
                </label>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="font-bold text-slate-800">{selectedUser.name}</p>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  部門 *
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">請選擇部門</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmApprove}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
              >
                確認批准
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 拒絕對話框 */}
      {showRejectionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">拒絕用戶申請</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  用戶資訊
                </label>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="font-bold text-slate-800">{selectedUser.name}</p>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  拒絕原因 *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="請說明拒絕的原因..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowRejectionModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
              >
                確認拒絕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯用戶 Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          departments={departments}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
