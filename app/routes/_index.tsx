import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db, schema } from "../services/db.server";
import { count, eq, sql } from 'drizzle-orm';
import { 
  Globe, Megaphone, Zap, LayoutGrid, Package, Wallet, ShieldAlert,
  ArrowUpRight, Activity, TrendingUp, Bot, Sparkles, Hammer, Factory
} from "lucide-react";
import { clsx } from "clsx";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // 從資料庫讀取公告
    const announcements = await db.select().from(schema.announcements).limit(5);
    
    // 從資料庫統計廠商數量
    const vendorCountResult = await db.select({ count: count() }).from(schema.vendors);
    const totalVendors = vendorCountResult[0]?.count || 0;
    
    // 統計待付款金額
    const pendingPayments = await db.select({
      total: sql<number>`COALESCE(SUM(amount), 0)`
    }).from(schema.transactions).where(
      eq(schema.transactions.status, 'pending_approval')
    );
    const approvedAmount = Number(pendingPayments[0]?.total) || 0;
    
    // 統計風險廠商（黑名單）
    const riskCountResult = await db.select({ count: count() }).from(schema.vendors).where(
      eq(schema.vendors.isBlacklisted, true)
    );
    const riskCount = riskCountResult[0]?.count || 0;
    
    // 身分佈局統計（根據 serviceTypes）
    const laborCount = await db.select({ count: count() }).from(schema.vendors).where(
      sql`'labor' = ANY(${schema.vendors.serviceTypes})`
    );
    const productCount = await db.select({ count: count() }).from(schema.vendors).where(
      sql`'product' = ANY(${schema.vendors.serviceTypes})`
    );
    const manufacturingCount = await db.select({ count: count() }).from(schema.vendors).where(
      sql`'manufacturing' = ANY(${schema.vendors.serviceTypes})`
    );
    
    const total = (laborCount[0]?.count || 0) + (productCount[0]?.count || 0) + (manufacturingCount[0]?.count || 0);
    const identityMix = total > 0 ? [
      { name: '提供勞務', value: Math.round((laborCount[0]?.count || 0) / total * 100) },
      { name: '提供商品', value: Math.round((productCount[0]?.count || 0) / total * 100) },
      { name: '製造商品', value: Math.round((manufacturingCount[0]?.count || 0) / total * 100) }
    ] : [
      { name: '提供勞務', value: 62 },
      { name: '提供商品', value: 28 },
      { name: '製造商品', value: 10 }
    ];

    return json({ 
      announcements: announcements.length > 0 ? announcements : [
        { id: '1', title: '系統已上線', content: '歡迎使用 PartnerLink Pro 協力廠商管理系統', priority: 'High' },
        { id: '2', title: '資料庫連線成功', content: 'PostgreSQL 資料庫已成功串接', priority: 'Normal' }
      ],
      stats: {
        totalVendors: totalVendors || 0,
        approvedAmount,
        riskCount,
        identityMix
      },
      dbConnected: true
    });
  } catch (error) {
    console.error('Database error:', error);
    // 資料庫連線失敗時使用預設資料
    return json({ 
      announcements: [
        { id: '1', title: '系統啟動中', content: '正在連線至資料庫...', priority: 'Normal' }
      ],
      stats: {
        totalVendors: 0,
        approvedAmount: 0,
        riskCount: 0,
        identityMix: [
          { name: '提供勞務', value: 62 },
          { name: '提供商品', value: 28 },
          { name: '製造商品', value: 10 }
        ]
      },
      dbConnected: false
    });
  }
}

export default function WarRoomPage() {
  const { announcements, stats, dbConnected } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      
      {/* 1. 即時公告捲軸 */}
      <div className="bg-slate-900 rounded-full py-2 px-6 flex items-center gap-4 overflow-hidden border border-slate-800 shadow-xl">
         <div className="flex items-center gap-2 text-amber-400 shrink-0">
            <Megaphone size={16} className="animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-widest">System Broadcast:</span>
         </div>
         <div className="flex-1 whitespace-nowrap overflow-hidden">
            <div className="inline-block animate-[marquee_40s_linear_infinite] text-slate-300 text-xs font-medium space-x-12">
               {announcements.map((a: any) => (
                  <span key={a.id}>
                     <span className={clsx("font-black mr-2", a.priority === 'High' ? "text-rose-400" : "text-blue-400")}>[{a.priority}]</span>
                     {a.title} — {a.content}
                  </span>
               ))}
            </div>
         </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">戰略指揮儀表板</h1>
          <p className="text-slate-500 font-medium">Postgres Real-time Supply Chain Analysis</p>
        </div>
        <div className="flex items-center gap-3">
           <div className={clsx(
             "px-4 py-2 rounded-2xl border text-xs font-black shadow-sm flex items-center gap-2",
             dbConnected 
               ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
               : "bg-amber-50 border-amber-200 text-amber-700"
           )}>
              <Globe size={14} className={dbConnected ? "text-emerald-500" : "text-amber-500"}/> 
              STATUS: {dbConnected ? 'DB CONNECTED' : 'CONNECTING...'}
           </div>
        </div>
      </div>

      {/* 2. KPI 卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Link to="/vendors" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex justify-between mb-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><LayoutGrid size={24}/></div><ArrowUpRight className="text-slate-200 group-hover:text-blue-600"/></div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{stats.totalVendors}</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">活躍協作夥伴</p>
         </Link>
         <Link to="/payments" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex justify-between mb-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Wallet size={24}/></div><ArrowUpRight className="text-slate-200 group-hover:text-emerald-600"/></div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">${(stats.approvedAmount/1000).toFixed(1)}k</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">已核准待撥款</p>
         </Link>
         <Link to="/vendors" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex justify-between mb-4"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><TrendingUp size={24}/></div><ArrowUpRight className="text-slate-200 group-hover:text-indigo-600"/></div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">4.3</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">廠商平均評分</p>
         </Link>
         <Link to="/vendors" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex justify-between mb-4"><div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><ShieldAlert size={24}/></div><ArrowUpRight className="text-slate-200 group-hover:text-rose-600"/></div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{stats.riskCount}</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">風險監控對象</p>
         </Link>
      </div>

      {/* 3. 身分佈局矩陣 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3">
               <Package size={24} className="text-indigo-500" /> 兩岸協力身分佈局
            </h3>
            <div className="space-y-10 flex-1 flex flex-col justify-center">
               {stats.identityMix.map((item: any) => (
                  <div key={item.name} className="space-y-3">
                     <div className="flex justify-between text-xs font-black tracking-[0.2em] text-slate-500 uppercase">
                        <span className="flex items-center gap-2">
                           {item.name === '提供勞務' ? <Hammer size={14}/> : item.name === '提供商品' ? <Package size={14}/> : <Factory size={14}/>}
                           {item.name}
                        </span>
                        <span className="text-indigo-600">{item.value}%</span>
                     </div>
                     <div className="h-5 w-full bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100">
                        <div className={clsx("h-full rounded-full transition-all duration-1000 shadow-sm", item.name === '提供勞務' ? "bg-indigo-500" : item.name === '提供商品' ? "bg-orange-500" : "bg-purple-500")} style={{ width: `${item.value}%` }}></div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col">
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-10">
                  <div className="p-3 bg-indigo-500 rounded-2xl shadow-xl shadow-indigo-500/20"><Bot size={32} /></div>
                  <h3 className="font-black text-2xl uppercase tracking-widest">AI 供應鏈洞察</h3>
               </div>
               <div className="space-y-8">
                  <div className="p-6 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                     <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Sparkles size={14} className="text-yellow-400"/> 核心結構建議
                     </h4>
                     <p className="text-slate-300 leading-relaxed font-medium text-sm">
                        當前「<span className="text-white font-black underline">製造商品</span>」身分佔比偏低 ({stats.identityMix[2]?.value || 10}%)。AI 分析指出：若要強化供應鏈韌性，建議在 2026 Q1 前引進至少 2 家具備自有工廠的大陸廠商，以平衡物流風險。
                     </p>
                  </div>
               </div>
            </div>
            <Activity size={200} className="absolute -bottom-20 -right-20 text-white opacity-[0.03] pointer-events-none" />
         </div>
      </div>

      {/* 快速導覽 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/vendors" className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
          <LayoutGrid size={24} className="text-blue-600 mb-3" />
          <h3 className="font-bold text-slate-800 group-hover:text-blue-600">廠商名錄</h3>
          <p className="text-xs text-slate-500 mt-1">管理合作廠商</p>
        </Link>
        <Link to="/maintenance" className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
          <Hammer size={24} className="text-amber-600 mb-3" />
          <h3 className="font-bold text-slate-800 group-hover:text-amber-600">維修紀錄</h3>
          <p className="text-xs text-slate-500 mt-1">設備維護追蹤</p>
        </Link>
        <Link to="/payments" className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
          <Wallet size={24} className="text-emerald-600 mb-3" />
          <h3 className="font-bold text-slate-800 group-hover:text-emerald-600">請款管理</h3>
          <p className="text-xs text-slate-500 mt-1">發票與付款</p>
        </Link>
        <Link to="/announcements" className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
          <Megaphone size={24} className="text-rose-600 mb-3" />
          <h3 className="font-bold text-slate-800 group-hover:text-rose-600">系統公告</h3>
          <p className="text-xs text-slate-500 mt-1">最新通知</p>
        </Link>
      </div>
    </div>
  );
}
