import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { db, schema } from "../services/db.server";
import { count, eq, sql } from 'drizzle-orm';
import { requireUser } from "~/services/auth.server";
import { requirePermission } from "~/utils/permissions.server";
import { 
  Globe, Megaphone, Zap, LayoutGrid, Package, Wallet, ShieldAlert,
  ArrowUpRight, Activity, TrendingUp, Bot, Sparkles, Hammer, Factory
} from "lucide-react";
import { clsx } from "clsx";

export async function loader({ request }: LoaderFunctionArgs) {
  // 要求用戶必須登入，否則跳轉到登入頁
  const user = await requireUser(request);
  
  // 檢查用戶是否有統計儀表板權限
  requirePermission(user, '/');
  
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
      eq(schema.transactions.status, 'PENDING_APPROVAL')
    );
    const approvedAmount = Number(pendingPayments[0]?.total) || 0;
    
    // 統計風險廠商（黑名單）
    const riskCountResult = await db.select({ count: count() }).from(schema.vendors).where(
      eq(schema.vendors.isBlacklisted, true)
    );
    const riskCount = riskCountResult[0]?.count || 0;
    
    // ===== 方案 B：新增統計邏輯 =====
    
    // 1. 廠商統計
    const activeVendorsCount = await db.select({ count: count() }).from(schema.vendors).where(
      eq(schema.vendors.isBlacklisted, false)
    );
    const activeVendors = activeVendorsCount[0]?.count || 0;
    
    // 本月新增廠商（假設 createdAt 欄位存在）
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    
    const newVendorsThisMonth = await db.select({ count: count() }).from(schema.vendors).where(
      sql`${schema.vendors.createdAt} >= ${thisMonthStart.toISOString()}`
    );
    const newVendors = newVendorsThisMonth[0]?.count || 0;
    
    // 2. 交易統計
    const transactionsThisMonth = await db.select({
      count: count(),
      total: sql<number>`COALESCE(SUM(amount), 0)`
    }).from(schema.transactions).where(
      sql`${schema.transactions.createdAt} >= ${thisMonthStart.toISOString()}`
    );
    const transactionCount = transactionsThisMonth[0]?.count || 0;
    const transactionAmount = Number(transactionsThisMonth[0]?.total) || 0;
    const avgTransaction = transactionCount > 0 ? Math.round(transactionAmount / transactionCount) : 0;
    
    // 3. 通訊統計
    const lineGroupsCount = await db.select({ count: count() }).from(schema.socialGroups).where(
      eq(schema.socialGroups.platform, 'LINE')
    );
    const wechatGroupsCount = await db.select({ count: count() }).from(schema.socialGroups).where(
      eq(schema.socialGroups.platform, 'WECHAT')
    );
    const lineGroups = lineGroupsCount[0]?.count || 0;
    const wechatGroups = wechatGroupsCount[0]?.count || 0;
    const totalGroups = lineGroups + wechatGroups;
    
    // 4. 工單統計（假設有 maintenanceRecords 表格）
    const ongoingWorkOrders = await db.select({ count: count() }).from(schema.maintenanceRecords).where(
      sql`${schema.maintenanceRecords.status} IN ('PENDING', 'IN_PROGRESS')`
    );
    const ongoingCount = ongoingWorkOrders[0]?.count || 0;
    
    const completedThisMonth = await db.select({ count: count() }).from(schema.maintenanceRecords).where(
      sql`${schema.maintenanceRecords.status} = 'COMPLETED' AND ${schema.maintenanceRecords.updatedAt} >= ${thisMonthStart.toISOString()}`
    );
    const completedCount = completedThisMonth[0]?.count || 0;
    
    // 平均處理時間（假設有 createdAt 和 completedAt）
    const avgProcessingTime = 3.2; // 暫時使用固定值，之後可以計算
    
    // ===== 原有的身分佈局統計 =====
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
        identityMix,
        // 方案 B 的統計資料
        vendorStats: {
          total: totalVendors || 0,
          active: activeVendors,
          newThisMonth: newVendors
        },
        transactionStats: {
          count: transactionCount,
          amount: transactionAmount,
          average: avgTransaction
        },
        communicationStats: {
          total: totalGroups,
          line: lineGroups,
          wechat: wechatGroups
        },
        workOrderStats: {
          ongoing: ongoingCount,
          completedThisMonth: completedCount,
          avgProcessingTime
        }
      },
      dbConnected: true,
      user
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
      dbConnected: false,
      user
    });
  }
}

export default function WarRoomPage() {
  const { announcements, stats, dbConnected, user } = useLoaderData<typeof loader>();

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
           {/* 用戶資訊 */}
           <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
             {user.avatarUrl && (
               <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
             )}
             <div className="text-left">
               <p className="text-sm font-bold text-slate-800">{user.name}</p>
               <p className="text-xs text-slate-500">{user.email}</p>
             </div>
           </div>
           {/* 登出按鈕 */}
           <Form action="/logout" method="post">
             <button
               type="submit"
               className="px-4 py-2 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition text-sm font-bold"
             >
               登出
             </button>
           </Form>
           {/* 資料庫狀態 */}
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

      {/* 2. KPI 卡片（方案 B） */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* 1. 廠商統計 */}
         <Link to="/vendors" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex justify-between mb-4">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><LayoutGrid size={24}/></div>
               <ArrowUpRight className="text-slate-200 group-hover:text-blue-600"/>
            </div>
            <h3 className="text-5xl font-black text-slate-800 tracking-tighter mb-2">{stats.vendorStats?.total || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">總廠商數</p>
            <div className="mt-4 space-y-2">
               <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                  <span className="text-lg">↑</span>
                  <span>{stats.vendorStats?.newThisMonth || 0} 家</span>
                  <span className="text-slate-400">本月新增</span>
               </div>
               <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                  <span className="text-lg">✓</span>
                  <span>{stats.vendorStats?.active || 0} 家</span>
                  <span className="text-slate-400">活躍廠商</span>
               </div>
            </div>
         </Link>
         
         {/* 2. 交易統計 */}
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
               <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Wallet size={24}/></div>
            </div>
            <h3 className="text-5xl font-black text-slate-800 tracking-tighter mb-2">NT$ {((stats.transactionStats?.amount || 0)/1000).toFixed(1)}k</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">本月交易額</p>
            <div className="mt-4 space-y-2">
               <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                  <span className="text-lg">📊</span>
                  <span>{stats.transactionStats?.count || 0} 筆</span>
                  <span className="text-slate-400">交易數</span>
               </div>
               <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                  <span className="text-lg">💰</span>
                  <span>NT$ {((stats.transactionStats?.average || 0)/1000).toFixed(1)}k</span>
                  <span className="text-slate-400">平均金額</span>
               </div>
            </div>
         </div>
         
         {/* 3. 通訊統計 */}
         <Link to="/communication" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex justify-between mb-4">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Activity size={24}/></div>
               <ArrowUpRight className="text-slate-200 group-hover:text-indigo-600"/>
            </div>
            <h3 className="text-5xl font-black text-slate-800 tracking-tighter mb-2">{stats.communicationStats?.total || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">通訊群組</p>
            <div className="mt-4 space-y-2">
               <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                  <span className="text-lg">🟢</span>
                  <span>{stats.communicationStats?.line || 0} 個</span>
                  <span className="text-slate-400">LINE 群組</span>
               </div>
               <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                  <span className="text-lg">👉</span>
                  <span>{stats.communicationStats?.wechat || 0} 個</span>
                  <span className="text-slate-400">WeChat 群組</span>
               </div>
            </div>
         </Link>
         
         {/* 4. 工單統計 */}
         <Link to="/maintenance" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex justify-between mb-4">
               <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Hammer size={24}/></div>
               <ArrowUpRight className="text-slate-200 group-hover:text-rose-600"/>
            </div>
            <h3 className="text-5xl font-black text-slate-800 tracking-tighter mb-2">{stats.workOrderStats?.ongoing || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">進行中工單</p>
            <div className="mt-4 space-y-2">
               <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                  <span className="text-lg">✓</span>
                  <span>{stats.workOrderStats?.completedThisMonth || 0} 件</span>
                  <span className="text-slate-400">本月完成</span>
               </div>
               <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                  <span className="text-lg">⏱️</span>
                  <span>{stats.workOrderStats?.avgProcessingTime || 0} 天</span>
                  <span className="text-slate-400">平均處理</span>
               </div>
            </div>
         </Link>
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
