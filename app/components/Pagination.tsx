import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useRef, useEffect } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (items: number) => void;
  itemsPerPageOptions?: number[];
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50]
}: PaginationProps) {
  // 智慧分頁模式：如果沒有提供 onItemsPerPageChange，則不顯示選擇器
  const isSmartPagination = !onItemsPerPageChange;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 計算要顯示的頁碼
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-8 px-6 py-4 bg-white/30 backdrop-blur rounded-[2.5rem] border border-white/50">
      <div className="flex items-center gap-8">
        {!isSmartPagination && (
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-4 bg-white px-6 py-3 rounded-[1.2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <span className="text-sm font-bold text-slate-400">每頁</span>
            <span className="text-sm font-black text-indigo-600">{itemsPerPage}</span>
            <ChevronDown size={16} className={clsx("text-slate-300 transition-transform duration-300", isDropdownOpen && "rotate-180")} />
          </button>
          {isDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-3 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
              {itemsPerPageOptions.map(num => (
                <button 
                  key={num}
                  onClick={() => { 
                    onItemsPerPageChange(num); 
                    onPageChange(1); 
                    setIsDropdownOpen(false); 
                  }}
                  className={clsx(
                    "w-full text-left px-6 py-3 text-sm font-black transition-colors border-b last:border-0 border-slate-50", 
                    itemsPerPage === num ? "bg-indigo-600 text-white" : "text-indigo-400 hover:bg-indigo-50"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          )}
        </div>
        )}
        <div className="text-sm font-bold text-slate-400 tracking-tight">
           共 <span className="text-slate-800">{totalItems}</span> 筆紀錄
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          disabled={currentPage === 1} 
          onClick={() => onPageChange(currentPage - 1)} 
          className="p-3 rounded-2xl border border-slate-100 bg-white text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90 disabled:opacity-20"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-1.5">
          {getPageNumbers().map((page, idx) => (
            typeof page === 'number' ? (
              <button 
                key={idx} 
                onClick={() => onPageChange(page)} 
                className={clsx(
                  "w-10 h-10 rounded-2xl text-xs font-black transition-all shadow-sm border", 
                  currentPage === page 
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-100" 
                    : "bg-white text-slate-500 border-slate-50 hover:bg-slate-50"
                )}
              >
                {page}
              </button>
            ) : (
              <span key={idx} className="w-10 h-10 flex items-center justify-center text-slate-300">...</span>
            )
          ))}
        </div>
        <button 
          disabled={currentPage === totalPages || totalPages === 0} 
          onClick={() => onPageChange(currentPage + 1)} 
          className="p-3 rounded-2xl border border-slate-100 bg-white text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90 disabled:opacity-20"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
