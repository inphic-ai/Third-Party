import type { MetaFunction } from "@remix-run/node";
import { 
  Megaphone, Plus, AlertCircle, Info, Clock, User
} from 'lucide-react';
import { clsx } from 'clsx';

export const meta: MetaFunction = () => {
  return [
    { title: "系統公告 - PartnerLink Pro" },
    { name: "description", content: "查看最新公告與通知" },
  ];
};

// 模擬公告資料
const MOCK_ANNOUNCEMENTS = [
  {
    id: '1',
    title: '2026 年度廠商評鑑開始',
    content: '請各部門於月底前完成主要合作廠商的年度評分。評鑑結果將影響下一年度的合作優先順序。',
    date: '2026-01-20',
    priority: 'High' as const,
    author: '系統管理員',
  },
  {
    id: '2',
    title: '農曆新年假期公告',
    content: '農曆新年期間（1/28-2/4）系統維護時間調整，緊急事項請聯繫值班人員。',
    date: '2026-01-18',
    priority: 'High' as const,
    author: '人事部',
  },
  {
    id: '3',
    title: '新版請款流程上線',
    content: '即日起請款流程改為線上審核，請各位同仁熟悉新系統操作方式。',
    date: '2026-01-15',
    priority: 'Normal' as const,
    author: '財務部',
  },
  {
    id: '4',
    title: '廠商資料更新提醒',
    content: '請各負責人確認所管理廠商的聯絡資訊是否正確，如有變更請及時更新。',
    date: '2026-01-10',
    priority: 'Normal' as const,
    author: '系統管理員',
  },
];

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 頁首 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Megaphone size={28} className="text-rose-600" />
            系統公告
          </h1>
          <p className="text-slate-500 mt-1">查看最新公告與通知</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition font-bold">
          <Plus size={18} />
          發布公告
        </button>
      </div>

      {/* 重要公告提示 */}
      {MOCK_ANNOUNCEMENTS.filter(a => a.priority === 'High').length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-rose-600 shrink-0" />
          <p className="text-rose-700 text-sm font-medium">
            您有 {MOCK_ANNOUNCEMENTS.filter(a => a.priority === 'High').length} 則重要公告需要關注
          </p>
        </div>
      )}

      {/* 公告列表 */}
      <div className="space-y-4">
        {MOCK_ANNOUNCEMENTS.map(announcement => (
          <div 
            key={announcement.id}
            className={clsx(
              "bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-lg cursor-pointer",
              announcement.priority === 'High' 
                ? "border-rose-200 hover:border-rose-300" 
                : "border-slate-100 hover:border-slate-200"
            )}
          >
            <div className="flex items-start gap-4">
              <div className={clsx(
                "p-3 rounded-xl shrink-0",
                announcement.priority === 'High' 
                  ? "bg-rose-100 text-rose-600" 
                  : "bg-blue-100 text-blue-600"
              )}>
                {announcement.priority === 'High' ? (
                  <AlertCircle size={20} />
                ) : (
                  <Info size={20} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-slate-800">
                    {announcement.title}
                  </h3>
                  {announcement.priority === 'High' && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-bold rounded">
                      重要
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {announcement.content}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{announcement.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>{announcement.author}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <p className="text-3xl font-black text-slate-800">{MOCK_ANNOUNCEMENTS.length}</p>
          <p className="text-sm text-slate-500 mt-1">總公告數</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <p className="text-3xl font-black text-rose-600">
            {MOCK_ANNOUNCEMENTS.filter(a => a.priority === 'High').length}
          </p>
          <p className="text-sm text-slate-500 mt-1">重要公告</p>
        </div>
      </div>
    </div>
  );
}
