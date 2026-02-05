import { useState } from 'react';
import { useLoaderData, useFetcher } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { db } from '../services/db.server';
import { systemLogs, adminUsers, announcements } from '../../db/schema/system';
import { loginLogs } from '../../db/schema/login';
import { vendorCategories } from '../../db/schema/vendorCategory';
import { vendorTags } from '../../db/schema/vendorTag';
import { users } from '../../db/schema/user';
import { departments } from '../../db/schema/department';
import { requireAdmin } from '~/services/auth.server';
import { eq, desc } from 'drizzle-orm';
// 郵件服務暫時停用
// import { sendApprovalEmail, sendRejectionEmail } from '~/services/email.server';
import { 
  Settings, Users, Plus, Megaphone, 
  Activity, X, Layers, Bot, 
  History, LogIn, Monitor, Smartphone, Trash2, Tags, Power, Edit2,
  Building, Terminal, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';

import { ClientOnly } from '~/components/ClientOnly';
import { UserManager } from '~/components/UserManager';
import { 
  MOCK_ANNOUNCEMENTS, MOCK_LOGS, 
  MOCK_MODEL_RULES, MOCK_SYSTEM_TAGS, CATEGORY_OPTIONS, 
  MOCK_USERS
} from '~/constants';

export const meta: MetaFunction = () => {
  return [
    { title: "系統管理 - PartnerLink Pro" },
    { name: "description", content: "全域設定、協力廠商權限控管與自動化日誌監控" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // 要求管理員權限
  await requireAdmin(request);
  
  try {
    console.log('[Admin Loader] Loading admin data...');
    
    // 讀取資料
    const [allSystemLogs, allAdminUsers, allAnnouncements, allUsers, allDepartments, allLoginLogs, allVendorCategories, allVendorTags] = await Promise.all([
      db.select().from(systemLogs).limit(100), // 限制日誌數量
      db.select().from(adminUsers),
      db.select().from(announcements),
      db.select().from(users), // 用戶審核系統
      db.select().from(departments), // 部門管理
      db.select().from(loginLogs).orderBy(desc(loginLogs.timestamp)).limit(100), // 登入日誌（最新的在前）
      db.select().from(vendorCategories).orderBy(vendorCategories.displayOrder), // 廠商類別
      db.select().from(vendorTags).orderBy(vendorTags.displayOrder) // 廠商標籤
    ]);
    
    console.log(`[Admin Loader] Loaded ${allSystemLogs.length} logs, ${allAdminUsers.length} users, ${allAnnouncements.length} announcements`);
    
    const logsWithMapping = allSystemLogs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      user: log.user,
      action: log.action,
      target: log.target,
      details: log.details,
      ip: log.ip,
      userAgent: log.userAgent,
      status: log.status
    }));
    
    const usersWithMapping = allAdminUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      department: user.department,
      role: user.role,
      isActive: user.isActive || false,
      accumulatedBonus: user.accumulatedBonus ? parseFloat(String(user.accumulatedBonus)) : 0,
    }));
    
    const announcementsWithMapping = allAnnouncements.map(ann => ({
      id: ann.id,
      title: ann.title,
      content: ann.content,
      date: ann.date.toISOString().split('T')[0],
      priority: ann.priority === 'HIGH' ? 'High' : 'Normal',
    }));
    
    // 處理 users 和 departments
    const usersForApproval = allUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      rejectionReason: user.rejectionReason,
      isActive: user.isActive ?? true,
      ipWhitelist: user.ipWhitelist ?? null,
      timeRestrictionEnabled: user.timeRestrictionEnabled ?? false,
      permissions: user.permissions ?? null
    }));
    
    // 計算每個部門的成員數量
    const departmentsList = allDepartments.map(dept => {
      const memberCount = allUsers.filter(user => user.department === dept.name).length;
      return {
        id: dept.id,
        name: dept.name,
        description: dept.description,
        memberCount
      };
    });
    
    // 處理登入日誌
    const loginLogsWithMapping = allLoginLogs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      user: log.userName || 'Unknown',
      email: log.email,
      ip: log.ip,
      device: log.device || `${log.browser || 'Unknown'} / ${log.os || 'Unknown'}`,
      status: log.status === 'SUCCESS' ? 'success' : 'failed'
    }));
    
    return json({ 
      systemLogs: logsWithMapping,
      adminUsers: usersWithMapping,
      announcements: announcementsWithMapping,
      users: usersForApproval,
      departments: departmentsList,
      loginLogs: loginLogsWithMapping,
      vendorCategories: allVendorCategories,
      vendorTags: allVendorTags
    });
  } catch (error) {
    console.error('[Admin Loader] Error:', error);
    return json({ 
      systemLogs: [],
      adminUsers: [],
      users: [],
      departments: [],
      announcements: [],
      loginLogs: [],
      vendorCategories: [],
      vendorTags: []
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const adminUser = await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    switch (intent) {
      case 'approveUser': {
        const userId = formData.get('userId') as string;
        const departmentId = formData.get('departmentId') as string;

        if (!userId || !departmentId) {
          return json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }

        // 獲取用戶資料
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) {
          return json({ success: false, error: '用戶不存在' }, { status: 404 });
        }

        // 獲取部門資料
        const [dept] = await db.select().from(departments).where(eq(departments.id, departmentId)).limit(1);
        if (!dept) {
          return json({ success: false, error: '部門不存在' }, { status: 404 });
        }

        // 更新用戶狀態
        await db.update(users)
          .set({
            status: 'approved',
            department: departmentId,
            approvedBy: adminUser.id,
            approvedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        // 發送批准郵件（暫時停用）
        // await sendApprovalEmail(user.email, user.name, dept.name);

        return json({ success: true, message: '用戶已批准' });
      }

      case 'rejectUser': {
        const userId = formData.get('userId') as string;
        const reason = formData.get('reason') as string;

        if (!userId || !reason) {
          return json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }

        // 獲取用戶資料
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) {
          return json({ success: false, error: '用戶不存在' }, { status: 404 });
        }

        // 更新用戶狀態
        await db.update(users)
          .set({
            status: 'rejected',
            rejectionReason: reason,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        // 發送拒絕郵件（暫時停用）
        // await sendRejectionEmail(user.email, user.name, reason);

        return json({ success: true, message: '用戶已拒絕' });
      }

      case 'unblockUser': {
        const userId = formData.get('userId') as string;

        if (!userId) {
          return json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }

        await db.update(users)
          .set({
            status: 'pending',
            rejectionReason: null,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        return json({ success: true, message: '用戶已解除封鎖，狀態改為待審核' });
      }

      case 'deleteUser': {
        const userId = formData.get('userId') as string;

        if (!userId) {
          return json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }

        // 獲取用戶資料
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) {
          return json({ success: false, error: '用戶不存在' }, { status: 404 });
        }

        // 軟刪除：將 isActive 設為 false
        await db.update(users)
          .set({
            isActive: false,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        return json({ success: true, message: '用戶已刪除' });
      }

      case 'restoreUser': {
        const userId = formData.get('userId') as string;

        if (!userId) {
          return json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }

        // 獲取用戶資料
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) {
          return json({ success: false, error: '用戶不存在' }, { status: 404 });
        }

        // 恢復：將 isActive 設為 true
        await db.update(users)
          .set({
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        return json({ success: true, message: '用戶已恢復' });
      }

      case 'updateUser': {
        const userId = formData.get('userId') as string;
        const name = formData.get('name') as string;
        const department = formData.get('department') as string;
        const status = formData.get('status') as string;
        const isActive = formData.get('isActive') === 'true';
        const ipWhitelist = formData.get('ipWhitelist') as string;
        const timeRestrictionEnabled = formData.get('timeRestrictionEnabled') === 'true';
        const permissions = formData.get('permissions') as string;

        if (!userId || !name) {
          return json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }

        // 獲取用戶資料
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) {
          return json({ success: false, error: '用戶不存在' }, { status: 404 });
        }

        // 如果有設定部門，檢查部門是否存在
        if (department) {
          const [dept] = await db.select().from(departments).where(eq(departments.id, department)).limit(1);
          if (!dept) {
            return json({ success: false, error: '部門不存在' }, { status: 404 });
          }
        }

        // 更新用戶資料
        await db.update(users)
          .set({
            name,
            department: department || null,
            status,
            isActive,
            ipWhitelist: ipWhitelist || null,
            timeRestrictionEnabled,
            permissions: permissions || null,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        return json({ success: true, message: '用戶資料已更新' });
      }

      case 'createCategory': {
        const name = formData.get('name') as string;
        
        if (!name || !name.trim()) {
          return json({ success: false, error: '類別名稱不能為空' }, { status: 400 });
        }
        
        // 檢查是否已存在
        const [existing] = await db.select().from(vendorCategories).where(eq(vendorCategories.name, name.trim())).limit(1);
        if (existing) {
          return json({ success: false, error: '類別已存在' }, { status: 400 });
        }
        
        await db.insert(vendorCategories).values({
          name: name.trim(),
          displayOrder: String(Date.now()) // 使用時間戳作為預設排序
        });
        
        return json({ success: true, message: '類別已新增' });
      }
      
      case 'updateCategory': {
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        
        if (!id || !name || !name.trim()) {
          return json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }
        
        // 檢查是否與其他類別重複
        const [existing] = await db.select().from(vendorCategories)
          .where(eq(vendorCategories.name, name.trim()))
          .limit(1);
        if (existing && existing.id !== id) {
          return json({ success: false, error: '類別名稱已存在' }, { status: 400 });
        }
        
        await db.update(vendorCategories)
          .set({ 
            name: name.trim(),
            updatedAt: new Date()
          })
          .where(eq(vendorCategories.id, id));
        
        return json({ success: true, message: '類別已更新' });
      }
      
      case 'deleteCategory': {
        const id = formData.get('id') as string;
        
        if (!id) {
          return json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }
        
        await db.delete(vendorCategories).where(eq(vendorCategories.id, id));
        
        return json({ success: true, message: '類別已刪除' });
      }
      
      // 標籤管理
      case 'createTag': {
        const name = formData.get('name') as string;
        const category = formData.get('category') as string;
        const color = formData.get('color') as string || 'blue';
        
        if (!name || !name.trim() || !category) {
          return json({ success: false, error: '標籤名稱和分類不能為空' }, { status: 400 });
        }
        
        // 檢查是否已存在
        const [existing] = await db.select().from(vendorTags)
          .where(eq(vendorTags.name, name.trim()))
          .limit(1);
        if (existing) {
          return json({ success: false, error: '標籤已存在' }, { status: 400 });
        }
        
        await db.insert(vendorTags).values({
          name: name.trim(),
          category: category,
          color: color,
          displayOrder: String(Date.now())
        });
        
        return json({ success: true, message: '標籤已新增' });
      }
      
      case 'updateTag': {
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        
        if (!id || !name || !name.trim()) {
          return json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }
        
        // 檢查是否與其他標籤重複
        const [existing] = await db.select().from(vendorTags)
          .where(eq(vendorTags.name, name.trim()))
          .limit(1);
        if (existing && existing.id !== id) {
          return json({ success: false, error: '標籤名稱已存在' }, { status: 400 });
        }
        
        await db.update(vendorTags)
          .set({ 
            name: name.trim(),
            updatedAt: new Date()
          })
          .where(eq(vendorTags.id, id));
        
        return json({ success: true, message: '標籤已更新' });
      }
      
      case 'deleteTag': {
        const id = formData.get('id') as string;
        
        if (!id) {
          return json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }
        
        await db.delete(vendorTags).where(eq(vendorTags.id, id));
        
        return json({ success: true, message: '標籤已刪除' });
      }

      // 部門管理
      case 'createDepartment': {
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        
        if (!name || !name.trim()) {
          return json({ success: false, error: '部門名稱不能為空' }, { status: 400 });
        }
        
        // 檢查是否重複
        const existing = await db.select().from(departments).where(eq(departments.name, name.trim()));
        if (existing.length > 0) {
          return json({ success: false, error: '部門名稱已存在' }, { status: 400 });
        }
        
        await db.insert(departments).values({
          name: name.trim(),
          description: description?.trim() || '',
        });
        
        return json({ success: true, message: '部門已新增' });
      }

      case 'updateDepartment': {
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        
        if (!id || !name || !name.trim()) {
          return json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }
        
        // 檢查是否與其他部門重複
        const existing = await db.select().from(departments)
          .where(eq(departments.name, name.trim()));
        if (existing.length > 0 && existing[0].id !== id) {
          return json({ success: false, error: '部門名稱已存在' }, { status: 400 });
        }
        
        await db.update(departments)
          .set({ 
            name: name.trim(),
            description: description?.trim() || '',
            updatedAt: new Date() 
          })
          .where(eq(departments.id, id));
        
        return json({ success: true, message: '部門已更新' });
      }

      case 'deleteDepartment': {
        const id = formData.get('id') as string;
        
        if (!id) {
          return json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }
        
        await db.delete(departments).where(eq(departments.id, id));
        
        return json({ success: true, message: '部門已刪除' });
      }

      default:
        return json({ success: false, error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Action error:', error);
    return json({ success: false, error: '操作失敗' }, { status: 500 });
  }
}

type AdminTab = 'dashboard' | 'logs' | 'categories' | 'tags' | 'ai' | 'users' | 'departments' | 'announcements' | 'settings';

function AdminContent() {
  const { systemLogs: dbSystemLogs, adminUsers: dbAdminUsers, announcements: dbAnnouncements, users: dbUsers, departments: dbDepartments, loginLogs: dbLoginLogs, vendorCategories, vendorTags } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<AdminTab>('logs');

  const navItems = [
    { id: 'logs', label: '日誌中心', icon: <Terminal size={18} /> },
    { id: 'categories', label: '類別管理', icon: <Layers size={18} /> },
    { id: 'tags', label: '標籤管理', icon: <Tags size={18} /> },
    { id: 'ai', label: 'AI 設定', icon: <Bot size={18} /> },
    { id: 'users', label: '人員權限', icon: <Users size={18} /> },
    { id: 'departments', label: '部門清單', icon: <Building size={18} /> },
    { id: 'announcements', label: '系統公告', icon: <Megaphone size={18} /> },
    { id: 'settings', label: '系統設定', icon: <Settings size={18} /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">系統核心管理中心</h1>
            <p className="text-slate-500 text-sm">全域設定、協力廠商權限控管與自動化日誌監控</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-100 text-xs font-bold">
           <ShieldCheck size={14} /> 系統狀態：運行正常
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto pb-px scrollbar-hide">
        {navItems.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={clsx(
              "flex items-center gap-2 pb-3 text-sm font-bold transition-all relative whitespace-nowrap",
              activeTab === tab.id ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[600px] py-4">
        {activeTab === 'logs' && <LogCenter systemLogs={dbSystemLogs} loginLogs={dbLoginLogs} />}
        {activeTab === 'categories' && <CategoryManager categories={vendorCategories} />}
        {activeTab === 'tags' && <TagManager tags={vendorTags} />}
        {activeTab === 'ai' && <AiConfig />}
        {activeTab === 'users' && <UserManager users={dbUsers} departments={dbDepartments} />}
        {activeTab === 'departments' && <DepartmentManager departments={dbDepartments} />}
        {activeTab === 'announcements' && <AnnouncementManager announcements={dbAnnouncements} />}
        {activeTab === 'settings' && <div className="text-slate-400 p-20 text-center border-2 border-dashed rounded-xl bg-white">系統基礎設定載入中...</div>}
      </div>
    </div>
  );
}



const LogCenter = ({ systemLogs, loginLogs }: { systemLogs: any[]; loginLogs: any[] }) => {
  const [logType, setLogType] = useState<'operation' | 'login'>('operation');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 計算分頁
  const getCurrentPageData = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[]) => Math.ceil(data.length / itemsPerPage);

  // 當切換日誌類型時，重置到第一頁
  const handleLogTypeChange = (type: 'operation' | 'login') => {
    setLogType(type);
    setCurrentPage(1);
  };

  const currentData = logType === 'operation' ? getCurrentPageData(systemLogs) : getCurrentPageData(loginLogs);
  const totalPages = logType === 'operation' ? getTotalPages(systemLogs) : getTotalPages(loginLogs);
  const totalItems = logType === 'operation' ? systemLogs.length : loginLogs.length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button 
          onClick={() => handleLogTypeChange('operation')}
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 transition",
            logType === 'operation' ? "bg-slate-800 text-white shadow-lg" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
          )}
        >
          <History size={16} /> 操作審計日誌
        </button>
        <button 
          onClick={() => handleLogTypeChange('login')}
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 transition",
            logType === 'login' ? "bg-slate-800 text-white shadow-lg" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
          )}
        >
          <LogIn size={16} /> 帳號登入安全日誌
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {logType === 'operation' ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-slate-500 font-bold">
                  <th className="px-6 py-4">發生時間</th>
                  <th className="px-6 py-4">執行人員</th>
                  <th className="px-6 py-4">動作</th>
                  <th className="px-6 py-4">變更對象</th>
                  <th className="px-6 py-4">詳情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentData.map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-5 text-slate-400 font-mono text-xs">{l.timestamp}</td>
                    <td className="px-6 py-5 font-bold text-slate-700">{l.user}</td>
                    <td className="px-6 py-5">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider",
                        l.action.includes('更新') ? "bg-blue-100 text-blue-700" : 
                        l.action.includes('新增') ? "bg-green-100 text-green-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {l.action === '更新資源' ? 'Update' : l.action === '新增資源' ? 'Create' : 'System'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-600 font-bold">{l.target}</td>
                    <td className="px-6 py-5 text-slate-500 max-w-xs truncate">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-slate-500 font-bold">
                  <th className="px-6 py-4">登入時間</th>
                  <th className="px-6 py-4">人員</th>
                  <th className="px-6 py-4">來源 IP</th>
                  <th className="px-6 py-4">裝置環境</th>
                  <th className="px-6 py-4 text-center">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentData.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-5 text-slate-400 font-mono text-xs">{l.timestamp}</td>
                    <td className="px-6 py-5 font-bold text-slate-700">{l.user}</td>
                    <td className="px-6 py-5 font-mono text-blue-600 text-xs">{l.ip}</td>
                    <td className="px-6 py-5 text-slate-500 flex items-center gap-2">
                      {l.device.includes('Desktop') ? <Monitor size={14} /> : <Smartphone size={14} />}
                      {l.device}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-full text-[10px] font-black",
                        l.status === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {l.status === 'success' ? '成功' : '失敗'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* 分頁系統 */}
        {totalItems > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              顯示 <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> 到 <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, totalItems)}</span> 筆，共 <span className="font-bold text-slate-700">{totalItems}</span> 筆
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-sm font-bold transition",
                  currentPage === 1
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                上一頁
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // 顯示邏輯：第一頁、最後一頁、當前頁、當前頁前後各一頁
                  if (
                    page === 1 ||
                    page === totalPages ||
                    page === currentPage ||
                    page === currentPage - 1 ||
                    page === currentPage + 1
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={clsx(
                          "px-3 py-1.5 rounded-lg text-sm font-bold transition min-w-[36px]",
                          page === currentPage
                            ? "bg-slate-800 text-white"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return <span key={page} className="text-slate-400 px-1">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-sm font-bold transition",
                  currentPage === totalPages
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CategoryManager = ({ categories }: { categories: any[] }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const fetcher = useFetcher();
  
  const handleEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };
  
  const handleSave = (id: string) => {
    fetcher.submit(
      { intent: 'updateCategory', id, name: editingName },
      { method: 'post' }
    );
    setEditingId(null);
  };
  
  const handleDelete = (id: string, name: string) => {
    if (confirm(`確定要刪除類別「${name}」嗎？`)) {
      fetcher.submit(
        { intent: 'deleteCategory', id },
        { method: 'post' }
      );
    }
  };
  
  const handleAdd = () => {
    if (!newCategoryName.trim()) {
      alert('請輸入類別名稱');
      return;
    }
    fetcher.submit(
      { intent: 'createCategory', name: newCategoryName },
      { method: 'post' }
    );
    setNewCategoryName('');
    setIsAddModalOpen(false);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">廠商類別管理</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition"
        >
          <Plus size={16} /> 新增類別
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
              {editingId === cat.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave(cat.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="flex-1 px-2 py-1 border border-slate-300 rounded font-bold text-slate-700"
                  autoFocus
                />
              ) : (
                <span className="font-bold text-slate-700">{cat.name}</span>
              )}
              <div className="flex items-center gap-1">
                {editingId === cat.id ? (
                  <>
                    <button 
                      onClick={() => handleSave(cat.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle2 size={14} />
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleEdit(cat.id, cat.name)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 新增類別 Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96">
            <h3 className="text-lg font-bold text-slate-800 mb-4">新增類別</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setIsAddModalOpen(false);
              }}
              placeholder="請輸入類別名稱"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// TagManager 組件 - 完整的 CRUD 功能
interface Tag {
  id: string;
  name: string;
  category: string;
  color: string;
}

interface TagManagerProps {
  tags: Tag[];
}

export const TagManager = ({ tags }: TagManagerProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('聯絡標籤');
  const fetcher = useFetcher();
  
  const handleEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };
  
  const handleSave = (id: string) => {
    if (!editingName.trim()) return;
    
    const formData = new FormData();
    formData.append('intent', 'updateTag');
    formData.append('id', id);
    formData.append('name', editingName);
    
    fetcher.submit(formData, { method: 'post' });
    setEditingId(null);
    setEditingName('');
  };
  
  const handleCancel = () => {
    setEditingId(null);
    setEditingName('');
  };
  
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`確定要刪除標籤「${name}」嗎？`)) return;
    
    const formData = new FormData();
    formData.append('intent', 'deleteTag');
    formData.append('id', id);
    
    fetcher.submit(formData, { method: 'post' });
  };
  
  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    
    const formData = new FormData();
    formData.append('intent', 'createTag');
    formData.append('name', newTagName);
    formData.append('category', newTagCategory);
    formData.append('color', getColorByCategory(newTagCategory));
    
    fetcher.submit(formData, { method: 'post' });
    setNewTagName('');
    setIsAddModalOpen(false);
  };
  
  const getColorByCategory = (category: string) => {
    switch (category) {
      case '聯絡標籤': return 'blue';
      case '服務標籤': return 'green';
      case '網站標籤': return 'purple';
      default: return 'blue';
    }
  };
  
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 text-blue-700';
      case 'green': return 'bg-green-50 text-green-700';
      case 'purple': return 'bg-purple-50 text-purple-700';
      default: return 'bg-blue-50 text-blue-700';
    }
  };
  
  // 按分類分組標籤
  const tagsByCategory = {
    '聯絡標籤': tags.filter(t => t.category === '聯絡標籤'),
    '服務標籤': tags.filter(t => t.category === '服務標籤'),
    '網站標籤': tags.filter(t => t.category === '網站標籤'),
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">系統標籤管理</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition"
        >
          <Plus size={16} /> 新增標籤
        </button>
      </div>
      
      {/* 聯絡標籤 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-md font-bold text-slate-700 mb-4">聯絡標籤</h3>
        <div className="flex flex-wrap gap-3">
          {tagsByCategory['聯絡標籤'].map((tag) => (
            <div key={tag.id} className={`px-4 py-2 rounded-full flex items-center gap-2 ${getColorClasses(tag.color)}`}>
              {editingId === tag.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave(tag.id);
                      if (e.key === 'Escape') handleCancel();
                    }}
                    className="px-2 py-1 border border-blue-300 rounded text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button onClick={() => handleSave(tag.id)} className="text-green-600 hover:text-green-700">
                    <CheckCircle2 size={16} />
                  </button>
                  <button onClick={handleCancel} className="text-red-600 hover:text-red-700">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="font-bold">{tag.name}</span>
                  <button onClick={() => handleEdit(tag.id, tag.name)} className="text-blue-400 hover:text-blue-600">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(tag.id, tag.name)} className="text-blue-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* 服務標籤 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-md font-bold text-slate-700 mb-4">服務標籤</h3>
        <div className="flex flex-wrap gap-3">
          {tagsByCategory['服務標籤'].map((tag) => (
            <div key={tag.id} className={`px-4 py-2 rounded-full flex items-center gap-2 ${getColorClasses(tag.color)}`}>
              {editingId === tag.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave(tag.id);
                      if (e.key === 'Escape') handleCancel();
                    }}
                    className="px-2 py-1 border border-green-300 rounded text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoFocus
                  />
                  <button onClick={() => handleSave(tag.id)} className="text-green-600 hover:text-green-700">
                    <CheckCircle2 size={16} />
                  </button>
                  <button onClick={handleCancel} className="text-red-600 hover:text-red-700">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="font-bold">{tag.name}</span>
                  <button onClick={() => handleEdit(tag.id, tag.name)} className="text-green-400 hover:text-green-600">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(tag.id, tag.name)} className="text-green-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* 網站標籤 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-md font-bold text-slate-700 mb-4">網站標籤</h3>
        <div className="flex flex-wrap gap-3">
          {tagsByCategory['網站標籤'].map((tag) => (
            <div key={tag.id} className={`px-4 py-2 rounded-full flex items-center gap-2 ${getColorClasses(tag.color)}`}>
              {editingId === tag.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave(tag.id);
                      if (e.key === 'Escape') handleCancel();
                    }}
                    className="px-2 py-1 border border-purple-300 rounded text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                  <button onClick={() => handleSave(tag.id)} className="text-green-600 hover:text-green-700">
                    <CheckCircle2 size={16} />
                  </button>
                  <button onClick={handleCancel} className="text-red-600 hover:text-red-700">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="font-bold">{tag.name}</span>
                  <button onClick={() => handleEdit(tag.id, tag.name)} className="text-purple-400 hover:text-purple-600">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(tag.id, tag.name)} className="text-purple-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* 新增標籤 Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">新增標籤</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">標籤名稱</label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') setIsAddModalOpen(false);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="輸入標籤名稱"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">標籤分類</label>
                <select
                  value={newTagCategory}
                  onChange={(e) => setNewTagCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="聯絡標籤">聯絡標籤</option>
                  <option value="服務標籤">服務標籤</option>
                  <option value="網站標籤">網站標籤</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold"
                >
                  取消
                </button>
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                >
                  新增
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AiConfig = () => (
  <div className="space-y-4">
    <h2 className="text-lg font-bold text-slate-800">AI 模型設定</h2>
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <div className="flex items-center gap-3">
          <Bot size={24} className="text-indigo-600" />
          <div>
            <p className="font-bold text-slate-800">Gemini 2.5 Pro</p>
            <p className="text-xs text-slate-500">主要 AI 模型</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">運行中</span>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-bold text-slate-700">自動化規則</h3>
        {MOCK_MODEL_RULES.map(rule => (
          <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-bold text-slate-700">{rule.name}</p>
              <p className="text-xs text-slate-500">{rule.description}</p>
            </div>
            <button className={clsx(
              "p-2 rounded-lg transition",
              rule.enabled ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-400"
            )}>
              <Power size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DepartmentManager = ({ departments }: { departments: Array<{ id: string; name: string; description: string; memberCount: number }> }) => {
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [newName, setNewName] = React.useState('');
  const [newDescription, setNewDescription] = React.useState('');
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  
  const createFetcher = useFetcher();
  const updateFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  // 處理新增
  const handleCreate = () => {
    if (!newName.trim()) return;
    
    const formData = new FormData();
    formData.append('intent', 'createDepartment');
    formData.append('name', newName.trim());
    formData.append('description', newDescription.trim());
    
    createFetcher.submit(formData, { method: 'post' });
    setNewName('');
    setNewDescription('');
    setIsAdding(false);
  };

  // 處理編輯
  const handleEdit = (dept: { id: string; name: string; description: string }) => {
    setEditingId(dept.id);
    setEditName(dept.name);
    setEditDescription(dept.description || '');
  };

  // 處理更新
  const handleUpdate = () => {
    if (!editName.trim() || !editingId) return;
    
    const formData = new FormData();
    formData.append('intent', 'updateDepartment');
    formData.append('id', editingId);
    formData.append('name', editName.trim());
    formData.append('description', editDescription.trim());
    
    updateFetcher.submit(formData, { method: 'post' });
    setEditingId(null);
  };

  // 處理刪除
  const handleDelete = (id: string) => {
    const formData = new FormData();
    formData.append('intent', 'deleteDepartment');
    formData.append('id', id);
    
    deleteFetcher.submit(formData, { method: 'post' });
    setDeleteConfirmId(null);
  };

  // 鍵盤快捷鍵
  const handleKeyDown = (e: React.KeyboardEvent, action: 'create' | 'update' | 'cancel') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (action === 'create') handleCreate();
      if (action === 'update') handleUpdate();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (action === 'cancel') {
        setIsAdding(false);
        setEditingId(null);
        setNewName('');
        setNewDescription('');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">部門清單管理</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition"
          >
            <Plus size={16} /> 新增部門
          </button>
        )}
      </div>

      {/* 新增表單 */}
      {isAdding && (
        <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'create')}
              placeholder="部門名稱"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              autoFocus
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'create')}
              placeholder="部門描述（選填）"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || createFetcher.state !== 'idle'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {createFetcher.state !== 'idle' ? '儲存中...' : '儲存'}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewName('');
                  setNewDescription('');
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300 transition"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 部門列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => (
          <div key={dept.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            {editingId === dept.id ? (
              // 編輯模式
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'update')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                  autoFocus
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'update')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    disabled={!editName.trim() || updateFetcher.state !== 'idle'}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {updateFetcher.state !== 'idle' ? '儲存中...' : '儲存'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              // 顯示模式
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800">{dept.name}</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(dept)}
                      className="text-slate-400 hover:text-blue-600 transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(dept.id)}
                      className="text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-4">{dept.description || '無描述'}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Users size={14} />
                  <span>{dept.memberCount} 人</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 刪除確認對話框 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">確認刪除</h3>
            <p className="text-sm text-slate-600 mb-4">
              確定要刪除此部門嗎？此操作無法復原。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleteFetcher.state !== 'idle'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleteFetcher.state !== 'idle' ? '刪除中...' : '確認刪除'}
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300 transition"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AnnouncementManager = ({ announcements }: { announcements: any[] }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-bold text-slate-800">系統公告管理</h2>
      <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition">
        <Plus size={16} /> 發布公告
      </button>
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr className="text-slate-500 font-bold">
            <th className="px-6 py-4 text-left">標題</th>
            <th className="px-6 py-4 text-left">發布日期</th>
            <th className="px-6 py-4 text-center">優先級</th>
            <th className="px-6 py-4 text-center">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {announcements.map((ann: any) => (
            <tr key={ann.id} className="hover:bg-slate-50/50 transition">
              <td className="px-6 py-4 font-bold text-slate-800">{ann.title}</td>
              <td className="px-6 py-4 text-slate-500">{ann.date}</td>
              <td className="px-6 py-4 text-center">
                <span className={clsx(
                  "px-2 py-1 rounded text-xs font-bold",
                  ann.priority === 'High' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                )}>
                  {ann.priority === 'High' ? '緊急' : '一般'}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button className="text-slate-400 hover:text-slate-600"><Edit2 size={16} /></button>
                  <button className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default function AdminPage() {
  return (
    <ClientOnly fallback={<div className="p-8 text-center text-slate-400">載入中...</div>}>
      <AdminContent />
    </ClientOnly>
  );
}
