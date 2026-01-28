import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { 
  Megaphone, Calendar, Bell, 
  Info, ShieldCheck, Tag, User, MapPin, Hammer, Package, Factory, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { Layout } from '~/components/Layout';
import { ClientOnly } from '~/components/ClientOnly';
import { MOCK_ANNOUNCEMENTS } from '~/constants';
import { ServiceType } from '~/types';

export const meta: MetaFunction = () => {
  return [
    { title: "系統公告 - PartnerLink Pro" },
    { name: "description", content: "即時掌握平台政策更新、兩岸物流波動與系統維護重要通知" },
  ];
};

function AnnouncementsContent() {
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
        {MOCK_ANNOUNCEMENTS.map((announcement) => (
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
                 <ShieldCheck size={28} className={clsx(announcement.priority === 'High' ? "text-red-500" : "text-blue-500 opacity-20")} />
              </div>
            </div>
            
            <h3 className={clsx(
              "text-2xl font-black mb-4 transition-colors tracking-tight", 
              announcement.priority === 'High' ? "text-red-900" : "text-slate-800 group-hover:text-blue-600"
            )}>
              {announcement.title}
            </h3>
            
            <p className="text-slate-600 leading-relaxed font-bold text-base mb-10 max-w-3xl">
              {announcement.content}
            </p>
            
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

        {MOCK_ANNOUNCEMENTS.length === 0 && (
          <div className="text-center py-24 text-slate-300 bg-white rounded-[3rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
               <Megaphone size={48} className="opacity-20" />
            </div>
            <p className="font-black text-xl tracking-[0.2em] uppercase">No active notices</p>
            <p className="text-sm font-medium mt-2">目前尚無任何發布公告，請靜待管理員更新。</p>
          </div>
        )}
      </div>

      <div className="bg-slate-900 p-12 rounded-[3rem] text-white mt-20 flex flex-col lg:flex-row lg:items-center justify-between shadow-2xl relative overflow-hidden">
         <div className="relative z-10">
            <h4 className="text-3xl font-black mb-3 flex items-center gap-4">
               <Info className="text-blue-400" size={32}/> 
               訂閱戰術通知
            </h4>
            <p className="text-slate-400 text-lg font-medium max-w-xl leading-relaxed">
               當與您關聯的廠商或「重點監控地區」有緊急政策更新時，系統將主動發送 LINE/WeChat/Email 推播通知。
            </p>
         </div>
         <button className="bg-white text-slate-900 px-12 py-5 rounded-[1.5rem] font-black hover:bg-blue-50 transition active:scale-95 shadow-2xl mt-8 lg:mt-0 relative z-10 uppercase tracking-[0.2em] text-sm">
            Enable Alerts
         </button>
         <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  return (
    <Layout>
      <ClientOnly fallback={<div className="p-8 text-center text-slate-400">載入中...</div>}>
        <AnnouncementsContent />
      </ClientOnly>
    </Layout>
  );
}
