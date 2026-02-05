import { useState, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import { X } from 'lucide-react';

interface EditAnnouncementModalProps {
  announcement: {
    id: string;
    title: string;
    content: string;
    priority: string;
  };
  onClose: () => void;
}

export function EditAnnouncementModal({ announcement, onClose }: EditAnnouncementModalProps) {
  const fetcher = useFetcher();
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [priority, setPriority] = useState(announcement.priority);

  const isSubmitting = fetcher.state === 'submitting';

  // 當提交成功後關閉 Modal
  useEffect(() => {
    if (fetcher.data?.success) {
      onClose();
    }
  }, [fetcher.data, onClose]);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      alert('請填寫標題和內容');
      return;
    }

    fetcher.submit(
      {
        intent: 'updateAnnouncement',
        id: announcement.id,
        title: title.trim(),
        content: content.trim(),
        priority
      },
      { method: 'post' }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-800">編輯公告</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* 標題 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              標題 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="輸入公告標題..."
              maxLength={100}
              disabled={isSubmitting}
            />
            <div className="text-xs text-slate-400 mt-1 text-right">
              {title.length}/100
            </div>
          </div>

          {/* 內容 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              內容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[200px]"
              placeholder="輸入公告內容..."
              maxLength={2000}
              disabled={isSubmitting}
            />
            <div className="text-xs text-slate-400 mt-1 text-right">
              {content.length}/2000
            </div>
          </div>

          {/* 優先級 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              優先級
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="NORMAL"
                  checked={priority === 'NORMAL'}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={isSubmitting}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-700">一般</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="HIGH"
                  checked={priority === 'HIGH'}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={isSubmitting}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-700">緊急</span>
              </label>
            </div>
          </div>

          {/* 錯誤訊息 */}
          {fetcher.data?.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {fetcher.data.error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500">
            提示：按 Ctrl/Cmd + Enter 快速更新
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-white transition"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? '更新中...' : '更新公告'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
