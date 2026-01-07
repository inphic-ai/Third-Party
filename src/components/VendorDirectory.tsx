
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_VENDORS, CATEGORY_GROUPS, TAIWAN_REGIONS, CHINA_REGIONS } from '../constants';
import { Region, EntityType, Vendor, VendorCategory, ServiceType } from '../types';
import { 
  Search, MapPin, BRIEFCASE, Star, ChevronRight, LayoutGrid, List, 
  LayoutList, FolderOpen, Plus, AlertTriangle, RefreshCw, Filter, 
  ArrowUpDown, Crown, Ban, Sparkles, Bot, X, Heart, CalendarCheck, 
  User, Building2, Phone, HelpCircle, Check, ChevronDown, GripVertical,
  ArrowRight, CheckCircle, Package, Hammer, Factory, Briefcase
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';

type ViewMode = 'grid' | 'card' | 'list';

export const VendorDirectory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>(''); 
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredVendors = useMemo(() => {
    return MOCK_VENDORS.filter(vendor => {
      const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            vendor.tags.some(t => t.includes(searchTerm));
      const matchesCategory = selectedCategory ? vendor.categories.includes(selectedCategory as any) : true;
      const matchesRegion = selectedRegion ? vendor.region === selectedRegion : true;
      const matchesService = selectedServiceType ? vendor.serviceTypes.includes(selectedServiceType as ServiceType) : true;
      return matchesSearch && matchesCategory && matchesRegion && matchesService;
    });
  }, [searchTerm, selectedCategory, selectedRegion, selectedServiceType]);

  const handleToggleFavorite = (vendorId: string) => {
    const vendor = MOCK_VENDORS.find(v => v.id === vendorId);
    if(vendor) {
        vendor.isFavorite = !vendor.isFavorite;
        setSearchTerm(prev => prev + " ");
        setTimeout(() => setSearchTerm(prev => prev.trim()), 0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 tracking-tight">協力廠商名錄</h1>
           <p className="text-gray-500 text-sm mt-1">
             管理 {MOCK_VENDORS.length} 家兩岸合作夥伴 • 提供 <span className="font-bold text-slate-800">勞務 / 商品 / 製造</span> 三大身分控管
           </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
           <div className="bg-white p-1 rounded-xl border border-gray-200 flex items-center shadow-sm">
              <button onClick={() => setViewMode('grid')} className={clsx("p-2 rounded-lg", viewMode === 'grid' ? "bg-slate-100" : "text-gray-400")}><LayoutGrid size={20} /></button>
              <button onClick={() => setViewMode('card')} className={clsx("p-2 rounded-lg", viewMode === 'card' ? "bg-slate-100" : "text-gray-400")}><LayoutList size={20} /></button>
           </div>
           <button className="bg-brand-700 text-white px-5 py-2.5 rounded-xl hover:bg-brand-800 transition font-black flex items-center gap-2 shadow-lg shadow-brand-200 uppercase tracking-widest text-xs">
             <Sparkles size={18} /> AI RECOMMEND
           </button>
           <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition font-black flex items-center gap-2 shadow-lg uppercase tracking-widest text-xs">
             <Plus size={18} /> Add Vendor
           </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4">
           <div className="flex-1 relative">
             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
             <input
               type="text"
               placeholder="搜尋名稱、標籤、系統 ID..."
               className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium text-slate-700 shadow-inner"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="flex flex-wrap gap-2">
             <select 
               className="px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 text-xs font-black text-gray-700 outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all uppercase tracking-widest"
               value={selectedServiceType}
               onChange={(e) => setSelectedServiceType(e.target.value)}
             >
               <option value="">Identity Filter</option>
               <option value={ServiceType.LABOR}>🛠️ 提供勞務</option>
               <option value={ServiceType.PRODUCT}>📦 提供商品</option>
               <option value={ServiceType.MANUFACTURING}>🏭 製造商品</option>
             </select>
             <select 
               className="px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 text-xs font-black text-gray-700 outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all uppercase tracking-widest"
               value={selectedRegion}
               onChange={(e) => setSelectedRegion(e.target.value)}
             >
               <option value="">Region: Global</option>
               <option value={Region.TAIWAN}>🇹🇼 TAIWAN</option>
               <option value={Region.CHINA}>🇨🇳 CHINA</option>
             </select>
           </div>
        </div>
      </div>

      <div className="min-h-[400px]">
        {viewMode === 'card' && (
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
                       <img src={vendor.avatarUrl} className="w-16 h-16 rounded-3xl object-cover border-2 border-white shadow-md transition group-hover:scale-105" />
                       <div className={clsx("absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm text-[10px] font-black text-white", vendor.region === Region.TAIWAN ? "bg-blue-500" : "bg-red-500")}>
                          {vendor.region === Region.TAIWAN ? "T" : "C"}
                       </div>
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-gray-800 line-clamp-1 group-hover:text-blue-600 transition tracking-tight">{vendor.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 font-black uppercase tracking-[0.1em]">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg">{vendor.id}</span>
                        <span className="flex items-center gap-1"><MapPin size={10}/> {vendor.region}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {vendor.serviceTypes.map(st => (
                      <span key={st} className={clsx(
                        "flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border",
                        st === ServiceType.LABOR ? "bg-blue-50 text-blue-700 border-blue-100" : 
                        st === ServiceType.PRODUCT ? "bg-orange-50 text-orange-700 border-orange-100" : 
                        "bg-indigo-50 text-indigo-700 border-indigo-100"
                      )}>
                        {st === ServiceType.LABOR ? <Hammer size={12}/> : st === ServiceType.PRODUCT ? <Package size={12}/> : <Factory size={12}/>}
                        {st}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <div>
                      <span className="text-gray-400 block mb-1 font-bold uppercase tracking-tighter">主要類別</span>
                      <span className="font-black text-slate-700">{vendor.categories[0]}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 block mb-1 font-bold uppercase tracking-tighter">用戶評分</span>
                      <span className="font-black text-yellow-600 flex items-center justify-end gap-1">{vendor.rating} <Star size={12} fill="currentColor"/></span>
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
                      {vendor.contacts.length > 3 && <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">+{vendor.contacts.length-3}</div>}
                   </div>
                   <Link to={`/vendors/${vendor.id}`} className="text-xs font-black text-slate-900 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-900 hover:text-white transition flex items-center gap-2 uppercase tracking-widest">
                      Detail Entry <ArrowRight size={14}/>
                   </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl border border-slate-100">
             <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center mb-6">
                <Plus size={32} />
             </div>
             <h3 className="text-2xl font-black text-slate-800 tracking-tight">新增協作夥伴</h3>
             <p className="text-slate-500 mt-2 font-medium">請選擇廠商註冊所在地，系統將引導至對應的認證流程。</p>
             <div className="mt-8 space-y-3">
                <button className="w-full py-4 bg-blue-50 text-blue-700 rounded-2xl font-black text-sm uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition">🇹🇼 Taiwan Region</button>
                <button className="w-full py-4 bg-red-50 text-red-700 rounded-2xl font-black text-sm uppercase tracking-widest border border-red-100 hover:bg-red-100 transition">🇨🇳 China Region</button>
             </div>
             <button onClick={()=>setShowAddModal(false)} className="w-full mt-6 text-slate-400 font-bold text-sm uppercase tracking-widest hover:text-slate-600 transition">Cancel Process</button>
          </div>
      </div>}
    </div>
  );
};
