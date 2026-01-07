
import React, { useState, useMemo } from 'react';
import { 
  Settings, Users, FileText, Plus, Megaphone, Globe, 
  Activity, Shield, X, Bell, AlertTriangle, Layers, Bot, BookOpen,
  History, LogIn, Eye, Monitor, Smartphone, Trash2, Tags, Power, Edit2,
  CheckCircle, Building, Search, ToggleRight, LayoutGrid, Wallet,
  Clock, Save, AlertCircle, Terminal, ExternalLink, ShieldCheck, Info,
  TrendingUp, Fingerprint, Database, Zap, Cpu, ArrowUpRight, BarChart3,
  Lock, Key, HardDrive, Filter, Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import { 
  MOCK_ANNOUNCEMENTS, MOCK_LOGS, MOCK_LOGIN_LOGS, 
  MOCK_MODEL_RULES, MOCK_SYSTEM_TAGS, CATEGORY_OPTIONS, 
  MOCK_USERS, MOCK_DEPARTMENTS, MOCK_VENDORS
} from '../constants';
import { Announcement, SystemLog, LoginLog, AdminUser, Department, AiModelRule, ServiceType, Region } from '../types';

type AdminTab = 'dashboard' | 'logs' | 'categories' | 'tags' | 'ai' | 'users' | 'departments' | 'announcements' | 'settings';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const navItems = [
    { id: 'dashboard', label: '統計儀表板', icon: <Activity size={18} /> },
    { id: 'logs', label: '審計日誌', icon: <Terminal size={18} /> },
    { id: 'categories', label: '類別管理', icon: <Layers size={18} /> },
    { id: 'tags', label: '智能標籤', icon: <Tags size={18} /> },
    { id: 'ai', label: 'AI 設定', icon: <Bot size={18} /> },
    { id: 'users', label: '人員權限', icon: <Users size={18} /> },
    { id: 'departments', label: '部門清單', icon: <Building size={18} /> },
    { id: 'announcements', label: '系統公告', icon: <Megaphone size={18} /> },
    { id: 'settings', label: '系統設定', icon: <Settings size={18} /> },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header with System Pulse */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl">
            <Cpu size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">系統核心管理中心</h1>
            <p className="text-slate-500 font-medium">Global Administrator Command Center</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 relative z-10">
           <div className="px-4 py-2 bg-green-50 text-green-700 rounded-2xl border border-green-100 flex items-center gap-2 text-xs font-black">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              CORE SERVICES: OPERATIONAL
           </div>
           <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 flex items-center gap-2 text-xs font-black">
              <Globe size={14} /> CDN: 24ms (ASIA-EAST)
           </div>
        </div>
        <Activity size={180} className="absolute -top-10 -right-10 text-slate-50 opacity-20" />
      </div>

      {/* Navigation Matrix */}
      <div className="flex border-b border-slate-200 gap-8 overflow-x-auto pb-px scrollbar-hide px-2">
        {navItems.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={clsx(
              "flex items-center gap-2 pb-4 text-sm font-black transition-all relative whitespace-nowrap uppercase tracking-widest",
              activeTab === tab.id ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 rounded-t-full animate-in slide-in-from-bottom-1" />
            )}
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
        {activeTab === 'settings' && <div className="text-slate-300 p-40 text-center border-4 border-dashed rounded-[3rem] bg-white font-black text-xl uppercase tracking-[0.2em]">System Config Loading...</div>}
      </div>
    </div>
  );
};

const DashboardSummary = () => {
  // --- Data Analytics Logic ---
  
  const complianceStats = useMemo(() => {
    const missingTaxId = MOCK_VENDORS.filter(v => !v.taxId).length;
    const missingContact = MOCK_VENDORS.filter(v => v.contacts.length === 0).length;
    const lowRating = MOCK_VENDORS.filter(v => v.rating < 3.0).length;
    return { missingTaxId, missingContact, lowRating };
  }, []);

  const identityStats = useMemo(() => {
    const total = MOCK_VENDORS.length;
    const counts = {
      labor: MOCK_VENDORS.filter(v => v.serviceTypes.includes(ServiceType.LABOR)).length,
      product: MOCK_VENDORS.filter(v => v.serviceTypes.includes(ServiceType.PRODUCT)).length,
      manufacturing: MOCK_VENDORS.filter(v => v.serviceTypes.includes(ServiceType.MANUFACTURING)).length,
    };
    return {
      labor: Math.round((counts.labor / total) * 100),
      product: Math.round((counts.product / total) * 100),
      manufacturing: Math.round((counts.manufacturing / total) * 100),
    };
  }, []);

  const securityStats = useMemo(() => {
    const failedLogins = MOCK_LOGIN_LOGS.filter(l => l.status === 'failed').length;
    const systemAlerts = MOCK_LOGS.filter(l => l.status === 'System').length;
    return { failedLogins, systemAlerts };
  }, []);

  return (
    <div className="space-y-8">
      {/* Row 1: Vital Signs (Resource & Security) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm group hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Bot size={24}/></div>
             <div className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">GEMINI 3 PRO</div>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">AI Token Usage</p>
          <div className="flex items-end gap-2">
             <h3 className="text-3xl font-black text-slate-800 tracking-tighter">14,280</h3>
             <span className="text-xs text-slate-400 mb-1 font-bold">/ 50k Today</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-500 w-[28%] transition-all duration-1000"></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border shadow-sm group hover:border-red-300 transition-all">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Shield size={24}/></div>
             <span className="flex items-center gap-1 text-[10px] font-black text-red-600 animate-pulse"><AlertCircle size={10}/> RISK DETECTED</span>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Security Incidents</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{securityStats.failedLogins} </h3>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Failed login attempts from suspicious IPs</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border shadow-sm group hover:border-blue-300 transition-all">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Database size={24}/></div>
             <div className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">DB HEALTH: 99%</div>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
          <div className="flex items-end gap-2">
             <h3 className="text-3xl font-black text-slate-800 tracking-tighter">2,482</h3>
             <span className="text-xs text-green-600 mb-1 font-black flex items-center gap-0.5"><ArrowUpRight size={12}/> 1.2%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Total Vendors & Transactions logs</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border shadow-sm group hover:border-orange-300 transition-all">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><Fingerprint size={24}/></div>
             <div className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">LIVE SESSION</div>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Active Administrators</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter">8</h3>
          <div className="flex -space-x-2 mt-3">
             {MOCK_USERS.slice(0, 4).map(u => (
                <img key={u.id} src={u.avatarUrl} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" title={u.name}/>
             ))}
             <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">+4</div>
          </div>
        </div>
      </div>

      {/* Row 2: Governance & Audit Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Compliance Guard */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-red-500 rounded-lg"><ShieldCheck size={20}/></div>
              <h3 className="font-black text-lg uppercase tracking-widest">供應鏈合規診斷</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center group cursor-pointer">
                 <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">資訊不完整廠商</span>
                    <span className="text-sm font-medium text-slate-300 mt-1">缺少統編或註冊證件</span>
                 </div>
                 <div className="text-2xl font-black text-orange-400">{complianceStats.missingTaxId} <span className="text-xs">家</span></div>
              </div>
              <div className="flex justify-between items-center group cursor-pointer">
                 <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">高風險低評分</span>
                    <span className="text-sm font-medium text-slate-300 mt-1">平均評分低於 3.0</span>
                 </div>
                 <div className="text-2xl font-black text-red-500">{complianceStats.lowRating} <span className="text-xs">家</span></div>
              </div>
              <div className="flex justify-between items-center group cursor-pointer">
                 <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">孤兒廠商</span>
                    <span className="text-sm font-medium text-slate-300 mt-1">未指派任何主要聯繫人</span>
                 </div>
                 <div className="text-2xl font-black text-white">{complianceStats.missingContact} <span className="text-xs">家</span></div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/10">
               <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition">
                  Execute Global Compliance Audit
               </button>
            </div>
          </div>
          <Shield size={200} className="absolute -bottom-20 -right-20 text-white opacity-5" />
        </div>

        {/* Identity Mix Balance */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
               <h3 className="font-black text-lg text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <BarChart3 size={20} className="text-blue-500" /> 兩岸協力身分結構
               </h3>
               <p className="text-xs text-slate-400 font-medium mt-1">Identity mix across TW / CN</p>
            </div>
            <Filter size={18} className="text-slate-300" />
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-8">
             <div className="space-y-2">
                <div className="flex justify-between text-xs font-black tracking-widest text-slate-600 uppercase">
                   <span>🛠️ 提供勞務 (Labor)</span>
                   <span>{identityStats.labor}%</span>
                </div>
                <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100">
                   <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${identityStats.labor}%` }}></div>
                </div>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-xs font-black tracking-widest text-slate-600 uppercase">
                   <span>📦 提供商品 (Product)</span>
                   <span>{identityStats.product}%</span>
                </div>
                <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100">
                   <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${identityStats.product}%` }}></div>
                </div>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-xs font-black tracking-widest text-slate-600 uppercase">
                   <span>🏭 製造商品 (Manufacturing)</span>
                   <span>{identityStats.manufacturing}%</span>
                </div>
                <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100">
                   <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${identityStats.manufacturing}%` }}></div>
                </div>
             </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
             <Info size={16} className="text-blue-500 shrink-0" />
             <p className="text-[10px] text-blue-700 leading-relaxed font-bold">
                當前結構顯示「製造」佔比偏低 (10%)。若要提升供應鏈韌性，建議開發更多具備自有工廠的大陸廠商。
             </p>
          </div>
        </div>

        {/* Real-time System Feed */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[500px]">
           <h3 className="font-black text-lg text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
             <Terminal size={20} className="text-slate-400" /> 系統日誌實時饋送
           </h3>
           <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {MOCK_LOGS.map(log => (
                 <div key={log.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                       <div className={clsx(
                          "w-2 h-2 rounded-full mt-2 ring-4 ring-offset-2",
                          log.status === 'Create' ? "bg-green-500 ring-green-50" : 
                          log.status === 'Update' ? "bg-blue-500 ring-blue-50" :
                          "bg-slate-300 ring-slate-50"
                       )}></div>
                       <div className="w-px flex-1 bg-slate-100 my-1 group-last:hidden"></div>
                    </div>
                    <div className="pb-4">
                       <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono text-slate-400 tracking-tighter">{log.timestamp}</span>
                          <span className="text-[10px] font-black text-slate-800 uppercase">{log.user}</span>
                       </div>
                       <p className="text-xs text-slate-600 font-bold line-clamp-1">{log.action}: {log.target}</p>
                       <p className="text-[10px] text-slate-400 mt-0.5 italic">{log.details}</p>
                    </div>
                 </div>
              ))}
           </div>
           <button className="mt-4 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-900 hover:border-slate-900 transition flex items-center justify-center gap-2 uppercase tracking-widest">
              Explore Audit Center <ExternalLink size={14} />
           </button>
        </div>
      </div>

      {/* Row 3: Regional Pulse (TW vs CN) */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative">
         <div className="flex flex-col lg:flex-row gap-12 relative z-10">
            <div className="lg:w-1/3">
               <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">區域數據治理分析</h3>
               <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  監控兩岸協力廠商的資料維護品質與活躍度。目前台灣地區廠商資料完整度較高，大陸地區廠商在「聯絡人更新」方面較為頻繁。
               </p>
               <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="text-[10px] font-black text-slate-400 uppercase mb-1">TW Data Freshness</div>
                     <div className="text-xl font-black text-blue-600">8.2 <span className="text-xs text-slate-400">/ 10</span></div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="text-[10px] font-black text-slate-400 uppercase mb-1">CN Data Freshness</div>
                     <div className="text-xl font-black text-red-500">6.4 <span className="text-xs text-slate-400">/ 10</span></div>
                  </div>
               </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Regional performance charts or stats would go here */}
               <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-6">
                     <span className="text-sm font-black text-slate-700 flex items-center gap-2">🇹🇼 台灣廠商活躍度</span>
                     <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">HIGH ACTIVE</span>
                  </div>
                  <div className="flex items-end gap-1 h-20 mb-4">
                     {[30, 45, 25, 60, 80, 55, 40].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-100 rounded-t-lg hover:bg-blue-500 transition-all duration-500" style={{ height: `${h}%` }}></div>
                     ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Weekly interaction log frequency</p>
               </div>
               <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-6">
                     <span className="text-sm font-black text-slate-700 flex items-center gap-2">🇨🇳 大陸廠商活躍度</span>
                     <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">NORMAL</span>
                  </div>
                  <div className="flex items-end gap-1 h-20 mb-4">
                     {[50, 30, 70, 40, 35, 20, 45].map((h, i) => (
                        <div key={i} className="flex-1 bg-red-100 rounded-t-lg hover:bg-red-500 transition-all duration-500" style={{ height: `${h}%` }}></div>
                     ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Weekly interaction log frequency</p>
               </div>
            </div>
         </div>
         <Globe size={300} className="absolute -bottom-20 -left-20 text-slate-50 opacity-20 pointer-events-none" />
      </div>
    </div>
  );
};

// ... Rest of the components (LogCenter, UserManager, etc.) remain the same ...
// [ Keeping original definitions but they will be mapped in the main file ]

const LogCenter: React.FC = () => {
  const [logType, setLogType] = useState<'operation' | 'login'>('operation');
  const [viewLog, setViewLog] = useState<any>(null);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button 
          onClick={() => setLogType('operation')}
          className={clsx(
            "px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition uppercase tracking-widest shadow-sm",
            logType === 'operation' ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
          )}
        >
          <History size={16} /> Operation Audit
        </button>
        <button 
          onClick={() => setLogType('login')}
          className={clsx(
            "px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition uppercase tracking-widest shadow-sm",
            logType === 'login' ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
          )}
        >
          <LogIn size={16} /> Security Login
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {logType === 'operation' ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5">Actor</th>
                  <th className="px-8 py-5">Action</th>
                  <th className="px-8 py-5">Target Entity</th>
                  <th className="px-8 py-5">Raw Details</th>
                  <th className="px-8 py-5 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_LOGS.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition group">
                    <td className="px-8 py-5 text-slate-400 font-mono text-xs">{l.timestamp}</td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">{l.user.charAt(0)}</div>
                          <span className="font-bold text-slate-700">{l.user}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                        l.status === 'Update' ? "bg-blue-50 text-blue-700" : 
                        l.status === 'Create' ? "bg-green-50 text-green-700" :
                        l.status === 'Delete' ? "bg-red-50 text-red-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-slate-600 font-black">{l.target}</td>
                    <td className="px-8 py-5 text-slate-400 text-xs font-medium max-w-xs truncate">{l.details}</td>
                    <td className="px-8 py-5 text-center">
                      <button onClick={() => setViewLog(l)} className="text-slate-300 hover:text-slate-800 transition">
                        <Eye size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  <th className="px-8 py-5">Login Time</th>
                  <th className="px-8 py-5">Administrator</th>
                  <th className="px-8 py-5">IP Source</th>
                  <th className="px-8 py-5">Device Environment</th>
                  <th className="px-8 py-5 text-center">Security Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_LOGIN_LOGS.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-8 py-5 text-slate-400 font-mono text-xs">{l.timestamp}</td>
                    <td className="px-8 py-5 font-bold text-slate-700">{l.user}</td>
                    <td className="px-8 py-5 font-mono text-blue-600 text-xs">{l.ip}</td>
                    <td className="px-8 py-5 text-slate-500">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        {l.device.includes('Mac') || l.device.includes('Windows') ? <Monitor size={14} className="text-slate-400" /> : <Smartphone size={14} className="text-slate-400" />}
                        {l.device}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={clsx(
                         "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                         l.status === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700 animate-pulse"
                      )}>
                        {l.status === 'success' ? 'Authorized' : 'Denied'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {viewLog && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-white/5 px-8 py-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-black text-white flex items-center gap-3 uppercase tracking-widest">
                <Terminal size={24} className="text-blue-400" /> Transaction Raw Data
              </h3>
              <button onClick={() => setViewLog(null)} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </div>
            <div className="p-8">
              <div className="bg-black/50 p-6 rounded-3xl border border-white/5">
                <pre className="text-blue-300 font-mono text-xs overflow-auto max-h-96 custom-scrollbar">{JSON.stringify(viewLog, null, 4)}</pre>
              </div>
              <button onClick={() => setViewLog(null)} className="w-full mt-8 bg-white text-slate-900 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-50 transition">Close Metadata Terminal</button>
            </div>
          </div>
        </div>
      )}
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
      author: 'Global Admin',
      tags: ['Important']
    };
    setList([newAnn, ...list]);
    setTitle(''); setContent('');
    alert('Global announcement broadcasted to all terminals.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-[750px]">
      <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 flex flex-col">
        <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-[0.2em] text-sm"><Plus className="text-blue-600" size={24}/> Create Broadcast</h3>
        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
           <div>
             <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.3em]">Bulletin Title</label>
             <input className="w-full border border-slate-100 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-slate-900/5 outline-none font-bold bg-slate-50 transition-all focus:bg-white" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., Annual Vendor Evaluation Starts..." />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.3em]">Priority Level</label>
                 <select className="w-full border border-slate-100 rounded-2xl p-4 text-xs bg-slate-50 outline-none font-black uppercase tracking-widest transition-all focus:bg-white" value={priority} onChange={e=>setPriority(e.target.value as any)}>
                   <option value="Normal">Standard (Blue)</option>
                   <option value="High">Emergency (Red Pulse)</option>
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.3em]">Target Segment</label>
                 <input className="w-full border border-slate-100 rounded-2xl p-4 text-xs bg-slate-50 outline-none font-bold transition-all focus:bg-white" placeholder="Logistics, Finance..." />
              </div>
           </div>
           <div className="flex-1 flex flex-col">
             <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.3em]">Message Body</label>
             <textarea className="flex-1 w-full border border-slate-100 rounded-2xl p-4 text-sm resize-none focus:ring-4 focus:ring-slate-900/5 outline-none font-medium leading-relaxed bg-slate-50 transition-all focus:bg-white min-h-[200px]" value={content} onChange={e=>setContent(e.target.value)} placeholder="Type the announcement details here..." />
           </div>
        </div>
        <button onClick={handlePost} className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black shadow-2xl hover:bg-slate-800 transition active:scale-95 uppercase tracking-[0.3em] text-xs">Transmit Broadcast</button>
      </div>
      
      <div className="lg:col-span-3 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <h3 className="font-black text-slate-800 mb-8 flex items-center justify-between">
           <span className="uppercase tracking-[0.2em] text-sm flex items-center gap-2"><History size={18} className="text-slate-300"/> Broadcast Archive</span>
           <span className="text-[10px] bg-slate-900 text-white px-4 py-1 rounded-full font-black">TOTAL: {list.length}</span>
        </h3>
        <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar flex-1">
          {list.map(a => (
            <div key={a.id} className="p-6 border border-slate-50 rounded-[2rem] hover:border-slate-200 transition-all group relative bg-slate-50/50 hover:bg-white">
              <div className="flex justify-between mb-3">
                <span className={clsx("text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-sm", a.priority === 'High' ? "bg-red-500 text-white" : "bg-blue-100 text-blue-700")}>
                   {a.priority === 'High' ? 'Emergency' : 'Standard'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">{a.date}</span>
              </div>
              <h4 className="font-black text-slate-800 text-lg tracking-tight mb-2">{a.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">{a.content}</p>
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 flex gap-2 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                 <button className="p-2.5 bg-white rounded-full shadow-lg text-slate-400 hover:text-blue-600 transition border border-slate-100"><Edit2 size={14}/></button>
                 <button className="p-2.5 bg-white rounded-full shadow-lg text-slate-400 hover:text-red-500 transition border border-slate-100"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CategoryManager = () => (
  <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h3 className="font-black text-slate-800 text-2xl tracking-tight uppercase">Vendor Category Matrix</h3>
        <p className="text-slate-400 text-sm font-bold mt-1 tracking-widest">GLOBAL CLASSIFICATION SYSTEM</p>
      </div>
      <button className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-800 transition shadow-2xl active:scale-95"><Plus size={20}/> Create Master Category</button>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {CATEGORY_OPTIONS.map(c => (
        <div key={c} className="p-6 border border-slate-50 rounded-[2rem] flex justify-between items-center bg-slate-50/50 group hover:border-blue-400 hover:bg-white transition cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-50">
          <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{c}</span>
          <button className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition duration-300"><X size={20}/></button>
        </div>
      ))}
    </div>
  </div>
);

const TagManager = () => (
  <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
    <div className="flex items-center gap-4 mb-12">
       <div className="p-4 bg-indigo-600 text-white rounded-3xl"><Sparkles size={32}/></div>
       <div>
          <h3 className="font-black text-slate-800 text-2xl tracking-tight uppercase">全域智能標籤系統</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">AI-Powered Semantic Labeling Matrix</p>
       </div>
    </div>
    <div className="space-y-16">
      {Object.entries(MOCK_SYSTEM_TAGS).map(([key, tags]) => (
        <div key={key}>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 pb-2 border-b-2 border-slate-50 inline-block">{key}</h4>
          <div className="flex flex-wrap gap-4">
            {tags.map(t => (
              <span key={t} className="px-6 py-3 bg-slate-50 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 group border border-slate-100 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 cursor-default">
                #{t} <X size={14} className="cursor-pointer opacity-20 group-hover:opacity-100 transition hover:text-red-400"/>
              </span>
            ))}
            <button className="px-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] text-slate-400 font-black hover:border-indigo-400 hover:text-indigo-600 transition-all uppercase tracking-[0.2em] bg-white">+ New Semantic Tag</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AiConfig = () => (
  <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
    <div className="flex items-center gap-8 mb-16 bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
      <div className="p-6 bg-white/10 backdrop-blur-xl text-white rounded-[2rem] border border-white/20 relative z-10">
        <Bot size={56} />
      </div>
      <div className="relative z-10">
        <h3 className="font-black text-white text-3xl tracking-tight uppercase">AI 智能媒合引擎控制台</h3>
        <p className="text-slate-400 text-sm font-medium mt-2 max-w-xl">
           調整 Gemini 3 在進行「廠商自動篩選、風險動態評核、標籤聯想」時的核心邏輯權重與過濾門檻。
        </p>
      </div>
      <Zap size={200} className="absolute -top-10 -right-10 text-white/5 opacity-10 rotate-12" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {MOCK_MODEL_RULES.map(r => (
        <div key={r.id} className="p-8 border border-slate-100 rounded-[2.5rem] flex justify-between items-center group hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-500 bg-white">
          <div className="flex-1 pr-8">
            <div className="flex gap-2 mb-4">
              <span className="text-[9px] bg-slate-900 text-white px-3 py-1 rounded-lg font-black uppercase tracking-widest">{r.category}</span>
              <span className={clsx("text-[9px] px-3 py-1 rounded-lg font-black tracking-widest uppercase", r.weight === 'Must' ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-700")}>{r.weight} Priority</span>
            </div>
            <p className="text-base font-black text-slate-700 leading-relaxed tracking-tight">{r.rule}</p>
          </div>
          <button className="text-indigo-600 transition-transform duration-500 group-hover:scale-125"><ToggleRight size={48}/></button>
        </div>
      ))}
    </div>
  </div>
);

const UserManager = () => (
  <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
    <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30">
      <div>
         <h3 className="font-black text-slate-800 text-2xl uppercase tracking-widest">人員權限中心</h3>
         <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Identity & Access Management</p>
      </div>
      <div className="relative w-full md:w-[450px]">
        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner" placeholder="Search by name, email, or department ID..." />
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
          <tr>
             <th className="px-10 py-6">Identity Profile</th>
             <th className="px-10 py-6">Core Role / Department</th>
             <th className="px-10 py-6">System Status</th>
             <th className="px-10 py-6 text-right">Policy Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {MOCK_USERS.map(u => (
            <tr key={u.id} className="hover:bg-slate-50 transition group">
              <td className="px-10 py-6 flex items-center gap-5">
                <img src={u.avatarUrl} className="w-12 h-12 rounded-[1.2rem] border-4 border-white shadow-lg object-cover group-hover:scale-110 transition-transform" />
                <div>
                   <div className="font-black text-slate-800 text-lg tracking-tight">{u.name}</div>
                   <div className="text-xs text-slate-400 font-bold font-mono uppercase">{u.email}</div>
                </div>
              </td>
              <td className="px-10 py-6">
                <div className="font-black text-slate-700 uppercase tracking-widest text-xs">{u.role}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-[0.1em]">{u.department} Unit</div>
              </td>
              <td className="px-10 py-6">
                 <span className={clsx(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border", 
                    u.status === 'Active' ? "bg-green-50 text-green-700 border-green-100" : "bg-slate-50 text-slate-400 border-slate-200"
                 )}>
                    {u.status}
                 </span>
              </td>
              <td className="px-10 py-6 text-right">
                <button className="text-blue-600 font-black hover:text-slate-900 uppercase tracking-[0.2em] text-[10px] px-4 py-2 rounded-xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">Configure Policy</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const DepartmentManager = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    {MOCK_DEPARTMENTS.map(d => (
      <div key={d.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm group hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-50 transition-all duration-500 relative overflow-hidden flex flex-col justify-between h-72">
        <div>
           <div className="flex justify-between items-start mb-8">
              <div className="p-5 bg-blue-50 text-blue-600 rounded-[1.5rem] group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                 <Shield size={28}/>
              </div>
              <button className="text-slate-200 hover:text-slate-800 transition-all duration-300 transform group-hover:rotate-90"><Settings size={20}/></button>
           </div>
           <h4 className="font-black text-slate-800 text-2xl tracking-tighter uppercase">{d.name}</h4>
           <p className="text-slate-400 text-xs mt-3 line-clamp-2 font-bold leading-relaxed tracking-wider uppercase">{d.description}</p>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Users size={14}/> {d.memberCount} Team Members</span>
          <span className="text-blue-600 font-black text-xs uppercase tracking-widest border-b-2 border-blue-100 pb-0.5">{d.managerName}</span>
        </div>
      </div>
    ))}
    <button className="border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center p-10 text-slate-300 hover:bg-blue-50/50 hover:border-blue-400 hover:text-blue-600 transition-all duration-500 group min-h-[288px] bg-white/50">
      <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-180 transition-all duration-700">
         <Plus size={40} className="text-slate-200 group-hover:text-blue-600 transition-colors"/>
      </div>
      <span className="font-black uppercase tracking-[0.3em] text-xs">Add Business Unit</span>
    </button>
  </div>
);
