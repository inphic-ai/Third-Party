import { useState } from 'react';
import { useLoaderData } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { db } from '../services/db.server';
import { systemLogs, adminUsers, announcements } from '../../db/schema/system';
import { users } from '../../db/schema/user';
import { departments } from '../../db/schema/department';
import { requireAdmin } from '~/services/auth.server';
import { eq } from 'drizzle-orm';
import { 
  Settings, Users, Plus, Megaphone, 
  Activity, X, Layers, Bot, 
  History, LogIn, Monitor, Smartphone, Trash2, Tags, Power, Edit2,
  Building, Terminal, ShieldCheck
} from 'lucide-react';
import { clsx } from 'clsx';

import { ClientOnly } from '~/components/ClientOnly';
import { UserManager } from '~/components/UserManager';
import { 
  MOCK_ANNOUNCEMENTS, MOCK_LOGS, MOCK_LOGIN_LOGS, 
  MOCK_MODEL_RULES, MOCK_SYSTEM_TAGS, CATEGORY_OPTIONS, 
  MOCK_USERS, MOCK_DEPARTMENTS 
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
    const [allSystemLogs, allAdminUsers, allAnnouncements, allUsers, allDepartments] = await Promise.all([
      db.select().from(systemLogs).limit(100), // 限制日誌數量
      db.select().from(adminUsers),
      db.select().from(announcements),
      db.select().from(users), // 用戶審核系統
      db.select().from(departments) // 部門管理
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
      rejectionReason: user.rejectionReason
    }));
    
    const departmentsList = allDepartments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description
    }));
    
    return json({ 
      systemLogs: logsWithMapping,
      adminUsers: usersWithMapping,
      announcements: announcementsWithMapping,
      users: usersForApproval,
      departments: departmentsList
    });
  } catch (error) {
    console.error('[Admin Loader] Error:', error);
    return json({ 
      systemLogs: [],
      adminUsers: [],
      users: [],
      departments: [],
      announcements: []
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

        await db.update(users)
          .set({
            status: 'approved',
            department: departmentId,
            approvedBy: adminUser.id,
            approvedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        // TODO: Send approval email notification

        return json({ success: true, message: '用戶已批准' });
      }

      case 'rejectUser': {
        const userId = formData.get('userId') as string;
        const reason = formData.get('reason') as string;

        if (!userId || !reason) {
          return json({ success: false, error: '缺少必要參數' }, { status: 400 });
        }

        await db.update(users)
          .set({
            status: 'rejected',
            rejectionReason: reason,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        // TODO: Send rejection email notification

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
  const { systemLogs: dbSystemLogs, adminUsers: dbAdminUsers, announcements: dbAnnouncements, users: dbUsers, departments: dbDepartments } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const navItems = [
    { id: 'dashboard', label: '數據總覽', icon: <Activity size={18} /> },
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
        {activeTab === 'dashboard' && <DashboardSummary />}
        {activeTab === 'logs' && <LogCenter systemLogs={dbSystemLogs} />}
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'tags' && <TagManager />}
        {activeTab === 'ai' && <AiConfig />}
        {activeTab === 'users' && <UserManager users={dbUsers} departments={dbDepartments} />}
        {activeTab === 'departments' && <DepartmentManager />}
        {activeTab === 'announcements' && <AnnouncementManager announcements={dbAnnouncements} />}
        {activeTab === 'settings' && <div className="text-slate-400 p-20 text-center border-2 border-dashed rounded-xl bg-white">系統基礎設定載入中...</div>}
      </div>
    </div>
  );
}

const DashboardSummary = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between">
        <h3 className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">台/陸廠商比例</h3>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-black text-slate-800">72 / 56</div>
          <div className="text-xs text-slate-400 font-bold">總計 128 家</div>
        </div>
        <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
           <div className="h-full bg-blue-500 w-[56%]"></div>
           <div className="h-full bg-red-400 w-[44%]"></div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h3 className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">待處理日誌</h3>
        <div className="text-3xl font-black text-orange-500">24 <span className="text-sm font-normal text-slate-400">條</span></div>
        <p className="text-[10px] text-slate-400 mt-2">包含 3 條權限變更紀錄</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h3 className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">系統通告轉化</h3>
        <div className="text-3xl font-black text-indigo-600">88% <span className="text-sm font-normal text-slate-400">閱讀率</span></div>
        <p className="text-[10px] text-slate-400 mt-2">最近一則公告：2024 年度評鑑</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h3 className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">API 調用狀態</h3>
        <div className="text-3xl font-black text-green-600">100% <span className="text-sm font-normal text-slate-400">成功</span></div>
        <p className="text-[10px] text-slate-400 mt-2">Gemini 2.5 Pro 模型運行中</p>
      </div>
    </div>
    
    <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
       <div className="relative z-10">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Terminal size={20} className="text-blue-400" /> 系統運行監控終端</h3>
          <div className="font-mono text-xs text-blue-200/70 space-y-1">
             <p>[OK] Cloud Database connection established.</p>
             <p>[OK] CDN Edge caching warming up...</p>
             <p>[INFO] Automated vendor evaluation background task started.</p>
             <p className="text-blue-400">[READY] System is listening for new vendor applications.</p>
          </div>
       </div>
       <Activity size={150} className="absolute -bottom-10 -right-10 text-white/5 opacity-10" />
    </div>
  </div>
);

const LogCenter = ({ systemLogs }: { systemLogs: any[] }) => {
  const [logType, setLogType] = useState<'operation' | 'login'>('operation');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button 
          onClick={() => setLogType('operation')}
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 transition",
            logType === 'operation' ? "bg-slate-800 text-white shadow-lg" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
          )}
        >
          <History size={16} /> 操作審計日誌
        </button>
        <button 
          onClick={() => setLogType('login')}
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
                {systemLogs.map((l: any) => (
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
                {MOCK_LOGIN_LOGS.map(l => (
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
      </div>
    </div>
  );
};

const CategoryManager = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-bold text-slate-800">廠商類別管理</h2>
      <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition">
        <Plus size={16} /> 新增類別
      </button>
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATEGORY_OPTIONS.map(cat => (
          <div key={cat.value} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="font-bold text-slate-700">{cat.label}</span>
            <button className="text-slate-400 hover:text-slate-600"><Edit2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TagManager = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-bold text-slate-800">系統標籤管理</h2>
      <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition">
        <Plus size={16} /> 新增標籤
      </button>
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-wrap gap-3">
        {MOCK_SYSTEM_TAGS.map(tag => (
          <div key={tag.id} className="px-4 py-2 bg-slate-100 rounded-full flex items-center gap-2">
            <span className="font-bold text-slate-700">{tag.name}</span>
            <span className="text-xs text-slate-400">({tag.count})</span>
            <button className="text-slate-400 hover:text-red-500"><X size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

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

const DepartmentManager = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-bold text-slate-800">部門清單管理</h2>
      <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition">
        <Plus size={16} /> 新增部門
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {MOCK_DEPARTMENTS.map(dept => (
        <div key={dept.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">{dept.name}</h3>
            <button className="text-slate-400 hover:text-slate-600"><Edit2 size={16} /></button>
          </div>
          <p className="text-sm text-slate-500 mb-4">{dept.description}</p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Users size={14} />
            <span>{dept.memberCount} 人</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

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
