import type { MetaFunction } from "@remix-run/node";
import { 
  MessageCircle, Search, Phone, Mail, 
  Clock, CheckCircle, AlertCircle, User
} from 'lucide-react';
import { clsx } from 'clsx';
import { ContactStatus } from '../types';

export const meta: MetaFunction = () => {
  return [
    { title: "通訊中心 - PartnerLink Pro" },
    { name: "description", content: "管理廠商聯繫紀錄與通訊" },
  ];
};

// 模擬聯繫紀錄
const MOCK_CONTACT_LOGS = [
  {
    id: '1',
    vendorName: '大發水電工程行',
    contactName: '王師傅',
    date: '2026-01-28 14:30',
    status: ContactStatus.SUCCESS,
    note: '確認明天上午 10 點到場維修',
    method: 'phone' as const,
  },
  {
    id: '2',
    vendorName: '永興冷凍空調',
    contactName: '李經理',
    date: '2026-01-28 11:00',
    status: ContactStatus.BUSY,
    note: '對方表示在忙，約下午再回電',
    method: 'phone' as const,
  },
  {
    id: '3',
    vendorName: '順達玻璃行',
    contactName: '張老闆',
    date: '2026-01-27 16:45',
    status: ContactStatus.RESERVED,
    note: '已預約週五下午施工',
    method: 'phone' as const,
  },
  {
    id: '4',
    vendorName: '大發水電工程行',
    contactName: '王師傅',
    date: '2026-01-27 09:00',
    status: ContactStatus.TOO_HIGH,
    note: '報價 35,000，超出預算，需再議價',
    method: 'phone' as const,
  },
];

const getStatusConfig = (status: ContactStatus) => {
  switch (status) {
    case ContactStatus.SUCCESS:
      return { label: '聯繫成功', icon: <CheckCircle size={14} />, className: 'bg-emerald-50 text-emerald-600' };
    case ContactStatus.BUSY:
      return { label: '在忙', icon: <Clock size={14} />, className: 'bg-amber-50 text-amber-600' };
    case ContactStatus.RESERVED:
      return { label: '已預約', icon: <CheckCircle size={14} />, className: 'bg-blue-50 text-blue-600' };
    case ContactStatus.TOO_HIGH:
      return { label: '報價過高', icon: <AlertCircle size={14} />, className: 'bg-rose-50 text-rose-600' };
    case ContactStatus.NO_TIME:
      return { label: '最近沒空', icon: <Clock size={14} />, className: 'bg-slate-100 text-slate-600' };
    case ContactStatus.BAD_ATTITUDE:
      return { label: '態度不好', icon: <AlertCircle size={14} />, className: 'bg-rose-50 text-rose-600' };
    default:
      return { label: status, icon: <Clock size={14} />, className: 'bg-slate-100 text-slate-600' };
  }
};

export default function CommunicationPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 頁首 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <MessageCircle size={28} className="text-indigo-600" />
            通訊中心
          </h1>
          <p className="text-slate-500 mt-1">管理廠商聯繫紀錄與通訊</p>
        </div>
      </div>

      {/* 搜尋 */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="搜尋廠商名稱、聯絡人..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-2xl font-black text-slate-800">{MOCK_CONTACT_LOGS.length}</p>
          <p className="text-sm text-slate-500">總聯繫次數</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-2xl font-black text-emerald-600">
            {MOCK_CONTACT_LOGS.filter(l => l.status === ContactStatus.SUCCESS).length}
          </p>
          <p className="text-sm text-slate-500">聯繫成功</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-2xl font-black text-blue-600">
            {MOCK_CONTACT_LOGS.filter(l => l.status === ContactStatus.RESERVED).length}
          </p>
          <p className="text-sm text-slate-500">已預約</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-2xl font-black text-amber-600">
            {MOCK_CONTACT_LOGS.filter(l => l.status === ContactStatus.BUSY).length}
          </p>
          <p className="text-sm text-slate-500">待回電</p>
        </div>
      </div>

      {/* 聯繫紀錄列表 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">最近聯繫紀錄</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {MOCK_CONTACT_LOGS.map(log => {
            const statusConfig = getStatusConfig(log.status);
            return (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    {log.method === 'phone' ? <Phone size={18} /> : <Mail size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800">{log.vendorName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-sm text-slate-500">{log.contactName}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{log.note}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{log.date}</span>
                      </div>
                    </div>
                  </div>
                  <span className={clsx(
                    "px-2 py-1 text-xs font-bold rounded-lg flex items-center gap-1 shrink-0",
                    statusConfig.className
                  )}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
