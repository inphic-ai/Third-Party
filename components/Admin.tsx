
import React, { useState } from 'react';
import { 
  Settings, Users, FileText, Plus, Megaphone, Globe, 
  Activity, Shield, X, Bell, AlertTriangle, Layers, Bot, BookOpen,
  History, LogIn, Eye, Monitor, Smartphone, Trash2, Tags, Power, Edit2,
  CheckCircle, Building, Search, ToggleRight, LayoutGrid, Wallet,
  Clock, Save, AlertCircle, Terminal, ExternalLink, ShieldCheck, Info
} from 'lucide-react';
import { clsx } from 'clsx';
import { 
  MOCK_ANNOUNCEMENTS, MOCK_LOGS, MOCK_LOGIN_LOGS, 
  MOCK_MODEL_RULES, MOCK_SYSTEM_TAGS, CATEGORY_OPTIONS, 
  MOCK_USERS, MOCK_DEPARTMENTS 
} from '../constants';
import { Announcement, SystemLog, LoginLog, AdminUser, Department, AiModelRule } from '../types';

type AdminTab = 'dashboard' | 'logs' | 'categories' | 'tags' | 'tutorials' | 'ai' | 'users' | 'departments' | 'announcements' | 'settings';

export const Admin: React.FC = () => {
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
        {activeTab === 'logs' && <LogCenter />}
        {activeTab === 'announcements' && <AnnouncementManager />}
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'tags' && <TagManager />}
        {activeTab === 'ai' && <AiConfig />}
        {activeTab === 'users' && <UserManager />}
        {activeTab === 'departments' && <DepartmentManager />}
        {activeTab === 'settings' && <div className="text-slate-400 p-20 text-center border-2 border-dashed rounded-xl bg-white">系統基礎設定載入中...</div>}
      </div>
    </div>
  );
};

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

const LogCenter: React.FC = () => {
  const [logType, setLogType] = useState<'operation' | 'login'>('operation');
  const [viewLog, setViewLog] = useState<any>(null);

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
                  <th className="px-6 py-4 text-center">追蹤</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_LOGS.map(l => (
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
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => setViewLog(l)} className="text-slate-300 hover:text-blue-600 transition">
                        <ExternalLink size={18} />
                      </button>
                    </td>
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
                    <td className="px-6 py-5 text-slate-500">
                      <div className="flex items-center gap-2 text-xs">
                        {l.device.includes('Mac') || l.device.includes('Windows') ? <Monitor size={14} className="text-slate-400" /> : <Smartphone size={14} className="text-slate-400" />}
                        {l.device}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        l.status === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {l.status}
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

const AnnouncementManager = () => {
  const [list, setList] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'High'>('Normal');

  const handlePost = () => {
    if (!title || !content) return;
    const newAnn: Announcement = {
      id: Date.now().toString(),
      title, content, date: new Date().toISOString().split('T')[0], priority,
      author: '系統管理員',
      tags: ['平台更新']
    };
    setList([newAnn, ...list]);
    setTitle(''); setContent('');
    alert('系統公告已成功發布並推播至所有用戶端！');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Plus className="text-blue-500" size={20}/> 撰寫全局公告</h3>
          <div>
            <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">公告標題</label>
            <input className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition" value={title} onChange={e=>setTitle(e.target.value)} placeholder="輸入標題 (例如：物流規定更動)..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">重要程度</label>
              <select className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white outline-none focus:ring-2 focus:ring-slate-900" value={priority} onChange={e=>setPriority(e.target.value as any)}>
                <option value="Normal">一般通知 (藍色)</option>
                <option value="High">緊急公告 (紅色閃爍)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">發布標籤</label>
              <input className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none" placeholder="例如：物流, 評鑑..." />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">公告內容 (支援多行)</label>
            <textarea className="w-full border border-slate-200 rounded-xl p-3 text-sm h-40 resize-none outline-none focus:ring-2 focus:ring-slate-900" value={content} onChange={e=>setContent(e.target.value)} placeholder="輸入詳細內容..." />
          </div>
          <button onClick={handlePost} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition active:scale-95 flex items-center justify-center gap-2">
            <Save size={18} /> 發布即時公告
          </button>
        </div>
      </div>
      
      <div className="lg:col-span-3 bg-white p-6 rounded-2xl border shadow-sm flex flex-col h-[650px]">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
           <span>歷史發布紀錄</span>
           <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold">共 {list.length} 則</span>
        </h3>
        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {list.map(a => (
            <div key={a.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition group relative">
              <div className="flex justify-between items-start mb-2">
                <span className={clsx(
                  "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                  a.priority === 'High' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                )}>
                  {a.priority === 'High' ? 'Emergency' : 'Standard'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{a.date}</span>
              </div>
              <h4 className="font-bold text-slate-800 line-clamp-1 pr-10">{a.title}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{a.content}</p>
              <div className="mt-3 flex items-center gap-2">
                 <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">撰寫：系統官</span>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition flex gap-1">
                 <button className="p-1.5 text-slate-300 hover:text-blue-500 transition"><Edit2 size={14}/></button>
                 <button className="p-1.5 text-slate-300 hover:text-red-500 transition"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CategoryManager = () => (
  <div className="bg-white p-8 rounded-2xl border shadow-sm">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h3 className="font-bold text-slate-800 text-xl">廠商主營類別管理</h3>
        <p className="text-slate-500 text-sm">維護跨部門通用的廠商行業分類樹狀結構</p>
      </div>
      <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200">
        <Plus size={18}/> 新增類別
      </button>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {CATEGORY_OPTIONS.map(c => (
        <div key={c} className="p-4 border border-slate-100 rounded-2xl flex justify-between items-center bg-slate-50/30 group hover:border-blue-200 hover:bg-white transition cursor-default">
          <span className="text-sm font-bold text-slate-700">{c}</span>
          <button className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><X size={16}/></button>
        </div>
      ))}
    </div>
    
    <div className="mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
       <div className="p-2 bg-white rounded-lg text-blue-500 shadow-sm"><Info size={20}/></div>
       <div>
          <h4 className="font-bold text-blue-800 text-sm">管理提示</h4>
          <p className="text-blue-600/80 text-xs mt-1 leading-relaxed">
            修改類別名稱後，將自動同步更新所有已關聯廠商的分類標籤。刪除類別時若尚有廠商關聯，系統會提示您進行類別轉移。
          </p>
       </div>
    </div>
  </div>
);

const TagManager = () => (
  <div className="bg-white p-8 rounded-2xl border shadow-sm">
    <div className="flex justify-between items-end mb-8">
      <div>
        <h3 className="font-bold text-slate-800 text-xl">標籤雲與過濾規則</h3>
        <p className="text-slate-500 text-sm">設定廠商推薦演算法所依據的標籤權重</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {Object.entries(MOCK_SYSTEM_TAGS).map(([key, tags]) => (
        <div key={key} className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pb-2 border-b border-slate-100">{key}</h4>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <div key={t} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 group hover:bg-slate-800 hover:text-white transition">
                #{t} <X size={12} className="cursor-pointer opacity-0 group-hover:opacity-100 transition hover:text-red-400"/>
              </div>
            ))}
            <button className="px-3 py-1.5 border-2 border-dashed border-slate-200 rounded-xl text-[10px] text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 transition">+ ADD</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AiConfig = () => (
  <div className="bg-white p-8 rounded-2xl border shadow-sm">
    <div className="flex items-center gap-6 mb-10 bg-gradient-to-br from-indigo-600 to-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100">
      <div className="p-4 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
        <Bot size={48} className="text-blue-200" />
      </div>
      <div>
        <h3 className="font-bold text-2xl">AI 媒合演算法中心</h3>
        <p className="text-blue-100/60 text-sm mt-1">控制 Gemini 2.5 在搜尋廠商時的權重權衡與安全過濾邏輯</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {MOCK_MODEL_RULES.map(r => (
        <div key={r.id} className="p-6 border border-slate-100 rounded-2xl flex justify-between items-center group hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition">
          <div className="flex-1 pr-6">
            <div className="flex gap-2 mb-3">
              <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded-md font-black tracking-widest uppercase">{r.category}</span>
              <span className={clsx(
                "text-[10px] px-2 py-0.5 rounded-md font-black",
                r.weight === 'Must' ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-700"
              )}>{r.weight}</span>
            </div>
            <p className="text-sm font-bold text-slate-700 leading-relaxed">{r.rule}</p>
          </div>
          <button className="text-indigo-600 transition hover:scale-110"><ToggleRight size={40}/></button>
        </div>
      ))}
    </div>
  </div>
);

const UserManager = () => (
  <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
      <h3 className="font-bold text-slate-800 text-lg">系統用戶權限管理</h3>
      <div className="relative w-full md:w-80">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900 transition bg-slate-50/50" placeholder="搜尋姓名、信箱或部門..." />
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest">
          <tr>
            <th className="px-8 py-5">成員資訊</th>
            <th className="px-8 py-5">職級角色 / 部門</th>
            <th className="px-8 py-5">安全綁定</th>
            <th className="px-8 py-5">帳號狀態</th>
            <th className="px-8 py-5 text-right">管理操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {MOCK_USERS.map(u => (
            <tr key={u.id} className="hover:bg-slate-50/80 transition group">
              <td className="px-8 py-5 flex items-center gap-4">
                <img src={u.avatarUrl} className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm object-cover" />
                <div>
                  <div className="font-bold text-slate-800 text-base">{u.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                </div>
              </td>
              <td className="px-8 py-5">
                <div className="font-bold text-slate-700">{u.role}</div>
                <div className="text-xs text-slate-400 font-medium">{u.department}</div>
              </td>
              <td className="px-8 py-5">
                <div className="flex gap-2">
                  {u.googleLinked && <Globe size={18} className="text-blue-500" title="Google OAuth Linked" />}
                  {u.securitySettings?.isTimeRestricted && <Clock size={18} className="text-orange-500" title="Time Restricted Access" />}
                  {!u.googleLinked && !u.securitySettings?.isTimeRestricted && <span className="text-slate-300 text-xs">-</span>}
                </div>
              </td>
              <td className="px-8 py-5">
                <span className={clsx(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5",
                  u.status === 'Active' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                )}>
                  <span className={clsx("w-1.5 h-1.5 rounded-full", u.status === 'Active' ? "bg-green-500" : "bg-slate-400")}></span>
                  {u.status}
                </span>
              </td>
              <td className="px-8 py-5 text-right">
                <button className="text-blue-600 font-black hover:bg-blue-50 px-4 py-2 rounded-lg transition">管理授權</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const DepartmentManager = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {MOCK_DEPARTMENTS.map(d => (
      <div key={d.id} className="bg-white p-6 rounded-3xl border shadow-sm group hover:border-blue-400 hover:shadow-xl hover:shadow-blue-50 transition-all relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Shield size={24}/>
            </div>
            <button className="p-2 text-slate-300 hover:text-slate-800 transition"><Edit2 size={18}/></button>
          </div>
          <h4 className="font-black text-slate-800 text-xl tracking-tight">{d.name}</h4>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed">{d.description}</p>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
          <div className="flex flex-col">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">部門成員</span>
             <span className="text-sm font-bold text-slate-700 flex items-center gap-1"><Users size={14} className="text-slate-400"/> {d.memberCount} 位</span>
          </div>
          <div className="text-right">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">負責主管</span>
             <div className="text-sm font-bold text-blue-600">{d.managerName}</div>
          </div>
        </div>
      </div>
    ))}
    <button className="border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-12 text-slate-400 hover:bg-slate-50 hover:border-slate-400 transition-all group min-h-[280px]">
      <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Plus size={32} className="text-slate-300 group-hover:text-slate-800 transition-colors"/>
      </div>
      <span className="font-black text-sm tracking-widest uppercase">新增事業單位</span>
    </button>
  </div>
);
