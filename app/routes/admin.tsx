import type { MetaFunction } from "@remix-run/node";
import { 
  Settings, Users, Shield, Database, Activity,
  ChevronRight, Lock, Bell, Palette
} from 'lucide-react';
import { clsx } from 'clsx';

export const meta: MetaFunction = () => {
  return [
    { title: "系統管理 - PartnerLink Pro" },
    { name: "description", content: "管理使用者權限與系統設定" },
  ];
};

const adminModules = [
  {
    id: 'users',
    title: '使用者管理',
    description: '管理系統使用者帳號與權限設定',
    icon: <Users size={24} />,
    colorClass: 'bg-blue-50 text-blue-600',
    stats: '12 位使用者',
  },
  {
    id: 'roles',
    title: '角色與權限',
    description: '設定不同角色的功能存取權限',
    icon: <Shield size={24} />,
    colorClass: 'bg-emerald-50 text-emerald-600',
    stats: '4 種角色',
  },
  {
    id: 'security',
    title: '安全設定',
    description: 'IP 白名單、登入限制、密碼政策',
    icon: <Lock size={24} />,
    colorClass: 'bg-amber-50 text-amber-600',
    stats: '已啟用',
  },
  {
    id: 'notifications',
    title: '通知設定',
    description: '系統通知、Email 提醒設定',
    icon: <Bell size={24} />,
    colorClass: 'bg-violet-50 text-violet-600',
    stats: '3 個頻道',
  },
  {
    id: 'appearance',
    title: '外觀設定',
    description: '自訂系統主題與品牌標誌',
    icon: <Palette size={24} />,
    colorClass: 'bg-rose-50 text-rose-600',
    stats: '預設主題',
  },
  {
    id: 'database',
    title: '資料庫管理',
    description: '資料備份、匯出與清理',
    icon: <Database size={24} />,
    colorClass: 'bg-slate-100 text-slate-600',
    stats: '正常運作',
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 頁首 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Settings size={28} className="text-slate-600" />
            系統管理
          </h1>
          <p className="text-slate-500 mt-1">管理使用者權限與系統設定</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Activity size={16} className="text-emerald-500" />
          <span className="text-slate-600">系統狀態：</span>
          <span className="text-emerald-600 font-bold">正常運作</span>
        </div>
      </div>

      {/* 系統資訊卡片 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold mb-1">PartnerLink Pro</h2>
            <p className="text-slate-400 text-sm">協力廠商管理系統 v1.0.0</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs">最後更新</p>
            <p className="text-sm font-medium">2026-01-28</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-black">128</p>
            <p className="text-xs text-slate-400">廠商數</p>
          </div>
          <div>
            <p className="text-2xl font-black">12</p>
            <p className="text-xs text-slate-400">使用者</p>
          </div>
          <div>
            <p className="text-2xl font-black">99.9%</p>
            <p className="text-xs text-slate-400">系統可用率</p>
          </div>
        </div>
      </div>

      {/* 管理模組 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminModules.map(module => (
          <div 
            key={module.id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={clsx("p-3 rounded-xl", module.colorClass)}>
                {module.icon}
              </div>
              <div className="p-2 bg-slate-50 text-slate-300 rounded-full group-hover:bg-slate-800 group-hover:text-white transition-all">
                <ChevronRight size={16} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-slate-600 transition-colors">
              {module.title}
            </h3>
            <p className="text-sm text-slate-500 mb-3">
              {module.description}
            </p>
            <p className="text-xs font-medium text-slate-400">
              {module.stats}
            </p>
          </div>
        ))}
      </div>

      {/* 快速操作 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4">快速操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-center">
            <Users size={20} className="mx-auto mb-2 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">新增使用者</span>
          </button>
          <button className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-center">
            <Database size={20} className="mx-auto mb-2 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">備份資料</span>
          </button>
          <button className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-center">
            <Activity size={20} className="mx-auto mb-2 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">查看日誌</span>
          </button>
          <button className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-center">
            <Settings size={20} className="mx-auto mb-2 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">系統設定</span>
          </button>
        </div>
      </div>
    </div>
  );
}
