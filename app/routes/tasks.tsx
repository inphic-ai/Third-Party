import type { MetaFunction } from "@remix-run/node";
import { 
  Briefcase, Plus, CheckCircle, Clock, AlertCircle,
  Calendar, User, Tag
} from 'lucide-react';
import { clsx } from 'clsx';

export const meta: MetaFunction = () => {
  return [
    { title: "日常任務 - PartnerLink Pro" },
    { name: "description", content: "管理日常工作任務與進度追蹤" },
  ];
};

// 模擬任務資料
const MOCK_TASKS = [
  {
    id: '1',
    title: '聯繫大發水電確認維修時間',
    description: '主會客室空調維修案件，需確認師傅到場時間',
    status: 'pending' as const,
    priority: 'high' as const,
    dueDate: '2026-01-29',
    assignee: '王小明',
    tags: ['維修', '空調'],
  },
  {
    id: '2',
    title: '審核永興冷凍請款單',
    description: '中央空調保養費用請款審核',
    status: 'in_progress' as const,
    priority: 'medium' as const,
    dueDate: '2026-01-30',
    assignee: '李經理',
    tags: ['請款', '審核'],
  },
  {
    id: '3',
    title: '更新廠商評分資料',
    description: '完成 Q4 廠商服務品質評分',
    status: 'completed' as const,
    priority: 'low' as const,
    dueDate: '2026-01-25',
    assignee: '張小華',
    tags: ['評分', '季度任務'],
  },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'completed':
      return { label: '已完成', icon: <CheckCircle size={14} />, className: 'bg-emerald-50 text-emerald-600' };
    case 'in_progress':
      return { label: '進行中', icon: <Clock size={14} />, className: 'bg-blue-50 text-blue-600' };
    default:
      return { label: '待處理', icon: <AlertCircle size={14} />, className: 'bg-amber-50 text-amber-600' };
  }
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'high':
      return { label: '高', className: 'bg-rose-100 text-rose-600' };
    case 'medium':
      return { label: '中', className: 'bg-amber-100 text-amber-600' };
    default:
      return { label: '低', className: 'bg-slate-100 text-slate-600' };
  }
};

export default function TasksPage() {
  const completedCount = MOCK_TASKS.filter(t => t.status === 'completed').length;
  const pendingCount = MOCK_TASKS.filter(t => t.status === 'pending').length;
  const inProgressCount = MOCK_TASKS.filter(t => t.status === 'in_progress').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 頁首 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Briefcase size={28} className="text-amber-600" />
            日常任務
          </h1>
          <p className="text-slate-500 mt-1">管理日常工作任務與進度追蹤</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition font-bold">
          <Plus size={18} />
          新增任務
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-3xl font-black text-slate-800">{MOCK_TASKS.length}</p>
          <p className="text-sm text-slate-500 mt-1">總任務數</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-3xl font-black text-amber-600">{pendingCount}</p>
          <p className="text-sm text-slate-500 mt-1">待處理</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-3xl font-black text-blue-600">{inProgressCount}</p>
          <p className="text-sm text-slate-500 mt-1">進行中</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-3xl font-black text-emerald-600">{completedCount}</p>
          <p className="text-sm text-slate-500 mt-1">已完成</p>
        </div>
      </div>

      {/* 任務列表 */}
      <div className="space-y-4">
        {MOCK_TASKS.map(task => {
          const statusConfig = getStatusConfig(task.status);
          const priorityConfig = getPriorityConfig(task.priority);
          
          return (
            <div 
              key={task.id}
              className={clsx(
                "bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-lg cursor-pointer",
                task.status === 'completed' ? "border-slate-100 opacity-70" : "border-slate-100 hover:border-amber-200"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={clsx(
                  "p-3 rounded-xl shrink-0",
                  statusConfig.className
                )}>
                  {statusConfig.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={clsx(
                      "text-lg font-bold",
                      task.status === 'completed' ? "text-slate-400 line-through" : "text-slate-800"
                    )}>
                      {task.title}
                    </h3>
                    <span className={clsx(
                      "px-2 py-0.5 text-xs font-bold rounded",
                      priorityConfig.className
                    )}>
                      {priorityConfig.label}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">
                    {task.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>截止：{task.dueDate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{task.assignee}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {task.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-100 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <span className={clsx(
                  "px-3 py-1 text-xs font-bold rounded-lg shrink-0",
                  statusConfig.className
                )}>
                  {statusConfig.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
