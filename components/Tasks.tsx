
import React, { useState, useMemo } from 'react';
import { MOCK_VENDORS } from '../constants';
import { TransactionStatus } from '../types';
import { useTutorial } from './TutorialSystem';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Briefcase, 
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Phone,
  Hammer,
  Circle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

// Local Type for Unified Task View
type TaskType = 'transaction' | 'follow_up' | 'manual';

interface UnifiedTask {
  id: string;
  type: TaskType;
  date: string;
  title: string;
  subtitle?: string;
  time?: string;
  status?: string;
  vendorId?: string;
  vendorAvatar?: string;
  isCompleted?: boolean;
}

export const Tasks: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [manualTasks, setManualTasks] = useState<UnifiedTask[]>([]); // Mock local state for manual tasks
  const [newTaskInput, setNewTaskInput] = useState('');
  
  // Tutorial Hook
  const { showTutorial } = useTutorial();

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
    return MOCK_VENDORS.flatMap(v => 
      v.transactions.map(t => ({
        id: t.id,
        type: 'transaction' as TaskType,
        date: t.date,
        title: `工單: ${t.description}`,
        subtitle: v.name,
        status: t.status,
        vendorId: v.id,
        vendorAvatar: v.avatarUrl,
        isCompleted: t.status === TransactionStatus.PAID || t.status === TransactionStatus.APPROVED
      }))
    );
  }, []);

  // 2. Gather Follow-ups (Contact Logs with nextFollowUp)
  const followUpTasks: UnifiedTask[] = useMemo(() => {
    return MOCK_VENDORS.flatMap(v => 
      v.contactLogs
        .filter(log => log.nextFollowUp)
        .map(log => ({
          id: `follow-${log.id}`,
          type: 'follow_up' as TaskType,
          date: log.nextFollowUp!,
          title: `跟進: ${v.name}`,
          subtitle: log.note,
          vendorId: v.id,
          vendorAvatar: v.avatarUrl,
          isCompleted: false
        }))
    );
  }, []);

  // Combine All Tasks
  const allTasks = [...transactionTasks, ...followUpTasks, ...manualTasks];

  // Get tasks for selected date
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const todaysTasks = allTasks.filter(t => t.date === selectedDateStr);

  // Month Navigation
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  // Day Selection
  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  // Add Manual Task
  const handleAddTask = () => {
    if (!newTaskInput.trim()) return;
    const newTask: UnifiedTask = {
      id: `manual-${Date.now()}`,
      type: 'manual',
      date: selectedDateStr,
      title: newTaskInput,
      isCompleted: false
    };
    setManualTasks([...manualTasks, newTask]);
    setNewTaskInput('');
  };

  const toggleManualTask = (id: string) => {
    setManualTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const handleTutorialClick = () => {
    showTutorial('TASKS_GUIDE');
  };

  // Trigger tutorial on mount (optional, or just rely on button)
  // useEffect(() => { showTutorial('TASKS_GUIDE'); }, []);

  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  // Helper to count tasks per day for dots
  const getTaskCountForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allTasks.filter(t => t.date === dateStr).length;
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
          onClick={handleTutorialClick}
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
                   const taskCount = getTaskCountForDay(day);

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
                       {taskCount > 0 && !isSelected && (
                         <span className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full"></span>
                       )}
                     </button>
                   );
                })}
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
                   <div className="text-xl font-bold">{transactionTasks.length}</div>
                   <div className="text-xs text-indigo-200 mt-1">工單行程</div>
                </div>
             </div>
          </div>
        </div>

        {/* Right: Daily Agenda List */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
           {/* Agenda Header */}
           <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                 <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {selectedDateStr === new Date().toISOString().split('T')[0] ? '今日待辦' : `${selectedDate.getMonth() + 1}/${selectedDate.getDate()} 的待辦事項`}
                 </h2>
                 <p className="text-slate-500 text-sm mt-1">
                    共 {todaysTasks.length} 個項目 • {todaysTasks.filter(t => t.isCompleted).length} 已完成
                 </p>
              </div>
              <button 
                 onClick={() => setSelectedDate(new Date())}
                 className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition"
              >
                 回到今天
              </button>
           </div>

           {/* Quick Add */}
           <div className="p-4 border-b border-slate-100">
              <div className="relative">
                 <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                 <input 
                   type="text" 
                   className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                   placeholder="新增臨時任務 (按 Enter 建立)..."
                   value={newTaskInput}
                   onChange={(e) => setNewTaskInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                 />
              </div>
           </div>

           {/* Task List */}
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {todaysTasks.length > 0 ? todaysTasks.map(task => (
                 <div key={task.id} className={clsx(
                    "flex items-center gap-4 p-4 rounded-xl border transition group",
                    task.isCompleted ? "bg-slate-50 border-slate-100" : "bg-white border-slate-200 hover:shadow-md hover:border-indigo-200"
                 )}>
                    {/* Status Checkbox */}
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
                       {task.isCompleted ? <CheckCircle2 size={16} /> : task.type === 'transaction' ? <Hammer size={14} /> : task.type === 'follow_up' ? <Phone size={14} /> : null}
                    </button>

                    {/* Content */}
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

                    {/* Action */}
                    {task.type !== 'manual' && (
                       <Link 
                          to={task.type === 'transaction' ? `/transactions/${task.id}` : `/vendors/${task.vendorId}`}
                          className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition opacity-0 group-hover:opacity-100"
                       >
                          <ChevronRight size={20} />
                       </Link>
                    )}
                 </div>
              )) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                       <CheckCircle size={40} />
                    </div>
                    <p>今天沒有安排行程</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
