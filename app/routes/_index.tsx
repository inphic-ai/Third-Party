import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { db, schema } from "../services/db.server";
import { count, eq, sql, and, lt } from 'drizzle-orm';
import { requireUser } from "~/services/auth.server";
import { requirePermission } from "~/utils/permissions.server";
import { 
  Globe, Megaphone, Zap, LayoutGrid, Package, Wallet, ShieldAlert,
  ArrowUpRight, Activity, TrendingUp, Bot, Sparkles, Hammer, Factory,
  DollarSign, Users, Wrench, BookOpen, MessageCircle, Clock, CheckCircle,
  AlertTriangle, FileText, UserCheck, Bell, TrendingDown
} from "lucide-react";
import { clsx } from "clsx";

export async function loader({ request }: LoaderFunctionArgs) {
  // 要求用戶必須登入，否則跳轉到登入頁
  const user = await requireUser(request);
  
  // 檢查用戶是否有統計儀表板權限
  await requirePermission(user, '/');
  
  try {
    // 從資料庫讀取公告
    const announcements = await db.select().from(schema.announcements).limit(5);
    
    // 計算本月開始時間
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    
    const now = new Date();
    
    // ===== 1. 財務相關統計 =====
    
    // 本月交易額
    const transactionsThisMonth = await db.select({
      count: count(),
      total: sql<number>`COALESCE(SUM(amount), 0)`
    }).from(schema.transactions).where(
      sql`${schema.transactions.createdAt} >= ${thisMonthStart.toISOString()}`
    );
    const transactionAmount = Number(transactionsThisMonth[0]?.total) || 0;
    const transactionCount = transactionsThisMonth[0]?.count || 0;
    
    // 本月支出總額（已支付）
    const paidTransactions = await db.select({
      total: sql<number>`COALESCE(SUM(amount), 0)`
    }).from(schema.transactions).where(
      and(
        sql`${schema.transactions.createdAt} >= ${thisMonthStart.toISOString()}`,
        eq(schema.transactions.status, 'PAID')
      )
    );
    const paidAmount = Number(paidTransactions[0]?.total) || 0;
    
    // 待審核請款
    const pendingApproval = await db.select({
      count: count(),
      total: sql<number>`COALESCE(SUM(amount), 0)`
    }).from(schema.transactions).where(
      eq(schema.transactions.status, 'PENDING_APPROVAL')
    );
    const pendingAmount = Number(pendingApproval[0]?.total) || 0;
    const pendingCount = pendingApproval[0]?.count || 0;
    
    // 待付款發票
    const pendingInvoices = await db.select({
      count: count(),
      total: sql<number>`COALESCE(SUM(amount), 0)`
    }).from(schema.invoiceRecords).where(
      eq(schema.invoiceRecords.status, 'PENDING')
    );
    const pendingInvoiceAmount = Number(pendingInvoices[0]?.total) || 0;
    const pendingInvoiceCount = pendingInvoices[0]?.count || 0;
    
    // 平均交易金額
    const avgTransaction = transactionCount > 0 ? Math.round(transactionAmount / transactionCount) : 0;
    
    // ===== 2. 廠商相關統計 =====
    
    // 總廠商數
    const vendorCountResult = await db.select({ count: count() }).from(schema.vendors);
    const totalVendors = vendorCountResult[0]?.count || 0;
    
    // 活躍廠商（非黑名單）
    const activeVendorsCount = await db.select({ count: count() }).from(schema.vendors).where(
      eq(schema.vendors.isBlacklisted, false)
    );
    const activeVendors = activeVendorsCount[0]?.count || 0;
    
    // 本月新增廠商
    const newVendorsThisMonth = await db.select({ count: count() }).from(schema.vendors).where(
      sql`${schema.vendors.createdAt} >= ${thisMonthStart.toISOString()}`
    );
    const newVendors = newVendorsThisMonth[0]?.count || 0;
    
    // 黑名單廠商
    const blacklistedVendors = await db.select({ count: count() }).from(schema.vendors).where(
      eq(schema.vendors.isBlacklisted, true)
    );
    const blacklistedCount = blacklistedVendors[0]?.count || 0;
    
    // 廠商評分平均（假設 rating 欄位存在）
    const avgRating = 4.2; // 暫時使用固定值，之後可以從資料庫計算
    
    // ===== 3. 維修與任務統計 =====
    
    // 進行中工單
    const ongoingWorkOrders = await db.select({ count: count() }).from(schema.maintenanceRecords).where(
      sql`${schema.maintenanceRecords.status} IN ('PENDING', 'IN_PROGRESS')`
    );
    const ongoingCount = ongoingWorkOrders[0]?.count || 0;
    
    // 本月完成工單
    const completedThisMonth = await db.select({ count: count() }).from(schema.maintenanceRecords).where(
      sql`${schema.maintenanceRecords.status} = 'COMPLETED' AND ${schema.maintenanceRecords.updatedAt} >= ${thisMonthStart.toISOString()}`
    );
    const completedCount = completedThisMonth[0]?.count || 0;
    
    // 待處理維修單
    const pendingMaintenance = await db.select({ count: count() }).from(schema.maintenanceRecords).where(
      eq(schema.maintenanceRecords.status, 'PENDING')
    );
    const pendingMaintenanceCount = pendingMaintenance[0]?.count || 0;
    
    // 日常任務統計
    const pendingTasks = await db.select({ count: count() }).from(schema.tasks).where(
      sql`${schema.tasks.status} IN ('PENDING', 'IN_PROGRESS')`
    );
    const pendingTasksCount = pendingTasks[0]?.count || 0;
    
    // 逾期任務
    const overdueTasks = await db.select({ count: count() }).from(schema.tasks).where(
      and(
        sql`${schema.tasks.dueDate} < ${now.toISOString()}`,
        sql`${schema.tasks.status} != 'COMPLETED'`
      )
    );
    const overdueTasksCount = overdueTasks[0]?.count || 0;
    
    // 平均處理時間
    const avgProcessingTime = 3.2; // 暫時使用固定值
    
    // ===== 4. 知識庫與系統統計 =====
    
    // 知識庫文章數
    const knowledgeCount = await db.select({ count: count() }).from(schema.knowledgeBaseItems);
    const totalKnowledge = knowledgeCount[0]?.count || 0;
    
    // 本月新增文章
    const newKnowledge = await db.select({ count: count() }).from(schema.knowledgeBaseItems).where(
      sql`${schema.knowledgeBaseItems.createdAt} >= ${thisMonthStart.toISOString()}`
    );
    const newKnowledgeCount = newKnowledge[0]?.count || 0;
    
    // 系統公告數
    const announcementCount = await db.select({ count: count() }).from(schema.announcements);
    const totalAnnouncements = announcementCount[0]?.count || 0;
    
    // 活躍用戶數
    const activeUsers = await db.select({ count: count() }).from(schema.users).where(
      eq(schema.users.isActive, true)
    );
    const activeUsersCount = activeUsers[0]?.count || 0;
    
    // 本月登入次數
    const loginCount = await db.select({ count: count() }).from(schema.loginLogs).where(
      sql`${schema.loginLogs.timestamp} >= ${thisMonthStart.toISOString()}`
    );
    const monthlyLogins = loginCount[0]?.count || 0;
    
    // ===== 5. 通訊與協作統計 =====
    
    // 通訊群組統計
    const lineGroupsCount = await db.select({ count: count() }).from(schema.socialGroups).where(
      eq(schema.socialGroups.platform, 'LINE')
    );
    const wechatGroupsCount = await db.select({ count: count() }).from(schema.socialGroups).where(
      eq(schema.socialGroups.platform, 'WECHAT')
    );
    const lineGroups = lineGroupsCount[0]?.count || 0;
    const wechatGroups = wechatGroupsCount[0]?.count || 0;
    const totalGroups = lineGroups + wechatGroups;
    
    // 本月聯繫紀錄
    const contactLogsCount = await db.select({ count: count() }).from(schema.contactLogs).where(
      sql`${schema.contactLogs.createdAt} >= ${thisMonthStart.toISOString()}`
    );
    const monthlyContacts = contactLogsCount[0]?.count || 0;
    
    // 待跟進事項
    const followUpCount = await db.select({ count: count() }).from(schema.contactLogs).where(
      and(
        sql`${schema.contactLogs.nextFollowUp} IS NOT NULL`,
        sql`${schema.contactLogs.nextFollowUp} <= ${now.toISOString()}`
      )
    );
    const pendingFollowUps = followUpCount[0]?.count || 0;

    return json({ 
      announcements: announcements.length > 0 ? announcements : [
        { id: '1', title: '系統已上線', content: '歡迎使用 PartnerLink Pro 協力廠商管理系統', priority: 'High' },
        { id: '2', title: '資料庫連線成功', content: 'PostgreSQL 資料庫已成功串接', priority: 'Normal' }
      ],
      stats: {
        // 財務相關
        financial: {
          monthlyRevenue: transactionAmount,
          monthlyExpense: paidAmount,
          pendingApproval: { count: pendingCount, amount: pendingAmount },
          pendingInvoices: { count: pendingInvoiceCount, amount: pendingInvoiceAmount },
          avgTransaction: avgTransaction,
          transactionCount: transactionCount
        },
        // 廠商相關
        vendor: {
          total: totalVendors,
          active: activeVendors,
          newThisMonth: newVendors,
          blacklisted: blacklistedCount,
          avgRating: avgRating
        },
        // 維修與任務
        maintenance: {
          ongoing: ongoingCount,
          completedThisMonth: completedCount,
          pending: pendingMaintenanceCount,
          pendingTasks: pendingTasksCount,
          overdueTasks: overdueTasksCount,
          avgProcessingTime: avgProcessingTime
        },
        // 知識庫與系統
        knowledge: {
          total: totalKnowledge,
          newThisMonth: newKnowledgeCount,
          announcements: totalAnnouncements,
          activeUsers: activeUsersCount,
          monthlyLogins: monthlyLogins
        },
        // 通訊與協作
        communication: {
          totalGroups: totalGroups,
          lineGroups: lineGroups,
          wechatGroups: wechatGroups,
          monthlyContacts: monthlyContacts,
          pendingFollowUps: pendingFollowUps
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
        financial: {
          monthlyRevenue: 0,
          monthlyExpense: 0,
          pendingApproval: { count: 0, amount: 0 },
          pendingInvoices: { count: 0, amount: 0 },
          avgTransaction: 0,
          transactionCount: 0
        },
        vendor: {
          total: 0,
          active: 0,
          newThisMonth: 0,
          blacklisted: 0,
          avgRating: 0
        },
        maintenance: {
          ongoing: 0,
          completedThisMonth: 0,
          pending: 0,
          pendingTasks: 0,
          overdueTasks: 0,
          avgProcessingTime: 0
        },
        knowledge: {
          total: 0,
          newThisMonth: 0,
          announcements: 0,
          activeUsers: 0,
          monthlyLogins: 0
        },
        communication: {
          totalGroups: 0,
          lineGroups: 0,
          wechatGroups: 0,
          monthlyContacts: 0,
          pendingFollowUps: 0
        }
      },
      dbConnected: false,
      user
    });
  }
}

export default function WarRoomPage() {
  const { announcements, stats, dbConnected, user } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-12">
      
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

      {/* ===== 1. 財務相關 ===== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <DollarSign size={24} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">💰 財務相關</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 本月交易額 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Wallet size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">NT$ {((stats.financial?.monthlyRevenue || 0)/1000).toFixed(1)}k</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">本月交易額</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                <span className="text-lg">📊</span>
                <span>{stats.financial?.transactionCount || 0} 筆</span>
                <span className="text-slate-400">交易數</span>
              </div>
            </div>
          </div>

          {/* 本月支出總額 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><TrendingDown size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">NT$ {((stats.financial?.monthlyExpense || 0)/1000).toFixed(1)}k</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">本月支出總額</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                <span className="text-lg">✓</span>
                <span>已支付</span>
              </div>
            </div>
          </div>

          {/* 待審核請款 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.financial?.pendingApproval?.count || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">待審核請款</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-amber-600 font-semibold">
                <span className="text-lg">💰</span>
                <span>NT$ {((stats.financial?.pendingApproval?.amount || 0)/1000).toFixed(1)}k</span>
              </div>
            </div>
          </div>

          {/* 待付款發票 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><FileText size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.financial?.pendingInvoices?.count || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">待付款發票</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-orange-600 font-semibold">
                <span className="text-lg">💰</span>
                <span>NT$ {((stats.financial?.pendingInvoices?.amount || 0)/1000).toFixed(1)}k</span>
              </div>
            </div>
          </div>

          {/* 平均交易金額 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><TrendingUp size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">NT$ {((stats.financial?.avgTransaction || 0)/1000).toFixed(1)}k</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">平均交易金額</p>
          </div>
        </div>
      </div>

      {/* ===== 2. 廠商相關 ===== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Users size={24} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">🏢 廠商相關</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 總廠商數 */}
          <Link to="/vendors" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><LayoutGrid size={24}/></div>
              <ArrowUpRight className="text-slate-200 group-hover:text-blue-600"/>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.vendor?.total || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">總廠商數</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                <span className="text-lg">↑</span>
                <span>{stats.vendor?.newThisMonth || 0} 家</span>
                <span className="text-slate-400">本月新增</span>
              </div>
            </div>
          </Link>

          {/* 活躍廠商 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><UserCheck size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.vendor?.active || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">活躍廠商</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                <span className="text-lg">✓</span>
                <span>正常運作</span>
              </div>
            </div>
          </div>

          {/* 黑名單廠商 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><ShieldAlert size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.vendor?.blacklisted || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">黑名單廠商</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-red-600 font-semibold">
                <span className="text-lg">⚠️</span>
                <span>需要關注</span>
              </div>
            </div>
          </div>

          {/* 廠商評分平均 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl"><Sparkles size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.vendor?.avgRating?.toFixed(1) || '0.0'}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">廠商評分平均</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-yellow-600 font-semibold">
                <span className="text-lg">⭐</span>
                <span>滿分 5.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 3. 維修與任務 ===== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-xl">
            <Wrench size={24} className="text-orange-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">🔧 維修與任務</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 進行中工單 */}
          <Link to="/maintenance" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Hammer size={24}/></div>
              <ArrowUpRight className="text-slate-200 group-hover:text-rose-600"/>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.maintenance?.ongoing || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">進行中工單</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                <span className="text-lg">⏱️</span>
                <span>{stats.maintenance?.avgProcessingTime || 0} 天</span>
                <span className="text-slate-400">平均處理</span>
              </div>
            </div>
          </Link>

          {/* 本月完成工單 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.maintenance?.completedThisMonth || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">本月完成工單</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                <span className="text-lg">✓</span>
                <span>已完成</span>
              </div>
            </div>
          </div>

          {/* 待處理維修單 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.maintenance?.pending || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">待處理維修單</p>
          </div>

          {/* 待處理任務 */}
          <Link to="/tasks" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><FileText size={24}/></div>
              <ArrowUpRight className="text-slate-200 group-hover:text-blue-600"/>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.maintenance?.pendingTasks || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">待處理任務</p>
          </Link>

          {/* 逾期任務 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><AlertTriangle size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.maintenance?.overdueTasks || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">逾期任務</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-red-600 font-semibold">
                <span className="text-lg">⚠️</span>
                <span>需要處理</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 4. 知識庫與系統 ===== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-xl">
            <BookOpen size={24} className="text-purple-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">📚 知識庫與系統</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 知識庫文章數 */}
          <Link to="/knowledge" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><BookOpen size={24}/></div>
              <ArrowUpRight className="text-slate-200 group-hover:text-purple-600"/>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.knowledge?.total || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">知識庫文章數</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
                <span className="text-lg">↑</span>
                <span>{stats.knowledge?.newThisMonth || 0} 篇</span>
                <span className="text-slate-400">本月新增</span>
              </div>
            </div>
          </Link>

          {/* 系統公告數 */}
          <Link to="/announcements" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Megaphone size={24}/></div>
              <ArrowUpRight className="text-slate-200 group-hover:text-rose-600"/>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.knowledge?.announcements || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">系統公告數</p>
          </Link>

          {/* 活躍用戶數 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Users size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.knowledge?.activeUsers || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">活躍用戶數</p>
          </div>

          {/* 本月登入次數 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Activity size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.knowledge?.monthlyLogins || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">本月登入次數</p>
          </div>
        </div>
      </div>

      {/* ===== 5. 通訊與協作 ===== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <MessageCircle size={24} className="text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">💬 通訊與協作</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 通訊群組 */}
          <Link to="/communication" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><MessageCircle size={24}/></div>
              <ArrowUpRight className="text-slate-200 group-hover:text-indigo-600"/>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.communication?.totalGroups || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">通訊群組</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                <span className="text-lg">🟢</span>
                <span>{stats.communication?.lineGroups || 0} 個</span>
                <span className="text-slate-400">LINE</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                <span className="text-lg">👉</span>
                <span>{stats.communication?.wechatGroups || 0} 個</span>
                <span className="text-slate-400">WeChat</span>
              </div>
            </div>
          </Link>

          {/* 本月聯繫紀錄 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Activity size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.communication?.monthlyContacts || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">本月聯繫紀錄</p>
          </div>

          {/* 待跟進事項 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Bell size={24}/></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{stats.communication?.pendingFollowUps || 0}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">待跟進事項</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-amber-600 font-semibold">
                <span className="text-lg">⏰</span>
                <span>需要跟進</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 快速導覽 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
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
