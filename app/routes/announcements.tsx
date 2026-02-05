import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUser, requirePermission } from "~/services/auth.server";
import { db } from "../../db";
import { announcements } from "../../db/schema/system";
import { Bell, Calendar, AlertCircle, Eye } from "lucide-react";
import clsx from "clsx";

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
    }));
    
    return json({ announcements: announcementsWithMapping });
  } catch (error) {
    console.error('[Announcements Loader] Error:', error);
    return json({ announcements: [] });
  }
}

export default function Announcements() {
  const { announcements: dbAnnouncements } = useLoaderData<typeof loader>();

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
                        <Link
                          to={`/announcements/${announcement.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                        >
                          <Eye size={16} />
                          檢視
                        </Link>
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
    </div>
  );
}
