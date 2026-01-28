
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "../services/db.server";
import { 
  Globe, Megaphone, Zap, LayoutGrid, Package, Wallet, ShieldAlert,
  ArrowUpRight, Activity, TrendingUp, Bot, Sparkles, Hammer, Factory
} from "lucide-react";
import { clsx } from "clsx";
import { ServiceType } from "../types";

export async function loader({ request }: LoaderFunctionArgs) {
  const announcements = await db.announcements.findMany();
  // 實際開發：這裡會從 Postgres 執行 COUNT(*) 統計
  const stats = {
    totalVendors: 128,
    approvedAmount: 45000,
    riskCount: 4,
    identityMix: [
      { name: ServiceType.LABOR, value: 62 },
      { name: ServiceType.PRODUCT, value: 28 },
      { name: ServiceType.MANUFACTURING, value: 10 }
    ]
  };
  return json({ announcements, stats });
}

export default function WarRoomPage() {
  const { announcements, stats } = useLoaderData<typeof loader>();

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
               {announcements.map(a => (
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
           <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 text-xs font-black text-slate-600 shadow-sm flex items-center gap-2">
              <Globe size={14} className="text-blue-500"/> STATUS: SSR LIVE
           </div>
        </div>
      </div>

      {/* 2. KPI 卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between mb-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><LayoutGrid size={24}/></div><ArrowUpRight className="text-slate-200 group-hover:text-blue-600"/></div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{stats.totalVendors}</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">活躍協作夥伴</p>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between mb-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Wallet size={24}/></div><ArrowUpRight className="text-slate-200 group-hover:text-emerald-600"/></div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">${(stats.approvedAmount/1000).toFixed(1)}k</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">已核准待撥款</p>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between mb-4"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><TrendingUp size={24}/></div><ArrowUpRight className="text-slate-200 group-hover:text-indigo-600"/></div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">4.3</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">廠商平均評分</p>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between mb-4"><div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><ShieldAlert size={24}/></div><ArrowUpRight className="text-slate-200 group-hover:text-rose-600"/></div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{stats.riskCount}</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">風險監控對象</p>
         </div>
      </div>

      {/* 3. 身分佈局矩陣 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3">
               <Package size={24} className="text-indigo-500" /> 兩岸協力身分佈局
            </h3>
            <div className="space-y-10 flex-1 flex flex-col justify-center">
               {stats.identityMix.map(item => (
                  <div key={item.name} className="space-y-3">
                     <div className="flex justify-between text-xs font-black tracking-[0.2em] text-slate-500 uppercase">
                        <span className="flex items-center gap-2">
                           {item.name === ServiceType.LABOR ? <Hammer size={14}/> : item.name === ServiceType.PRODUCT ? <Package size={14}/> : <Factory size={14}/>}
                           {item.name}
                        </span>
                        <span className="text-indigo-600">{item.value}%</span>
                     </div>
                     <div className="h-5 w-full bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100">
                        <div className={clsx("h-full rounded-full transition-all duration-1000 shadow-sm", item.name === ServiceType.LABOR ? "bg-indigo-500" : item.name === ServiceType.PRODUCT ? "bg-orange-500" : "bg-purple-500")} style={{ width: `${item.value}%` }}></div>
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
                        當前「<span className="text-white font-black underline">製造商品</span>」身分佔比偏低 (10%)。AI 分析指出：若要強化供應鏈韌性，建議在 2024 Q3 前引進至少 2 家具備自有工廠的大陸廠商，以平衡物流風險。
                     </p>
                  </div>
               </div>
            </div>
            <Activity size={200} className="absolute -bottom-20 -right-20 text-white opacity-[0.03] pointer-events-none" />
         </div>
      </div>
    </div>
  );
}
