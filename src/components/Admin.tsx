
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Settings, 
  Users, 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  History, 
  LayoutGrid, 
  Activity, 
  Wallet, 
  Bot, 
  Sparkles, 
  ToggleLeft, 
  ToggleRight, 
  Tags, 
  X, 
  BookOpen, 
  Globe, 
  Megaphone, 
  AlertTriangle, 
  Clock, 
  Maximize2, 
  Power, 
  Layers, 
  FolderOpen, 
  Camera, 
  CheckCircle, 
  Shield, 
  Upload, 
  BarChart, 
  PieChart, 
  ArrowRight, 
  Save, 
  AlertCircle, 
  Search, 
  LogIn, 
  Monitor, 
  Building, 
  Lock, 
  Eye, 
  Calendar, 
  Filter, 
  ArrowDown, 
  ArrowUp, 
  UserCheck, 
  UserX
} from 'lucide-react';
import { clsx } from 'clsx';
import { MOCK_USERS, MOCK_LOGS, MOCK_LOGIN_LOGS, MOCK_MODEL_RULES, MOCK_SYSTEM_TAGS, MOCK_TUTORIALS, MOCK_ANNOUNCEMENTS, CATEGORY_OPTIONS, MOCK_VENDORS, MOCK_DEPARTMENTS } from '../constants';
import { AiModelRule, SystemTags, TutorialTip, Announcement, AdminUser, TransactionStatus, Department, SystemLog } from '../types';
import { ResponsiveContainer, BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';

type AdminTab = 'dashboard' | 'logs' | 'categories' | 'tags' | 'tutorials' | 'ai' | 'users' | 'departments' | 'settings';

// Mock current user for admin context
const CURRENT_ADMIN_USER = MOCK_USERS[0]; // Alex Chen (System Admin)

// --- Helper Components & Sub-Views Definitions ---

const PermissionToggle: React.FC<{ label: string; checked: boolean; onChange: () => void; isDangerous?: boolean }> = ({ label, checked, onChange, isDangerous }) => (
   <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-white hover:shadow-sm transition">
      <span className={clsx("text-sm font-medium", isDangerous ? "text-red-700" : "text-slate-700")}>{label}</span>
      <div className="relative inline-flex items-center cursor-pointer" onClick={onChange}>
         <div className={clsx("w-9 h-5 rounded-full transition-colors", checked ? (isDangerous ? "bg-red-500" : "bg-blue-600") : "bg-slate-300")}></div>
         <div className={clsx("absolute top-1 left-1 bg-white border border-gray-300 w-3 h-3 rounded-full transition-transform", checked ? "translate-x-4" : "translate-x-0")}></div>
      </div>
   </label>
);

const AdminDashboard: React.FC = () => {
  const stats = useMemo(() => {
    let pendingCount = 0;
    let totalSpend = 0;
    let totalLogs = 0;
    let missedCount = 0;
    let activeVendors = 0;

    MOCK_VENDORS.forEach(v => {
      pendingCount += v.transactions.filter(t => t.status === TransactionStatus.PENDING_APPROVAL).length;
      totalSpend += v.transactions
        .filter(t => t.status === TransactionStatus.APPROVED || t.status === TransactionStatus.PAID)
        .reduce((sum, t) => sum + t.amount, 0);
      totalLogs += v.contactLogs.length;
      if ((v.missedContactLogCount || 0) > 0) missedCount++;
      if (!v.isBlacklisted) activeVendors++;
    });

    return { pendingCount, totalSpend, totalLogs, missedCount, vendorCount: MOCK_VENDORS.length, activeVendors };
  }, []);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    MOCK_VENDORS.forEach(v => {
      v.categories.forEach(c => {
        data[c] = (data[c] || 0) + 1;
      });
    });
    return Object.entries(data).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, []);

  const pendingTasks = useMemo(() => {
    const tasks: any[] = [];
    MOCK_VENDORS.forEach(v => {
      v.transactions
        .filter(t => t.status === TransactionStatus.PENDING_APPROVAL)
        .forEach(t => tasks.push({ 
          type: 'APPROVAL', 
          title: `待驗收: ${t.description}`, 
          vendor: v.name, 
          date: t.date,
          link: `/transactions/${t.id}`
        }));
      if (v.missedContactLogCount > 0) {
        tasks.push({ 
          type: 'MISSED', 
          title: `未填寫聯繫紀錄 (${v.missedContactLogCount}次)`, 
          vendor: v.name, 
          date: '最近',
          link: `/vendors/${v.id}`
        });
      }
    });
    return tasks;
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Link to="/vendors" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:shadow-md transition group">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase">活躍/總資源數</p>
              <h3 className="text-3xl font-extrabold text-slate-800 group-hover:text-blue-600 transition">{stats.activeVendors} <span className="text-sm text-slate-400 font-medium">/ {stats.vendorCount}</span></h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition"><LayoutGrid size={24} /></div>
         </Link>
         <Link to="/payments" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:shadow-md transition group">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase">待撥款與已結算</p>
              <h3 className="text-3xl font-extrabold text-slate-800 group-hover:text-green-600 transition">${(stats.totalSpend / 10000).toFixed(1)}萬</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition"><Wallet size={24} /></div>
         </Link>
         <Link to="#pending" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:shadow-md transition group">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase">異常與待辦</p>
              <h3 className="text-3xl font-extrabold text-orange-600">{stats.pendingCount + stats.missedCount}</h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100 transition"><AlertTriangle size={24} /></div>
         </Link>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:shadow-md transition">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1 uppercase">總聯繫紀錄</p>
              <h3 className="text-3xl font-extrabold text-slate-800">{stats.totalLogs}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Activity size={24} /></div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <BarChart size={20} className="text-slate-400"/> 
                 廠商類別分佈 (Top 8)
              </h3>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">即時統計</span>
           </div>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <RechartsBar data={categoryData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} interval={0} />
                    <YAxis hide />
                    <Bar dataKey="value" fill="#475569" radius={[4, 4, 0, 0]} barSize={40} />
                 </RechartsBar>
              </ResponsiveContainer>
           </div>
        </div>

        <div id="pending" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Clock size={20} className="text-slate-400"/> 
                 待處理項目
              </h3>
              <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
           </div>
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 max-h-[300px]">
              {pendingTasks.length > 0 ? pendingTasks.map((task, i) => (
                 <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-3 hover:bg-slate-100 transition">
                    <div className={clsx("w-2 h-2 rounded-full mt-1.5 shrink-0", task.type === 'APPROVAL' ? "bg-orange-500" : "bg-red-500")}></div>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-slate-700 truncate">{task.title}</p>
                       <p className="text-xs text-slate-500">{task.vendor} • {task.date}</p>
                    </div>
                    <Link to={task.link} className="text-xs text-blue-600 font-bold hover:underline shrink-0 bg-white px-2 py-1 rounded border border-blue-100 hover:bg-blue-50">
                       處理
                    </Link>
                 </div>
              )) : (
                 <div className="text-center py-10 text-slate-400">
                    <CheckCircle size={32} className="mx-auto mb-2 opacity-20" />
                    <p>目前沒有待辦事項</p>
                 </div>
              )}
           </div>
           <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <button className="text-sm text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center gap-1 w-full transition">
                 前往工單中心 <ArrowRight size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const LogCenter: React.FC = () => {
  const [logType, setLogType] = useState<'operation' | 'login'>('operation');
  const [viewLog, setViewLog] = useState<SystemLog | null>(null);
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Derive unique users and actions from logs for dropdowns
  const uniqueUsers = useMemo(() => Array.from(new Set(MOCK_LOGS.concat(MOCK_LOGIN_LOGS as any).map((l: any) => l.user))), []);
  const uniqueActions = useMemo(() => Array.from(new Set(MOCK_LOGS.map(l => l.action))), []);

  const filterLogs = (logs: any[]) => {
    return logs.filter(log => {
      const logDate = log.timestamp.split(' ')[0]; // Assuming format YYYY-MM-DD HH:mm
      const matchesSearch = 
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.target && log.target.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.ip && log.ip.includes(searchQuery));
      
      const matchesUser = selectedUser ? log.user === selectedUser : true;
      const matchesDate = 
        (!startDate || logDate >= startDate) && 
        (!endDate || logDate <= endDate);
      
      const matchesAction = selectedAction && 'action' in log ? log.action === selectedAction : true;

      return matchesSearch && matchesUser && matchesDate && matchesAction;
    }).sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  };

  const filteredOperationLogs = useMemo(() => filterLogs(MOCK_LOGS), [searchQuery, startDate, endDate, selectedUser, selectedAction, sortOrder]);
  const filteredLoginLogs = useMemo(() => filterLogs(MOCK_LOGIN_LOGS), [searchQuery, startDate, endDate, selectedUser, sortOrder]);

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSelectedUser('');
    setSelectedAction('');
  };

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex gap-2">
             <button 
                onClick={() => setLogType('operation')}
                className={clsx("px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition", logType === 'operation' ? "bg-slate-800 text-white shadow" : "bg-white text-slate-500 hover:bg-slate-50")}
             >
                <History size={16} /> 操作日誌
             </button>
             <button 
                onClick={() => setLogType('login')}
                className={clsx("px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition", logType === 'login' ? "bg-slate-800 text-white shadow" : "bg-white text-slate-500 hover:bg-slate-50")}
             >
                <LogIn size={16} /> 登入日誌
             </button>
          </div>
       </div>

       {/* Advanced Filters Toolbar */}
       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
             <input 
                type="text" 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="搜尋使用者、IP、詳情..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
             />
          </div>
          
          <div className="flex gap-2 items-center flex-wrap w-full md:w-auto">
             <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                <Calendar size={14} className="text-slate-400"/>
                <input type="date" className="bg-transparent text-xs outline-none w-24 text-slate-600" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <span className="text-slate-300">-</span>
                <input type="date" className="bg-transparent text-xs outline-none w-24 text-slate-600" value={endDate} onChange={e => setEndDate(e.target.value)} />
             </div>

             <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 max-w-[120px]" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                <option value="">所有人員</option>
                {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
             </select>

             {logType === 'operation' && (
                <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 max-w-[120px]" value={selectedAction} onChange={e => setSelectedAction(e.target.value)}>
                   <option value="">所有動作</option>
                   {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
             )}

             <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500" title="切換排序">
                {sortOrder === 'desc' ? <ArrowDown size={18}/> : <ArrowUp size={18}/>}
             </button>

             {(searchQuery || startDate || endDate || selectedUser || selectedAction) && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:underline px-2">清除</button>
             )}
          </div>
       </div>

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          <div className="overflow-x-auto">
            {logType === 'operation' ? (
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                     <tr>
                        <th className="px-6 py-4">時間</th>
                        <th className="px-6 py-4">人員</th>
                        <th className="px-6 py-4">動作</th>
                        <th className="px-6 py-4">對象</th>
                        <th className="px-6 py-4">詳情</th>
                        <th className="px-6 py-4 text-center">操作</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                     {filteredOperationLogs.length > 0 ? filteredOperationLogs.map(l => (
                        <tr key={l.id} className="hover:bg-slate-50 transition">
                           <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{l.timestamp}</td>
                           <td className="px-6 py-4 font-bold">{l.user}</td>
                           <td className="px-6 py-4">
                              <span className={clsx(
                                 "px-2 py-1 rounded text-xs font-bold",
                                 l.action.includes('刪除') ? "bg-red-100 text-red-700" : 
                                 l.action.includes('修改') ? "bg-yellow-100 text-yellow-800" :
                                 l.action.includes('新增') ? "bg-green-100 text-green-700" :
                                 "bg-slate-100 text-slate-700"
                              )}>{l.action}</span>
                           </td>
                           <td className="px-6 py-4 font-medium">{l.target}</td>
                           <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{l.details}</td>
                           <td className="px-6 py-4 text-center">
                              <button onClick={() => setViewLog(l)} className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition"><Eye size={16} /></button>
                           </td>
                        </tr>
                     )) : (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">沒有符合條件的日誌</td></tr>
                     )}
                  </tbody>
               </table>
            ) : (
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                     <tr>
                        <th className="px-6 py-4">登入時間</th>
                        <th className="px-6 py-4">人員</th>
                        <th className="px-6 py-4">IP 位址</th>
                        <th className="px-6 py-4">裝置</th>
                        <th className="px-6 py-4 text-center">狀態</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                     {filteredLoginLogs.length > 0 ? filteredLoginLogs.map(l => (
                        <tr key={l.id} className="hover:bg-slate-50 transition">
                           <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{l.timestamp}</td>
                           <td className="px-6 py-4 font-bold">{l.user}</td>
                           <td className="px-6 py-4 font-mono text-slate-500 text-xs">{l.ip}</td>
                           <td className="px-6 py-4 text-slate-500 flex items-center gap-2"><Monitor size={14}/> {l.device}</td>
                           <td className="px-6 py-4 text-center"><span className={clsx("px-3 py-1 rounded-full text-xs font-bold capitalize", l.status === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>{l.status}</span></td>
                        </tr>
                     )) : (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">沒有符合條件的日誌</td></tr>
                     )}
                  </tbody>
               </table>
            )}
          </div>
       </div>
       {viewLog && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><FileText size={20} className="text-blue-500" /> 日誌詳情</h3>
                  <button onClick={() => setViewLog(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
               </div>
               <div className="p-6 space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                     <div><span className="block text-xs font-bold text-slate-400 mb-1">時間</span><span className="font-mono text-slate-700">{viewLog.timestamp}</span></div>
                     <div><span className="block text-xs font-bold text-slate-400 mb-1">操作人員</span><span className="font-bold text-slate-800">{viewLog.user}</span></div>
                     <div><span className="block text-xs font-bold text-slate-400 mb-1">來源 IP</span><span className="font-mono text-slate-700">{viewLog.ip || 'N/A'}</span></div>
                     <div><span className="block text-xs font-bold text-slate-400 mb-1">動作類型</span><span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-600">{viewLog.action}</span></div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                     <span className="block text-xs font-bold text-slate-400 mb-2">操作對象</span>
                     <div className="bg-slate-50 p-2 rounded border border-slate-100 text-slate-700 font-medium">{viewLog.target}</div>
                  </div>
                  <div>
                     <span className="block text-xs font-bold text-slate-400 mb-2">詳細內容</span>
                     <div className="bg-slate-50 p-3 rounded border border-slate-100 text-slate-600 leading-relaxed whitespace-pre-wrap h-24 overflow-y-auto custom-scrollbar">{viewLog.details}</div>
                  </div>
               </div>
               <div className="bg-slate-50 px-6 py-4 flex justify-end">
                  <button onClick={() => setViewLog(null)} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-700">關閉</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Department>>({});

  const handleAdd = () => {
    const newId = `D${String(departments.length + 1).padStart(3, '0')}`;
    const newDept: Department = { id: newId, name: '新部門', description: '請輸入部門描述', memberCount: 0 };
    setDepartments([...departments, newDept]);
    setIsEditing(newId);
    setFormData(newDept);
  };

  const handleEdit = (dept: Department) => { setIsEditing(dept.id); setFormData(dept); };
  const handleSave = () => {
    if (isEditing && formData.name) {
      setDepartments(departments.map(d => d.id === isEditing ? { ...d, ...formData } as Department : d));
      setIsEditing(null);
      setFormData({});
    }
  };
  const handleDelete = (id: string) => { if (window.confirm('確定要刪除此部門嗎？')) setDepartments(departments.filter(d => d.id !== id)); };

  return (
    <div className="space-y-6">
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex justify-between items-center">
          <div><h3 className="font-bold text-lg text-slate-800">部門設定清單</h3><p className="text-slate-500 text-sm">管理公司組織架構與部門資訊</p></div>
          <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition flex items-center gap-2"><Plus size={16} /> 新增部門</button>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map(dept => (
             <div key={dept.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition group">
                {isEditing === dept.id ? (
                   <div className="space-y-3">
                      <div className="flex gap-2">
                         <div className="flex-1"><label className="block text-xs font-bold text-slate-400 mb-1">部門名稱</label><input className="w-full border border-slate-300 rounded p-2 text-sm" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}/></div>
                         <div className="flex-1"><label className="block text-xs font-bold text-slate-400 mb-1">部門主管</label><input className="w-full border border-slate-300 rounded p-2 text-sm" value={formData.managerName || ''} onChange={e => setFormData({...formData, managerName: e.target.value})}/></div>
                      </div>
                      <div><label className="block text-xs font-bold text-slate-400 mb-1">描述</label><textarea className="w-full border border-slate-300 rounded p-2 text-sm resize-none h-20" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})}/></div>
                      <div className="flex justify-end gap-2 mt-2"><button onClick={() => setIsEditing(null)} className="px-3 py-1.5 text-slate-500 text-sm hover:bg-slate-100 rounded">取消</button><button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded font-bold hover:bg-blue-700">儲存</button></div>
                   </div>
                ) : (
                   <>
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-2"><span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-mono">{dept.id}</span><h4 className="font-bold text-slate-800 text-lg">{dept.name}</h4></div>
                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"><button onClick={() => handleEdit(dept)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button><button onClick={() => handleDelete(dept.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button></div>
                      </div>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[40px]">{dept.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                         <div className="flex items-center gap-2 text-sm text-slate-500"><Users size={14} /><span>{dept.memberCount} 位成員</span></div>
                         {dept.managerName && (<div className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded"><Shield size={12} /> 主管: {dept.managerName}</div>)}
                      </div>
                   </>
                )}
             </div>
          ))}
       </div>
    </div>
  );
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending' | 'Inactive'>('All');

  const filteredUsers = users.filter(u => statusFilter === 'All' || u.status === statusFilter);

  const handleEdit = (user: AdminUser) => setEditingUser({ ...user });
  const handleSave = () => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
    }
  };
  const togglePermission = (key: keyof AdminUser['permissions']) => {
    if (editingUser) setEditingUser({ ...editingUser, permissions: { ...editingUser.permissions, [key]: !editingUser.permissions[key] } });
  };
  const updateSecurity = (field: string, value: any) => {
    if (editingUser) setEditingUser({ ...editingUser, securitySettings: { ...editingUser.securitySettings || { allowedIps: [], accessTimeStart: '00:00', accessTimeEnd: '23:59', isTimeRestricted: false }, [field]: value } });
  };

  const handleApprove = (userId: string) => {
    if(window.confirm('確認核准此用戶加入系統？')) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'Active' } : u));
    }
  };

  const handleReject = (userId: string) => {
    if(window.confirm('確認拒絕此用戶？該帳號將被停用。')) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'Inactive' } : u));
    }
  };

  const handleAddUser = () => {
    // In real scenario, this might open a modal to invite via email
    alert("系統規則提示：本系統不開放自行註冊。\n\n請透過此處建立帳號，初始狀態將設為「待審核 (Pending)」，經確認後再由管理員開通權限。");
    const newUser: AdminUser = {
      id: `u-${Date.now()}`,
      name: 'New User',
      email: 'user@company.com',
      department: '未分配',
      role: 'Viewer',
      status: 'Pending',
      avatarUrl: 'https://picsum.photos/200',
      accumulatedBonus: 0,
      googleLinked: false,
      permissions: {
        viewWarRoom: false, viewVendors: true, viewTasks: false, viewCommunication: false, viewPayments: false, viewKnowledge: false, viewAnnouncements: true, accessAdminPanel: false, canManageCategories: false, canManageUsers: false, canDeleteVendors: false, canAddVendors: false, canEditVendors: false
      }
    };
    setUsers([...users, newUser]);
    setEditingUser(newUser);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-600">狀態篩選:</span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
               {(['All', 'Active', 'Pending', 'Inactive'] as const).map(s => (
                  <button 
                     key={s} 
                     onClick={() => setStatusFilter(s)}
                     className={clsx("px-3 py-1 rounded text-xs font-bold transition", statusFilter === s ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700")}
                  >
                     {s === 'All' ? '全部' : s === 'Active' ? '啟用中' : s === 'Pending' ? '待審核' : '停用'}
                  </button>
               ))}
            </div>
         </div>
         <button onClick={handleAddUser} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-700 flex items-center gap-2"><Plus size={16}/> 新增人員 (內部建立)</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
               <tr>
                  <th className="px-6 py-4">人員</th><th className="px-6 py-4">角色/部門</th><th className="px-6 py-4">綁定帳號</th><th className="px-6 py-4">安全設定</th><th className="px-6 py-4">狀態</th><th className="px-6 py-4 text-right">操作</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                     <td className="px-6 py-4 flex items-center gap-3"><img src={u.avatarUrl} className="w-10 h-10 rounded-full border border-slate-200" /><div><div className="font-bold text-slate-800">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></div></td>
                     <td className="px-6 py-4"><span className="block font-bold text-slate-700">{u.role}</span><span className="text-xs text-slate-500">{u.department}</span></td>
                     <td className="px-6 py-4">{u.googleLinked ? <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded w-fit text-xs font-bold border border-green-100"><Globe size={12} /> Google Linked</div> : <div className="text-slate-400 text-xs">未綁定</div>}</td>
                     <td className="px-6 py-4 text-xs text-slate-500">
                        {u.securitySettings?.isTimeRestricted && <div className="flex items-center gap-1 text-orange-600 mb-1"><Clock size={12} /> {u.securitySettings.accessTimeStart}-{u.securitySettings.accessTimeEnd}</div>}
                        {u.securitySettings?.allowedIps && u.securitySettings.allowedIps.length > 0 && <div className="flex items-center gap-1 text-blue-600" title={u.securitySettings.allowedIps.join(', ')}><Lock size={12} /> IP 限制 ({u.securitySettings.allowedIps.length})</div>}
                        {!u.securitySettings?.isTimeRestricted && (!u.securitySettings?.allowedIps || u.securitySettings.allowedIps.length === 0) && <span className="text-slate-400">無限制</span>}
                     </td>
                     <td className="px-6 py-4">
                        <span className={clsx("px-2 py-1 rounded text-xs font-bold", u.status === 'Active' ? "bg-green-100 text-green-700" : u.status === 'Pending' ? "bg-orange-100 text-orange-700 animate-pulse" : "bg-slate-100 text-slate-500")}>
                           {u.status === 'Active' ? '啟用中' : u.status === 'Pending' ? '待審核' : '已停用'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        {u.status === 'Pending' ? (
                           <div className="flex justify-end gap-2">
                              <button onClick={() => handleApprove(u.id)} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition" title="通過審核"><UserCheck size={18}/></button>
                              <button onClick={() => handleReject(u.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition" title="拒絕"><UserX size={18}/></button>
                              <button onClick={() => handleEdit(u)} className="p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-lg transition" title="編輯詳情"><Edit2 size={18}/></button>
                           </div>
                        ) : (
                           <button onClick={() => handleEdit(u)} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition font-bold text-xs">權限/安全</button>
                        )}
                     </td>
                  </tr>
               ))}
               {filteredUsers.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">沒有符合篩選條件的使用者</td></tr>}
            </tbody>
         </table>
      </div>
      {editingUser && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
               <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white shrink-0"><h3 className="font-bold text-lg flex items-center gap-2"><Users size={20} className="text-blue-400" /> 編輯人員與安全設定</h3><button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white"><X size={24}/></button></div>
               <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                  {editingUser.status === 'Pending' && (
                     <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="text-orange-600 mt-0.5" size={20}/>
                        <div>
                           <h4 className="font-bold text-orange-800">此帳號目前為「待審核」狀態</h4>
                           <p className="text-sm text-orange-700 mt-1">請確認該人員的身份、部門與權限設定是否正確，確認無誤後請於列表點擊「通過」按鈕。</p>
                        </div>
                     </div>
                  )}
                  <div className="flex items-start gap-6 pb-6 border-b border-slate-100">
                     <div className="relative group cursor-pointer"><img src={editingUser.avatarUrl} className="w-20 h-20 rounded-full border-4 border-slate-100" /><div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Camera size={24} className="text-white" /></div></div>
                     <div className="flex-1"><h4 className="text-xl font-bold text-slate-800">{editingUser.name}</h4><p className="text-slate-500 text-sm mb-3">{editingUser.email}</p><div className="flex items-center gap-3">{editingUser.googleLinked ? <button className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold"><CheckCircle size={14} /> 已連結 Google 帳號</button> : <button className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-bold transition"><Globe size={14} /> 連結 Google 帳號</button>}</div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-xs font-bold text-slate-500 mb-1">系統角色 (Role)</label><select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white" value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}><option value="System Admin">System Admin (最高權限)</option><option value="Manager">Manager (經理)</option><option value="Editor">Editor (編輯者)</option><option value="Viewer">Viewer (檢視者)</option></select></div>
                     <div><label className="block text-xs font-bold text-slate-500 mb-1">所屬部門</label><select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white" value={editingUser.department} onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}>{MOCK_DEPARTMENTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100"><h4 className="font-bold text-orange-800 text-sm mb-4 flex items-center gap-2"><Lock size={16} className="text-orange-500"/> 安全存取設定 (Security)</h4><div className="space-y-4"><div><label className="block text-xs font-bold text-slate-600 mb-1">IP 限制 (白名單)</label><textarea className="w-full border border-slate-300 rounded p-2 text-sm h-16 resize-none placeholder-slate-400 text-slate-700 font-mono" placeholder="例如: 192.168.1.1, 203.145.2.1 (留空代表不限制)" value={editingUser.securitySettings?.allowedIps?.join(', ') || ''} onChange={(e) => updateSecurity('allowedIps', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}/><p className="text-[10px] text-slate-500 mt-1">請使用逗號分隔多個 IP 位址。</p></div><div className="flex items-center gap-4"><div className="flex items-center gap-2"><input type="checkbox" id="timeRestrict" className="rounded text-orange-600 focus:ring-orange-500" checked={editingUser.securitySettings?.isTimeRestricted || false} onChange={(e) => updateSecurity('isTimeRestricted', e.target.checked)}/><label htmlFor="timeRestrict" className="text-sm font-bold text-slate-700 cursor-pointer">啟用時段限制</label></div><div className={clsx("flex items-center gap-2", !editingUser.securitySettings?.isTimeRestricted && "opacity-50 pointer-events-none")}><input type="time" className="border border-slate-300 rounded p-1 text-sm" value={editingUser.securitySettings?.accessTimeStart || '09:00'} onChange={(e) => updateSecurity('accessTimeStart', e.target.value)}/><span className="text-slate-400">至</span><input type="time" className="border border-slate-300 rounded p-1 text-sm" value={editingUser.securitySettings?.accessTimeEnd || '18:00'} onChange={(e) => updateSecurity('accessTimeEnd', e.target.value)}/></div></div></div></div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200"><h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><Shield size={16} className="text-slate-500"/> 功能權限設定</h4><div className="grid grid-cols-2 gap-6"><div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">前台資源導覽</p><div className="space-y-2"><PermissionToggle label="戰情室 (War Room)" checked={editingUser.permissions.viewWarRoom} onChange={() => togglePermission('viewWarRoom')} /><PermissionToggle label="廠商名錄 (Vendors)" checked={editingUser.permissions.viewVendors} onChange={() => togglePermission('viewVendors')} /><PermissionToggle label="日常任務 (Tasks)" checked={editingUser.permissions.viewTasks} onChange={() => togglePermission('viewTasks')} /><PermissionToggle label="通訊中心 (Comm Hub)" checked={editingUser.permissions.viewCommunication} onChange={() => togglePermission('viewCommunication')} /></div></div><div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">管理中心與操作</p><div className="space-y-2"><PermissionToggle label="支付紀錄 (Payments)" checked={editingUser.permissions.viewPayments} onChange={() => togglePermission('viewPayments')} /><PermissionToggle label="知識庫 (Knowledge)" checked={editingUser.permissions.viewKnowledge} onChange={() => togglePermission('viewKnowledge')} /><PermissionToggle label="系統公告 (Announcements)" checked={editingUser.permissions.viewAnnouncements} onChange={() => togglePermission('viewAnnouncements')} /><PermissionToggle label="進入系統管理 (Admin Panel)" checked={editingUser.permissions.accessAdminPanel} onChange={() => togglePermission('accessAdminPanel')} isDangerous /><hr className="border-slate-200 my-2"/><PermissionToggle label="新增廠商" checked={editingUser.permissions.canAddVendors} onChange={() => togglePermission('canAddVendors')} /><PermissionToggle label="編輯廠商詳情" checked={editingUser.permissions.canEditVendors} onChange={() => togglePermission('canEditVendors')} /><PermissionToggle label="刪除廠商資料" checked={editingUser.permissions.canDeleteVendors} onChange={() => togglePermission('canDeleteVendors')} isDangerous /></div></div></div></div>
               </div>
               <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0"><button onClick={() => setEditingUser(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-sm">取消</button><button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md">儲存設定</button></div>
            </div>
         </div>
      )}
    </div>
  );
};

const CategoryManagement: React.FC<{ currentUser: AdminUser }> = ({ currentUser }) => {
  const [categories, setCategories] = useState<string[]>(CATEGORY_OPTIONS);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempEditValue, setTempEditValue] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const categoryUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    MOCK_VENDORS.forEach(v => v.categories.forEach(c => counts[c] = (counts[c] || 0) + 1));
    return counts;
  }, []);

  const handleAdd = () => { if (newCategory.trim() && !categories.includes(newCategory.trim())) { setCategories([...categories, newCategory.trim()]); setNewCategory(''); } };
  const startEditing = (cat: string) => { setEditingCategory(cat); setTempEditValue(cat); };
  const cancelEditing = () => { setEditingCategory(null); setTempEditValue(''); };
  const saveRename = (oldName: string) => { const newName = tempEditValue.trim(); if (newName && newName !== oldName && !categories.includes(newName)) { setCategories(categories.map(c => c === oldName ? newName : c)); cancelEditing(); } };
  const handleDelete = (cat: string) => { if (currentUser.role !== 'System Admin' || categoryUsage[cat] > 0) return; if (window.confirm(`確定要刪除「${cat}」嗎？`)) setCategories(categories.filter(c => c !== cat)); };

  const displayedCategories = categories.filter(c => c.includes(searchFilter));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-6">
             <div className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-4"><FolderOpen size={20} className="text-blue-600" /><h3>新增服務類別</h3></div>
             <div className="space-y-4"><div><label className="block text-sm font-bold text-slate-500 mb-1">類別名稱</label><input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="例如：園藝造景" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/></div><button onClick={handleAdd} disabled={!newCategory.trim()} className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-700 disabled:opacity-50 transition shadow-sm">確認新增</button></div>
          </div>
       </div>
       <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"><div><h3 className="font-bold text-slate-800 text-lg">現有類別列表 ({categories.length})</h3></div><div className="relative w-full sm:w-auto"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="搜尋類別..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)}/></div></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {displayedCategories.map(cat => {
                   const usage = categoryUsage[cat] || 0;
                   const isEditing = editingCategory === cat;
                   return (
                     <div key={cat} className={clsx("flex items-center justify-between p-3 rounded-lg border transition", isEditing ? "bg-blue-50 border-blue-300 ring-1 ring-blue-200" : "bg-white border-slate-100 hover:border-blue-200")}>
                        {isEditing ? (<div className="flex-1 flex gap-2 mr-2"><input autoFocus className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded bg-white focus:outline-none" value={tempEditValue} onChange={e => setTempEditValue(e.target.value)}/><button onClick={() => saveRename(cat)} className="text-green-600 hover:bg-green-100 p-1 rounded"><CheckCircle size={18}/></button><button onClick={cancelEditing} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X size={18}/></button></div>) : (<div className="flex items-center gap-2"><span className="text-sm font-bold text-slate-700">{cat}</span><span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-mono", usage > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400")}>{usage}</span></div>)}
                        {!isEditing && (<div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition"><button onClick={() => startEditing(cat)} className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition"><Edit2 size={14} /></button>{currentUser.role === 'System Admin' && (<button onClick={() => handleDelete(cat)} className={clsx("p-1.5 rounded transition", usage > 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-red-500 hover:bg-red-50")}><Trash2 size={14} /></button>)}</div>)}
                     </div>
                   );
                })}
             </div>
          </div>
       </div>
    </div>
  );
};

const TagManagement: React.FC = () => {
  const [tags, setTags] = useState<SystemTags>(MOCK_SYSTEM_TAGS);
  const [newTag, setNewTag] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof SystemTags>('contactTags');
  const categoryLabels: Record<keyof SystemTags, string> = { contactTags: '聯繫詳情標籤', serviceTags: '服務項目標籤', websiteTags: '網站/廠商標籤' };
  const handleAddTag = () => { if (newTag.trim() && !tags[activeCategory].includes(newTag.trim())) { setTags({ ...tags, [activeCategory]: [...tags[activeCategory], newTag.trim()] }); setNewTag(''); } };
  const handleDeleteTag = (tagToDelete: string) => { setTags({ ...tags, [activeCategory]: tags[activeCategory].filter(t => t !== tagToDelete) }); };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-fit"><h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Tags size={20} className="text-blue-600" /> 標籤類別</h3><div className="space-y-2">{(Object.keys(tags) as Array<keyof SystemTags>).map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={clsx("w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition flex justify-between items-center", activeCategory === cat ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}>{categoryLabels[cat]}<span className={clsx("text-xs px-2 py-0.5 rounded-full", activeCategory === cat ? "bg-slate-600" : "bg-slate-200")}>{tags[cat].length}</span></button>))}</div></div>
      <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6"><div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-800 text-lg">{categoryLabels[activeCategory]}</h3></div><div className="flex gap-2 mb-6"><input type="text" className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="輸入新標籤名稱..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}/><button onClick={handleAddTag} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition flex items-center gap-1"><Plus size={16} /> 新增</button></div><div className="flex flex-wrap gap-2">{tags[activeCategory].map(tag => (<span key={tag} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium flex items-center gap-2 group hover:bg-slate-200 transition">#{tag}<button onClick={() => handleDeleteTag(tag)} className="text-slate-400 hover:text-red-500"><X size={14} /></button></span>))}</div></div>
    </div>
  );
};

const AiModelTraining: React.FC = () => {
  const [rules, setRules] = useState<AiModelRule[]>(MOCK_MODEL_RULES);
  const [editingRule, setEditingRule] = useState<AiModelRule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalCategory, setModalCategory] = useState<'Search' | 'Response' | 'Filter'>('Search');
  const [modalWeight, setModalWeight] = useState<'Must' | 'Should' | 'Nice to have'>('Must');

  const handleAddRule = () => { if (newRule.trim()) { setRules([...rules, { id: `r${Date.now()}`, category: 'Search', rule: newRule, weight: 'Should', isActive: true }]); setNewRule(''); } };
  const handleSaveModal = () => { if (modalContent.trim()) { if (editingRule) { setRules(rules.map(r => r.id === editingRule.id ? { ...r, rule: modalContent, category: modalCategory, weight: modalWeight } : r)); } else { setRules([...rules, { id: `r${Date.now()}`, category: modalCategory, rule: modalContent, weight: modalWeight, isActive: true }]); } setShowEditModal(false); setEditingRule(null); setModalContent(''); } };
  const openEditModal = (rule?: AiModelRule) => { if (rule) { setEditingRule(rule); setModalContent(rule.rule); setModalCategory(rule.category); setModalWeight(rule.weight); } else { setEditingRule(null); setModalContent(''); setModalCategory('Search'); setModalWeight('Must'); } setShowEditModal(true); };
  const toggleRule = (id: string) => setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  const deleteRule = (id: string) => setRules(rules.filter(r => r.id !== id));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-8 text-white relative overflow-hidden shadow-lg"><Sparkles className="absolute top-4 right-4 text-white opacity-20" size={120} /><h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Bot size={28} /> AI 搜尋模型訓練</h2><p className="opacity-90 max-w-2xl">在此設定系統 AI 搜尋時的底層邏輯與優先順序。</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4"><div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"><div className="space-y-3">{rules.map(rule => (<div key={rule.id} className={clsx("p-4 rounded-lg border transition-all group", rule.isActive ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60")}><div className="flex justify-between items-start gap-4"><div className="flex-1 cursor-pointer" onClick={() => openEditModal(rule)}><div className="flex items-center gap-2 mb-2"><span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{rule.category}</span><span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{rule.weight}</span></div><p className="text-slate-700 font-medium line-clamp-2">{rule.rule}</p></div><div className="flex items-center gap-2"><button onClick={() => openEditModal(rule)}><Edit2 size={18} className="text-slate-400 hover:text-blue-600"/></button><button onClick={() => toggleRule(rule.id)}>{rule.isActive ? <ToggleRight size={24} className="text-blue-600"/> : <ToggleLeft size={24} className="text-slate-400"/>}</button><button onClick={() => deleteRule(rule.id)}><Trash2 size={18} className="text-slate-300 hover:text-red-500"/></button></div></div></div>))}</div></div></div>
        <div className="space-y-4"><div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-6"><h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18} className="text-blue-600" /> 快速新增</h3><div className="space-y-4"><textarea className="w-full border border-slate-200 rounded-lg p-3 text-sm h-32 resize-none" placeholder="輸入規則..." value={newRule} onChange={(e) => setNewRule(e.target.value)}/><button onClick={handleAddRule} disabled={!newRule.trim()} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-bold">快速加入</button><button onClick={() => openEditModal()} className="w-full bg-purple-50 text-purple-700 border border-purple-200 py-2 rounded-lg font-bold flex items-center justify-center gap-2"><Maximize2 size={16} /> 開啟完整編輯器</button></div></div></div>
      </div>
      {showEditModal && (<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"><div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-lg text-slate-800">編輯規則</h3><button onClick={() => setShowEditModal(false)}><X size={24} /></button></div><div className="flex-1 overflow-y-auto p-6"><div className="grid grid-cols-2 gap-6 mb-6"><div><label className="block text-sm font-bold text-slate-600 mb-2">規則分類</label><select className="w-full border p-2.5 rounded-lg" value={modalCategory} onChange={(e) => setModalCategory(e.target.value as any)}><option value="Search">Search</option><option value="Response">Response</option><option value="Filter">Filter</option></select></div><div><label className="block text-sm font-bold text-slate-600 mb-2">權重</label><select className="w-full border p-2.5 rounded-lg" value={modalWeight} onChange={(e) => setModalWeight(e.target.value as any)}><option value="Must">Must</option><option value="Should">Should</option><option value="Nice to have">Nice to have</option></select></div></div><textarea className="w-full border border-slate-200 rounded-xl p-6 h-[400px] resize-none" value={modalContent} onChange={(e) => setModalContent(e.target.value)}/></div><div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3"><button onClick={() => setShowEditModal(false)} className="px-6 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-bold">取消</button><button onClick={handleSaveModal} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold">儲存變更</button></div></div></div>)}
    </div>
  );
};

const TutorialManagement: React.FC = () => {
  const [tutorials, setTutorials] = useState<TutorialTip[]>(MOCK_TUTORIALS);
  const [editingTip, setEditingTip] = useState<TutorialTip | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPrinciple, setEditPrinciple] = useState('');

  const toggleActive = (key: string) => setTutorials(tutorials.map(t => t.key === key ? { ...t, isActive: !t.isActive } : t));
  const handleOpenEdit = (tip: TutorialTip) => { setEditingTip(tip); setEditTitle(tip.title); setEditContent(tip.content); setEditPrinciple(tip.designPrinciple); };
  const handleSaveEdit = () => { if (editingTip) { setTutorials(tutorials.map(t => t.key === editingTip.key ? { ...t, title: editTitle, content: editContent, designPrinciple: editPrinciple } : t)); setEditingTip(null); } };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-6 flex items-start gap-4"><div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><BookOpen size={24} /></div><div><h3 className="font-bold text-slate-800 text-lg mb-1">使用教學與錯誤提示管理</h3><p className="text-slate-500 text-sm">設定系統在特定情境下顯示的引導文字。</p></div></div>
      <div className="space-y-4">{tutorials.map(tutorial => (<div key={tutorial.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 transition hover:shadow-md"><div className="flex justify-between items-start mb-4"><div className="flex items-center gap-3"><h4 className="text-xl font-bold text-slate-800">{tutorial.title}</h4><span className={clsx("text-xs px-2 py-1 rounded font-bold", tutorial.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>{tutorial.isActive ? '啟用中' : '已停用'}</span><span className="text-xs bg-slate-100 text-slate-400 px-2 py-1 rounded font-mono uppercase tracking-wider">{tutorial.key}</span></div><div className="flex items-center gap-3"><button onClick={() => handleOpenEdit(tutorial)} className="text-slate-300 hover:text-slate-600 transition"><Edit2 size={18} /></button><button onClick={() => toggleActive(tutorial.key)} className={clsx("transition", tutorial.isActive ? "text-green-500" : "text-slate-300")}><Power size={22} /></button></div></div><p className="text-slate-600 mb-6 text-base leading-relaxed pl-1">{tutorial.content}</p><div className="bg-slate-50 p-5 rounded-xl border border-slate-100"><span className="block font-bold text-slate-500 mb-2 text-xs">系統設計原則 (System Principle)：</span><p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">{tutorial.designPrinciple}</p></div></div>))}</div>
      {editingTip && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"><div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Edit2 size={20} className="text-orange-600" /> 編輯教學提示</h3><button onClick={() => setEditingTip(null)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button></div><div className="p-6 space-y-4"><div><label className="block text-sm font-bold text-slate-600 mb-1">標題</label><input className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={editTitle} onChange={e => setEditTitle(e.target.value)}/></div><div><label className="block text-sm font-bold text-slate-600 mb-1">內容</label><textarea className="w-full border border-slate-200 rounded-lg p-2 text-sm h-24 resize-none" value={editContent} onChange={e => setEditContent(e.target.value)}/></div><div><label className="block text-sm font-bold text-slate-600 mb-1">設計原則</label><textarea className="w-full border border-slate-200 rounded-lg p-2 text-sm h-32 resize-none bg-slate-50" value={editPrinciple} onChange={e => setEditPrinciple(e.target.value)}/></div></div><div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3"><button onClick={() => setEditingTip(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium text-sm">取消</button><button onClick={handleSaveEdit} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 shadow-sm">儲存變更</button></div></div></div>)}
    </div>
  );
};

const SystemSettings: React.FC = () => {
  const [timezone, setTimezone] = useState('Asia/Taipei');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"><div className="flex items-center gap-3 text-slate-800"><div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Globe size={24} /></div><div><h3 className="font-bold text-lg">系統時區 (Timezone)</h3><p className="text-xs text-slate-500">影響所有時間戳記顯示</p></div></div><select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full md:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"><option value="Asia/Taipei">Asia/Taipei (GMT+8)</option><option value="Asia/Shanghai">Asia/Shanghai (GMT+8)</option><option value="UTC">UTC (GMT+0)</option></select></div>
      
      {/* Placeholder for other settings */}
      <div className="bg-slate-50 rounded-3xl p-8 border border-dashed border-slate-200 text-center text-slate-400">
         <Settings size={48} className="mx-auto mb-4 opacity-20" />
         <p>更多系統全域設定開發中...</p>
         <p className="text-sm mt-2">公告管理已移至「系統公告」頁面</p>
      </div>
    </div>
  );
};

// --- Main Admin Component ---

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  if (!CURRENT_ADMIN_USER.permissions.accessAdminPanel) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center text-slate-500">
         <Shield size={64} className="text-red-200 mb-4" />
         <h2 className="text-xl font-bold text-slate-800">存取被拒 (Access Denied)</h2>
         <p className="mt-2">您沒有權限存取此管理介面。請聯繫系統管理員。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-slate-800 text-white rounded-xl">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">系統管理</h1>
          <p className="text-slate-500 text-sm">全域設定、人員權限與系統日誌</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        {[
          { id: 'dashboard', label: '統計儀表板', icon: <Activity size={18} /> },
          { id: 'logs', label: '日誌中心', icon: <FileText size={18} /> },
          { id: 'categories', label: '類別管理', icon: <Layers size={18} /> },
          { id: 'tags', label: '標籤管理', icon: <Tags size={18} /> },
          { id: 'tutorials', label: '使用教學', icon: <BookOpen size={18} /> }, 
          { id: 'ai', label: 'AI 模型設定', icon: <Bot size={18} /> },
          { id: 'users', label: '人員權限', icon: <Users size={18} /> },
          { id: 'departments', label: '部門清單', icon: <Building size={18} /> },
          { id: 'settings', label: '系統設定', icon: <Settings size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={clsx(
              "flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative whitespace-nowrap",
              activeTab === tab.id ? "text-slate-800" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-800" />}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'logs' && <LogCenter />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'departments' && <DepartmentManagement />}
        {activeTab === 'ai' && <AiModelTraining />}
        {activeTab === 'tags' && <TagManagement />}
        {activeTab === 'categories' && <CategoryManagement currentUser={CURRENT_ADMIN_USER} />}
        {activeTab === 'tutorials' && <TutorialManagement />}
        {activeTab === 'settings' && <SystemSettings />}
      </div>
    </div>
  );
};

// Fixed: Added default export for lazy loading compatibility
export default Admin;
