
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend, 
  ComposedChart, StackedBar
} from 'recharts';
import { MOCK_MAINTENANCE, MOCK_INVOICES, MOCK_VENDORS, MOCK_ANNOUNCEMENTS } from '../constants';
import { MaintenanceStatus, PaymentStatus, ServiceType, Region } from '../types';
import { 
  Activity, AlertCircle, ArrowUpRight, ArrowRight, Zap, Globe, 
  Bot, Sparkles, Wrench, Receipt, Coins, HandCoins, ShieldAlert,
  ChevronRight, TrendingUp, LayoutGrid, CheckCircle, Megaphone,
  Hammer, Package, Factory, Info
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

export const WarRoom: React.FC = () => {
  const navigate = useNavigate();

  // --- 數據計算 ---
  const invoiceStats = useMemo(() => {
    const totals = {
      [PaymentStatus.PAID]: 0,
      [PaymentStatus.BILLED]: 0,
      [PaymentStatus.PENDING]: 0,
    };
    MOCK_INVOICES.forEach(inv => {
      totals[inv.status] += inv.amount;
    });
    return totals;
  }, []);

  // 計算身分佈局數據
  const identityRegionalData = useMemo(() => {
    const tw = { name: '台灣', [ServiceType.LABOR]: 0, [ServiceType.PRODUCT]: 0, [ServiceType.MANUFACTURING]: 0 };
    const cn = { name: '大陸', [ServiceType.LABOR]: 0, [ServiceType.PRODUCT]: 0, [ServiceType.MANUFACTURING]: 0 };
    
    MOCK_VENDORS.forEach(v => {
      const target = v.region === Region.TAIWAN ? tw : cn;
      v.serviceTypes.forEach(st => {
        target[st]++;
      });
    });
    return [tw, cn];
  }, []);

  const maintenanceStats = useMemo(() => {
    const counts = {
      total: MOCK_MAINTENANCE.length,
      completed: MOCK_MAINTENANCE.filter(m => m.status === MaintenanceStatus.COMPLETED || m.status === MaintenanceStatus.ARCHIVED).length,
      pending: MOCK_MAINTENANCE.filter(m => m.status === MaintenanceStatus.PENDING || m.status === MaintenanceStatus.IN_PROGRESS).length,
    };
    const statusData = [
      { name: '已完工', value: counts.completed, color: '#10b981' },
      { name: '處理中', value: counts.pending, color: '#6366f1' }
    ];
    return { ...counts, statusData };
  }, []);

  const logicalAlerts = useMemo(() => {
    return MOCK_MAINTENANCE.filter(m => 
      (m.status === MaintenanceStatus.COMPLETED) && 
      !MOCK_INVOICES.some(inv => inv.vendorName === m.vendorName && inv.status !== PaymentStatus.PENDING)
    );
  }, []);

  // --- 通用卡片組件 ---
  const ActionableCard = ({ title, value, subtext, icon, colorClass, to, trend, trendValue }: any) => (
    <Link 
      to={to} 
      className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1 hover:border-indigo-200 transition-all group relative overflow-hidden"
    >
       <div className="flex justify-between items-start mb-4">
          <div className={clsx("p-3.5 rounded-2xl shadow-sm transition-colors group-hover:scale-110 duration-500", colorClass)}>
             {icon}
          </div>
          <div className="flex items-center gap-2">
             {trend && (
                <div className={clsx("flex items-center text-[10px] font-black px-2 py-1 rounded-lg", trend === 'up' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                   {trendValue}
                </div>
             )}
             <div className="p-2 bg-slate-50 text-slate-300 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <ArrowUpRight size={14} />
             </div>
          </div>
       </div>
       <div className="relative z-10">
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter mb-1 group-hover:text-indigo-600 transition-colors">{value}</h3>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">{subtext}</p>
       </div>
    </Link>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto px-2 sm:px-0">
      
      {/* 頂部即時情報捲軸 */}
      <div className="bg-slate-900 rounded-full py-2 px-6 flex items-center gap-4 overflow-hidden border border-slate-800 shadow-xl">
         <div className="flex items-center gap-2 text-amber-400 shrink-0">
            <Megaphone size={16} className="animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Briefing:</span>
         </div>
         <div className="flex-1 whitespace-nowrap overflow-hidden">
            <div className="inline-block animate-[marquee_30s_linear_infinite] text-slate-300 text-xs font-medium space-x-12">
               {MOCK_ANNOUNCEMENTS.map(a => (
                  <Link key={a.id} to="/announcements" className="hover:text-white transition-colors">
                     <span className={clsx("font-black mr-2", a.priority === 'High' ? "text-rose-400" : "text-blue-400")}>[{a.priority}]</span>
                     {a.title} — {a.content.slice(0, 40)}...
                  </Link>
               ))}
            </div>
         </div>
         <style>{`
            @keyframes marquee {
               0% { transform: translateX(100%); }
               100% { transform: translateX(-100%); }
            }
         `}</style>
      </div>

      {/* 頁首 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             戰略指揮儀表板
             <span className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest animate-pulse">Tactical Portal</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">點擊數據卡片進入分頁，系統將自動套用過濾條件</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden sm:flex px-4 py-2 bg-white rounded-2xl border border-slate-200 text-xs font-black text-slate-600 shadow-sm items-center gap-2">
              <Globe size={14} className="text-blue-500"/> STATUS: GLOBAL LIVE
           </div>
           <button onClick={() => window.location.reload()} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition shadow-lg active:scale-95">
              <Zap size={20} fill="currentColor" />
           </button>
        </div>
      </div>

      {/* 第一排：核心門戶 KPI (帶參數) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ActionableCard 
           to={`/payments?status=${PaymentStatus.BILLED}`}
           title="已核准待撥款" 
           value={`$${(invoiceStats[PaymentStatus.BILLED] / 1000).toFixed(1)}k`} 
           subtext="點擊直接進行撥款與審核" 
           icon={<HandCoins size={24} />} 
           colorClass="bg-emerald-50 text-emerald-600"
           trend="up"
           trendValue="+12%"
        />
        <ActionableCard 
           to="/maintenance"
           title="執行中維修案件" 
           value={maintenanceStats.pending} 
           subtext="點擊查看所有維運中設備" 
           icon={<Wrench size={24} />} 
           colorClass="bg-indigo-50 text-indigo-600"
        />
        <ActionableCard 
           to={`/payments?status=${PaymentStatus.PAID}`}
           title="本月累計支出" 
           value={`$${(invoiceStats[PaymentStatus.PAID] / 1000).toFixed(1)}k`} 
           subtext="點擊查閱完整已支付清單" 
           icon={<Coins size={24} />} 
           colorClass="bg-amber-50 text-amber-600"
        />
        <ActionableCard 
           to={`/payments?status=${PaymentStatus.PENDING}`}
           title="未請款警告數" 
           value={logicalAlerts.length} 
           subtext="維修已完工但缺少發票單據" 
           icon={<Receipt size={24} />} 
           colorClass="bg-rose-50 text-rose-600"
           trend="up"
           trendValue="ALERT"
        />
      </div>

      {/* 第二排：身分佈局與資金水位 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* 1. 兩岸協力身分矩陣 - 新圖表 */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col group">
            <div className="flex justify-between items-start mb-8">
               <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                     <LayoutGrid size={20} className="text-indigo-500" /> 兩岸身分佈局矩陣
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Cross-Region Identity Mix</p>
               </div>
               <div className="p-2.5 bg-slate-50 text-slate-300 rounded-xl">
                  <Globe size={16} />
               </div>
            </div>
            
            <div className="flex-1 min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={identityRegionalData} layout="vertical" margin={{ left: -20, right: 30 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" tick={{ fontWeight: 900, fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                     <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                     />
                     <Bar dataKey={ServiceType.LABOR} name="提供勞務" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} barSize={40} />
                     <Bar dataKey={ServiceType.PRODUCT} name="提供商品" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                     <Bar dataKey={ServiceType.MANUFACTURING} name="製造商品" stackId="a" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>

            <div className="mt-6 flex justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> 勞務</div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> 商品</div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-violet-500"></div> 製造</div>
            </div>
         </div>

         {/* 2. 財務流水水位計 (保持點擊跳轉) */}
         <div 
           onClick={() => navigate('/payments')}
           className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:col-span-2 cursor-pointer hover:border-emerald-300 transition-all group"
         >
            <div className="flex justify-between items-start mb-8">
               <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                     <Receipt size={20} className="text-emerald-500" /> 資金流動水位 (Cash Flow)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Invoice & Billing Status Monitor</p>
               </div>
               <div className="p-2.5 bg-slate-50 text-slate-300 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <ArrowRight size={16} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
               <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100 hover:bg-white transition-colors group/stat">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">已核准總額</div>
                  <div className="text-xl font-black text-indigo-700">${invoiceStats[PaymentStatus.BILLED].toLocaleString()}</div>
               </div>
               <div className="p-5 bg-emerald-50/50 rounded-3xl border border-emerald-100 hover:bg-white transition-colors group/stat">
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">已付款總額</div>
                  <div className="text-xl font-black text-emerald-700">${invoiceStats[PaymentStatus.PAID].toLocaleString()}</div>
               </div>
               <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white transition-colors group/stat">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">待處理單據</div>
                  <div className="text-xl font-black text-slate-700">${invoiceStats[PaymentStatus.PENDING].toLocaleString()}</div>
               </div>
            </div>
            
            <div className="flex-1 bg-slate-50/50 rounded-[2rem] border border-slate-100 p-6 flex items-center justify-center">
               <div className="text-center">
                  <Activity size={32} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">系統正在動態監控當月金流預算配比</p>
               </div>
            </div>
         </div>
      </div>

      {/* 第三排：AI 與 異常 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={20} className="text-rose-500" /> 核銷異常監控 (Audit Flags)
               </h3>
               <Link to="/payments?status=未請款" className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Fix All Invoices</Link>
            </div>
            
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
               {logicalAlerts.map(alert => (
                  <div 
                    key={alert.id} 
                    onClick={() => navigate(`/payments?search=${alert.vendorName}`)}
                    className="p-5 bg-rose-50/30 rounded-3xl border border-rose-100 flex justify-between items-center group cursor-pointer hover:bg-white hover:border-rose-300 transition-all"
                  >
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors"><ShieldAlert size={20}/></div>
                        <div>
                           <div className="font-black text-slate-800 text-sm tracking-tight">{alert.vendorName}</div>
                           <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">維修案 #{alert.caseId} 已結案 · 缺少進項發票</p>
                        </div>
                     </div>
                     <ArrowRight size={20} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
               ))}
               {logicalAlerts.length === 0 && (
                  <div className="py-20 text-center flex flex-col items-center justify-center opacity-30">
                     <CheckCircle size={48} className="mb-4 text-emerald-500" />
                     <p className="font-black uppercase tracking-widest text-sm">數據鏈條完整，無遺失單據</p>
                  </div>
               )}
            </div>
         </div>

         <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col">
            <div className="relative z-10 flex-1">
               <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-indigo-500 rounded-2xl shadow-xl shadow-indigo-500/20"><Bot size={28} /></div>
                     <div>
                        <h3 className="font-black text-xl uppercase tracking-widest tracking-tight">AI 供應鏈優化中心</h3>
                        <p className="text-[10px] text-indigo-300 font-bold tracking-[0.2em] uppercase">Tactical Support System</p>
                     </div>
                  </div>
                  <Sparkles size={24} className="text-yellow-400 animate-pulse" />
               </div>

               <div className="space-y-8">
                  <div 
                    onClick={() => navigate('/vendors?search=製造商品')}
                    className="p-6 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                           <TrendingUp size={14}/> 身分結構優化建議
                        </h4>
                        <ArrowUpRight size={14} className="text-white/30 group-hover:text-white transition-colors" />
                     </div>
                     <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        大陸地區「<span className="text-indigo-400 font-black">製造商品</span>」身分佔比偏低 (僅 10%)。AI 建議增加 2-3 家具備自有工廠的協力廠商，以降低貿易戰與物流波動對成本的衝擊。
                     </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">年度預算剩餘</div>
                        <div className="text-xl font-black tracking-tight">$126,500</div>
                        <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 w-[72%]"></div>
                        </div>
                     </div>
                     <Link to="/vendors" className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors flex flex-col justify-center">
                        <div className="text-[10px] font-black text-indigo-400 uppercase mb-1">優化協力商池</div>
                        <div className="text-lg font-black flex items-center gap-2">Explore <ArrowRight size={14}/></div>
                     </Link>
                  </div>
               </div>
            </div>
            
            <button 
              onClick={() => navigate('/payments')}
              className="mt-10 w-full py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-50 transition shadow-2xl relative z-10 flex items-center justify-center gap-3 active:scale-95"
            >
               查看完整財務分析報告
               <ArrowRight size={16} />
            </button>
         </div>
      </div>
    </div>
  );
};
