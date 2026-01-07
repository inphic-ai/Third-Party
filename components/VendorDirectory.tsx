
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_VENDORS, CATEGORY_GROUPS, TAIWAN_REGIONS, CHINA_REGIONS } from '../constants';
import { Region, EntityType, Vendor, VendorCategory, ServiceType } from '../types';
import { 
  Search, MapPin, Star, ChevronRight, LayoutGrid, 
  LayoutList, Plus, Sparkles, X, Heart, 
  ArrowRight, Package, Hammer, Factory, Info, Globe, Filter
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';

type ViewMode = 'grid' | 'card' | 'list';

export const VendorDirectory: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>(searchParams.get('search') || ''); 
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [showAddModal, setShowAddModal] = useState(false);

  // 監聽 URL 變化（例如從公告點擊身分標籤跳轉過來）
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) {
      if (Object.values(ServiceType).includes(q as any)) {
         setSelectedServiceType(q);
         setSearchTerm('');
      } else {
         setSearchTerm(q);
      }
    }
  }, [searchParams]);

  const filteredVendors = useMemo(() => {
    return MOCK_VENDORS.filter(vendor => {
      const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            vendor.tags.some(t => t.includes(searchTerm));
      const matchesRegion = selectedRegion ? vendor.region === selectedRegion : true;
      const matchesService = selectedServiceType ? vendor.serviceTypes.includes(selectedServiceType as ServiceType) : true;
      return matchesSearch && matchesRegion && matchesService;
    });
  }, [searchTerm, selectedRegion, selectedServiceType]);

  const handleToggleFavorite = (vendorId: string) => {
    const vendor = MOCK_VENDORS.find(v => v.id === vendorId);
    if(vendor) {
        vendor.isFavorite = !vendor.isFavorite;
        // 觸發重新渲染
        setSearchTerm(prev => prev + " ");
        setTimeout(() => setSearchTerm(prev => prev.trim()), 0);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 tracking-tight">全球協作廠商戰術名錄</h1>
           <p className="text-gray-500 text-sm mt-1">
             管理 {MOCK_VENDORS.length} 家兩岸三地合作夥伴 • <span className="font-bold text-slate-800">身分屬性識別系統</span> 運行中
           </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
           <div className="bg-white p-1 rounded-xl border border-gray-200 flex items-center shadow-sm">
              <button onClick={() => setViewMode('grid')} className={clsx("p-2 rounded-lg transition", viewMode === 'grid' ? "bg-slate-900 text-white" : "text-gray-400 hover:text-gray-600")}><LayoutGrid size={18} /></button>
              <button onClick={() => setViewMode('card')} className={clsx("p-2 rounded-lg transition", viewMode === 'card' ? "bg-slate-900 text-white" : "text-gray-400 hover:text-gray-600")}><LayoutList size={18} /></button>
           </div>
           <button className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition font-bold flex items-center gap-2 shadow-md">
             <Sparkles size={18} /> AI 智能推薦
           </button>
           <button onClick={() => setShowAddModal(true)} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-900 transition font-bold flex items-center gap-2 shadow-md">
             <Plus size={18} /> 新增廠商
           </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-4">
           <div className="flex-1 relative group">
             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-slate-800 transition-colors" size={20} />
             <input
               type="text"
               placeholder="搜尋廠商名稱、標籤、系統 ID..."
               className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium text-slate-700"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="flex flex-wrap gap-2">
             <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 border border-slate-100">
               <Info size={16} className="text-slate-400" />
               <select 
                 className="py-3.5 bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
                 value={selectedServiceType}
                 onChange={(e) => setSelectedServiceType(e.target.value)}
               >
                 <option value="">所有身分屬性</option>
                 <option value={ServiceType.LABOR}>🛠️ 提供勞務</option>
                 <option value={ServiceType.PRODUCT}>📦 提供商品</option>
                 <option value={ServiceType.MANUFACTURING}>🏭 製造商品</option>
               </select>
             </div>
             
             <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 border border-slate-100">
               <Globe size={16} className="text-slate-400" />
               <select 
                 className="py-3.5 bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
                 value={selectedRegion}
                 onChange={(e) => setSelectedRegion(e.target.value)}
               >
                 <option value="">所有地區廠商</option>
                 <option value={Region.TAIWAN}>🇹🇼 台灣地區</option>
                 <option value={Region.CHINA}>🇨🇳 大陸地區</option>
               </select>
             </div>
           </div>
        </div>
      </div>

      <div className="min-h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVendors.map(vendor => (
            <div key={vendor.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 hover:shadow-2xl hover:shadow-slate-200 transition-all group relative h-full flex flex-col overflow-hidden">
              <div className="absolute top-4 right-4 flex gap-1">
                 <button onClick={() => handleToggleFavorite(vendor.id)} className={clsx("p-2 rounded-full transition bg-white/80 backdrop-blur", vendor.isFavorite ? "text-red-500 shadow-inner" : "text-gray-300 hover:text-red-300 shadow-sm")}>
                   <Heart size={20} className={clsx(vendor.isFavorite && "fill-current")} />
                 </button>
              </div>

              <Link to={`/vendors/${vendor.id}`} className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <img src={vendor.avatarUrl} className="w-16 h-16 rounded-[1.5rem] object-cover border-2 border-white shadow-md transition group-hover:scale-105" />
                    <div className={clsx(
                      "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm text-[10px] font-black",
                      vendor.region === Region.TAIWAN ? "bg-blue-500 text-white" : "bg-red-500 text-white"
                    )}>
                      {vendor.region === Region.TAIWAN ? "T" : "C"}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-800 line-clamp-1 group-hover:text-blue-600 transition tracking-tight">{vendor.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 uppercase font-black tracking-widest">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">{vendor.id}</span>
                      <span className="flex items-center gap-1"><MapPin size={10}/> {vendor.region}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {vendor.serviceTypes.map(st => (
                    <div key={st} className={clsx(
                      "flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border shadow-sm",
                      st === ServiceType.LABOR ? "bg-blue-50 text-blue-700 border-blue-100" : 
                      st === ServiceType.PRODUCT ? "bg-orange-50 text-orange-700 border-orange-100" : 
                      "bg-indigo-50 text-indigo-700 border-indigo-100"
                    )}>
                      {st === ServiceType.LABOR ? <Hammer size={12}/> : st === ServiceType.PRODUCT ? <Package size={12}/> : <Factory size={12}/>}
                      {st}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block mb-1 font-bold uppercase tracking-tighter">主營類別</span>
                    <span className="font-black text-slate-700">{vendor.categories[0]}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block mb-1 font-bold uppercase tracking-tighter">好評等級</span>
                    <div className="flex items-center justify-end gap-1 font-black text-yellow-600">
                       {vendor.rating} <Star size={12} fill="currentColor"/>
                    </div>
                  </div>
                </div>
              </Link>
              
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex -space-x-3">
                    {vendor.contacts.slice(0, 3).map((c, i) => (
                       <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm" title={c.name}>
                          {c.name.charAt(0)}
                       </div>
                    ))}
                 </div>
                 <Link to={`/vendors/${vendor.id}`} className="text-xs font-black text-slate-900 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-900 hover:text-white transition flex items-center gap-2 uppercase tracking-widest">
                    Detail <ArrowRight size={14} />
                 </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
