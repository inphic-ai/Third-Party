
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { MOCK_VENDORS, MOCK_KNOWLEDGE_BASE } from './constants';
import { TransactionStatus } from './types';
import { 
  Trophy, 
  Phone, 
  LayoutGrid, 
  Wallet, 
  AlertCircle,
  Briefcase,
  MousePointerClick,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

export const WarRoom: React.FC = () => {
  // --- Data Calculations ---

  // 1. Financials: Total Estimated vs Pending
  const financialStats = useMemo(() => {
    let totalApproved = 0;
    let totalPaid = 0;
    MOCK_VENDORS.forEach(v => {
      v.transactions.forEach(t => {
        if (t.status === TransactionStatus.APPROVED) totalApproved += t.amount;
        if (t.status === TransactionStatus.PAID) totalPaid += t.amount;
      });
    });
    return { totalApproved, totalPaid };
  }, []);

  // 2. Conversion Analytics: Phone Views vs Logs
  const phoneConversionData = useMemo(() => {
    return MOCK_VENDORS.map(v => ({
      name: v.name,
      views: v.phoneViewCount || 0,
      logs: v.contactLogs.length,
      conversion: (v.phoneViewCount ? (v.contactLogs.length / v.phoneViewCount) * 100 : 0).toFixed(1)
    })).sort((a, b) => b.views - a.views).slice(0, 5); // Top 5 viewed vendors
  }, []);

  // 3. Conversion Analytics: Booking Clicks vs Actual Reservations
  const bookingConversionData = useMemo(() => {
    return MOCK_VENDORS.map(v => ({
      name: v.name,
      clicks: v.bookingClickCount || 0,
      reservations: v.contactLogs.filter(l => l.isReservation).length,
      conversion: (v.bookingClickCount ? (v.contactLogs.filter(l => l.isReservation).length / v.bookingClickCount) * 100 : 0).toFixed(1)
    })).filter(d => d.clicks > 0).sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  }, []);

  // 4. Anomalies: High Phone Views but Low Logs (Potential Bypass)
  const anomalies = useMemo(() => {
    return MOCK_VENDORS.filter(v => 
      (v.phoneViewCount || 0) > 5 && v.contactLogs.length === 0
    ).map(v => ({
      id: v.id,
      name: v.name,
      views: v.phoneViewCount,
      missed: v.missedContactLogCount
    }));
  }, []);

  // 5. Knowledge Base Count
  const kbCount = MOCK_KNOWLEDGE_BASE.length;

  // Reusable Card Component
  const StatCard = ({ title, value, subtext, icon, colorClass, linkTo, trend }: any) => (
    <Link to={linkTo} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition group flex flex-col justify-between h-full relative overflow-hidden">
       <div className="flex justify-between items-start mb-4">
          <div className={clsx("p-3 rounded-xl", colorClass)}>
             {icon}
          </div>
          {trend && (
             <div className={clsx("flex items-center text-xs font-bold px-2 py-1 rounded-full", trend === 'up' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                {trend === 'up' ? <ArrowUpRight size={14} className="mr-1"/> : <ArrowDownRight size={14} className="mr-1"/>}
                {trend === 'up' ? '+12%' : '-5%'}
             </div>
          )}
       </div>
       <div>
          <h3 className="text-3xl font-extrabold text-slate-800 mb-1 tracking-tight">{value}</h3>
          <p className="text-sm font-bold text-slate-500 mb-1">{title}</p>
          <p className="text-xs text-slate-400 group-hover:text-blue-600 transition">{subtext}</p>
       </div>
    </Link>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">戰略指揮中心 (War Room)</h1>
        <p className="text-slate-500 text-sm mt-1">即時監控營運效率、轉化率與異常指標</p>
      </div>

      {/* Top Row: Strategic KPI Cards (5 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard 
           title="活躍合作夥伴" 
           value={MOCK_VENDORS.filter(v => !v.isBlacklisted).length} 
           subtext="前往名錄清單" 
           icon={<LayoutGrid size={24} />} 
           colorClass="bg-blue-100 text-blue-600"
           linkTo="/vendors"
           trend="up"
        />
        <StatCard 
           title="待撥款金額" 
           value={`$${(financialStats.totalApproved / 1000).toFixed(1)}k`} 
           subtext="前往支付中心" 
           icon={<Wallet size={24} />} 
           colorClass="bg-green-100 text-green-600"
           linkTo="/payments"
        />
        <StatCard 
           title="今日任務總數" 
           value="8" 
           subtext="前往日程表" 
           icon={<Briefcase size={24} />} 
           colorClass="bg-purple-100 text-purple-600"
           linkTo="/tasks"
        />
        <StatCard 
           title="知識庫數量" 
           value={kbCount} 
           subtext="查看 QA 列表" 
           icon={<BookOpen size={24} />} 
           colorClass="bg-indigo-100 text-indigo-600"
           linkTo="/knowledge"
           trend="up"
        />
        <StatCard 
           title="異常行為監控" 
           value={anomalies.length} 
           subtext="查看下方列表" 
           icon={<AlertCircle size={24} />} 
           colorClass="bg-orange-100 text-orange-600"
           linkTo="#anomalies" // Links to the anchor on the same page
           trend="down"
        />
      </div>

      {/* Middle Row: Conversion Analytics (The Core Request) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Chart 1: Contact Compliance (Phone Views vs Logs) */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     <Phone size={20} className="text-blue-500" /> 電話轉化與合規率
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">監控是否「查看了電話卻未填寫紀錄」</p>
               </div>
               <Link to="/vendors" className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition flex items-center gap-1">
                  查看完整清單 <ArrowRight size={12}/>
               </Link>
            </div>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={phoneConversionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} interval={0} />
                     <YAxis hide />
                     <Bar dataKey="views" fill="#e2e8f0" radius={[4, 4, 4, 4]} barSize={30} />
                     <Bar dataKey="logs" fill="#3b82f6" radius={[4, 4, 4, 4]} barSize={30} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Chart 2: Booking Funnel (Clicks vs Actual Reservations) */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     <MousePointerClick size={20} className="text-orange-500" /> 預約意圖轉化率
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">監控「點擊立即預約」後是否真實建立行程</p>
               </div>
               <Link to="/vendors" className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition flex items-center gap-1">
                  查看完整清單 <ArrowRight size={12}/>
               </Link>
            </div>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingConversionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} interval={0} />
                     <YAxis hide />
                     <Bar dataKey="clicks" fill="#e2e8f0" radius={[4, 4, 4, 4]} barSize={30} />
                     <Bar dataKey="reservations" fill="#f97316" radius={[4, 4, 4, 4]} barSize={30} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Bottom Row: Detailed Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Anomalies List - Added ID for Anchor Link */}
         <div id="anomalies" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col scroll-mt-20">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <AlertCircle size={20} className="text-red-500" /> 潛在異常關注清單
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 max-h-[300px]">
               {anomalies.length > 0 ? anomalies.map(item => (
                  <div key={item.id} className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
                     <div>
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="text-xs text-red-600 mt-1">查看電話 {item.views} 次 / 0 紀錄</div>
                     </div>
                     <Link to={`/vendors/${item.id}`} className="px-3 py-1.5 bg-white text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition">
                        稽核
                     </Link>
                  </div>
               )) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                     <CheckCircle size={32} className="mb-2 text-green-500 opacity-50" />
                     <p>目前無異常資料</p>
                  </div>
               )}
            </div>
         </div>

         {/* Top Rated Vendors (Retention) */}
         <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Trophy size={20} className="text-yellow-500" /> 優質合作夥伴 (評分 Top 5)
            </h3>
            <div className="flex-1 overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold">
                     <tr>
                        <th className="px-4 py-3 rounded-l-lg">廠商名稱</th>
                        <th className="px-4 py-3">累計工單</th>
                        <th className="px-4 py-3">平均評分</th>
                        <th className="px-4 py-3">預約/詢問比</th>
                        <th className="px-4 py-3 rounded-r-lg text-right">操作</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {MOCK_VENDORS.sort((a, b) => b.rating - a.rating).slice(0, 5).map(v => {
                        const ratio = v.bookingClickCount > 0 ? Math.round((v.contactLogs.filter(l => l.isReservation).length / v.bookingClickCount) * 100) : 0;
                        return (
                           <tr key={v.id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3 font-bold text-slate-700 flex items-center gap-2">
                                 <img src={v.avatarUrl} className="w-6 h-6 rounded-full" />
                                 {v.name}
                              </td>
                              <td className="px-4 py-3 text-slate-500">{v.transactions.length} 筆</td>
                              <td className="px-4 py-3 font-bold text-yellow-600">{v.rating} ⭐</td>
                              <td className="px-4 py-3">
                                 <div className="w-full bg-slate-100 rounded-full h-1.5 w-24">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(ratio, 100)}%` }}></div>
                                 </div>
                                 <span className="text-[10px] text-slate-400">{ratio}%</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                 <Link to={`/vendors/${v.id}`} className="text-blue-600 hover:underline text-xs font-bold">詳情</Link>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
};
