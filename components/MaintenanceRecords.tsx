
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Filter, Plus, MapPin, ChevronRight, ChevronLeft, 
  History, Trash2, X, ArrowRight, Sparkles, ImageIcon, 
  Camera, Upload, MoreHorizontal, ChevronDown, CheckCircle2,
  AlertCircle, Save, Info, Link as LinkIcon, MessageSquare,
  Maximize2, Tag
} from 'lucide-react';
import { clsx } from 'clsx';
import { MOCK_MAINTENANCE, MOCK_VENDORS } from '../constants';
import { MaintenanceRecord, MaintenanceStatus, MediaItem } from '../types';

// 常見產品標籤預設選項
const PRODUCT_TAG_OPTIONS = ['空調', '電力', '水路', '裝修', '家具', '網路', '安控', '結構', '玻璃'];

export const MaintenanceRecords: React.FC = () => {
  // --- States ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductTags, setSelectedProductTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  
  // --- 相簿燈箱狀態 ---
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [activePhotoType, setActivePhotoType] = useState<'before' | 'after'>('before');

  // --- Filtering ---
  const filteredRecords = useMemo(() => {
    return MOCK_MAINTENANCE.filter(r => {
      const matchesSearch = 
        r.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.deviceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.caseId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTags = selectedProductTags.length === 0 || 
        selectedProductTags.some(tag => r.productTags?.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [searchTerm, selectedProductTags]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // --- Handlers ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPageDropdownOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenDetail = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
  };

  const handleOpenAdd = () => {
    setSelectedRecord(null);
    setIsFormModalOpen(true);
  };

  // 打開特定類型的相簿
  const openGallery = (index: number, type: 'before' | 'after') => {
    setActivePhotoIndex(index);
    setActivePhotoType(type);
  };

  const closeGallery = () => {
    setActivePhotoIndex(null);
  };

  const activePhotos = useMemo(() => {
    if (!selectedRecord) return [];
    return activePhotoType === 'before' ? selectedRecord.beforePhotos : selectedRecord.afterPhotos;
  }, [selectedRecord, activePhotoType]);

  const handleNextPhoto = () => {
    if (activePhotoIndex !== null && activePhotoIndex < activePhotos.length - 1) {
      setActivePhotoIndex(activePhotoIndex + 1);
    }
  };

  const handlePrevPhoto = () => {
    if (activePhotoIndex !== null && activePhotoIndex > 0) {
      setActivePhotoIndex(activePhotoIndex - 1);
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedProductTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto">
      
      {/* 1. 頂部操作與優化篩選欄 */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-[28rem] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="搜尋設備關鍵字、廠商或編號..."
              className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur rounded-[1.5rem] border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* 優化後的篩選按鈕 */}
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={clsx(
                "flex items-center gap-2 px-6 py-3.5 rounded-[1.5rem] font-bold transition-all shadow-sm border",
                selectedProductTags.length > 0 ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Filter size={18} /> 
              {selectedProductTags.length > 0 ? `篩選 (${selectedProductTags.length})` : '產品標籤'}
              <ChevronDown size={14} className={clsx("transition-transform duration-300", isFilterOpen && "rotate-180")} />
            </button>

            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 z-50 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">按產品標籤過濾</h4>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_TAG_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={clsx(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        selectedProductTags.includes(tag) ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedProductTags.length > 0 && (
                  <button 
                    onClick={() => setSelectedProductTags([])}
                    className="w-full mt-6 py-2 text-xs font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                  >
                    重置所有篩選
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleOpenAdd}
          className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95"
        >
          <Plus size={20} /> 新增維修紀錄
        </button>
      </div>

      {/* 2. 數據列表區 (顯示產品標籤) */}
      <div className="bg-white/80 backdrop-blur rounded-[2.5rem] border border-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-10 py-6">維修日期</th>
                <th className="px-10 py-6">設備資訊 / 產品標籤</th>
                <th className="px-10 py-6 text-center">影像證據</th>
                <th className="px-10 py-6">承辦廠商</th>
                <th className="px-10 py-6">目前狀態</th>
                <th className="px-10 py-6 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedRecords.map(record => (
                <tr 
                  key={record.id} 
                  className="group hover:bg-indigo-50/30 transition-colors cursor-pointer"
                  onClick={() => handleOpenDetail(record)}
                >
                  <td className="px-10 py-8">
                    <div className="flex flex-col font-black text-slate-800 font-mono">{record.date}</div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-2">
                      <span className="font-extrabold text-slate-800 text-lg tracking-tight group-hover:text-indigo-600 transition-colors">{record.deviceName}</span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mr-2">{record.deviceNo}</span>
                        {record.productTags?.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="flex items-center justify-center gap-4">
                       <div className="flex flex-col items-center">
                          <span className="text-[9px] font-black text-slate-300 uppercase mb-1">Before</span>
                          <span className="text-xs font-black text-rose-500 bg-rose-50 px-2 rounded-full border border-rose-100">{record.beforePhotos.length}</span>
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="text-[9px] font-black text-slate-300 uppercase mb-1">After</span>
                          <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2 rounded-full border border-emerald-100">{record.afterPhotos.length}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black uppercase tracking-tight shadow-sm border border-slate-200">
                      {record.vendorName}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-2 font-black text-slate-500 text-xs">
                      <div className={clsx(
                        "w-2 h-2 rounded-full",
                        record.status === MaintenanceStatus.COMPLETED ? "bg-emerald-500" : "bg-indigo-500 animate-pulse"
                      )}></div>
                      {record.status}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="p-2.5 bg-slate-50 text-slate-300 rounded-xl group-hover:text-indigo-600 group-hover:bg-white transition-all shadow-sm">
                      <ChevronRight size={20} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分頁控制 */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-8 px-6 py-4 bg-white/30 backdrop-blur rounded-[2.5rem] border border-white/50">
        <div className="flex items-center gap-8">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
              className="flex items-center gap-4 bg-white px-6 py-3 rounded-[1.2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
            >
              <span className="text-sm font-bold text-slate-400">每頁</span>
              <span className="text-sm font-black text-indigo-600">{itemsPerPage}</span>
              <ChevronDown size={16} className={clsx("text-slate-300 transition-transform duration-300", isPageDropdownOpen && "rotate-180")} />
            </button>
            {isPageDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-3 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                {[10, 20, 50].map(num => (
                  <button 
                    key={num}
                    onClick={() => { setItemsPerPage(num); setCurrentPage(1); setIsPageDropdownOpen(false); }}
                    className={clsx("w-full text-left px-6 py-3 text-sm font-black transition-colors border-b last:border-0 border-slate-50", itemsPerPage === num ? "bg-indigo-600 text-white" : "text-indigo-400 hover:bg-indigo-50")}
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="text-sm font-bold text-slate-400 tracking-tight">
             共 <span className="text-slate-800">{filteredRecords.length}</span> 筆紀錄
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 rounded-2xl border border-slate-100 bg-white text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90 disabled:opacity-20"><ChevronLeft size={20} /></button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)} className={clsx("w-10 h-10 rounded-2xl text-xs font-black transition-all shadow-sm border", currentPage === i + 1 ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-100" : "bg-white text-slate-500 border-slate-50 hover:bg-slate-50")}>{i + 1}</button>
            ))}
          </div>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-3 rounded-2xl border border-slate-100 bg-white text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90 disabled:opacity-20"><ChevronRight size={20} /></button>
        </div>
      </div>

      {/* 3. 維修紀錄詳細視窗 (含多圖相簿切換與即時敘述) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            {/* Header Area */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-5">
                  <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-lg">
                    <History size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedRecord.deviceName}</h3>
                    <div className="flex items-center gap-3 mt-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                          <MapPin size={12}/> CASE ID: {selectedRecord.caseId}
                       </p>
                       <div className="flex gap-1.5">
                          {selectedRecord.productTags?.map(tag => (
                             <span key={tag} className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-widest">{tag}</span>
                          ))}
                       </div>
                    </div>
                  </div>
               </div>
               <button onClick={() => setSelectedRecord(null)} className="p-3.5 text-slate-300 hover:bg-slate-50 hover:text-slate-800 rounded-full transition-all"><X size={32} /></button>
            </div>

            {/* Body Area */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">承辦廠商</p>
                   <p className="text-lg font-black text-slate-800">{selectedRecord.vendorName}</p>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">維修日期</p>
                   <p className="text-lg font-black text-slate-800">{selectedRecord.date}</p>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">目前狀態</p>
                      <p className="text-lg font-black text-emerald-600">{selectedRecord.status}</p>
                   </div>
                   <CheckCircle2 size={24} className="text-emerald-500" />
                </div>
              </div>

              {/* 多圖相簿對照區 (Before/After Albums) */}
              <div className="space-y-12">
                 {/* Before Section */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-sm"><Camera size={20}/></div>
                          <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">維修前現場相簿 (Before Evidence)</h4>
                       </div>
                       <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 uppercase tracking-widest">共 {selectedRecord.beforePhotos.length} 張影像</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                       {selectedRecord.beforePhotos.map((photo, idx) => (
                          <div key={photo.id} className="group relative bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
                             <div 
                               onClick={() => openGallery(idx, 'before')}
                               className="relative aspect-square cursor-pointer overflow-hidden bg-slate-200"
                             >
                                <img src={photo.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Before" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white"><Maximize2 size={24}/></div>
                                </div>
                             </div>
                             <div className="p-4 bg-white">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">影像說明 (敘述)</label>
                                <textarea 
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all h-16 resize-none"
                                  placeholder="在此輸入該照片的特定註記..."
                                  defaultValue={photo.description}
                                />
                             </div>
                          </div>
                       ))}
                       <button className="aspect-square border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 hover:border-indigo-200 hover:text-indigo-400 transition-all bg-slate-50/50">
                          <Plus size={32} className="mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest">上傳影像</span>
                       </button>
                    </div>
                 </div>

                 {/* After Section */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm"><Upload size={20}/></div>
                          <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">維修後完工相簿 (After Evidence)</h4>
                       </div>
                       <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 uppercase tracking-widest">共 {selectedRecord.afterPhotos.length} 張影像</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                       {selectedRecord.afterPhotos.map((photo, idx) => (
                          <div key={photo.id} className="group relative bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
                             <div 
                               onClick={() => openGallery(idx, 'after')}
                               className="relative aspect-square cursor-pointer overflow-hidden bg-slate-200"
                             >
                                <img src={photo.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="After" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white"><Maximize2 size={24}/></div>
                                </div>
                             </div>
                             <div className="p-4 bg-white">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">完工敘述</label>
                                <textarea 
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all h-16 resize-none"
                                  placeholder="在此輸入完工細節註記..."
                                  defaultValue={photo.description}
                                />
                             </div>
                          </div>
                       ))}
                       <button className="aspect-square border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 hover:border-indigo-200 hover:text-indigo-400 transition-all bg-slate-50/50">
                          <Plus size={32} className="mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest">上傳影像</span>
                       </button>
                    </div>
                 </div>
              </div>
            </div>

            {/* Footer Area */}
            <div className="p-8 border-t border-slate-100 bg-white flex flex-col md:flex-row justify-end gap-6 shrink-0 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
               <button className="flex-1 md:flex-none px-10 py-5 bg-white border border-slate-200 text-slate-600 font-black rounded-[1.5rem] hover:bg-slate-50 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3">
                  <Save size={18}/> 儲存並更新敘述文字
               </button>
               <button className="flex-1 md:min-w-[20rem] px-14 py-5 bg-slate-900 text-white font-black rounded-[1.5rem] shadow-2xl hover:shadow-indigo-100 hover:scale-[1.01] transition-all active:scale-95 uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3">
                  <LinkIcon size={18} className="text-indigo-400" /> 關聯請款單據 (Invoicing)
               </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 相簿全螢幕燈箱 (Interactive Photo Viewer) */}
      {activePhotoIndex !== null && (
         <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="p-8 flex justify-between items-center">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">
                    Maintenance Album - {activePhotoType === 'before' ? 'Before' : 'After'}
                  </span>
                  <h4 className="text-white font-black text-lg tracking-tight">影像細節檢視 ({activePhotoIndex + 1} / {activePhotos.length})</h4>
               </div>
               <button onClick={closeGallery} className="p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"><X size={40} /></button>
            </div>

            {/* Main Viewer Area */}
            <div className="flex-1 relative flex items-center justify-center px-20 overflow-hidden">
               <button 
                 disabled={activePhotoIndex === 0}
                 onClick={handlePrevPhoto}
                 className="absolute left-10 p-6 text-white hover:bg-white/10 rounded-full transition disabled:opacity-0"
               >
                  <ChevronLeft size={48} />
               </button>

               <div className="max-w-6xl w-full h-full flex flex-col items-center justify-center py-10">
                  <img 
                    src={activePhotos[activePhotoIndex].url} 
                    className="max-h-full object-contain rounded-3xl shadow-2xl border-4 border-white/5 animate-in zoom-in-95 duration-500" 
                    alt="Fullscreen" 
                  />
                  {activePhotos[activePhotoIndex].description && (
                     <div className="mt-8 px-10 py-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl max-w-2xl">
                        <p className="text-white font-bold text-center text-lg">{activePhotos[activePhotoIndex].description}</p>
                     </div>
                  )}
               </div>

               <button 
                 disabled={activePhotoIndex === activePhotos.length - 1}
                 onClick={handleNextPhoto}
                 className="absolute right-10 p-6 text-white hover:bg-white/10 rounded-full transition disabled:opacity-0"
               >
                  <ChevronRight size={48} />
               </button>
            </div>
            
            {/* Thumbnails strip */}
            <div className="h-28 bg-black/40 border-t border-white/5 flex items-center justify-center gap-4 px-10">
               {activePhotos.map((p, idx) => (
                  <button 
                    key={p.id}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={clsx(
                      "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300",
                      activePhotoIndex === idx ? "border-indigo-500 scale-110 shadow-lg" : "border-transparent opacity-40 hover:opacity-100"
                    )}
                  >
                     <img src={p.url} className="w-full h-full object-cover" alt="Thumb" />
                  </button>
               ))}
            </div>
         </div>
      )}

      {/* 5. 新增紀錄視窗 (含產品標籤勾選區) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center shrink-0">
                 <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase tracking-[0.1em]">建立維修紀錄單據</h3>
                 <button onClick={() => setIsFormModalOpen(false)} className="p-4 text-slate-300 hover:text-slate-800 rounded-full transition-all"><X size={32} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">設備名稱</label>
                       <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner" placeholder="輸入維修資產名稱..." />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">設備編號 (Asset ID)</label>
                       <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none font-mono" placeholder="HVAC-001-XYZ" />
                    </div>
                    
                    {/* 產品標籤勾選選單 (New) */}
                    <div className="col-span-full space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Tag size={12}/> 產品標籤類別 (勾選選單)
                       </label>
                       <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-wrap gap-3">
                          {PRODUCT_TAG_OPTIONS.map(tag => (
                             <label key={tag} className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-400 transition-all select-none group">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm font-black text-slate-600 group-hover:text-indigo-600">{tag}</span>
                             </label>
                          ))}
                          <button className="px-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all">+ 新增標籤</button>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">承辦廠商</label>
                       <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner">
                          <option>請選擇合作對象...</option>
                          {MOCK_VENDORS.map(v => <option key={v.id}>{v.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">維修日期</label>
                       <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">維修細節描述</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner h-40 resize-none leading-relaxed" 
                      placeholder="請詳細描述故障原因、修復過程與備件更換細節..."
                    ></textarea>
                 </div>

                 {/* 影像上傳預覽區 */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">上傳維修前照片 (可多張)</label>
                       <div className="grid grid-cols-3 gap-4">
                          <div className="aspect-square border-4 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300 hover:border-rose-300 hover:text-rose-400 transition-all cursor-pointer bg-slate-50/50 group">
                             <Camera size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                             <span className="text-[8px] font-black uppercase">拍攝/上傳</span>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">上傳維修後照片 (可多張)</label>
                       <div className="grid grid-cols-3 gap-4">
                          <div className="aspect-square border-4 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300 hover:border-emerald-300 hover:text-emerald-400 transition-all cursor-pointer bg-slate-50/50 group">
                             <Upload size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                             <span className="text-[8px] font-black uppercase">選取影像</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="p-10 border-t border-slate-100 bg-white flex gap-6 shrink-0">
                 <button onClick={() => setIsFormModalOpen(false)} className="flex-1 py-5 bg-slate-50 text-slate-500 font-black rounded-[1.5rem] hover:bg-slate-100 transition-all uppercase tracking-widest text-xs">取消</button>
                 <button className="flex-1 py-5 bg-slate-900 text-white font-black rounded-[1.5rem] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-3"><Save size={20} /> 儲存紀錄單據</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
