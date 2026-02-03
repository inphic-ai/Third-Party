import { useState, useMemo } from 'react';
import { useLoaderData, Link, useFetcher } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { db } from '../services/db.server';
import { transactions } from '../../db/schema/financial';
import { contactLogs, tasks } from '../../db/schema/operations';
import { vendors } from '../../db/schema/vendor';
import { eq } from 'drizzle-orm';
import { requireUser } from '~/services/auth.server';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  User,
  CheckCircle,
  Plus,
  Phone,
  Hammer,
  CheckCircle2,
  HelpCircle,
  CalendarCheck,
  MapPin,
  DollarSign,
  X
} from 'lucide-react';
import { clsx } from 'clsx';

import { ClientOnly } from '~/components/ClientOnly';
import { MOCK_VENDORS } from '~/constants';
import { TransactionStatus } from '~/types';

export const meta: MetaFunction = () => {
  return [
    { title: "日常任務 - PartnerLink Pro" },
    { name: "description", content: "每日議程與任務執行看板" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // 要求用戶必須登入
  await requireUser(request);
  
  try {
    console.log('[Tasks Loader] Loading tasks data...');
    
    // 讀取所有交易、聯絡紀錄、任務和廠商
    const [allTransactions, allContactLogs, allTasks, allVendors] = await Promise.all([
      db.select().from(transactions),
      db.select().from(contactLogs),
      db.select().from(tasks),
      db.select().from(vendors)
    ]);
    
    console.log(`[Tasks Loader] Loaded ${allTransactions.length} transactions, ${allContactLogs.length} contact logs, ${allTasks.length} tasks, ${allVendors.length} vendors`);
    
    // 建立 vendor map 以便快速查詢
    const vendorMap = new Map(allVendors.map(v => [v.id, v]));
    
    // 轉換交易為任務格式
    const transactionTasks = allTransactions.map(t => {
      const vendor = vendorMap.get(t.vendorId);
      return {
        id: t.id,
        type: 'transaction',
        date: t.date.toISOString().split('T')[0],
        title: `工單: ${t.description}`,
        subtitle: vendor?.name || '',
        status: t.status,
        vendorId: t.vendorId,
        vendorName: vendor?.name || '',
        vendorAvatar: vendor?.avatarUrl || '',
        isCompleted: t.status === 'PAID' || t.status === 'APPROVED'
      };
    });
    
    // 轉換聯絡紀錄為任務格式
    const contactTasks = allContactLogs
      .filter(log => log.nextFollowUp || log.isReservation)
      .map(log => {
        const vendor = vendorMap.get(log.vendorId);
        return {
          id: `log-${log.id}`,
          type: log.isReservation ? 'reservation' : 'follow_up',
          date: log.nextFollowUp?.toISOString().split('T')[0] || log.date.toISOString().split('T')[0],
          time: log.reservationTime?.toISOString() || undefined,
          title: log.isReservation ? `預約: ${vendor?.name || ''}` : `跟進: ${vendor?.name || ''}`,
          subtitle: log.note,
          vendorId: log.vendorId,
          vendorName: vendor?.name || '',
          vendorAvatar: vendor?.avatarUrl || '',
          quoteAmount: log.quoteAmount ? parseFloat(String(log.quoteAmount)) : undefined,
        };
      });
    
    // 轉換手動任務為任務格式
    const manualTasks = allTasks.map(task => {
      const vendor = task.vendorId ? vendorMap.get(task.vendorId) : null;
      return {
        id: task.id,
        type: 'manual',
        date: task.dueDate ? task.dueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        title: task.title,
        subtitle: task.description || '',
        priority: task.priority,
        status: task.status,
        vendorId: task.vendorId || undefined,
        vendorName: vendor?.name || '',
        vendorAvatar: vendor?.avatarUrl || '',
        isCompleted: task.status === 'COMPLETED'
      };
    });
    
    return json({ 
      transactionTasks,
      contactTasks,
      manualTasks
    });
  } catch (error) {
    console.error('[Tasks Loader] Error:', error);
    return json({ 
      transactionTasks: [],
      contactTasks: [],
      manualTasks: []
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "createTask") {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const dueDate = formData.get("dueDate") as string;
    const vendorId = formData.get("vendorId") as string;

    if (!title || !title.trim()) {
      return json({ success: false, message: "任務標題不能為空" }, { status: 400 });
    }

    try {
      // 使用固定的 createdBy UUID（實際應該從 session 中獲取）
      const createdBy = '00000000-0000-0000-0000-000000000001';

      const newTask = await db.insert(tasks).values({
        title: title.trim(),
        description: description?.trim() || null,
        priority: (priority as any) || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        vendorId: vendorId || null,
        createdBy,
        status: 'PENDING'
      }).returning();

      console.log('[Tasks Action] Created task:', newTask[0]);

      return json({ success: true, message: "任務已建立", task: newTask[0] });
    } catch (error) {
      console.error('[Tasks Action] Failed to create task:', error);
      return json({ success: false, message: "建立失敗，請稍後再試" }, { status: 500 });
    }
  }

  if (intent === "toggleTask") {
    const taskId = formData.get("taskId") as string;

    if (!taskId) {
      return json({ success: false, message: "缺少任務 ID" }, { status: 400 });
    }

    try {
      const [existingTask] = await db.select().from(tasks).where(eq(tasks.id, taskId));

      if (!existingTask) {
        return json({ success: false, message: "任務不存在" }, { status: 404 });
      }

      const newStatus = existingTask.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      const completedAt = newStatus === 'COMPLETED' ? new Date() : null;

      await db.update(tasks)
        .set({ 
          status: newStatus,
          completedAt,
          updatedAt: new Date()
        })
        .where(eq(tasks.id, taskId));

      console.log('[Tasks Action] Toggled task:', taskId, 'to', newStatus);

      return json({ success: true, message: "任務狀態已更新" });
    } catch (error) {
      console.error('[Tasks Action] Failed to toggle task:', error);
      return json({ success: false, message: "更新失敗，請稍後再試" }, { status: 500 });
    }
  }

  return json({ success: false, message: "未知的請求" }, { status: 400 });
}

// Local Type for Unified Task View
type TaskType = 'transaction' | 'follow_up' | 'manual' | 'reservation';

interface UnifiedTask {
  id: string;
  type: TaskType;
  date: string;
  title: string;
  subtitle?: string;
  time?: string;
  status?: string;
  vendorId?: string;
  vendorName?: string;
  vendorAvatar?: string;
  isCompleted?: boolean;
  quoteAmount?: number;
  location?: string;
}

function TasksContent() {
  const { transactionTasks: dbTransactionTasks, contactTasks: dbContactTasks, manualTasks: dbManualTasks } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');

  // Helper to get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = getDaysInMonth(currentDate);

  // 1. Gather Transactions
  const transactionTasks: UnifiedTask[] = useMemo(() => {
    return dbTransactionTasks as UnifiedTask[];
  }, [dbTransactionTasks]);

  // 2. Gather Follow-ups & Reservations (From Contact Logs)
  const contactTasks: UnifiedTask[] = useMemo(() => {
    return dbContactTasks as UnifiedTask[];
  }, [dbContactTasks]);

  // 3. Gather Manual Tasks
  const manualTasks: UnifiedTask[] = useMemo(() => {
    return dbManualTasks as UnifiedTask[];
  }, [dbManualTasks]);

  // Combine All Tasks
  const allTasks = [...transactionTasks, ...contactTasks, ...manualTasks];

  // Get tasks for selected date
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const todaysTasks = allTasks.filter(t => t.date === selectedDateStr);
  
  // Sort tasks: Reservations first
  todaysTasks.sort((a, b) => {
    if (a.type === 'reservation' && b.type !== 'reservation') return -1;
    if (a.type !== 'reservation' && b.type === 'reservation') return 1;
    return 0;
  });

  // Month Navigation
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  // Day Selection
  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  // Add Manual Task
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const formData = new FormData();
    formData.append('intent', 'createTask');
    formData.append('title', newTaskTitle.trim());
    formData.append('description', newTaskDescription.trim());
    formData.append('priority', newTaskPriority);
    formData.append('dueDate', selectedDateStr);
    
    fetcher.submit(formData, { method: 'post' });
    
    // 清空表單並關閉模態框
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('MEDIUM');
    setShowAddTaskModal(false);
  };

  const toggleManualTask = (id: string) => {
    const formData = new FormData();
    formData.append('intent', 'toggleTask');
    formData.append('taskId', id);
    fetcher.submit(formData, { method: 'post' });
  };

  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  // Helper to check data per day
  const getDataForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = allTasks.filter(t => t.date === dateStr);
    const hasReservation = dayTasks.some(t => t.type === 'reservation');
    return { count: dayTasks.length, hasReservation };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">日常戰術中心</h1>
            <p className="text-slate-500 text-sm">每日議程與任務執行看板</p>
          </div>
        </div>
        <button 
          className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition"
        >
          <HelpCircle size={18} /> 如何使用？
        </button>
      </div>

      {/* Split View Content */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
        
        {/* Left: Calendar Picker */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 overflow-y-auto lg:overflow-visible">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
             {/* Calendar Header */}
             <div className="flex items-center justify-between mb-6">
                <span className="font-bold text-slate-800 text-lg">
                  {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
                </span>
                <div className="flex gap-1">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronLeft size={20}/></button>
                  <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronRight size={20}/></button>
                </div>
             </div>

             {/* Calendar Grid */}
             <div className="grid grid-cols-7 gap-y-4 text-center mb-2">
                {weekDays.map(d => <span key={d} className="text-xs font-bold text-slate-400">{d}</span>)}
             </div>
             <div className="grid grid-cols-7 gap-y-2 place-items-center">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                   const day = i + 1;
                   const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth();
                   const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                   const { count, hasReservation } = getDataForDay(day);

                   return (
                     <button 
                       key={day}
                       onClick={() => handleDateClick(day)}
                       className={clsx(
                         "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition relative",
                         isSelected ? "bg-indigo-600 text-white shadow-md shadow-indigo-300 scale-110" : 
                         isToday ? "text-indigo-600 border border-indigo-200 font-bold" : "text-slate-600 hover:bg-slate-100"
                       )}
                     >
                       {day}
                       {count > 0 && !isSelected && (
                         <span className={clsx("absolute -bottom-1 w-1.5 h-1.5 rounded-full", hasReservation ? "bg-red-500 ring-2 ring-white" : "bg-indigo-300")}></span>
                       )}
                     </button>
                   );
                })}
             </div>
             <div className="mt-4 flex gap-4 justify-center text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> 預約行程</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-300"></span> 一般待辦</span>
             </div>
          </div>

          {/* Stats Widget */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
             <h3 className="font-bold text-indigo-100 mb-4 text-sm">本月概況</h3>
             <div className="flex justify-between items-end">
                <div>
                   <div className="text-3xl font-bold">{allTasks.filter(t => t.date.startsWith(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)).length}</div>
                   <div className="text-xs text-indigo-200 mt-1">總任務數</div>
                </div>
                <div className="text-right">
                   <div className="text-xl font-bold">{contactTasks.filter(t => t.type === 'reservation').length}</div>
                   <div className="text-xs text-indigo-200 mt-1">預約拜訪</div>
                </div>
             </div>
          </div>
        </div>

        {/* Right: Daily Agenda List */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                 <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {selectedDate.getDate()}日 行程卡片
                    <span className="text-sm font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 ml-2">
                        {selectedDate.getFullYear()}/{selectedDate.getMonth() + 1}
                    </span>
                 </h2>
                 <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                    {todaysTasks.some(t => t.type === 'reservation') ? (
                        <>
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span className="text-slate-700 font-bold">當日有預約行程</span>
                        </>
                    ) : '無重大預約行程'}
                 </p>
              </div>
              <button 
                 onClick={() => setSelectedDate(new Date())}
                 className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition border border-transparent hover:border-indigo-100"
              >
                 回到今天
              </button>
           </div>

           <div className="p-4 border-b border-slate-100">
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                新增任務
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
              {todaysTasks.length > 0 ? todaysTasks.map(task => {
                 if (task.type === 'reservation') {
                    return (
                       <div key={task.id} className="bg-white rounded-2xl border-l-4 border-l-orange-500 border border-slate-200 shadow-sm hover:shadow-md transition relative overflow-hidden group">
                          <div className="bg-gradient-to-r from-orange-50 to-white px-5 py-2 border-b border-orange-100 flex justify-between items-center">
                              <span className="text-xs font-bold text-orange-700 flex items-center gap-1 uppercase tracking-wide">
                                <CalendarCheck size={12} /> Reservation Card
                              </span>
                              {task.time && <span className="text-sm font-black text-slate-800 bg-white px-2 py-0.5 rounded shadow-sm">{task.time}</span>}
                          </div>
                          
                          <div className="p-5 flex flex-col sm:flex-row gap-5">
                             <div className="flex-1 flex gap-4">
                                <div className="shrink-0">
                                   {task.vendorAvatar ? (
                                     <img src={task.vendorAvatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="" />
                                   ) : (
                                     <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400"><User size={20}/></div>
                                   )}
                                </div>
                                <div>
                                   <Link to={`/vendors/${task.vendorId}`} className="font-bold text-lg text-slate-800 hover:text-indigo-600 transition flex items-center gap-2">
                                      {task.vendorName}
                                      <ChevronRight size={16} className="text-slate-300" />
                                   </Link>
                                   <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                      <MapPin size={14} className="text-slate-400"/>
                                      {task.location || '廠商登記地址'}
                                   </div>
                                </div>
                             </div>

                             <div className="sm:border-l sm:border-slate-100 sm:pl-5 min-w-[180px] flex flex-col justify-center">
                                <div className="mb-2">
                                   <div className="text-xs text-slate-400 mb-0.5">預估報價</div>
                                   <div className="font-mono font-bold text-xl text-slate-700 flex items-center gap-1">
                                      <DollarSign size={16} className="text-green-600"/>
                                      {task.quoteAmount ? task.quoteAmount.toLocaleString() : <span className="text-sm text-slate-400 font-sans">未報價</span>}
                                   </div>
                                </div>
                                {task.subtitle && (
                                   <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                      <span className="font-bold text-slate-400 mr-1">備註:</span>
                                      {task.subtitle}
                                   </div>
                                )}
                             </div>
                          </div>
                       </div>
                    );
                 }

                 return (
                    <div key={task.id} className={clsx(
                       "flex items-center gap-4 p-4 rounded-xl border transition group bg-white",
                       task.isCompleted ? "border-slate-100 opacity-60" : "border-slate-200 hover:shadow-sm hover:border-indigo-200"
                    )}>
                       <button 
                          onClick={() => task.type === 'manual' && toggleManualTask(task.id)}
                          className={clsx(
                             "shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition",
                             task.type === 'manual' ? "cursor-pointer" : "cursor-default",
                             task.isCompleted 
                               ? "bg-green-500 text-white" 
                               : task.type === 'manual' ? "border-2 border-slate-300 hover:border-indigo-500" : "bg-slate-100 text-slate-400"
                          )}
                       >
                          {task.isCompleted ? <CheckCircle2 size={16} /> : task.type === 'transaction' ? <Hammer size={14} /> : <Phone size={14} />}
                       </button>

                       <div className="flex-1 min-w-0">
                          <div className={clsx("font-bold text-base mb-1 truncate", task.isCompleted && "text-slate-400 line-through")}>
                             {task.title}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                             {task.vendorAvatar && <img src={task.vendorAvatar} className="w-5 h-5 rounded-full" alt="" />}
                             <span className="truncate">{task.subtitle || '個人備忘'}</span>
                             {task.status && (
                                <span className={clsx("text-xs px-2 py-0.5 rounded ml-2", 
                                   task.status === TransactionStatus.PENDING_APPROVAL ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-600"
                                )}>
                                   {task.status}
                                </span>
                             )}
                          </div>
                       </div>

                       {task.type !== 'manual' && (
                          <Link 
                             to={task.type === 'transaction' ? `/transactions/${task.id}` : `/vendors/${task.vendorId}`}
                             className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition opacity-0 group-hover:opacity-100"
                          >
                             <ChevronRight size={20} />
                          </Link>
                       )}
                    </div>
                 );
              }) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                       <CheckCircle size={40} />
                    </div>
                    <p>本日沒有安排行程</p>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* 新增任務模態框 */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddTaskModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">新增任務</h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">任務標題 *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="輸入任務標題..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">任務描述</label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                  placeholder="輸入任務詳細描述..."
                  rows={3}
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">優先級</label>
                <select
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                >
                  <option value="LOW">低</option>
                  <option value="MEDIUM">中</option>
                  <option value="HIGH">高</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">截止日期</label>
                <div className="text-sm text-slate-500">
                  {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
              >
                取消
              </button>
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim() || fetcher.state === 'submitting'}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fetcher.state === 'submitting' ? '建立中...' : '建立任務'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <ClientOnly fallback={<div className="p-8 text-center text-slate-400">載入中...</div>}>
      <TasksContent />
    </ClientOnly>
  );
}
