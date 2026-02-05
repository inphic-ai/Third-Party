import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "~/services/auth.server";
import { requirePermission } from "~/utils/permissions.server";
import { db } from "../../db";
import { announcements } from "../../db/schema/system";
import { Bell, Calendar, AlertCircle, Eye, X, Image as ImageIcon } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  // 要求用戶必須登入
  const user = await requireUser(request);
  
  // 檢查用戶是否有系統公告權限
  requirePermission(user, '/announcements');
  
  try {
    console.log('[Announcements Loader] Loading announcements...');
    
    const allAnnouncements = await db.select().from(announcements);
    
    console.log(`[Announcements Loader] Loaded ${allAnnouncements.length} announcements`);
    
    const announcementsWithMapping = allAnnouncements.map(ann => ({
      id: ann.id,
      title: ann.title,
      content: ann.content,
      date: ann.date.toISOString().split('T')[0],
      priority: ann.priority === 'HIGH' ? 'High' : 'Normal',
      tags: Array.isArray(ann.tags) ? ann.tags : [],
      targetIdentity: Array.isArray(ann.targetIdentity) ? ann.targetIdentity : [],
      targetRegion: ann.targetRegion || undefined,
      imageUrl: ann.imageUrl,
      author: ann.author,
    }));
    
    return json({ announcements: announcementsWithMapping });
  } catch (error) {
    console.error('[Announcements Loader] Error:', error);
    return json({ announcements: [] });
  }
}

export default function Announcements() {
  const { announcements: dbAnnouncements } = useLoaderData<typeof loader>();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 頁面標題 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Bell size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800">系統全局公告</h1>
              <p className="text-slate-500 font-medium mt-1">即時掌握平台政策更新、兩岸物流波動與系統維護重要通知</p>
            </div>
          </div>
        </div>

        {/* 公告列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                    優先級
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                    發布時間
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                    公告標題
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dbAnnouncements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Bell size={48} className="text-slate-300" />
                        <p className="text-slate-400 font-medium">目前沒有公告</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dbAnnouncements.map((announcement: any) => (
                    <tr 
                      key={announcement.id}
                      className={clsx(
                        "hover:bg-slate-50 transition-colors",
                        announcement.priority === 'High' && "bg-red-50/30"
                      )}
                    >
                      {/* 優先級 */}
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider",
                          announcement.priority === 'High' 
                            ? "bg-red-100 text-red-700" 
                            : "bg-blue-100 text-blue-700"
                        )}>
                          {announcement.priority === 'High' && <AlertCircle size={12} />}
                          {announcement.priority === 'High' ? 'Emergency' : 'General'}
                        </span>
                      </td>
                      
                      {/* 發布時間 */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                          <Calendar size={16} className="text-slate-400" />
                          {announcement.date}
                        </div>
                      </td>
                      
                      {/* 公告標題 */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">
                          {announcement.title}
                        </div>
                        <div className="text-sm text-slate-500 mt-1 line-clamp-1">
                          {announcement.content}
                        </div>
                      </td>
                      
                      {/* 操作 */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedAnnouncement(announcement)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition cursor-pointer"
                        >
                          <Eye size={16} />
                          檢視
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 統計資訊 */}
        {dbAnnouncements.length > 0 && (
          <div className="mt-4 text-sm text-slate-500 text-center">
            共 {dbAnnouncements.length} 則公告
          </div>
        )}
      </div>

      {/* 公告詳情 Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal 標題區域 */}
            <div className={clsx(
              "px-8 py-6 border-b border-slate-100 sticky top-0 bg-white z-10",
              selectedAnnouncement.priority === 'High' ? "bg-red-50" : "bg-slate-50"
            )}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={clsx(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                    selectedAnnouncement.priority === 'High' 
                      ? "bg-gradient-to-br from-red-500 to-red-600 shadow-red-200" 
                      : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200"
                  )}>
                    <Bell size={28} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={clsx(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider",
                        selectedAnnouncement.priority === 'High' 
                          ? "bg-red-100 text-red-700" 
                          : "bg-blue-100 text-blue-700"
                      )}>
                        {selectedAnnouncement.priority === 'High' && <AlertCircle size={12} />}
                        {selectedAnnouncement.priority === 'High' ? 'Emergency' : 'General'}
                      </span>
                      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                        <Calendar size={14} />
                        {selectedAnnouncement.date}
                      </div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">
                      {selectedAnnouncement.title}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X size={24} className="text-slate-600" />
                </button>
              </div>
            </div>

            {/* Modal 內容區域 */}
            <div className="px-8 py-8">
              {/* 公告內容 */}
              <div className="prose prose-slate max-w-none mb-8">
                <p className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
              </div>

              {/* 公告圖片 */}
              {selectedAnnouncement.imageUrl && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon size={20} className="text-slate-600" />
                    <h3 className="text-lg font-bold text-slate-800">附件圖片</h3>
                  </div>
                  <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                    <img 
                      src={selectedAnnouncement.imageUrl} 
                      alt={selectedAnnouncement.title}
                      className="w-full cursor-pointer hover:opacity-90 transition"
                      onClick={() => window.open(selectedAnnouncement.imageUrl, '_blank')}
                      title="點擊查看大圖"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">點擊圖片可放大查看</p>
                </div>
              )}
            </div>

            {/* Modal 底部資訊 */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <div className="text-slate-500">
                  發布者：<span className="font-medium text-slate-700">{selectedAnnouncement.author || 'System Admin'}</span>
                </div>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-6 py-2 bg-slate-600 text-white rounded-lg font-bold hover:bg-slate-700 transition"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
