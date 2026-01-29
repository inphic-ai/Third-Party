import { X, ChevronLeft, ChevronRight, Upload, Save, Edit2, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  description?: string;
}

interface ImageLightboxProps {
  photos: MediaItem[];
  activeIndex: number;
  title?: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  onUpload?: (file: File) => void;
  onUpdateDescription?: (photoId: string, description: string) => void;
}

export function ImageLightbox({
  photos,
  activeIndex,
  title = 'Image Gallery',
  onClose,
  onPrev,
  onNext,
  onSelect,
  onUpload,
  onUpdateDescription
}: ImageLightboxProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  if (photos.length === 0) return null;

  const currentPhoto = photos[activeIndex];
  const isVideo = currentPhoto.type === 'video';

  const handleEditDescription = () => {
    setEditedDescription(currentPhoto.description || '');
    setIsEditingDescription(true);
  };

  const handleSaveDescription = () => {
    if (onUpdateDescription) {
      onUpdateDescription(currentPhoto.id, editedDescription);
    }
    setIsEditingDescription(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex animate-in fade-in duration-300">
      {/* Left Side: Main Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-8 flex justify-between items-center border-b border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">
              {title}
            </span>
            <h4 className="text-white font-black text-lg tracking-tight">
              {isVideo ? '影片' : '影像'}細節檢視 ({activeIndex + 1} / {photos.length})
            </h4>
          </div>
          <button 
            onClick={onClose} 
            className="p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X size={32} />
          </button>
        </div>

        {/* Main Media Viewer */}
        <div className="flex-1 relative flex items-center justify-center px-20">
          <button 
            disabled={activeIndex === 0}
            onClick={onPrev}
            className="absolute left-10 p-6 text-white hover:bg-white/10 rounded-full transition disabled:opacity-20 disabled:cursor-not-allowed z-10"
          >
            <ChevronLeft size={48} />
          </button>

          <div className="max-w-4xl w-full h-full flex flex-col items-center justify-center py-10">
            {isVideo ? (
              <video 
                src={currentPhoto.url}
                controls
                className="max-h-[60vh] max-w-full rounded-3xl shadow-2xl border-4 border-white/5 animate-in zoom-in-95 duration-500"
                autoPlay
              />
            ) : (
              <img 
                src={currentPhoto.url} 
                className="max-h-[60vh] object-contain rounded-3xl shadow-2xl border-4 border-white/5 animate-in zoom-in-95 duration-500" 
                alt="Fullscreen" 
              />
            )}
            
            {/* Description Area */}
            <div className="mt-8 w-full max-w-2xl">
              {isEditingDescription ? (
                <div className="space-y-3">
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium text-base focus:outline-none focus:border-indigo-400 resize-none"
                    rows={3}
                    placeholder={`輸入${isVideo ? '影片' : '照片'}說明...`}
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setIsEditingDescription(false)}
                      className="px-6 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all font-medium"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-medium flex items-center gap-2"
                    >
                      <Save size={18} />
                      儲存
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl">
                    <p className="text-white font-medium text-base text-center">
                      {currentPhoto.description || `尚無${isVideo ? '影片' : '照片'}說明`}
                    </p>
                  </div>
                  {onUpdateDescription && (
                    <button
                      onClick={handleEditDescription}
                      className="absolute top-3 right-3 p-2 text-white/50 hover:text-white hover:bg-white/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <button 
            disabled={activeIndex === photos.length - 1}
            onClick={onNext}
            className="absolute right-10 p-6 text-white hover:bg-white/10 rounded-full transition disabled:opacity-20 disabled:cursor-not-allowed z-10"
          >
            <ChevronRight size={48} />
          </button>
        </div>
      </div>

      {/* Right Side: Gallery Grid */}
      <div className="w-[400px] border-l border-white/5 bg-black/40 flex flex-col">
        {/* Gallery Header */}
        <div className="p-6 border-b border-white/5">
          <h5 className="text-white font-black text-base mb-4">媒體總覽</h5>
          {onUpload && (
            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all cursor-pointer font-medium">
              <Upload size={18} />
              上傳照片/影片
              <input 
                type="file" 
                accept="image/*,video/*" 
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* 9-Grid Gallery */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => onSelect(idx)}
                className={clsx(
                  "aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 relative",
                  activeIndex === idx 
                    ? "border-indigo-500 ring-2 ring-indigo-500/50 scale-105" 
                    : "border-white/10 hover:border-white/30"
                )}
              >
                {photo.type === 'video' ? (
                  <>
                    <video 
                      src={photo.url} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                        <Play size={20} className="text-gray-900 ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </>
                ) : (
                  <img 
                    src={photo.url} 
                    className="w-full h-full object-cover" 
                    alt={`Thumbnail ${idx + 1}`} 
                  />
                )}
              </button>
            ))}
            
            {/* Empty slots for visual balance */}
            {Array.from({ length: Math.max(0, 9 - photos.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center"
              >
                <span className="text-white/20 text-xs">空位</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
