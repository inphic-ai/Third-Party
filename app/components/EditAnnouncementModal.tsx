import { useState, useEffect, useRef } from 'react';
import { useFetcher } from '@remix-run/react';
import { X, Megaphone, FileText, AlertCircle, Image as ImageIcon, Upload } from 'lucide-react';

interface EditAnnouncementModalProps {
  announcement: {
    id: string;
    title: string;
    content: string;
    priority: string;
    imageUrl?: string | null;
  };
  onClose: () => void;
}

export function EditAnnouncementModal({ announcement, onClose }: EditAnnouncementModalProps) {
  const fetcher = useFetcher();
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [priority, setPriority] = useState(announcement.priority);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(announcement.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = fetcher.state === 'submitting';

  // 當提交成功後關閉 Modal
  useEffect(() => {
    if (fetcher.data?.success) {
      onClose();
    }
  }, [fetcher.data, onClose]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 驗證檔案類型
      if (!file.type.startsWith('image/')) {
        alert('請選擇圖片檔案');
        return;
      }
      // 驗證檔案大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('圖片大小不能超過 5MB');
        return;
      }
      
      setImageFile(file);
      setRemoveImage(false);
      
      // 生成預覽
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert('請填寫標題和內容');
      return;
    }

    const formData = new FormData();
    formData.append('intent', 'updateAnnouncement');
    formData.append('id', announcement.id);
    formData.append('title', title.trim());
    formData.append('content', content.trim());
    formData.append('priority', priority);
    
    // 處理圖片
    if (removeImage) {
      // 刪除圖片
      formData.append('imageUrl', '');
    } else if (imageFile) {
      // 上傳新圖片
      setIsUploading(true);
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('圖片上傳失敗');
        }
        
        const { url } = await uploadResponse.json();
        formData.append('imageUrl', url);
      } catch (error) {
        alert('圖片上傳失敗，請重試');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    } else if (announcement.imageUrl) {
      // 保持原有圖片
      formData.append('imageUrl', announcement.imageUrl);
    }

    fetcher.submit(formData, { method: 'post' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Megaphone size={24} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800">編輯系統公告</h2>
            <p className="text-sm text-slate-500">修改公告標題和內容</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* 標題 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText size={16} />
                公告標題 *
              </div>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：系統維護通知"
              maxLength={100}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-1">{title.length}/100 字元</p>
          </div>

          {/* 內容 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              公告內容 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="請輸入公告內容..."
              rows={8}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{content.length} 字元</p>
          </div>

          {/* 優先級 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                優先級
              </div>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="NORMAL"
                  checked={priority === 'NORMAL'}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-slate-700">一般</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="HIGH"
                  checked={priority === 'HIGH'}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-sm text-red-700 font-semibold">緊急</span>
              </label>
            </div>
          </div>

          {/* 圖片上傳 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} />
                公告圖片 (選填)
              </div>
            </label>
            
            {!imagePreview ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 mb-1">點擊上傳圖片</p>
                <p className="text-xs text-slate-400">支援 JPG, PNG, GIF，最大 5MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative border border-slate-300 rounded-lg overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="預覽" 
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                >
                  <X size={16} />
                </button>
                {!imageFile && announcement.imageUrl && (
                  <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    現有圖片
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 提示訊息 */}
          {fetcher.data?.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{fetcher.data.error}</p>
            </div>
          )}

          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            💡 提示：按 Ctrl/Cmd + Enter 快速更新，按 Esc 取消
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isUploading}
            className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-white transition disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading || !title.trim() || !content.trim()}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '更新中...' : isUploading ? '上傳中...' : '✓ 更新公告'}
          </button>
        </div>
      </div>
    </div>
  );
}
