import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface MediaItem {
  id: string;
  url: string;
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
}

export function ImageLightbox({
  photos,
  activeIndex,
  title = 'Image Gallery',
  onClose,
  onPrev,
  onNext,
  onSelect
}: ImageLightboxProps) {
  if (photos.length === 0) return null;

  const currentPhoto = photos[activeIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-8 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">
            {title}
          </span>
          <h4 className="text-white font-black text-lg tracking-tight">
            影像細節檢視 ({activeIndex + 1} / {photos.length})
          </h4>
        </div>
        <button 
          onClick={onClose} 
          className="p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X size={40} />
        </button>
      </div>

      {/* Main Viewer Area */}
      <div className="flex-1 relative flex items-center justify-center px-20 overflow-hidden">
        <button 
          disabled={activeIndex === 0}
          onClick={onPrev}
          className="absolute left-10 p-6 text-white hover:bg-white/10 rounded-full transition disabled:opacity-0"
        >
          <ChevronLeft size={48} />
        </button>

        <div className="max-w-6xl w-full h-full flex flex-col items-center justify-center py-10">
          <img 
            src={currentPhoto.url} 
            className="max-h-full object-contain rounded-3xl shadow-2xl border-4 border-white/5 animate-in zoom-in-95 duration-500" 
            alt="Fullscreen" 
          />
          {currentPhoto.description && (
            <div className="mt-8 px-10 py-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl max-w-2xl">
              <p className="text-white font-bold text-center text-lg">{currentPhoto.description}</p>
            </div>
          )}
        </div>

        <button 
          disabled={activeIndex === photos.length - 1}
          onClick={onNext}
          className="absolute right-10 p-6 text-white hover:bg-white/10 rounded-full transition disabled:opacity-0"
        >
          <ChevronRight size={48} />
        </button>
      </div>
      
      {/* Thumbnails strip */}
      <div className="h-28 bg-black/40 border-t border-white/5 flex items-center justify-center gap-4 px-10">
        {photos.map((p, idx) => (
          <button 
            key={p.id}
            onClick={() => onSelect(idx)}
            className={clsx(
              "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300",
              activeIndex === idx 
                ? "border-indigo-500 scale-110 shadow-lg" 
                : "border-transparent opacity-40 hover:opacity-100"
            )}
          >
            <img src={p.url} className="w-full h-full object-cover" alt="Thumb" />
          </button>
        ))}
      </div>
    </div>
  );
}
