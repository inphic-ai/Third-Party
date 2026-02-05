import { useState } from 'react';
import { useLoaderData, Link, useFetcher } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { db } from '../services/db.server';
import { announcements } from '../../db/schema/system';
import { eq } from 'drizzle-orm';
import { requireUser } from '~/services/auth.server';
import { requirePermission } from '~/utils/permissions.server';
import { 
  Megaphone, Calendar, Bell, 
  Info, ShieldCheck, Tag, User, MapPin, Hammer, Package, Factory, ChevronRight,
  Pencil, Trash2, X, Save
} from 'lucide-react';
import { clsx } from 'clsx';

import { ClientOnly } from '~/components/ClientOnly';
import { MOCK_ANNOUNCEMENTS } from '~/constants';
import { ServiceType } from '~/types';

export const meta: MetaFunction = () => {
  return [
    { title: "系統公告 - PartnerLink Pro" },
    { name: "description", content: "即時掌握平台政策更新、兩岸物流波動與系統維護重要通知" },
  ];
};

// Action 函數處理編輯與刪除
export async function action({ request }: any) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'updateAnnouncement') {
    try {
      const id = formData.get('id') as string;
      const title = formData.get('title') as string;
      const content = formData.get('content') as string;
      const priority = formData.get('priority') as string;

      if (!id || !title || !content) {
        return json({ success: false, error: '缺少必填欄位' }, { status: 400 });
      }

      await db.update(announcements)
        .set({ 
          title, 
          content, 
          priority: priority === 'High' ? 'HIGH' : 'NORMAL',
          updatedAt: new Date()
        })
        .where(eq(announcements.id, id));

      return json({ success: true, error: null });
    } catch (error) {
      console.error('Failed to update announcement:', error);
      return json({ success: false, error: '更新失敗' }, { status: 500 });
    }
  }

  if (intent === 'deleteAnnouncement') {
    try {
      const id = formData.get('id') as string;

      if (!id) {
        return json({ success: false, error: '缺少公告 ID' }, { status: 400 });
      }

      await db.delete(announcements).where(eq(announcements.id, id));

      return json({ success: true, error: null });
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      return json({ success: false, error: '刪除失敗' }, { status: 500 });
    }
  }

  return json({ success: false, error: 'Invalid intent' }, { status: 400 });
}

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
    }));
    
    return json({ announcements: announcementsWithMapping });
  } catch (error) {
    console.error('[Announcements Loader] Error:', error);
    return json({ announcements: [] });
  }
}

function AnnouncementsContent() {
  const { announcements: dbAnnouncements } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', priority: 'Normal' });

  const handleEdit = (announcement: any) => {
    setEditingId(announcement.id);
    setEditForm({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const formData = new FormData();
    formData.append('intent', 'updateAnnouncement');
    formData.append('id', editingId);
    formData.append('title', editForm.title);
    formData.append('content', editForm.content);
    formData.append('priority', editForm.priority);
    fetcher.submit(formData, { method: 'post' });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('確定要刪除這個公告嗎？')) return;
    const formData = new FormData();
    formData.append('intent', 'deleteAnnouncement');
    formData.append('id', id);
    fetcher.submit(formData, { method: 'post' });
  };

  const getIdentityIcon = (st: ServiceType) => {
    switch (st) {
      case ServiceType.LABOR: return <Hammer size={12} />;
      case ServiceType.PRODUCT: return <Package size={12} />;
      case ServiceType.MANUFACTURING: return <Factory size={12} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="p-6 bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-100 relative z-10 group-hover:scale-110 transition-transform duration-500">
          <Bell size={48} />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-4">
            系統全局公告
            <span className="text-[10px] bg-green-100 text-green-700 px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] shadow-sm">Live Updates</span>
          </h1>
          <p className="text-slate-500 font-bold mt-2 text-lg">
            即時掌握平台政策更新、兩岸物流波動與系統維護重要通知
          </p>
        </div>
        <Megaphone size={160} className="absolute -top-10 -right-10 text-slate-50 opacity-10 rotate-12" />
      </div>

      <div className="space-y-8">
        {dbAnnouncements.map((announcement: any) => (
          <div 
            key={announcement.id} 
            className={clsx(
              "bg-white p-8 rounded-[2.5rem] shadow-sm border transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200 group relative overflow-hidden",
              announcement.priority === 'High' ? "border-red-100 bg-red-50/5" : "border-slate-50"
            )}
          >
            {announcement.priority === 'High' && (
              <div className="absolute top-0 left-0 w-2.5 h-full bg-red-500 animate-pulse"></div>
            )}
            
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className={clsx(
                  "px-4 py-2 text-[10px] font-black rounded-xl uppercase tracking-[0.2em] shadow-sm",
                  announcement.priority === 'High' 
                    ? "bg-red-100 text-red-700 animate-bounce" 
                    : "bg-blue-100 text-blue-700"
                )}>
                  {announcement.priority === 'High' ? 'Emergency' : 'General'}
                </span>
                <span className="text-slate-400 text-xs font-bold flex items-center gap-2 font-mono">
                  <Calendar size={14} />
                  {announcement.date}
                </span>

                {/* 受眾身分標籤 */}
                {announcement.targetIdentity && announcement.targetIdentity.map(ti => (
                  <Link 
                    key={ti}
                    to={`/vendors?search=${ti}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white transition-all rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100"
                  >
                    {getIdentityIcon(ti)}
                    對象: {ti}
                  </Link>
                ))}

                {/* 地區標籤 */}
                {announcement.targetRegion && (
                   <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                      <MapPin size={12} /> 地區: {announcement.targetRegion}
                   </span>
                )}
              </div>
              <div className="flex gap-2">
                {editingId === announcement.id ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="p-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition"
                      title="儲存"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                      title="取消"
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            
            {editingId === announcement.id ? (
              <div className="space-y-4 mb-10">
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="公告標題"
                />
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl font-medium text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="公告內容"
                />
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Normal">一般優先</option>
                  <option value="High">高優先</option>
                </select>
              </div>
            ) : (
              <>
                <h3 className={clsx(
                  "text-2xl font-black mb-4 transition-colors tracking-tight", 
                  announcement.priority === 'High' ? "text-red-900" : "text-slate-800 group-hover:text-blue-600"
                )}>
                  {announcement.title}
                </h3>
                
                <p className="text-slate-600 leading-relaxed font-bold text-base mb-10 max-w-3xl">
                  {announcement.content}
                </p>
              </>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-8 border-t border-slate-50">
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100">
                  <Tag size={12}/> #平台政策
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 px-3 py-1.5">
                   <User size={12}/> FROM: {announcement.author || 'SYSTEM ADMIN'}
                </span>
              </div>
              <button className="text-sm text-slate-900 font-black hover:text-blue-600 flex items-center gap-3 transition-all group/btn whitespace-nowrap uppercase tracking-widest">
                Read Bulletin <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}

        {dbAnnouncements.length === 0 && (
          <div className="text-center py-24 text-slate-300 bg-white rounded-[3rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
               <Megaphone size={48} className="opacity-20" />
            </div>
            <p className="font-black text-xl tracking-[0.2em] uppercase">No active notices</p>
            <p className="text-sm font-medium mt-2">目前尚無任何發布公告，請靜待管理員更新。</p>
          </div>
        )}
      </div>


    </div>
  );
}

export default function AnnouncementsPage() {
  return (
    <ClientOnly fallback={<div className="p-8 text-center text-slate-400">載入中...</div>}>
      <AnnouncementsContent />
    </ClientOnly>
  );
}
