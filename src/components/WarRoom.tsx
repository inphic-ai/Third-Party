
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { MOCK_VENDORS } from '../constants';
import { TransactionStatus, ServiceType, Region } from '../types';
import { 
  Trophy, Phone, TrendingUp, LayoutGrid, Wallet, Activity, AlertCircle,
  Briefcase, MousePointerClick, FileText, CalendarCheck, ArrowUpRight,
  ArrowDownRight, CheckCircle, ShieldAlert, Zap, Globe, Package, Hammer, Factory, Bot, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

export const WarRoom: React.FC = () => {
  // --- 核心數據計算 ---

  // 1. 財務指標：已結案 vs 待撥款
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

  // 2. 身分結構分析 (Service Type Mix)
  const identityMixData = useMemo(() => {
    const counts = { [ServiceType.LABOR]: 0, [ServiceType.PRODUCT]: 0, [ServiceType.MANUFACTURING]: 0 };
    MOCK_VENDORS.forEach(v => {
      v.serviceTypes.forEach(type => {
        counts[type] = (counts[type] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  // 3. 區域績效對比 (TW vs CN)
  const regionalPerformance = useMemo(() => {
    const stats = {
      [Region.TAIWAN]: { count: 0, avgRating: 0, totalTx: 0 },
      [Region.CHINA]: { count: 0, avgRating: 0, totalTx: 0 }
    };
    MOCK_VENDORS.forEach(v => {
      stats[v.region].count++;
      stats[v.region].avgRating += v.rating;
      stats[v.region].totalTx += v.transactions.length;
    });
    return Object.entries(stats).map(([region, data]) => ({
      region,
      avgRating: (data.avgRating / data.count).toFixed(1),
      txCount: data.totalTx,
      vendorCount: data.count
    }));
  }, []);

  // 4. 風險指標
  const riskMetrics = useMemo(() => {
    const blacklisted = MOCK_VENDORS.filter(v => v.isBlacklisted).length;
    const lowRating = MOCK_VENDORS.filter(v => v.rating < 3.5).length;
    const dormant = MOCK_VENDORS.filter(v => v.transactions.length === 0).length;
    return { blacklisted, lowRating, dormant };
  }, []);

  const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'];

  // Reusable Stat Component
  const StatCard = ({ title, value, subtext, icon, colorClass, trend, trendValue }: any) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group relative overflow-hidden">
       <div className="flex justify-between items-start mb-4">
          <div className={clsx("p-3 rounded-2xl", colorClass)}>
             {icon}
          </div>
          {trend && (
             <div className={clsx("flex items-center text-[10px] font-black px-2 py-1 rounded-lg", trend === 'up' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                {trend === 'up' ? <ArrowUpRight size={14} className="mr-1"/> : <ArrowDownRight size={14} className="mr-1"/>}
                {trendValue}
             </div>
          )}
       </div>
       <div className="relative z-10">
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">{value}</h3>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">{subtext}</p>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">戰略統計儀表板</h1>
          <p className="text-slate-500 font-medium mt-1">即時分析供應鏈健康度、區域績效與合作風險</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 text-xs font-black text-slate-600 shadow-sm flex items-center gap-2">
              <Globe size={14} className="text-blue-500"/> DATA SOURCE: GLOBAL
           </div>
           <button className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition shadow-lg">
              <Zap size={20} fill="currentColor" />
           </button>
        </div>
      </div>

      {/* 第一排：核心戰略 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
           title="活躍協作廠商" 
           value={MOCK_VENDORS.filter(v => !v.isBlacklisted).length} 
           subtext="本季度淨增長 4 家" 
           icon={<LayoutGrid size={24} />} 
           colorClass="bg-blue-50 text-blue-600"
           trend="up"
           trendValue="+8%"
        />
        <StatCard 
           title="已核准待撥款" 
           value={`$${(financialStats.totalApproved / 1000).toFixed(1)}k`} 
           subtext="款項已進入出納流程" 
           icon={<Wallet size={24} />} 
           colorClass="bg-green-50 text-green-600"
           trend="up"
           trendValue="+12%"
        />
        <StatCard 
           title="廠商平均評分" 
           value="4.3" 
           subtext="目標維持在 4.0 以上" 
           icon={<Trophy size={24} />} 
           colorClass="bg-yellow-50 text-yellow-600"
        />
        <StatCard 
           title="風險關注對象" 
           value={riskMetrics.blacklisted + riskMetrics.lowRating} 
           subtext="包含黑名單與低分廠商" 
           icon={<ShieldAlert size={24} />} 
           colorClass="bg-red-50 text-red-600"
           trend="down"
           trendValue="-2%"
        />
      </div>

      {/* 第二排：結構分析與 AI 洞察 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* 身分識別結構 */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
               <Package size={20} className="text-indigo-500" /> 供應鏈身分結構
            </h3>
            <div className="flex-1 min-h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={identityMixData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {identityMixData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                     />
                     <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
               <div className="p-2 bg-slate-50 rounded-2xl">
                  <div className="text-xs font-black text-slate-400 mb-1">勞務</div>
                  <div className="text-sm font-bold text-blue-600">62%</div>
               </div>
               <div className="p-2 bg-slate-50 rounded-2xl">
                  <div className="text-xs font-black text-slate-400 mb-1">商品</div>
                  <div className="text-sm font-bold text-orange-600">28%</div>
               </div>
               <div className="p-2 bg-slate-50 rounded-2xl">
                  <div className="text-xs font-black text-slate-400 mb-1">製造</div>
                  <div className="text-sm font-bold text-purple-600">10%</div>
               </div>
            </div>
         </div>

         {/* 區域績效對比 */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
               <Globe size={20} className="text-blue-500" /> 區域績效矩陣
            </h3>
            <div className="space-y-6 flex-1">
               {regionalPerformance.map(perf => (
                  <div key={perf.region} className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                     <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-black text-slate-700 flex items-center gap-2">
                           {perf.region === Region.TAIWAN ? '🇹🇼 台灣地區' : '🇨🇳 大陸地區'}
                           <span className="px-2 py-0.5 bg-white rounded-lg text-[10px] font-bold text-slate-400">{perf.vendorCount} 家</span>
                        </span>
                        <span className="text-sm font-black text-yellow-600">{perf.avgRating} ★</span>
                     </div>
                     <div className="flex items-end justify-between">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">合作頻次 (Transactions)</p>
                           <p className="text-xl font-black text-slate-800">{perf.txCount} 筆</p>
                        </div>
                        <div className="h-10 w-24 bg-white rounded-xl flex items-center justify-center border border-slate-100">
                           <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${(perf.txCount / 10) * 100}%` }}></div>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* AI 戰略戰術建議 */}
         <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200 flex flex-col relative overflow-hidden">
            <div className="relative z-10 flex-1 flex flex-col">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                     <div className="p-2 bg-indigo-500 rounded-lg"><Bot size={20} /></div>
                     <span className="text-sm font-black uppercase tracking-widest text-indigo-300">AI Strategic Insight</span>
                  </div>
                  <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full font-bold">MODEL: GEMINI 3</span>
               </div>
               <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                     <h4 className="text-sm font-black text-white flex items-center gap-2"><Sparkles size={14} className="text-yellow-400" /> 核心觀察結論</h4>
                     <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        大陸地區廠商雖然評分略低，但「製造」與「物流」類別的回應速度較 2023 年提升了 <span className="text-indigo-400 font-bold">15%</span>。目前的供應鏈身分結構過度偏向「勞務」，建議開發更多具備「自有產能」的大陸製造商。
                     </p>
                  </div>
                  <div className="space-y-2">
                     <h4 className="text-sm font-black text-white flex items-center gap-2"><Zap size={14} className="text-blue-400" /> 戰術行動建議</h4>
                     <ul className="text-xs text-slate-400 space-y-2 font-medium">
                        <li className="flex gap-2">
                           <span className="text-indigo-400">01</span>
                           針對評分低於 3.5 的 3 家大陸物流商啟動「季度績效面談」。
                        </li>
                        <li className="flex gap-2">
                           <span className="text-indigo-400">02</span>
                           在台灣地區尋求具備「夜間施工」能力的備援水電廠商。
                        </li>
                     </ul>
                  </div>
               </div>
               <button className="mt-8 w-full py-3 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition">
                  Export Tactical Report
               </button>
            </div>
            <Activity size={180} className="absolute -bottom-10 -right-10 text-white opacity-[0.03]" />
         </div>
      </div>

      {/* 第三排：詳細列表 (風險與 Top 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* 風險預警與異常監控 */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
               <ShieldAlert size={20} className="text-red-500" /> 供應鏈風險監控看板
            </h3>
            <div className="space-y-4 flex-1">
               {MOCK_VENDORS.filter(v => v.isBlacklisted || v.rating < 3.5).map(v => (
                  <div key={v.id} className="flex items-center justify-between p-4 bg-red-50/50 rounded-3xl border border-red-100">
                     <div className="flex items-center gap-4">
                        <img src={v.avatarUrl} className="w-10 h-10 rounded-2xl grayscale" />
                        <div>
                           <div className="font-black text-slate-800 text-sm">{v.name}</div>
                           <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                              {v.isBlacklisted ? 'Blacklisted' : `Low Rating: ${v.rating}`}
                           </div>
                        </div>
                     </div>
                     <Link to={`/vendors/${v.id}`} className="px-4 py-2 bg-white text-slate-900 text-[10px] font-black rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                        AUDIT
                     </Link>
                  </div>
               ))}
               <div className="p-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold">
                  <Phone size={14} /> 聯繫逾期監控中 (目前無異常)
               </div>
            </div>
         </div>

         {/* 優質合作夥伴排行 (Retention) */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
               <TrendingUp size={20} className="text-green-500" /> 核心合作商影響力排行
            </h3>
            <div className="flex-1 overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] border-b border-slate-50">
                     <tr>
                        <th className="pb-4 pr-4">Vendor Partner</th>
                        <th className="pb-4 px-4 text-center">Identity</th>
                        <th className="pb-4 px-4 text-center">Score</th>
                        <th className="pb-4 text-right">Activity</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {MOCK_VENDORS.sort((a, b) => b.rating - a.rating).slice(0, 4).map(v => (
                        <tr key={v.id} className="group transition-colors">
                           <td className="py-4 pr-4">
                              <div className="flex items-center gap-3">
                                 <img src={v.avatarUrl} className="w-8 h-8 rounded-xl shadow-sm" />
                                 <div className="font-bold text-slate-700 truncate max-w-[150px]">{v.name}</div>
                              </div>
                           </td>
                           <td className="py-4 px-4 text-center">
                              <div className="flex justify-center">
                                 <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500" title={v.serviceTypes[0]}>
                                    {v.serviceTypes[0] === ServiceType.LABOR ? <Hammer size={14}/> : v.serviceTypes[0] === ServiceType.PRODUCT ? <Package size={14}/> : <Factory size={14}/>}
                                 </div>
                              </div>
                           </td>
                           <td className="py-4 px-4 text-center">
                              <span className="font-black text-slate-900">{v.rating}</span>
                           </td>
                           <td className="py-4 text-right">
                              <Link to={`/vendors/${v.id}`} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">Detail Entry</Link>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
};
