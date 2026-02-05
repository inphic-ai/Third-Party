import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUser, requirePermission } from "~/services/auth.server";
import { db } from "../../db";
import { announcements } from "../../db/schema/system";
import { eq } from "drizzle-orm";
import { Bell, Calendar, AlertCircle, ArrowLeft, Image as ImageIcon } from "lucide-react";
import clsx from "clsx";

export async function loader({ request, params }: LoaderFunctionArgs) {
  // 要求用戶必須登入
  const user = await requireUser(request);
  
  // 檢查用戶是否有系統公告權限
  requirePermission(user, '/announcements');
  
  const { id } = params;
  
  if (!id) {
    throw new Response("公告 ID 不存在", { status: 404 });
  }
  
  try {
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id));
    
    if (!announcement) {
      throw new Response("找不到此公告", { status: 404 });
    }
    
    return json({
      announcement: {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        date: announcement.date.toISOString().split('T')[0],
        priority: announcement.priority === 'HIGH' ? 'High' : 'Normal',
        imageUrl: announcement.imageUrl,
        author: announcement.author,
      }
    });
  } catch (error) {
    console.error('[Announcement Detail Loader] Error:', error);
    throw new Response("載入公告失敗", { status: 500 });
  }
}

export default function AnnouncementDetail() {
  const { announcement } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按鈕 */}
        <Link
          to="/announcements"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium mb-6 transition"
        >
          <ArrowLeft size={20} />
          返回公告列表
        </Link>

        {/* 公告內容卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* 標題區域 */}
          <div className={clsx(
            "px-8 py-6 border-b border-slate-100",
            announcement.priority === 'High' ? "bg-red-50" : "bg-slate-50"
          )}>
            <div className="flex items-start gap-4 mb-4">
              <div className={clsx(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                announcement.priority === 'High' 
                  ? "bg-gradient-to-br from-red-500 to-red-600 shadow-red-200" 
                  : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200"
              )}>
                <Bell size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={clsx(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider",
                    announcement.priority === 'High' 
                      ? "bg-red-100 text-red-700" 
                      : "bg-blue-100 text-blue-700"
                  )}>
                    {announcement.priority === 'High' && <AlertCircle size={12} />}
                    {announcement.priority === 'High' ? 'Emergency' : 'General'}
                  </span>
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Calendar size={14} />
                    {announcement.date}
                  </div>
                </div>
                <h1 className="text-2xl font-black text-slate-800">
                  {announcement.title}
                </h1>
              </div>
            </div>
          </div>

          {/* 內容區域 */}
          <div className="px-8 py-8">
            {/* 公告內容 */}
            <div className="prose prose-slate max-w-none mb-8">
              <p className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap">
                {announcement.content}
              </p>
            </div>

            {/* 公告圖片 */}
            {announcement.imageUrl && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon size={20} className="text-slate-600" />
                  <h2 className="text-lg font-bold text-slate-800">附件圖片</h2>
                </div>
                <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                  <img 
                    src={announcement.imageUrl} 
                    alt={announcement.title}
                    className="w-full cursor-pointer hover:opacity-90 transition"
                    onClick={() => window.open(announcement.imageUrl, '_blank')}
                    title="點擊查看大圖"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">點擊圖片可放大查看</p>
              </div>
            )}
          </div>

          {/* 底部資訊 */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <div className="text-slate-500">
                發布者：<span className="font-medium text-slate-700">{announcement.author || 'System Admin'}</span>
              </div>
              <div className="text-slate-400">
                公告 ID: {announcement.id}
              </div>
            </div>
          </div>
        </div>

        {/* 返回按鈕（底部） */}
        <div className="mt-6 text-center">
          <Link
            to="/announcements"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg font-bold hover:bg-slate-700 transition"
          >
            <ArrowLeft size={20} />
            返回公告列表
          </Link>
        </div>
      </div>
    </div>
  );
}
