
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_VENDORS, CATEGORY_OPTIONS, TAIWAN_REGIONS, CHINA_REGIONS, MOCK_USERS } from '../constants';
import { Region, EntityType, Vendor, VendorCategory } from '../types';
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
  Building2,
  User,
  Phone,
  FileDigit,
  RefreshCw,
  Info,
  Globe,
  DollarSign,
  Calendar,
  Filter,
  ArrowUpDown,
  Crown,
  Ban,
  ScanLine,
  Sparkles,
  Bot,
  X,
  Heart
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';

type ViewMode = 'grid' | 'card' | 'list' | 'group';
type SortOption = 'default' | 'rating_desc' | 'txn_count' | 'last_active';

// AI Recommendation Interface
interface AiRecommendation {
  vendorId: string;
  reason: string;
  score: number;
}

export const VendorDirectory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>(Region.TAIWAN);
  const [selectedServiceArea, setSelectedServiceArea] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>(''); // New Filter
  
  // New Filters
  const [minRating, setMinRating] = useState<number>(0);
  const [showBlacklisted, setShowBlacklisted] = useState<boolean>(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [specialFilter, setSpecialFilter] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiSearch, setShowAiSearch] = useState(false);

  // Handle URL Params on Mount
  useEffect(() => {
    if (filterParam === 'missed') {
      setSpecialFilter('missed');
    } else if (filterParam === 'contacting') {
      setSpecialFilter('contacting');
    } else {
      setSpecialFilter(null);
    }
  }, [filterParam]);

  const clearSpecialFilter = () => {
    setSpecialFilter(null);
    setSearchParams({});
  };

  // Dynamic Service Area Options based on selected Region
  const availableServiceAreas = useMemo(() => {
    if (selectedRegion === Region.TAIWAN) return TAIWAN_REGIONS;
    if (selectedRegion === Region.CHINA) return CHINA_REGIONS;
    return [];
  }, [selectedRegion]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegion(e.target.value);
    setSelectedServiceArea(''); // Reset specific area when region changes
  };

  const filteredVendors = useMemo(() => {
    let result = MOCK_VENDORS.filter(vendor => {
      const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            vendor.categories.some(c => c.includes(searchTerm)) ||
                            vendor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vendor.taxId?.includes(searchTerm) ||
                            vendor.address?.includes(searchTerm) ||
                            vendor.tags.some(t => t.includes(searchTerm)); // Search tags
      
      const matchesCategory = selectedCategory ? vendor.categories.includes(selectedCategory as any) : true;
      const matchesRegion = selectedRegion ? vendor.region === selectedRegion : true;
      const matchesEntityType = selectedEntityType ? vendor.entityType === selectedEntityType : true;
      
      const matchesServiceArea = selectedServiceArea 
        ? (selectedServiceArea === '全部' ? true : vendor.serviceArea.includes(selectedServiceArea) || vendor.serviceArea.includes('全部'))
        : true;
      
      const matchesRating = vendor.rating >= minRating;
      const blacklistCheck = showBlacklisted ? vendor.isBlacklisted : !vendor.isBlacklisted;
      const matchesFavorite = showFavoritesOnly ? vendor.isFavorite : true;

      // Special Filters from Dashboard
      let matchesSpecial = true;
      if (specialFilter === 'missed') {
        matchesSpecial = (vendor.missedContactLogCount || 0) > 0;
      } else if (specialFilter === 'contacting') {
        // Mock logic: has contact logs in recent month or specific status
        matchesSpecial = vendor.contactLogs.length > 0;
      }

      return matchesSearch && matchesCategory && matchesRegion && matchesServiceArea && matchesRating && blacklistCheck && matchesSpecial && matchesFavorite && matchesEntityType;
    });

    // Sorting
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

  }, [searchTerm, selectedCategory, selectedRegion, selectedServiceArea, minRating, showBlacklisted, sortBy, specialFilter, showFavoritesOnly, selectedEntityType]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">廠商名錄</h1>
           <p className="text-slate-500 text-sm mt-1">
             管理 {MOCK_VENDORS.length} 家合作夥伴 • ID 規則: C=公司 / I=個人
           </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
           {/* View Mode Switcher */}
           <div className="bg-white p-1 rounded-lg border border-slate-200 flex items-center">
              <button onClick={() => setViewMode('grid')} className={clsx("p-2 rounded transition", viewMode === 'grid' ? "bg-slate-100 text-blue-600" : "text-slate-400 hover:text-slate-600")} title="Grid"><LayoutGrid size={20} /></button>
              <button onClick={() => setViewMode('card')} className={clsx("p-2 rounded transition", viewMode === 'card' ? "bg-slate-100 text-blue-600" : "text-slate-400 hover:text-slate-600")} title="Card"><LayoutList size={20} /></button>
              <button onClick={() => setViewMode('list')} className={clsx("p-2 rounded transition", viewMode === 'list' ? "bg-slate-100 text-blue-600" : "text-slate-400 hover:text-slate-600")} title="List"><List size={20} /></button>
              <button onClick={() => setViewMode('group')} className={clsx("p-2 rounded transition", viewMode === 'group' ? "bg-slate-100 text-blue-600" : "text-slate-400 hover:text-slate-600")} title="Group"><FolderOpen size={20} /></button>
           </div>

           <button
             onClick={() => setShowAiSearch(true)}
             className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-sm font-medium flex items-center gap-2"
           >
             <Sparkles size={18} /> AI 智能推薦
           </button>

           <button 
             onClick={() => setShowAddModal(true)}
             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium flex items-center gap-2"
           >
             <Plus size={18} /> 新增廠商
           </button>
        </div>
      </div>

      {/* Special Filter Banner */}
      {specialFilter && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-orange-800 text-sm font-bold">
              <AlertTriangle size={18} />
              目前正在篩選：
              {specialFilter === 'missed' && '未填寫聯繫紀錄的廠商 (請盡速補登)'}
              {specialFilter === 'contacting' && '近期聯繫中的案件'}
           </div>
           <button onClick={clearSpecialFilter} className="text-orange-600 hover:text-orange-900 bg-white/50 hover:bg-white rounded-lg px-3 py-1 text-xs font-bold transition flex items-center gap-1">
              清除篩選 <X size={14} />
           </button>
        </div>
      )}

      {/* Advanced Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4">
           {/* Search */}
           <div className="flex-1 relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
             <input
               type="text"
               placeholder="搜尋名稱、地址、標籤 (#急件)、統編..."
               className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           
           {/* Primary Filters */}
           <div className="flex flex-wrap gap-2">
             {/* New Entity Type Filter */}
             <select 
               className="px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={selectedEntityType}
               onChange={(e) => setSelectedEntityType(e.target.value)}
             >
               <option value="">身分 (全部)</option>
               <option value={EntityType.COMPANY}>🏢 公司行號</option>
               <option value={EntityType.INDIVIDUAL}>👤 個人接案</option>
             </select>

             <select 
               className="px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={selectedCategory}
               onChange={(e) => setSelectedCategory(e.target.value)}
             >
               <option value="">所有類別</option>
               {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
             </select>

             <select 
               className="px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
               value={selectedRegion}
               onChange={handleRegionChange}
             >
               <option value={Region.TAIWAN}>{Region.TAIWAN}</option>
               <option value={Region.CHINA}>{Region.CHINA}</option>
             </select>

             <select 
               className="px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
               value={selectedServiceArea}
               onChange={(e) => setSelectedServiceArea(e.target.value)}
               disabled={!selectedRegion}
             >
               <option value="">地區 (全部)</option>
               {availableServiceAreas.map(city => <option key={city} value={city}>{city}</option>)}
             </select>
           </div>
        </div>

        {/* Secondary Filters & Sort */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-3 border-t border-slate-50 gap-4">
           <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto">
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                 <Filter size={14} />
                 <span>評分 &ge;</span>
                 <select 
                    className="bg-transparent outline-none font-bold text-slate-800"
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                 >
                    <option value="0">全部</option>
                    <option value="3">3 星+</option>
                    <option value="4">4 星+</option>
                    <option value="4.5">4.5 星+</option>
                    <option value="5">5 星 (優良)</option>
                 </select>
              </div>

              <label className={clsx("flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border cursor-pointer transition select-none", 
                 showFavoritesOnly ? "bg-red-50 border-red-200 text-red-600 font-bold" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              )}>
                 <input type="checkbox" className="hidden" checked={showFavoritesOnly} onChange={() => setShowFavoritesOnly(!showFavoritesOnly)} />
                 <Heart size={14} className={clsx(showFavoritesOnly ? "fill-current" : "")} />
                 <span>我的最愛</span>
              </label>

              <label className={clsx("flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border cursor-pointer transition select-none", 
                 showBlacklisted ? "bg-red-50 border-red-200 text-red-700 font-bold" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              )}>
                 <input type="checkbox" className="hidden" checked={showBlacklisted} onChange={() => setShowBlacklisted(!showBlacklisted)} />
                 <Ban size={14} />
                 <span>只顯示黑名單</span>
              </label>
           </div>

           <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-slate-500 whitespace-nowrap"><ArrowUpDown size={14} className="inline"/> 排序：</span>
              <select 
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="default">預設 (ID)</option>
                <option value="rating_desc">評分 (高 &rarr; 低)</option>
                <option value="txn_count">合作次數 (多 &rarr; 少)</option>
                <option value="last_active">最近合作日 (新 &rarr; 少)</option>
              </select>
           </div>
        </div>
      </div>

      {/* Views Content */}
      <div className="min-h-[400px]">
        {filteredVendors.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            <p>找不到符合條件的廠商</p>
            {(specialFilter || showFavoritesOnly || selectedEntityType) && (
               <button 
                 onClick={() => { clearSpecialFilter(); setShowFavoritesOnly(false); setSelectedEntityType(''); }} 
                 className="mt-2 text-blue-600 hover:underline text-sm"
               >
                 清除篩選條件
               </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'card' && <CardView vendors={filteredVendors} />}
            {viewMode === 'grid' && <GridView vendors={filteredVendors} />}
            {viewMode === 'list' && <ListView vendors={filteredVendors} />}
            {viewMode === 'group' && <GroupView vendors={filteredVendors} />}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddModal && <AddVendorModal onClose={() => setShowAddModal(false)} />}
      {showAiSearch && <AiSearchModal onClose={() => setShowAiSearch(false)} />}
    </div>
  );
};

// ... (Rest of the file remains same: Helper, AiSearchModal, View Components, AddVendorModal)
// Helper for Last Service Date
const getLastServiceDate = (vendor: Vendor) => {
  if (vendor.transactions.length === 0) return '無紀錄';
  // Sort transactions by date desc just in case
  const sorted = [...vendor.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return sorted[0].date;
};

/* --- AI Search Modal (Optimized) --- */
const AiSearchModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<AiRecommendation[]>([]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResults([]);

    // Simulate AI Latency
    setTimeout(() => {
      // Mock AI Logic: Find matches based on keywords in query
      const matches: AiRecommendation[] = [];
      const lowerQuery = query.toLowerCase();

      MOCK_VENDORS.forEach(v => {
        let score = 0;
        let reasons: string[] = [];

        // Simple keyword matching for demo
        if (v.categories.some(c => lowerQuery.includes(c.toLowerCase()))) {
          score += 3;
          reasons.push(`專精於 ${v.categories[0]}`);
        }
        if (v.tags.some(t => lowerQuery.includes(t.toLowerCase()))) {
          score += 2;
          reasons.push(`符合標籤「${v.tags.find(t => lowerQuery.includes(t.toLowerCase()))}」`);
        }
        if (lowerQuery.includes('便宜') || lowerQuery.includes('預算')) {
          if (v.priceRange === '$') {
             score += 2;
             reasons.push('價格具有競爭力 ($)');
          }
        }
        if (lowerQuery.includes('品質') || lowerQuery.includes('好')) {
          if (v.rating >= 4.5) {
             score += 2;
             reasons.push(`歷史評價優良 (${v.rating}星)`);
          }
        }
        // Location Match (Simple)
        if (lowerQuery.includes(v.region) || v.serviceArea.includes(query.substring(0, 2))) {
           score += 1;
           reasons.push('服務區域相符');
        }

        if (score > 0 && !v.isBlacklisted) {
          matches.push({
            vendorId: v.id,
            reason: reasons.join('、'),
            score
          });
        }
      });

      // Sort by score
      matches.sort((a, b) => b.score - a.score);
      setResults(matches.slice(0, 3)); // Top 3
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles size={24} className="text-yellow-300" />
            AI 智能推薦助手
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">×</button>
        </div>

        <div className="p-6 overflow-y-auto">
           <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">請描述您的需求</label>
              <textarea 
                className="w-full border border-slate-200 rounded-xl p-4 h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-slate-50"
                placeholder="例如：我需要一個在台北市，配合度高且能處理急件的水電行，預算不用太低但品質要好..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                 <button 
                   onClick={handleSearch}
                   disabled={isSearching || !query.trim()}
                   className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-purple-700 disabled:opacity-50 transition flex items-center gap-2"
                 >
                   {isSearching ? <RefreshCw className="animate-spin" size={18}/> : <Bot size={18}/>}
                   {isSearching ? 'AI 分析中...' : '開始搜尋'}
                 </button>
              </div>
           </div>

           {/* Results */}
           {results.length > 0 && (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h3 className="font-bold text-slate-800 border-b pb-2 mb-2">推薦結果</h3>
               {results.map((res, idx) => {
                 const vendor = MOCK_VENDORS.find(v => v.id === res.vendorId);
                 if (!vendor) return null;
                 return (
                   <Link to={`/vendors/${vendor.id}`} key={vendor.id} className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition group">
                      <div className="flex gap-4">
                         <div className="relative">
                           <img src={vendor.avatarUrl} className="w-16 h-16 rounded-full object-cover" alt="" />
                           <div className="absolute -top-2 -left-2 bg-yellow-400 text-yellow-900 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                             {idx + 1}
                           </div>
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-start">
                               <h4 className="font-bold text-slate-800 text-lg group-hover:text-purple-700 transition">{vendor.name}</h4>
                               <div className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-50 px-2 py-0.5 rounded text-sm">
                                  <Star size={14} fill="currentColor" /> {vendor.rating}
                               </div>
                            </div>
                            <p className="text-sm text-slate-500 mb-2">{vendor.categories[0]} • {vendor.region}</p>
                            
                            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-sm text-purple-800 flex items-start gap-2">
                               <Bot size={16} className="mt-0.5 shrink-0" />
                               <div>
                                  <span className="font-bold">推薦原因：</span>
                                  {res.reason}
                               </div>
                            </div>
                         </div>
                      </div>
                   </Link>
                 );
               })}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

/* --- Performance Optimization: Memoized View Components --- */

// Memoized Card Component (Single Vendor)
const VendorCardItem: React.FC<{ vendor: Vendor }> = React.memo(({ vendor }) => (
  <Link to={`/vendors/${vendor.id}`} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col">
    {/* Type Stripe */}
    <div className={clsx("absolute left-0 top-0 bottom-0 w-1", vendor.entityType === EntityType.COMPANY ? "bg-blue-500" : "bg-green-500")} />
    
    {/* Header */}
    <div className="flex items-start justify-between mb-4 pl-2">
      <div className="flex items-center gap-4">
        <img src={vendor.avatarUrl} alt={vendor.name} loading="lazy" className="w-14 h-14 rounded-full object-cover border border-slate-200" />
        <div>
          <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1">
            {vendor.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="font-mono bg-slate-100 px-1 rounded">{vendor.id}</span>
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {vendor.region}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
          {/* Favorite Icon */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation(); // Stop propagation to prevent link click
              // In a real app, dispatch action here
              console.log('Toggle favorite', vendor.id);
            }}
            className="text-slate-300 hover:text-red-500 transition mb-1"
          >
            <Heart size={18} className={clsx(vendor.isFavorite ? "fill-red-500 text-red-500" : "")} />
          </button>

          {/* Status Badges */}
          {vendor.isBlacklisted && (
            <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200">
              <Ban size={10} /> 黑名單
            </span>
          )}
          {vendor.rating >= 5 && !vendor.isBlacklisted && (
            <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-200">
              <Crown size={10} /> 優良廠商
            </span>
          )}
          <div className="flex items-center gap-1 bg-slate-50 text-slate-700 px-2 py-1 rounded-full text-xs font-bold mt-1">
            <Star size={12} className={clsx("fill-current", vendor.rating >= 4.5 ? "text-yellow-400" : "text-slate-300")} />
            {vendor.rating}
          </div>
      </div>
    </div>
    
    {/* Info Grid */}
    <div className="pl-2 space-y-3 mb-4 flex-1">
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
          <div>
            <span className="text-slate-400 block text-[10px]">平均收費</span>
            <span className="font-medium text-slate-700">{vendor.priceRange}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">最近服務</span>
            <span className="font-medium text-slate-700">{getLastServiceDate(vendor)}</span>
          </div>
        </div>

        <div className="text-xs text-slate-600 flex items-center gap-2">
          <User size={12} /> 
          {vendor.contacts.find(c => c.isMainContact)?.name || '未指定窗口'}
        </div>
    </div>
    
    {/* Tags */}
    <div className="pl-2 mb-4 flex flex-wrap gap-1">
      {vendor.tags.slice(0, 3).map(tag => (
        <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
          #{tag}
        </span>
      ))}
      {vendor.tags.length > 3 && <span className="text-[10px] text-slate-400">+{vendor.tags.length - 3}</span>}
    </div>

    {/* Footer */}
    <div className="pl-2 border-t border-slate-100 pt-3 flex justify-between items-center text-sm text-slate-500 mt-auto">
      <div className="flex items-center gap-2">
          <Briefcase size={14} />
          <span>{vendor.transactions.length} 次合作</span>
      </div>
      <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
    </div>
  </Link>
));

const CardView: React.FC<{ vendors: Vendor[] }> = ({ vendors }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {vendors.map(vendor => (
      <VendorCardItem key={vendor.id} vendor={vendor} />
    ))}
  </div>
);

// Memoized Grid Item
const GridItem: React.FC<{ vendor: Vendor }> = React.memo(({ vendor }) => (
  <Link to={`/vendors/${vendor.id}`} className="bg-white rounded-xl p-4 border border-slate-100 hover:border-blue-300 hover:shadow-md transition flex flex-col items-center text-center group relative overflow-hidden">
    {/* Blacklist Overlay */}
    {vendor.isBlacklisted && <div className="absolute top-2 right-2 text-red-500"><Ban size={16} /></div>}
    {vendor.rating >= 5 && !vendor.isBlacklisted && <div className="absolute top-2 right-2 text-yellow-500"><Crown size={16} /></div>}
    {vendor.isFavorite && <div className="absolute top-2 left-2 text-red-500"><Heart size={16} className="fill-current"/></div>}

    <div className="relative">
      <img src={vendor.avatarUrl} alt={vendor.name} loading="lazy" className="w-16 h-16 rounded-2xl mb-3 object-cover shadow-sm group-hover:scale-105 transition-transform" />
      <div className={clsx("absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white", 
          vendor.entityType === EntityType.COMPANY ? "bg-blue-500" : "bg-green-500"
      )}>
        {vendor.entityType === EntityType.COMPANY ? "C" : "I"}
      </div>
    </div>
    <h3 className="font-bold text-slate-800 text-sm truncate w-full mb-1">{vendor.name}</h3>
    <p className="text-[10px] text-slate-500 truncate w-full mb-2">{vendor.priceRange} • {vendor.categories[0]}</p>
    <div className="mt-auto pt-2 w-full border-t border-slate-50 flex justify-center gap-1">
      <Star size={12} className={clsx("fill-current", vendor.rating >= 4.5 ? "text-yellow-400" : "text-slate-300")} />
      <span className="text-xs font-bold text-slate-600">{vendor.rating}</span>
    </div>
  </Link>
));

const GridView: React.FC<{ vendors: Vendor[] }> = ({ vendors }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
    {vendors.map(vendor => (
      <GridItem key={vendor.id} vendor={vendor} />
    ))}
  </div>
);

// Memoized List Row
const ListRow: React.FC<{ vendor: Vendor }> = React.memo(({ vendor }) => (
  <tr className={clsx("group", vendor.isBlacklisted ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-slate-50")}>
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <img src={vendor.avatarUrl} className="w-8 h-8 rounded-full" alt="" loading="lazy" />
        <div>
          <div className="font-medium text-slate-900 flex items-center gap-2">
              {vendor.name}
              {vendor.isFavorite && <Heart size={12} className="text-red-500 fill-current" />}
              {vendor.isBlacklisted && <Ban size={12} className="text-red-500"/>}
          </div>
          <div className="text-xs text-slate-400 font-mono">{vendor.id}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-800 font-medium">{vendor.priceRange}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">{vendor.categories[0]}</span>
          </div>
          <div className="flex gap-1">
            {vendor.tags.slice(0, 2).map(t => <span key={t} className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">#{t}</span>)}
          </div>
        </div>
    </td>
    <td className="px-6 py-4 text-slate-600">
      <div className="flex items-center gap-1 text-xs">
          <Calendar size={12} />
          {getLastServiceDate(vendor)}
      </div>
    </td>
    <td className="px-6 py-4 text-center">
      <span className={clsx("inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold text-xs",
          vendor.rating >= 5 ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-600"
      )}>
        {vendor.rating} <Star size={10} className="fill-current" />
      </span>
    </td>
    <td className="px-6 py-4 text-right">
      <Link to={`/vendors/${vendor.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
        查看
      </Link>
    </td>
  </tr>
));

const ListView: React.FC<{ vendors: Vendor[] }> = ({ vendors }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 font-semibold">廠商名稱 / ID</th>
            <th className="px-6 py-3 font-semibold">標籤 & 屬性</th>
            <th className="px-6 py-3 font-semibold">上次服務</th>
            <th className="px-6 py-3 font-semibold text-center">評分</th>
            <th className="px-6 py-3 font-semibold text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {vendors.map(vendor => (
            <ListRow key={vendor.id} vendor={vendor} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const GroupView: React.FC<{ vendors: Vendor[] }> = ({ vendors }) => {
  // Group by first category
  const groups = useMemo(() => {
    const g: Record<string, Vendor[]> = {};
    vendors.forEach(v => {
      const cat = v.categories[0] || 'Uncategorized';
      if (!g[cat]) g[cat] = [];
      g[cat].push(v);
    });
    return g;
  }, [vendors]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Object.entries(groups).map(([category, items]) => {
        const groupVendors = items as Vendor[];
        return (
          <div key={category} className="group cursor-pointer">
            <div className="bg-slate-50 rounded-xl p-3 border-2 border-transparent group-hover:border-blue-200 transition-colors">
              <div className="grid grid-cols-2 gap-2 mb-3 h-32">
                {groupVendors.slice(0, 4).map((item, idx) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 flex flex-col items-center justify-center relative overflow-hidden">
                    {item.isBlacklisted && <div className="absolute inset-0 bg-red-100/50 flex items-center justify-center"><Ban className="text-red-500 opacity-50"/></div>}
                    <img src={item.avatarUrl} className="w-6 h-6 rounded-full mb-1" alt="" loading="lazy"/>
                    <span className="text-[10px] text-slate-600 truncate w-full text-center">{item.name}</span>
                  </div>
                ))}
                {groupVendors.length < 4 && Array.from({ length: 4 - groupVendors.length }).map((_, i) => (
                  <div key={i} className="bg-slate-100/50 rounded-lg border border-dashed border-slate-200"></div>
                ))}
              </div>
              <div className="flex justify-between items-center px-1">
                <div>
                    <h3 className="font-bold text-slate-800">{category}</h3>
                    <p className="text-xs text-slate-500">{groupVendors.length} 個項目</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* --- Advanced Add Vendor Modal --- */
const AddVendorModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  // ... (Code remains identical to previous version, omitted for brevity but logic is preserved)
  const [entityType, setEntityType] = useState<EntityType>(EntityType.COMPANY);
  const [region, setRegion] = useState<Region>(Region.TAIWAN);
  const [isScanning, setIsScanning] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    taxId: '', 
    mainPhone: '',
    website: '', 
    contactName: '',
    contactRole: '', 
    contactMobile: '',
    address: '',
    companyLineId: '',
    companyWechatId: '',
    contactLineId: '',
    contactWechatId: ''
  });
  const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>([]);
  const creator = MOCK_USERS[0]; 

  const handleScanCard = () => {
    setIsScanning(true);
    setTimeout(() => {
      setFormData({
        name: '新時代裝修工程有限公司',
        taxId: '88991234',
        mainPhone: '02-8765-4321',
        website: 'www.new-era-deco.com.tw',
        contactName: '陳建宏',
        contactRole: '專案經理',
        contactMobile: '0910-123-456',
        address: '台北市內湖區瑞光路100號',
        companyLineId: '@new_era_deco',
        companyWechatId: '',
        contactLineId: 'chen_deco_888',
        contactWechatId: ''
      });
      setEntityType(EntityType.COMPANY);
      setRegion(Region.TAIWAN);
      setIsScanning(false);
    }, 1500);
  };

  const toggleServiceArea = (area: string) => {
    setSelectedServiceAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };
  
  const availableAreas = useMemo(() => {
     return region === Region.TAIWAN ? TAIWAN_REGIONS : CHINA_REGIONS;
  }, [region]);

  const generatedId = useMemo(() => {
    const prefix = entityType === EntityType.COMPANY ? 'C' : 'I';
    const year = new Date().getFullYear();
    const existingIds = MOCK_VENDORS
      .filter(v => v.id.startsWith(prefix + year))
      .map(v => parseInt(v.id.slice(5)));
    
    const maxSeq = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    
    return `${prefix}${year}${nextSeq}`;
  }, [entityType]);

  const duplicateInfo = useMemo(() => {
    if (!formData.taxId && !formData.mainPhone && !formData.name && !formData.contactMobile) return null;
    for (const v of MOCK_VENDORS) {
      if (formData.taxId && v.taxId === formData.taxId) return { type: '統一編號', value: formData.taxId, vendor: v };
      if (formData.name && v.name === formData.name) return { type: '廠商名稱', value: formData.name, vendor: v };
      if (formData.mainPhone && v.mainPhone?.includes(formData.mainPhone)) return { type: '公司代表號', value: formData.mainPhone, vendor: v };
      if (formData.contactMobile) {
         const matchingContact = v.contacts.find(c => c.mobile?.includes(formData.contactMobile));
         if (matchingContact) return { type: '窗口手機', value: formData.contactMobile, vendor: v };
      }
    }
    return null;
  }, [formData]);

  const isCompany = entityType === EntityType.COMPANY;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Plus size={24} className="text-blue-600" />
            新增合作夥伴
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>

        <div className="p-6 overflow-y-auto">
           {/* Scan Button Area */}
           <div className="mb-6 p-4 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center text-center">
              {isScanning ? (
                <div className="flex flex-col items-center gap-2">
                   <RefreshCw className="animate-spin text-blue-600" size={32} />
                   <span className="text-sm font-bold text-blue-800">名片辨識中...</span>
                </div>
              ) : (
                <>
                  <button 
                    onClick={handleScanCard}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                       <ScanLine size={24} />
                    </div>
                    <div>
                       <span className="block text-sm font-bold text-blue-800">上傳名片 (自動填寫)</span>
                       <span className="text-xs text-blue-600/70">支援 JPG, PNG 格式</span>
                    </div>
                  </button>
                </>
              )}
           </div>

          {/* Step 1: Entity Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">1. 選擇廠商身分</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setEntityType(EntityType.COMPANY)}
                className={clsx(
                  "p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition",
                  isCompany ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 hover:border-slate-300 text-slate-500"
                )}
              >
                <Building2 size={32} />
                <span className="font-bold">公司/行號</span>
              </button>
              <button
                onClick={() => setEntityType(EntityType.INDIVIDUAL)}
                className={clsx(
                  "p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition",
                  !isCompany ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 hover:border-slate-300 text-slate-500"
                )}
              >
                <User size={32} />
                <span className="font-bold">個人接案</span>
              </button>
            </div>
          </div>

          {/* Step 2: ID Preview */}
          <div className="mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
               <Info size={16} />
               <span>系統將自動指派 ID:</span>
            </div>
            <div className="font-mono font-bold text-lg text-blue-600 tracking-wider">
              {generatedId}
            </div>
          </div>

          {/* Step 3: Form Details */}
          <div className="space-y-4">
             <div className="flex justify-between items-center border-b pb-2 mb-2">
               <div className="text-sm font-bold text-slate-700">2. 基本資料 & 地區</div>
               <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-medium">
                  <button 
                    onClick={() => { setRegion(Region.TAIWAN); setSelectedServiceAreas([]); }}
                    className={clsx("px-3 py-1 rounded transition", region === Region.TAIWAN ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}
                  >
                    台灣
                  </button>
                  <button 
                    onClick={() => { setRegion(Region.CHINA); setSelectedServiceAreas([]); }}
                    className={clsx("px-3 py-1 rounded transition", region === Region.CHINA ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}
                  >
                    大陸
                  </button>
               </div>
             </div>
             
             {/* Duplicate Warning Box */}
             {duplicateInfo && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3 animate-pulse mb-4">
                 <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
                 <div>
                   <h4 className="text-red-800 font-bold text-sm">注意：資料重複 - {duplicateInfo.type}</h4>
                   <p className="text-red-700 text-xs mt-1">
                     輸入值：<span className="font-bold underline">{duplicateInfo.value}</span>
                   </p>
                   <p className="text-red-600 text-xs mt-1">
                     已存在於資料庫：{duplicateInfo.vendor.name} ({duplicateInfo.vendor.id})
                   </p>
                 </div>
              </div>
            )}

             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {isCompany ? "廠商名稱 (公司全名)" : "廠商姓名"} <span className="text-red-500">*</span>
                </label>
                <input 
                  className={clsx("w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500", duplicateInfo?.type === '廠商名稱' ? "border-red-500 bg-red-50" : "border-slate-300")}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder={isCompany ? "例如：大發工程有限公司" : "例如：陳小明"}
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {isCompany ? "統一編號" : "身分證字號"} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className={clsx("w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500", duplicateInfo?.type === '統一編號' ? "border-red-500 bg-red-50" : "border-slate-300")}
                    value={formData.taxId}
                    onChange={e => setFormData({...formData, taxId: e.target.value})}
                    placeholder={isCompany ? "8碼數字" : "身分證字號"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {isCompany ? "公司代表號" : "個人手機"} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className={clsx("w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500", duplicateInfo?.type === '公司代表號' ? "border-red-500 bg-red-50" : "border-slate-300")}
                    value={formData.mainPhone}
                    onChange={e => setFormData({...formData, mainPhone: e.target.value})}
                    placeholder={isCompany ? "02-xxxx-xxxx" : "09xx-xxx-xxx"}
                  />
                </div>
             </div>
             
             {/* Address Field */}
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  公司/聯絡地址
                </label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    className="w-full border border-slate-300 rounded p-2 pl-8 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="例如：台北市..."
                  />
                </div>
             </div>

             {/* Company Website Field */}
             {isCompany && (
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    公司網站 (Website)
                  </label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      className="w-full border border-slate-300 rounded p-2 pl-8 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.website}
                      onChange={e => setFormData({...formData, website: e.target.value})}
                      placeholder="https://www.example.com"
                    />
                  </div>
               </div>
             )}

             {/* Corporate / Main Vendor IDs */}
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {isCompany ? "企業 LINE ID" : "個人 LINE ID"}
                  </label>
                  <input 
                    className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                    value={formData.companyLineId}
                    onChange={e => setFormData({...formData, companyLineId: e.target.value})}
                    placeholder="@company_id"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {isCompany ? "企業 WeChat ID" : "個人 WeChat ID"}
                  </label>
                  <input 
                    className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                    value={formData.companyWechatId}
                    onChange={e => setFormData({...formData, companyWechatId: e.target.value})}
                    placeholder="wxid_..."
                  />
                </div>
             </div>

             {/* Service Area Selection */}
             <div className="pt-2">
                <label className="block text-xs font-bold text-slate-500 mb-2">服務範圍 (可多選)</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-32 overflow-y-auto">
                   {availableAreas.filter(r => r !== '全部').map(area => (
                     <button
                        key={area}
                        onClick={() => toggleServiceArea(area)}
                        className={clsx(
                          "px-2 py-1 text-xs rounded-full border transition-all",
                          selectedServiceAreas.includes(area) 
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                            : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                        )}
                     >
                       {area}
                     </button>
                   ))}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  已選擇: {selectedServiceAreas.length > 0 ? selectedServiceAreas.join(', ') : '未設定 (預設為全部)'}
                </div>
             </div>

             {isCompany && (
               <>
                 <div className="text-sm font-bold text-slate-700 border-b pb-2 pt-4 mb-2">3. 主要聯繫窗口 (Contact Person)</div>
                 <div className="bg-slate-50 p-3 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">窗口姓名</label>
                        <input 
                          className="w-full border border-slate-300 rounded p-2 text-sm outline-none"
                          value={formData.contactName}
                          onChange={e => setFormData({...formData, contactName: e.target.value})}
                          placeholder="例如：王經理"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">職稱 (Role)</label>
                        <input 
                          className="w-full border border-slate-300 rounded p-2 text-sm outline-none"
                          value={formData.contactRole}
                          onChange={e => setFormData({...formData, contactRole: e.target.value})}
                          placeholder="例如：業務經理、會計"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">窗口手機/分機</label>
                      <input 
                        className={clsx("w-full border rounded p-2 text-sm outline-none", duplicateInfo?.type === '窗口手機' ? "border-red-500 bg-red-50" : "border-slate-300")}
                        value={formData.contactMobile}
                        onChange={e => setFormData({...formData, contactMobile: e.target.value})}
                        placeholder="09xx-xxx-xxx"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">窗口 LINE ID</label>
                        <input 
                          className="w-full border border-slate-300 rounded p-2 text-sm outline-none"
                          value={formData.contactLineId}
                          onChange={e => setFormData({...formData, contactLineId: e.target.value})}
                          placeholder="Personal ID"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">窗口 WeChat ID</label>
                        <input 
                          className="w-full border border-slate-300 rounded p-2 text-sm outline-none"
                          value={formData.contactWechatId}
                          onChange={e => setFormData({...formData, contactWechatId: e.target.value})}
                          placeholder="Personal ID"
                        />
                      </div>
                    </div>
                 </div>
               </>
             )}
             
             {/* Referrer Info (Auto-filled) */}
             <div className="mt-4 pt-4 border-t border-slate-200">
               <div className="flex items-center gap-2 text-xs text-slate-500">
                 <span>建檔推薦人:</span>
                 <div className="flex items-center gap-1 font-bold text-slate-700">
                   <img src={creator.avatarUrl} className="w-4 h-4 rounded-full" />
                   {creator.name}
                 </div>
               </div>
             </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition">
            取消
          </button>
          <button 
            disabled={!!duplicateInfo || !formData.name} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium transition"
          >
            確認建立
          </button>
        </div>
      </div>
    </div>
  );
};
