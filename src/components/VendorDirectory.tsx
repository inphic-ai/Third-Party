
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MOCK_VENDORS, CATEGORY_GROUPS, TAIWAN_REGIONS, CHINA_REGIONS, MOCK_USERS } from '../constants';
import { Region, EntityType, Vendor, VendorCategory, ServiceType } from '../types';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Star, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  LayoutList, 
  FolderOpen, 
  Plus, 
  AlertTriangle, 
  RefreshCw, 
  Filter, 
  ArrowUpDown, 
  Crown, 
  Ban, 
  Sparkles, 
  Bot, 
  X, 
  Heart, 
  CalendarCheck, 
  User, 
  Building2, 
  Phone, 
  Info, 
  HelpCircle, 
  Check, 
  ChevronDown, 
  Layers, 
  AlertCircle, 
  GripVertical,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';

type ViewMode = 'grid' | 'card' | 'list' | 'group';
type SortOption = 'default' | 'rating_desc' | 'txn_count' | 'last_active';

export const VendorDirectory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const queryParam = searchParams.get('q'); // Get search query from URL

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>(Region.TAIWAN);
  const [selectedServiceArea, setSelectedServiceArea] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>(''); 
  
  // New Filters
  const [minRating, setMinRating] = useState<number>(0);
  const [showBlacklisted, setShowBlacklisted] = useState<boolean>(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [specialFilter, setSpecialFilter] = useState<string>('');

  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiSearch, setShowAiSearch] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);
  
  // Drag and drop state for favorites
  const [customFavoritesOrder, setCustomFavoritesOrder] = useState<string[]>([]);
  const [draggedVendorId, setDraggedVendorId] = useState<string | null>(null);

  // Permission Check
  const canAddVendors = MOCK_USERS[0].permissions.canAddVendors;
  
  // Handle URL Params on Mount
  useEffect(() => {
    if (filterParam === 'missed') {
      setSpecialFilter('missed');
    } else if (filterParam === 'contacting') {
      setSpecialFilter('contacting');
    } else {
      setSpecialFilter('');
    }
    if (queryParam) setSearchTerm(queryParam);
  }, [filterParam, queryParam]);

  const clearSpecialFilter = () => {
    setSpecialFilter('');
    setSearchTerm('');
    setSelectedCategory('');
    setSearchParams({});
  };

  const handleToggleFavorite = (vendorId: string) => {
    // In a real app, this would dispatch an API call
    const vendor = MOCK_VENDORS.find(v => v.id === vendorId);
    if(vendor) {
        vendor.isFavorite = !vendor.isFavorite;
        // Force re-render trick for mock
        setSearchTerm(prev => prev + " ");
        setTimeout(() => setSearchTerm(prev => prev.trim()), 0);
    }
  };

  const filteredVendors = useMemo(() => {
    let result = MOCK_VENDORS.filter(vendor => {
      const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            vendor.categories.some(c => c.includes(searchTerm)) ||
                            vendor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vendor.taxId?.includes(searchTerm) ||
                            vendor.tags.some(t => t.includes(searchTerm)); 
      
      const matchesCategory = selectedCategory ? vendor.categories.includes(selectedCategory as any) : true;
      const matchesRegion = selectedRegion ? vendor.region === selectedRegion : true;
      const matchesEntityType = selectedEntityType ? vendor.entityType === selectedEntityType : true;
      
      const matchesServiceArea = selectedServiceArea 
        ? (selectedServiceArea === '全部' ? true : vendor.serviceArea.includes(selectedServiceArea) || vendor.serviceArea.includes('全部'))
        : true;
      
      const matchesRating = vendor.rating >= minRating;
      const blacklistCheck = showBlacklisted ? vendor.isBlacklisted : !vendor.isBlacklisted;
      const matchesFavorite = showFavoritesOnly ? vendor.isFavorite : true;

      // Special Filters
      let matchesSpecial = true;
      if (specialFilter === 'missed') matchesSpecial = (vendor.missedContactLogCount || 0) > 0;
      else if (specialFilter === 'contacting') matchesSpecial = vendor.contactLogs.length > 0;

      return matchesSearch && matchesCategory && matchesRegion && matchesServiceArea && matchesRating && blacklistCheck && matchesSpecial && matchesFavorite && matchesEntityType;
    });

    // Custom Sorting for Favorites
    if (showFavoritesOnly && customFavoritesOrder.length > 0) {
      return result.sort((a, b) => {
        const indexA = customFavoritesOrder.indexOf(a.id);
        const indexB = customFavoritesOrder.indexOf(b.id);
        // If both are in custom order, sort by index
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        // If only A is in order, A comes first
        if (indexA !== -1) return -1;
        // If only B is in order, B comes first
        if (indexB !== -1) return 1;
        // Default fallback
        return 0;
      });
    }

    // Standard Sorting
    return result.sort((a, b) => {
      if (sortBy === 'rating_desc') return b.rating - a.rating;
      if (sortBy === 'txn_count') return b.transactions.length - a.transactions.length;
      if (sortBy === 'last_active') {
        const lastA = a.transactions.length > 0 ? new Date(a.transactions[0].date).getTime() : 0;
        const lastB = b.transactions.length > 0 ? new Date(b.transactions[0].date).getTime() : 0;
        return lastB - lastA;
      }
      return 0; // Default order
    });

  }, [searchTerm, selectedCategory, selectedRegion, selectedServiceArea, minRating, showBlacklisted, sortBy, specialFilter, showFavoritesOnly, selectedEntityType, customFavoritesOrder]);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedVendorId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedVendorId || draggedVendorId === targetId) return;

    // Initialize custom order if empty using current filtered list
    let currentOrder = customFavoritesOrder.length > 0 
      ? [...customFavoritesOrder] 
      : filteredVendors.map(v => v.id);
    
    // Ensure all visible vendors are in the order list if specific ones were missing
    filteredVendors.forEach(v => {
       if(!currentOrder.includes(v.id)) currentOrder.push(v.id);
    });

    const fromIndex = currentOrder.indexOf(draggedVendorId);
    const toIndex = currentOrder.indexOf(targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    // Move item
    const [movedItem] = currentOrder.splice(fromIndex, 1);
    currentOrder.splice(toIndex, 0, movedItem);

    setCustomFavoritesOrder(currentOrder);
    setDraggedVendorId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
           <div className="flex items-center gap-2">
             <h1 className="text-2xl font-bold text-gray-800">廠商名錄</h1>
             <button 
                onClick={() => setShowLegendModal(true)}
                className="text-gray-400 hover:text-brand-600 transition" 
                title="系統說明"
             >
                <HelpCircle size={20} />
             </button>
           </div>
           <p className="text-gray-500 text-sm mt-1">
             管理 {MOCK_VENDORS.length} 家合作夥伴 • 搜尋與協作
           </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
           {/* View Mode Switcher */}
           <div className="bg-white p-1 rounded-lg border border-gray-200 flex items-center shadow-sm">
              <button onClick={() => setViewMode('grid')} className={clsx("p-2 rounded transition", viewMode === 'grid' ? "bg-gray-100 text-gray-800" : "text-gray-400 hover:text-gray-600")} title="Grid"><LayoutGrid size={20} /></button>
              <button onClick={() => setViewMode('card')} className={clsx("p-2 rounded transition", viewMode === 'card' ? "bg-gray-100 text-gray-800" : "text-gray-400 hover:text-gray-600")} title="Card"><LayoutList size={20} /></button>
              <button onClick={() => setViewMode('list')} className={clsx("p-2 rounded transition", viewMode === 'list' ? "bg-gray-100 text-gray-800" : "text-gray-400 hover:text-gray-600")} title="List"><List size={20} /></button>
              <button onClick={() => setViewMode('group')} className={clsx("p-2 rounded transition", viewMode === 'group' ? "bg-gray-100 text-gray-800" : "text-gray-400 hover:text-gray-600")} title="Group"><FolderOpen size={20} /></button>
           </div>

           <button
             onClick={() => setShowAiSearch(true)}
             className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm font-medium flex items-center gap-2"
           >
             <Sparkles size={18} /> AI 推薦
           </button>

           {canAddVendors && (
             <button 
               onClick={() => setShowAddModal(true)}
               className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition shadow-sm font-medium flex items-center gap-2"
             >
               <Plus size={18} /> 新增廠商
             </button>
           )}
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4">
           {/* Search */}
           <div className="flex-1 relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
             <input
               type="text"
               placeholder="搜尋名稱、地址、標籤..."
               className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           
           {/* Primary Filters */}
           <div className="flex flex-wrap gap-2">
             <select 
               className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium text-gray-700"
               value={selectedEntityType}
               onChange={(e) => setSelectedEntityType(e.target.value)}
             >
               <option value="">身分 (全部)</option>
               <option value={EntityType.COMPANY}>🏢 公司行號</option>
               <option value={EntityType.INDIVIDUAL}>👤 個人接案</option>
             </select>

             {/* Advanced Category Filter (New!) */}
             <AdvancedCategoryFilter 
                selectedCategory={selectedCategory} 
                onChange={setSelectedCategory} 
             />
           </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-3 border-t border-gray-50 gap-4">
           <div className="flex items-center gap-4 w-full sm:w-auto">
              <label className={clsx("flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg cursor-pointer transition select-none border", 
                 showFavoritesOnly ? "bg-red-50 border-red-100 text-red-600 font-bold" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              )}>
                 <input 
                   type="checkbox" 
                   className="hidden" 
                   checked={showFavoritesOnly} 
                   onChange={() => {
                     setShowFavoritesOnly(!showFavoritesOnly);
                     if (!showFavoritesOnly) setViewMode('list'); // Switch to list for better DnD UX
                   }} 
                 />
                 <Heart size={16} className={clsx(showFavoritesOnly ? "fill-current" : "")} />
                 <span>我的最愛 (自訂排序)</span>
              </label>

              <label className={clsx("flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg cursor-pointer transition select-none border", 
                 showBlacklisted ? "bg-gray-800 text-white border-gray-800 font-bold" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              )}>
                 <input type="checkbox" className="hidden" checked={showBlacklisted} onChange={() => setShowBlacklisted(!showBlacklisted)} />
                 <Ban size={16} />
                 <span>黑名單</span>
              </label>
           </div>

           <div className="flex items-center gap-2 w-full sm:w-auto">
              {showFavoritesOnly ? (
                 <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                   提示: 在列表模式下可拖曳調整順序
                 </span>
              ) : (
                <>
                  <span className="text-sm text-gray-500 whitespace-nowrap">排序：</span>
                  <select 
                    className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full font-medium text-gray-700"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                  >
                    <option value="default">預設 (ID)</option>
                    <option value="rating_desc">評分 (高 &rarr; 低)</option>
                    <option value="txn_count">合作次數 (多 &rarr; 少)</option>
                  </select>
                </>
              )}
           </div>
        </div>
      </div>

      {/* Views Content */}
      <div className="min-h-[400px]">
        {filteredVendors.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-400">
            <p>找不到符合條件的廠商</p>
            <button 
                 onClick={() => { clearSpecialFilter(); setShowFavoritesOnly(false); setSelectedEntityType(''); setSearchTerm('');}} 
                 className="mt-2 text-brand-600 hover:underline text-sm font-medium"
            >
                 清除篩選條件
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'card' && <CardView vendors={filteredVendors} onToggleFavorite={handleToggleFavorite} />}
            {viewMode === 'grid' && <GridView vendors={filteredVendors} />}
            {viewMode === 'list' && (
              <ListView 
                vendors={filteredVendors} 
                enableDrag={showFavoritesOnly} 
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                draggedId={draggedVendorId}
              />
            )}
            {viewMode === 'group' && <GroupView vendors={filteredVendors} />}
          </>
        )}
      </div>

      {/* Add Vendor Modal (with Duplicate Detection) */}
      {showAddModal && <AddVendorModal onClose={() => setShowAddModal(false)} />}

      {/* System Legend Modal */}
      {showLegendModal && <SystemLegendModal onClose={() => setShowLegendModal(false)} />}
      
      {/* AI Search Modal */}
      {showAiSearch && <AiSearchModal onClose={() => setShowAiSearch(false)} />}
    </div>
  );
};

/* --- Add Vendor Modal with Duplicate Detection --- */
const AddVendorModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    phone: '',
    entityType: EntityType.COMPANY,
    region: Region.TAIWAN
  });
  
  const [duplicates, setDuplicates] = useState<{ field: string; message: string; vendorName: string } | null>(null);

  // Real-time Duplicate Check
  useEffect(() => {
    const checkDuplicate = () => {
      // 1. Check Name
      if (formData.name.trim().length > 1) {
        const match = MOCK_VENDORS.find(v => v.name === formData.name.trim());
        if (match) {
          setDuplicates({ field: 'name', message: '廠商名稱已存在', vendorName: match.name });
          return;
        }
      }
      
      // 2. Check Tax ID
      if (formData.taxId.trim().length > 4) {
        const match = MOCK_VENDORS.find(v => v.taxId === formData.taxId.trim());
        if (match) {
          setDuplicates({ field: 'taxId', message: '統一編號已重複', vendorName: match.name });
          return;
        }
      }

      // 3. Check Phone (Main Phone & Contacts Mobile)
      if (formData.phone.trim().length > 6) {
        const match = MOCK_VENDORS.find(v => 
          v.mainPhone?.includes(formData.phone.trim()) || 
          v.contacts.some(c => c.mobile?.includes(formData.phone.trim()))
        );
        if (match) {
          setDuplicates({ field: 'phone', message: '電話/手機號碼已重複', vendorName: match.name });
          return;
        }
      }

      setDuplicates(null);
    };

    const timer = setTimeout(checkDuplicate, 500); // Debounce
    return () => clearTimeout(timer);
  }, [formData]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
           <h3 className="text-lg font-bold flex items-center gap-2">
              <Plus size={20} className="text-blue-400" /> 新增廠商
           </h3>
           <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
        </div>
        
        <div className="p-6 space-y-4">
           {/* Duplicate Warning Banner */}
           {duplicates && (
             <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div>
                   <p className="text-red-800 font-bold text-sm">偵測到重複資料</p>
                   <p className="text-red-600 text-xs mt-1">
                      {duplicates.message} (已存在於: {duplicates.vendorName})
                   </p>
                </div>
             </div>
           )}

           <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">廠商名稱 / 姓名 <span className="text-red-500">*</span></label>
              <input 
                className={clsx(
                  "w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2",
                  duplicates?.field === 'name' ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-blue-500"
                )}
                placeholder="輸入完整名稱..." 
                value={formData.name} 
                onChange={e => handleChange('name', e.target.value)}
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">身分</label>
                 <select 
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white"
                    value={formData.entityType}
                    onChange={e => handleChange('entityType', e.target.value)}
                 >
                    <option value={EntityType.COMPANY}>公司行號</option>
                    <option value={EntityType.INDIVIDUAL}>個人接案</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">地區</label>
                 <select 
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white"
                    value={formData.region}
                    onChange={e => handleChange('region', e.target.value)}
                 >
                    <option value={Region.TAIWAN}>台灣</option>
                    <option value={Region.CHINA}>大陸</option>
                 </select>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">統一編號</label>
                 <input 
                   className={clsx(
                     "w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2",
                     duplicates?.field === 'taxId' ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-blue-500"
                   )}
                   placeholder="8碼數字..." 
                   value={formData.taxId} 
                   onChange={e => handleChange('taxId', e.target.value)}
                 />
              </div>
              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">電話 / 手機</label>
                 <input 
                   className={clsx(
                     "w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2",
                     duplicates?.field === 'phone' ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-blue-500"
                   )}
                   placeholder="02-xxxx or 09xx..." 
                   value={formData.phone} 
                   onChange={e => handleChange('phone', e.target.value)}
                 />
              </div>
           </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-sm">取消</button>
           <button 
             disabled={!!duplicates || !formData.name}
             className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
           >
             確認新增
           </button>
        </div>
      </div>
    </div>
  );
};

/* --- Advanced Category Filter Component (Searchable Popover) --- */
const AdvancedCategoryFilter: React.FC<{ selectedCategory: string; onChange: (c: string) => void }> = ({ selectedCategory, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter categories based on input text
  const filteredGroups = useMemo(() => {
    const result: Record<string, string[]> = {};
    Object.entries(CATEGORY_GROUPS).forEach(([groupName, items]) => {
      // Use type assertion to avoid unknown[] inference if necessary
      const filteredItems = (items as string[]).filter(item => item.toLowerCase().includes(filterText.toLowerCase()));
      if (filteredItems.length > 0) {
        result[groupName] = filteredItems;
      }
    });
    return result;
  }, [filterText]);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        className={clsx(
          "px-4 py-2.5 border rounded-xl flex items-center justify-between gap-3 text-sm font-medium min-w-[180px] bg-white transition-all",
          isOpen ? "border-brand-500 ring-2 ring-brand-100" : "border-gray-200 hover:border-gray-300"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedCategory ? "text-brand-700 font-bold" : "text-gray-700"}>
          {selectedCategory || "所有類別 (可搜尋)"}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[320px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-left">
           {/* Search Input */}
           <div className="p-3 border-b border-gray-100 bg-gray-50/50">
             <div className="relative">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <input 
                 autoFocus
                 className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                 placeholder="輸入關鍵字篩選..."
                 value={filterText}
                 onChange={(e) => setFilterText(e.target.value)}
               />
             </div>
           </div>

           {/* Scrollable List */}
           <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
             {/* "All" Option */}
             <button 
               className={clsx(
                 "w-full text-left px-3 py-2 rounded-lg text-sm mb-1 flex items-center justify-between",
                 selectedCategory === '' ? "bg-brand-50 text-brand-700 font-bold" : "text-gray-700 hover:bg-gray-50"
               )}
               onClick={() => { onChange(''); setIsOpen(false); }}
             >
               顯示全部
               {selectedCategory === '' && <Check size={16} />}
             </button>

             {/* Grouped Categories */}
             {Object.entries(filteredGroups).length > 0 ? (
               Object.entries(filteredGroups).map(([groupName, items]: [string, string[]]) => (
                 <div key={groupName} className="mb-2 last:mb-0">
                    <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 rounded mt-1 mb-1">
                      {groupName}
                    </div>
                    {items.map(item => (
                       <button
                         key={item}
                         className={clsx(
                            "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors",
                            selectedCategory === item ? "bg-brand-50 text-brand-700 font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                         )}
                         onClick={() => { onChange(item); setIsOpen(false); }}
                       >
                         {item}
                         {selectedCategory === item && <Check size={16} />}
                       </button>
                    ))}
                 </div>
               ))
             ) : (
               <div className="py-8 text-center text-gray-400 text-sm">
                 找不到 "{filterText}"
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
};

/* --- System Legend Modal --- */
const SystemLegendModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
         <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white">
            <h3 className="text-lg font-bold flex items-center gap-2">
               <Info size={20} className="text-blue-300" /> 系統圖例與權限說明
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
         </div>
         <div className="p-6 space-y-6">
            
            {/* Legend 1: Favorites */}
            <div className="flex gap-4">
               <div className="shrink-0 w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
                  <Heart size={24} className="fill-current" />
               </div>
               <div>
                  <h4 className="font-bold text-slate-800 text-base">個人收藏 (My Favorites)</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                     <span className="bg-slate-100 px-1.5 rounded text-xs text-slate-500 font-mono mr-1">個人權限</span>
                     此標記僅對您自己可見。用於快速篩選您常用的合作夥伴，不會影響其他同事的列表顯示。
                  </p>
               </div>
            </div>

            {/* Legend 2: Excellent */}
            <div className="flex gap-4">
               <div className="shrink-0 w-12 h-12 rounded-xl bg-yellow-50 text-yellow-500 flex items-center justify-center border border-yellow-100">
                  <Crown size={24} />
               </div>
               <div>
                  <h4 className="font-bold text-slate-800 text-base">優良廠商 (Excellent Partner)</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                     <span className="bg-blue-100 text-blue-700 px-1.5 rounded text-xs font-mono mr-1">全域標記</span>
                     由系統根據「近一年交易次數 > 3」且「平均評分 > 4.5」自動判定。所有使用者皆可看到此標記，建議優先合作。
                  </p>
               </div>
            </div>

            {/* Legend 3: Blacklist */}
            <div className="flex gap-4">
               <div className="shrink-0 w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center border border-slate-600">
                  <Ban size={24} />
               </div>
               <div>
                  <h4 className="font-bold text-slate-800 text-base">黑名單 (Blacklist)</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                     <span className="bg-blue-100 text-blue-700 px-1.5 rounded text-xs font-mono mr-1">全域標記</span>
                     經管理員審核確認有重大違規或品質問題。系統會自動隱藏黑名單廠商（除非手動勾選顯示），並在預約時發出警告。
                  </p>
               </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-2">
               <p className="text-xs text-slate-400 text-center">
                  若需調整全域標記（優良/黑名單），請聯繫系統管理員。
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

/* --- Helpers --- */
const getActiveReservation = (vendor: Vendor) => {
  const today = new Date().toISOString().split('T')[0];
  const reservation = vendor.contactLogs
    .filter(log => log.isReservation && log.date >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  return reservation;
};

/* --- Updated Card Component (Button Removed) --- */
const VendorCardItem: React.FC<{ vendor: Vendor; onToggleFavorite: (id: string) => void }> = React.memo(({ vendor, onToggleFavorite }) => {
  const reservation = getActiveReservation(vendor);
  const isExcellent = vendor.tags.includes('優良廠商') || vendor.rating >= 4.8;
  
  // Mask phone number for public card view
  const displayPhone = vendor.mainPhone 
    ? vendor.mainPhone.replace(/(\d{3,4})(-?)(\d+)(-?)(\d{3})/, '$1-***-$5')
    : (vendor.contacts[0]?.mobile 
        ? vendor.contacts[0].mobile.replace(/(\d{4})(-?)(\d{3})(-?)(\d{3})/, '$1-***-$5') 
        : '無電話');

  return (
    <div className={clsx(
        "bg-white rounded-2xl shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] border p-5 hover:shadow-lg transition-all group relative flex flex-col h-full",
        isExcellent ? "border-yellow-200 ring-1 ring-yellow-100" : "border-gray-100"
    )}>
      {/* Favorite Button - Top Right Floating */}
      <button 
         onClick={(e) => {
           e.preventDefault();
           e.stopPropagation();
           onToggleFavorite(vendor.id);
         }}
         className={clsx(
           "absolute top-4 right-4 p-2 rounded-full transition-all z-10",
           vendor.isFavorite 
             ? "bg-red-50 text-red-500" 
             : "bg-gray-50 text-gray-300 hover:bg-gray-100 hover:text-gray-500"
         )}
         title={vendor.isFavorite ? "取消收藏" : "加入收藏"}
      >
         <Heart size={20} className={clsx(vendor.isFavorite && "fill-current")} />
      </button>

      {/* Excellent Badge */}
      {isExcellent && (
         <div className="absolute top-0 left-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-br-lg rounded-tl-xl flex items-center gap-1 z-10 shadow-sm">
            <Crown size={10} fill="currentColor" /> 優良廠商
         </div>
      )}

      {/* Main Info Link */}
      <Link to={`/vendors/${vendor.id}`} className="flex-1 pt-2">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <img src={vendor.avatarUrl} alt={vendor.name} className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shadow-sm" />
            <div className={clsx("absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 border-white flex items-center justify-center text-xs text-white", 
                vendor.entityType === EntityType.COMPANY ? "bg-blue-500" : "bg-emerald-500"
            )}>
              {vendor.entityType === EntityType.COMPANY ? <Building2 size={12} /> : <User size={12} />}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800 group-hover:text-brand-700 transition-colors line-clamp-1">
              {vendor.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600">{vendor.id}</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {vendor.region}
              </span>
            </div>
          </div>
        </div>
        
        {/* Reservation / Status Bar */}
        <div className="mb-4 min-h-[24px]">
           {reservation ? (
             <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1 rounded-lg text-xs font-bold border border-orange-100 animate-pulse">
                <CalendarCheck size={14} /> {reservation.date.split('-').slice(1).join('/')} 已預約
             </span>
           ) : vendor.isBlacklisted ? (
             <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-100">
                <Ban size={12} /> 暫停合作
             </span>
           ) : (
             <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                   <Star size={12} className="fill-yellow-400 text-yellow-400" />
                   <span className="text-xs font-bold text-gray-700">{vendor.rating}</span>
                </div>
                <span className="text-xs text-gray-400 ml-2">{vendor.transactions.length} 次合作</span>
             </div>
           )}
        </div>
        
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4 bg-gray-50/50 p-3 rounded-xl border border-gray-50">
           <div>
             <span className="text-gray-400 block mb-0.5">服務類別</span>
             <span className="font-medium text-gray-800">{vendor.categories[0]}</span>
           </div>
           <div>
             <span className="text-gray-400 block mb-0.5">平均收費</span>
             <span className="font-medium text-gray-800">{vendor.priceRange}</span>
           </div>
           <div className="col-span-2 mt-1 pt-2 border-t border-gray-100 flex items-center gap-1.5">
              <Phone size={12} className="text-gray-400"/>
              <span className="truncate tracking-wide">{displayPhone}</span>
           </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {vendor.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] bg-white text-gray-500 px-2 py-1 rounded-md border border-gray-200 shadow-sm">
              #{tag}
            </span>
          ))}
        </div>
      </Link>
    </div>
  );
});

/* --- Updated CardView (Removes onBook) --- */
const CardView: React.FC<{ vendors: Vendor[]; onToggleFavorite: (id: string) => void }> = ({ vendors, onToggleFavorite }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {vendors.map(vendor => (
      <VendorCardItem key={vendor.id} vendor={vendor} onToggleFavorite={onToggleFavorite} />
    ))}
  </div>
);

/* --- Updated GridView (Removes onBook) --- */
const GridView: React.FC<{ vendors: Vendor[] }> = ({ vendors }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
    {vendors.map(vendor => (
      <Link to={`/vendors/${vendor.id}`} key={vendor.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-300 hover:shadow-md transition flex flex-col items-center text-center group relative h-full">
         <img src={vendor.avatarUrl} className="w-14 h-14 rounded-full mb-3 object-cover grayscale group-hover:grayscale-0 transition duration-300" />
         <h3 className="font-bold text-gray-800 text-sm truncate w-full">{vendor.name}</h3>
         <p className="text-xs text-gray-400 mt-1">{vendor.categories[0]}</p>
         {vendor.isFavorite && <Heart size={14} className="absolute top-2 right-2 text-red-500 fill-current" />}
      </Link>
    ))}
  </div>
);

interface ListViewProps {
  vendors: Vendor[];
  enableDrag: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  draggedId: string | null;
}

/* --- Updated ListView (Removes Actions Column & onBook) --- */
const ListView: React.FC<ListViewProps> = ({ vendors, enableDrag, onDragStart, onDragOver, onDrop, draggedId }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
     <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
           <tr>
              {enableDrag && <th className="w-10 pl-4 py-4"></th>}
              <th className="px-6 py-4">廠商</th>
              <th className="px-6 py-4">類別</th>
              <th className="px-6 py-4 text-center">狀態</th>
              <th className="px-6 py-4 text-right"></th>
           </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
           {vendors.map(v => (
              <tr 
                key={v.id} 
                className={clsx(
                  "hover:bg-gray-50 transition",
                  draggedId === v.id && "bg-blue-50 opacity-50 border-2 border-blue-300"
                )}
                draggable={enableDrag}
                onDragStart={(e) => onDragStart(e, v.id)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, v.id)}
              >
                 {enableDrag && (
                    <td className="pl-4">
                       <div className="cursor-grab text-gray-300 hover:text-gray-600 p-2">
                          <GripVertical size={16} />
                       </div>
                    </td>
                 )}
                 <td className="px-6 py-4 font-bold text-gray-800">
                    <Link to={`/vendors/${v.id}`} className="flex items-center gap-3 hover:text-blue-600 group">
                       <img src={v.avatarUrl} className="w-8 h-8 rounded-full" />
                       {v.name}
                    </Link>
                 </td>
                 <td className="px-6 py-4 text-gray-600">{v.categories[0]}</td>
                 <td className="px-6 py-4 text-center">{v.rating} ⭐</td>
                 <td className="px-6 py-4 text-right">
                    <Link to={`/vendors/${v.id}`} className="text-gray-400 hover:text-blue-600">
                       <ArrowRight size={18} />
                    </Link>
                 </td>
              </tr>
           ))}
        </tbody>
     </table>
  </div>
);

/* --- Updated GroupView (Removes onBook) --- */
const GroupView: React.FC<{ vendors: Vendor[] }> = ({ vendors }) => (
    <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
        群組視圖 (Group View) 樣式更新中...
    </div>
);

/* --- AI Search Modal for Vendors --- */
const AiSearchModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ vendor: Vendor; score: number; reasons: string[] }[]>([]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResults([]);

    setTimeout(() => {
      const scoredVendors = MOCK_VENDORS.map(vendor => {
        let score = 0;
        const reasons: string[] = [];
        const lowerQuery = query.toLowerCase();

        vendor.categories.forEach(cat => {
          if (lowerQuery.includes(cat)) { score += 30; reasons.push(`專長符合：${cat}`); }
        });

        if (lowerQuery.includes(vendor.region) || vendor.serviceArea.includes(query.substring(0, 2))) {
          score += 20; reasons.push(`地區符合：${vendor.region}`);
        }

        vendor.tags.forEach(tag => {
          if (lowerQuery.includes(tag)) { score += 15; reasons.push(`符合特質：${tag}`); }
        });

        if (vendor.rating >= 4.8) { score += 10; reasons.push('高評價優良廠商'); }

        if (lowerQuery.includes('急') && (vendor.tags.includes('急件') || vendor.internalNotes.includes('配合度高'))) {
           score += 25; reasons.push('可配合急件需求');
        }
        if (lowerQuery.includes('夜') && (vendor.tags.includes('夜間施工'))) {
           score += 25; reasons.push('具備夜間施工能力');
        }
        if ((lowerQuery.includes('便宜') || lowerQuery.includes('預算')) && vendor.priceRange === '$') {
           score += 15; reasons.push('價格具競爭力');
        }

        return { vendor, score, reasons };
      });

      const finalResults = scoredVendors
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      setResults(finalResults);
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 flex justify-between items-center text-white shrink-0">
           <div>
             <h2 className="text-xl font-bold flex items-center gap-2">
               <Sparkles className="text-yellow-300 animate-pulse" size={24} /> AI 智能廠商推薦
             </h2>
             <p className="text-indigo-100 text-xs mt-1">分析您的自然語言需求，精準媒合最佳廠商</p>
           </div>
           <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition"><X size={24}/></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
           <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">您需要什麼樣的協助？</label>
              <div className="relative">
                 <textarea 
                   className="w-full border-2 border-slate-200 rounded-xl p-4 h-32 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 outline-none resize-none text-slate-700 text-base shadow-inner bg-slate-50 transition-all"
                   placeholder="例如：我們信義區的辦公室需要緊急水電維修，希望能配合夜間施工..."
                   value={query}
                   onChange={e => setQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSearch())}
                 />
                 <button 
                   onClick={handleSearch}
                   disabled={isSearching || !query.trim()}
                   className="absolute bottom-4 right-4 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-violet-200 flex items-center gap-2 transition-all disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95"
                 >
                    {isSearching ? <RefreshCw className="animate-spin" size={18} /> : <Bot size={18} />}
                    {isSearching ? 'AI 分析中...' : '開始媒合'}
                 </button>
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2 custom-scrollbar">
                 {['急件處理', '夜間施工', '台北市水電', '物流報關', '高評價設計'].map(tag => (
                    <button key={tag} onClick={() => setQuery(tag)} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs hover:bg-violet-50 hover:text-violet-600 transition whitespace-nowrap border border-slate-200 font-medium">
                       {tag}
                    </button>
                 ))}
              </div>
           </div>
           {results.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       <CheckCircle className="text-green-500" size={18} /> 最佳推薦結果
                    </h3>
                    <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-bold">Top {results.length}</span>
                 </div>
                 {results.map(({ vendor, score, reasons }, idx) => (
                    <div key={vendor.id} className="border border-slate-200 rounded-xl p-4 hover:border-violet-300 hover:shadow-md transition group bg-white relative overflow-hidden">
                       <div className="absolute top-0 right-0 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">
                          契合度 {score}%
                       </div>
                       <div className="flex gap-4">
                          <img src={vendor.avatarUrl} className="w-16 h-16 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0" />
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-slate-800 text-lg group-hover:text-violet-700 transition truncate pr-20">
                                   <Link to={`/vendors/${vendor.id}`}>{vendor.name}</Link>
                                </h4>
                             </div>
                             <div className="flex flex-wrap gap-2 mb-3">
                                {reasons.map((r, i) => (
                                   <span key={i} className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-100 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                                      <Sparkles size={8} /> {r}
                                   </span>
                                ))}
                             </div>
                             <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1 font-bold text-slate-700"><Star size={12} className="text-yellow-400 fill-current"/> {vendor.rating}</span>
                                <span className="w-px h-3 bg-slate-300"></span>
                                <span>{vendor.categories[0]}</span>
                                <span className="w-px h-3 bg-slate-300"></span>
                                <span className="truncate">{vendor.region}</span>
                             </div>
                          </div>
                          <div className="flex flex-col justify-end">
                             <Link to={`/vendors/${vendor.id}`} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-violet-600 hover:text-white transition">
                                <ArrowRight size={20} />
                             </Link>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           )}
           {!isSearching && results.length === 0 && query && (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                 <Bot size={48} className="mx-auto mb-3 text-slate-300" />
                 <p className="text-slate-500 font-medium">尚無符合的推薦結果</p>
                 <p className="text-slate-400 text-sm mt-1">請嘗試描述得更具體，或使用不同的關鍵字。</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
