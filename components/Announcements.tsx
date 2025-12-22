import React from 'react';
import { MOCK_ANNOUNCEMENTS } from '../constants';
import { Megaphone, Calendar, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

export const Announcements: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
          <Megaphone size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">系統公告</h1>
          <p className="text-slate-500 text-sm">查看最新的政策更新與重要通知</p>
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_ANNOUNCEMENTS.map((announcement) => (
          <div 
            key={announcement.id} 
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={clsx(
                  "px-2 py-1 text-xs font-bold rounded",
                  announcement.priority === 'High' 
                    ? "bg-red-100 text-red-700" 
                    : "bg-blue-50 text-blue-600"
                )}>
                  {announcement.priority === 'High' ? '緊急' : '一般'}
                </span>
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <Calendar size={14} />
                  {announcement.date}
                </span>
              </div>
              {announcement.priority === 'High' && (
                <AlertTriangle size={20} className="text-red-500" />
              )}
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-2">{announcement.title}</h3>
            <p className="text-slate-600 leading-relaxed">
              {announcement.content}
            </p>
            
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
              <button className="text-sm text-blue-600 font-medium hover:underline">
                閱讀詳細內容 &rarr;
              </button>
            </div>
          </div>
        ))}

        {MOCK_ANNOUNCEMENTS.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
            <p>目前沒有任何公告</p>
          </div>
        )}
      </div>
    </div>
  );
};