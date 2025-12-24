
import React, { useState } from 'react';
import { MOCK_ANNOUNCEMENTS, MOCK_USERS } from './constants';
import { Announcement } from './types';
import { Megaphone, Calendar, AlertTriangle, Plus, Edit2, Trash2, X, Save, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

// Mock current user - In a real app this comes from context
const CURRENT_USER = MOCK_USERS[0]; 
const IS_ADMIN = CURRENT_USER.role === 'System Admin';

export const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    priority: 'Normal',
    date: new Date().toISOString().split('T')[0]
  });

  const openModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingId(announcement.id);
      setFormData({ ...announcement });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        content: '',
        priority: 'Normal',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('確定要刪除此公告嗎？此動作無法復原。')) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.title || !formData.content) return;

    if (editingId) {
      // Update
      setAnnouncements(prev => prev.map(a => 
        a.id === editingId ? { ...a, ...formData } as Announcement : a
      ));
    } else {
      // Create
      const newAnnouncement: Announcement = {
        id: `ann-${Date.now()}`,
        title: formData.title!,
        content: formData.content!,
        date: formData.date || new Date().toISOString().split('T')[0],
        priority: formData.priority as 'High' | 'Normal' || 'Normal'
      };
      setAnnouncements(prev => [newAnnouncement, ...prev]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Megaphone size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">系統公告</h1>
            <p className="text-slate-500 text-sm">查看最新的政策更新與重要通知</p>
          </div>
        </div>
        
        {IS_ADMIN && (
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-800 transition"
          >
            <Plus size={18} /> 發布新公告
          </button>
        )}
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div 
            key={announcement.id} 
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition hover:shadow-md relative group"
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
              
              <div className="flex items-center gap-2">
                {announcement.priority === 'High' && (
                  <AlertTriangle size={20} className="text-red-500" />
                )}
                {IS_ADMIN && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openModal(announcement)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="編輯"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(announcement.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="刪除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-2">{announcement.title}</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {announcement.content}
            </p>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
            <p>目前沒有任何公告</p>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                {editingId ? '編輯公告' : '發布新公告'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">標題</label>
                <input 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="請輸入公告標題"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">重要性</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value as 'High' | 'Normal'})}
                  >
                    <option value="Normal">一般通知</option>
                    <option value="High">緊急重要</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">發布日期</label>
                  <input 
                    type="date"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">內容</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  placeholder="請輸入公告內容..."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-sm"
              >
                取消
              </button>
              <button 
                onClick={handleSave}
                disabled={!formData.title || !formData.content}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} /> 儲存發布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
