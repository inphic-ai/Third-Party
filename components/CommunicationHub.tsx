
import React, { useState, useMemo } from 'react';
import { MOCK_VENDORS, CATEGORY_OPTIONS } from '../constants';
import { SocialGroup, ContactWindow, EntityType, Vendor, VendorCategory } from '../types';
import { 
  MessageCircle, 
  Search, 
  ExternalLink, 
  Copy, 
  QrCode, 
  Hash, 
  User, 
  Building2, 
  Users,
  Filter,
  CheckCircle2,
  Plus,
  X,
  Save,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Edit3,
  Sparkles,
  Bot,
  RefreshCw,
  ArrowRight,
  GripVertical
} from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

type Platform = 'LINE' | 'WeChat';
type ViewType = 'GROUPS' | 'CONTACTS';

// Extended interface for AI and Filtering context
interface FlattenedGroup extends SocialGroup {
  vendorName: string;
  vendorId: string;
  vendorAvatar: string;
  vendorCategories: VendorCategory[];
  vendorTags: string[];
}

interface FlattenedContact {
  id: string;
  name: string;
  role: string;
  vendorName: string;
  vendorId: string;
  vendorAvatar: string;
  accountId: string;
  isCorporate: boolean;
  isMainContact: boolean;
  vendorCategories: VendorCategory[];
  vendorTags: string[];
}

interface AiSearchResult {
  id: string;
  type: 'GROUP' | 'CONTACT';
  title: string;
  subtitle: string;
  vendorId: string;
  matchReason: string;
  score: number;
}

const ITEMS_PER_PAGE = 9; // 3x3 Grid or 9 rows

export const CommunicationHub: React.FC = () => {
  const [platform, setPlatform] = useState<Platform>('LINE');
  const [viewType, setViewType] = useState<ViewType>('GROUPS');
  const [groupViewMode, setGroupViewMode] = useState<'GRID' | 'LIST'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Advanced Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');

  // Modal State
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showAiSearch, setShowAiSearch] = useState(false);

  // Drag and Drop State
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Reset pagination when main controls change
  const handlePlatformChange = (p: Platform) => {
    setPlatform(p);
    setSelectedCategoryFilter('');
    setSelectedRoleFilter('');
    setCurrentPage(1);
  };

  const handleViewTypeChange = (v: ViewType) => {
    setViewType(v);
    setCurrentPage(1);
  };

  // Initialize Data (Enriched with Categories and Tags for Filtering/AI)
  const initialGroups: FlattenedGroup[] = useMemo(() => {
    return MOCK_VENDORS.flatMap(v => 
      (v.socialGroups || []).map(g => ({
        ...g,
        vendorName: v.name,
        vendorId: v.id,
        vendorAvatar: v.avatarUrl,
        vendorCategories: v.categories,
        vendorTags: v.tags
      }))
    );
  }, []);

  const [allGroups, setAllGroups] = useState<FlattenedGroup[]>(initialGroups);

  // Flatten Contact Data
  const allContacts: FlattenedContact[] = useMemo(() => {
    const contacts: FlattenedContact[] = [];

    MOCK_VENDORS.forEach(v => {
      // Common Props
      const common = {
        vendorName: v.name,
        vendorId: v.id,
        vendorAvatar: v.avatarUrl,
        vendorCategories: v.categories,
        vendorTags: v.tags
      };

      // Add Corporate/Main Account if exists
      if (platform === 'LINE' && v.lineId) {
        contacts.push({
          ...common,
          id: `${v.id}-corp-line`,
          name: v.entityType === EntityType.COMPANY ? '官方帳號/主帳號' : v.name,
          role: '企業窗口',
          accountId: v.lineId,
          isCorporate: true,
          isMainContact: false
        });
      }
      if (platform === 'WeChat' && v.wechatId) {
        contacts.push({
          ...common,
          id: `${v.id}-corp-wechat`,
          name: v.entityType === EntityType.COMPANY ? '官方帳號/主帳號' : v.name,
          role: '企業窗口',
          accountId: v.wechatId,
          isCorporate: true,
          isMainContact: false
        });
      }

      // Add Individual Contacts
      v.contacts.forEach(c => {
        const accId = platform === 'LINE' ? c.lineId : c.wechatId;
        if (accId) {
          contacts.push({
            ...common,
            id: `${v.id}-${c.id}`,
            name: c.name,
            role: c.role,
            accountId: accId,
            isCorporate: false,
            isMainContact: c.isMainContact
          });
        }
      });
    });

    return contacts;
  }, [platform]);

  // Unique lists for dropdowns
  const roleOptions = useMemo(() => Array.from(new Set(allContacts.map(c => c.role))), [allContacts]);

  // Filtering Logic
  const filteredGroups = allGroups.filter(g => {
    const matchesPlatform = g.platform === platform;
    const matchesSearch = g.groupName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          g.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.systemCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category Filter
    const matchesCategory = selectedCategoryFilter 
      ? g.vendorCategories.includes(selectedCategoryFilter as VendorCategory) 
      : true;
    
    return matchesPlatform && matchesSearch && matchesCategory;
  });

  const filteredContacts = allContacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.accountId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category Filter
    const matchesCategory = selectedCategoryFilter 
      ? c.vendorCategories.includes(selectedCategoryFilter as VendorCategory) 
      : true;

    const matchesRole = selectedRoleFilter ? c.role === selectedRoleFilter : true;

    return matchesSearch && matchesCategory && matchesRole;
  });

  // Pagination Data
  const currentData = viewType === 'GROUPS' ? filteredGroups : filteredContacts;
  const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);
  const paginatedData = currentData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleAddGroupSubmit = (newGroup: FlattenedGroup) => {
    setAllGroups([newGroup, ...allGroups]);
    setShowAddGroupModal(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`已複製 ID: ${text}`);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Optional: set drag image ghost
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault(); // Allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    // Only allow reordering if we are looking at the sorted/filtered list that matches original data somewhat
    // But for simplicity in this demo, we reorder 'allGroups' based on finding indices
    
    const sourceIndex = allGroups.findIndex(g => g.id === draggedId);
    const targetIndex = allGroups.findIndex(g => g.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newGroups = [...allGroups];
    const [movedGroup] = newGroups.splice(sourceIndex, 1);
    newGroups.splice(targetIndex, 0, movedGroup);

    setAllGroups(newGroups);
    setDraggedId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      {/* Header Area */}
      <div>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={clsx("p-3 rounded-xl transition-colors", platform === 'LINE' ? "bg-green-100 text-green-600" : "bg-green-700 text-white")}>
              <MessageCircle size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">通訊軟體管理中心</h1>
              <p className="text-slate-500 text-sm">統一管理 {platform} 平台的所有群組資產與聯絡人</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
               onClick={() => setShowAiSearch(true)}
               className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
               <Sparkles size={18} className="text-yellow-300" /> AI 智能搜群
            </button>
            
            {viewType === 'GROUPS' && (
              <button 
                onClick={() => setShowAddGroupModal(true)}
                className={clsx(
                  "px-4 py-2 rounded-lg text-white font-bold shadow-md flex items-center gap-2 transition hover:opacity-90",
                  platform === 'LINE' ? "bg-[#06C755]" : "bg-[#07C160]"
                )}
              >
                <Plus size={18} /> 新增群組
              </button>
            )}
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex gap-4 border-b border-slate-200">
          <button 
            onClick={() => handlePlatformChange('LINE')}
            className={clsx(
              "px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all",
              platform === 'LINE' ? "border-green-500 text-green-600 bg-green-50/50" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            LINE
            <span className="ml-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">
              {allGroups.filter(g => g.platform === 'LINE').length} 群
            </span>
          </button>
          <button 
            onClick={() => handlePlatformChange('WeChat')}
            className={clsx(
              "px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all",
              platform === 'WeChat' ? "border-green-600 text-green-700 bg-green-50/50" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-green-700"></span>
            WeChat (微信)
            <span className="ml-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">
              {allGroups.filter(g => g.platform === 'WeChat').length} 群
            </span>
          </button>
        </div>
      </div>

      {/* Controls & Sub-tabs & Advanced Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex w-full lg:w-auto items-center gap-2">
            {/* View Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg flex-1 lg:flex-none">
              <button 
                onClick={() => handleViewTypeChange('GROUPS')}
                className={clsx("flex-1 lg:flex-none px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition", viewType === 'GROUPS' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}
              >
                <Hash size={16} /> 專案群組
              </button>
              <button 
                onClick={() => handleViewTypeChange('CONTACTS')}
                className={clsx("flex-1 lg:flex-none px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition", viewType === 'CONTACTS' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}
              >
                <Users size={16} /> 聯絡人
              </button>
            </div>

            {/* Grid/List Toggle for Groups */}
            {viewType === 'GROUPS' && (
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setGroupViewMode('GRID')} 
                  className={clsx("p-2 rounded transition", groupViewMode === 'GRID' ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-600")}
                  title="Grid View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setGroupViewMode('LIST')} 
                  className={clsx("p-2 rounded transition", groupViewMode === 'LIST' ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-600")}
                  title="List View"
                >
                  <LayoutList size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={viewType === 'GROUPS' ? "搜尋群組名稱、代碼..." : "搜尋姓名、ID..."}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
           <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
             <Filter size={12} /> 篩選條件:
           </span>
           
           {/* Category Filter (Updated from Vendor Filter) */}
           <select 
             className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-green-500 cursor-pointer hover:bg-slate-100"
             value={selectedCategoryFilter}
             onChange={(e) => { setSelectedCategoryFilter(e.target.value); setCurrentPage(1); }}
           >
             <option value="">所有廠商類別</option>
             {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
           </select>

           {/* Role Filter (Contacts Only) */}
           {viewType === 'CONTACTS' && (
             <select 
               className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-green-500 cursor-pointer hover:bg-slate-100"
               value={selectedRoleFilter}
               onChange={(e) => { setSelectedRoleFilter(e.target.value); setCurrentPage(1); }}
             >
               <option value="">所有角色</option>
               {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
             </select>
           )}

           {(selectedCategoryFilter || selectedRoleFilter) && (
             <button 
               onClick={() => { setSelectedCategoryFilter(''); setSelectedRoleFilter(''); setCurrentPage(1); }}
               className="text-xs text-red-500 hover:underline ml-auto"
             >
               清除篩選
             </button>
           )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 flex flex-col justify-between">
        <div className="mb-6">
          {viewType === 'GROUPS' ? (
            <>
              {groupViewMode === 'GRID' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedData.map((group: any) => (
                    <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition group-card">
                      <div className={clsx("h-2 w-full", platform === 'LINE' ? "bg-green-500" : "bg-green-600")}></div>
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col gap-1">
                            {/* System Code Priority Display */}
                            <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <Hash size={14} className="text-slate-400" />
                              {group.systemCode}
                            </span>
                            <span className="text-xs text-slate-500 line-clamp-1" title={group.groupName}>
                              {group.groupName}
                            </span>
                          </div>
                          {/* Status Indicator */}
                          <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-100 whitespace-nowrap">
                            <CheckCircle2 size={10} /> 已加入
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3 mb-4 p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <img src={group.vendorAvatar} className="w-6 h-6 rounded-full" alt="" />
                          <div className="min-w-0 flex-1">
                            <Link to={`/vendors/${group.vendorId}`} className="text-sm text-slate-600 hover:text-blue-600 hover:underline truncate block">
                              {group.vendorName}
                            </Link>
                            <div className="flex gap-1 mt-0.5">
                               {group.vendorCategories.slice(0, 2).map((cat: string) => (
                                 <span key={cat} className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded">{cat}</span>
                               ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-2 mb-4">
                           <p className="text-[10px] font-bold text-slate-400 mb-1">群組用途/公用描述</p>
                           <p className="text-xs text-slate-600 h-8 line-clamp-2">
                             {group.note || "無描述"}
                           </p>
                        </div>

                        <div className="flex gap-2">
                          <a 
                            href={group.inviteLink || "#"} 
                            target="_blank" 
                            rel="noreferrer"
                            className={clsx(
                              "flex-1 py-2 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition text-sm",
                              platform === 'LINE' ? "bg-[#06C755] hover:bg-[#05b34c]" : "bg-[#07C160] hover:bg-[#06ad56]",
                              !group.inviteLink && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <ExternalLink size={14} /> 
                            開啟
                          </a>
                          {group.qrCodeUrl && (
                            <button className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">
                              <QrCode size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View (Table with Drag & Drop) */
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="w-10 py-3"></th> {/* Grip Column */}
                          <th className="px-6 py-3 font-semibold w-16">平台</th>
                          <th className="px-6 py-3 font-semibold">系統代碼</th>
                          <th className="px-6 py-3 font-semibold">群組名稱</th>
                          <th className="px-6 py-3 font-semibold">所屬廠商 & 類別</th>
                          <th className="px-6 py-3 font-semibold w-1/3">群組用途/公用描述</th>
                          <th className="px-6 py-3 font-semibold text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedData.map((group: any) => (
                          <tr 
                            key={group.id} 
                            className={clsx(
                              "hover:bg-slate-50 transition-colors",
                              draggedId === group.id && "bg-blue-50 opacity-50 border-2 border-blue-200"
                            )}
                            draggable={!searchTerm && !selectedCategoryFilter} // Only draggable when not filtering
                            onDragStart={(e) => handleDragStart(e, group.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, group.id)}
                          >
                            <td className="pl-4">
                               {(!searchTerm && !selectedCategoryFilter) ? (
                                 <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-2 rounded">
                                   <GripVertical size={16} />
                                 </div>
                               ) : (
                                 <div className="w-8"></div>
                               )}
                            </td>
                            <td className="px-6 py-4">
                               <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs", platform === 'LINE' ? "bg-green-500" : "bg-green-600")}>
                                  {platform === 'LINE' ? 'L' : 'W'}
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">{group.systemCode}</span>
                            </td>
                            <td className="px-6 py-4">
                               <span className="font-bold text-slate-800 block truncate max-w-[200px]" title={group.groupName}>{group.groupName}</span>
                            </td>
                            <td className="px-6 py-4">
                               <Link to={`/vendors/${group.vendorId}`} className="flex items-center gap-2 text-blue-600 hover:underline mb-1">
                                  <img src={group.vendorAvatar} className="w-6 h-6 rounded-full" alt=""/>
                                  <span className="truncate max-w-[150px]">{group.vendorName}</span>
                               </Link>
                               <div className="flex gap-1">
                                 {group.vendorCategories.map((c: string) => (
                                   <span key={c} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded">{c}</span>
                                 ))}
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="text-slate-600 text-xs leading-relaxed max-w-xs">
                                  {group.note || <span className="text-slate-300 italic">無描述</span>}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2">
                                  <a 
                                    href={group.inviteLink || "#"} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className={clsx("p-2 rounded hover:bg-slate-100 text-slate-500 hover:text-green-600 transition", !group.inviteLink && "opacity-50 pointer-events-none")}
                                    title="開啟連結"
                                  >
                                    <ExternalLink size={18} />
                                  </a>
                                  {group.qrCodeUrl && (
                                    <button className="p-2 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition" title="顯示 QR Code">
                                      <QrCode size={18} />
                                    </button>
                                  )}
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {paginatedData.length === 0 && (
                <div className="col-span-full text-center py-20 text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200">
                  <p>找不到符合的群組</p>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedData.map((contact: any) => (
                  <div key={contact.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition relative group">
                    <div className={clsx("absolute top-0 left-0 w-1 h-full rounded-l-xl", contact.isCorporate ? "bg-blue-500" : "bg-slate-300")}></div>
                    <div className="pl-3">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                              <div className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                                contact.isCorporate ? "bg-blue-500" : "bg-slate-400"
                              )}>
                                {contact.isCorporate ? <Building2 size={18} /> : <User size={18} />}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-800 text-sm">{contact.name}</h3>
                                <p className="text-xs text-slate-500">{contact.role}</p>
                              </div>
                          </div>
                          {contact.isMainContact && (
                            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">主窗口</span>
                          )}
                        </div>

                        <div className="bg-slate-50 rounded-lg p-2 mb-3">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">所屬廠商 ({contact.vendorCategories[0]})</p>
                          <Link to={`/vendors/${contact.vendorId}`} className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-600">
                              <img src={contact.vendorAvatar} className="w-4 h-4 rounded-full" alt="" />
                              <span className="truncate">{contact.vendorName}</span>
                          </Link>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <div className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded select-all">
                              {contact.accountId}
                          </div>
                          <button 
                            onClick={() => copyToClipboard(contact.accountId)}
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition"
                            title="複製 ID"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                    </div>
                  </div>
              ))}
              {paginatedData.length === 0 && (
                  <div className="col-span-full text-center py-20 text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200">
                    <p>找不到符合的聯絡人</p>
                  </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 py-4 bg-white/50 backdrop-blur rounded-xl border border-slate-100 shadow-sm sticky bottom-0">
             <button 
               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
               disabled={currentPage === 1}
               className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-slate-600 shadow-sm"
             >
               <ChevronLeft size={20} />
             </button>
             <span className="text-sm font-bold text-slate-600">
               第 {currentPage} 頁 / 共 {totalPages} 頁
             </span>
             <button 
               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
               disabled={currentPage === totalPages}
               className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-slate-600 shadow-sm"
             >
               <ChevronRight size={20} />
             </button>
          </div>
        )}
      </div>

      {/* Add Group Modal */}
      {showAddGroupModal && (
        <AddGroupModal 
          platform={platform} 
          onClose={() => setShowAddGroupModal(false)} 
          onSubmit={handleAddGroupSubmit}
        />
      )}

      {/* AI Search Modal */}
      {showAiSearch && (
        <AiSearchModal 
          allGroups={allGroups}
          allContacts={allContacts}
          platform={platform}
          onClose={() => setShowAiSearch(false)}
        />
      )}
    </div>
  );
};

/* --- Add Group Modal --- */
const AddGroupModal: React.FC<{ 
  platform: Platform;
  onClose: () => void; 
  onSubmit: (group: FlattenedGroup) => void;
}> = ({ platform, onClose, onSubmit }) => {
  const [vendorId, setVendorId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [systemCode, setSystemCode] = useState(`GRP-${platform === 'LINE' ? 'L' : 'W'}-${Date.now().toString().slice(-4)}`);
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');

  const handleSubmit = () => {
    const vendor = MOCK_VENDORS.find(v => v.id === vendorId);
    if (!vendor || !groupName) return;

    const newGroup: FlattenedGroup = {
      id: `g-new-${Date.now()}`,
      platform,
      groupName,
      systemCode,
      note,
      inviteLink: link,
      // Flattened props
      vendorName: vendor.name,
      vendorId: vendor.id,
      vendorAvatar: vendor.avatarUrl,
      vendorCategories: vendor.categories,
      vendorTags: vendor.tags
    };
    onSubmit(newGroup);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
         <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-lg text-slate-800">新增 {platform} 群組</h3>
            <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
         </div>
         <div className="p-6 space-y-4">
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-1">所屬廠商</label>
               <select 
                 className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                 value={vendorId}
                 onChange={e => setVendorId(e.target.value)}
               >
                 <option value="">請選擇廠商...</option>
                 {MOCK_VENDORS.map(v => (
                   <option key={v.id} value={v.id}>{v.name} ({v.id})</option>
                 ))}
               </select>
            </div>
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-1">群組名稱</label>
               <input 
                 className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                 value={groupName}
                 onChange={e => setGroupName(e.target.value)}
                 placeholder="例如：2024 某某專案群"
               />
            </div>
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-1">系統代碼 (自動產生)</label>
               <input 
                 className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 text-slate-500 font-mono"
                 value={systemCode}
                 readOnly
               />
            </div>
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-1">邀請連結 (選填)</label>
               <input 
                 className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                 value={link}
                 onChange={e => setLink(e.target.value)}
                 placeholder="https://..."
               />
            </div>
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-1">備註/用途</label>
               <textarea 
                 className="w-full border border-slate-200 rounded-lg p-2 text-sm h-20 resize-none"
                 value={note}
                 onChange={e => setNote(e.target.value)}
                 placeholder="例如：施工進度回報用..."
               />
            </div>
         </div>
         <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-sm">取消</button>
            <button 
              onClick={handleSubmit} 
              disabled={!vendorId || !groupName}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              建立群組
            </button>
         </div>
      </div>
    </div>
  );
};

/* --- AI Search Modal --- */
interface AiSearchModalProps {
  allGroups: FlattenedGroup[];
  allContacts: FlattenedContact[];
  platform: Platform;
  onClose: () => void;
}

const AiSearchModal: React.FC<AiSearchModalProps> = ({ allGroups, allContacts, platform, onClose }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<AiSearchResult[]>([]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResults([]);

    // Simulate AI Semantic Search Logic
    setTimeout(() => {
       const searchResults: AiSearchResult[] = [];
       const lowerQuery = query.toLowerCase();
       
       // Heuristic Matching Logic (Simulating Embeddings)
       // 1. Search Groups
       allGroups.filter(g => g.platform === platform).forEach(g => {
         let score = 0;
         let reasons: string[] = [];
         
         // Match Category (High Priority)
         g.vendorCategories.forEach(cat => {
            if (lowerQuery.includes(cat)) {
              score += 10;
              reasons.push(`屬於「${cat}」類別群組`);
            }
         });

         // Match Tags
         g.vendorTags.forEach(tag => {
            if (lowerQuery.includes(tag)) {
              score += 5;
              reasons.push(`廠商標籤包含「${tag}」`);
            }
         });

         // Match Notes/Name
         if (g.note && g.note.includes(lowerQuery)) {
            score += 3;
            reasons.push(`群組描述包含關鍵字`);
         }
         if (g.groupName.includes(query)) {
            score += 5;
            reasons.push(`群組名稱直接命中`);
         }

         if (score > 0) {
           searchResults.push({
             id: g.id,
             type: 'GROUP',
             title: g.groupName,
             subtitle: g.vendorName,
             vendorId: g.vendorId,
             matchReason: reasons.join('、'),
             score
           });
         }
       });

       // 2. Search Contacts
       allContacts.forEach(c => {
         // Filter by platform logic handled by parent data passing usually, but verify here
         const isCorrectPlatform = platform === 'LINE' ? !c.accountId.startsWith('wxid') : c.accountId.startsWith('wxid') || c.id.includes('wechat'); // Rough check or rely on parent filtering
         // Since allContacts passed in is already platform filtered (mostly), we focus on text match
         
         let score = 0;
         let reasons: string[] = [];

         c.vendorCategories.forEach(cat => {
            if (lowerQuery.includes(cat)) {
              score += 8;
              reasons.push(`${cat}廠商窗口`);
            }
         });
         
         if (c.role.includes(query)) {
            score += 5;
            reasons.push(`職稱包含關鍵字`);
         }

         if (score > 0) {
            searchResults.push({
               id: c.id,
               type: 'CONTACT',
               title: c.name,
               subtitle: `${c.vendorName} - ${c.role}`,
               vendorId: c.vendorId,
               matchReason: reasons.join('、'),
               score
            });
         }
       });

       searchResults.sort((a, b) => b.score - a.score);
       setResults(searchResults.slice(0, 5));
       setIsSearching(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles size={24} className="text-yellow-300" />
            AI 智能搜群助手
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 rounded-full p-1">
             <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
           <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">請用自然語言描述您要找的對象</label>
              <div className="relative">
                 <textarea 
                   className="w-full border border-slate-200 rounded-xl p-4 h-24 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none resize-none bg-slate-50 text-slate-700"
                   placeholder="例如：幫我找能夠處理急件的水電群組..."
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSearch())}
                 />
                 <div className="absolute bottom-3 right-3">
                    <button 
                      onClick={handleSearch}
                      disabled={isSearching || !query.trim()}
                      className="bg-purple-600 text-white px-4 py-1.5 rounded-lg font-bold shadow-sm hover:bg-purple-700 disabled:opacity-50 transition flex items-center gap-2 text-sm"
                    >
                      {isSearching ? <RefreshCw className="animate-spin" size={14}/> : <Bot size={14}/>}
                      {isSearching ? '分析中...' : 'AI 搜尋'}
                    </button>
                 </div>
              </div>
           </div>

           {results.length > 0 ? (
             <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500"/> 最佳推薦結果
               </h3>
               {results.map((res, idx) => (
                 <div key={res.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition group relative overflow-hidden">
                    <div className="flex gap-4 items-center">
                       <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0", res.type === 'GROUP' ? "bg-green-500" : "bg-blue-500")}>
                          {res.type === 'GROUP' ? <Hash size={20} /> : <User size={20} />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                             <h4 className="font-bold text-slate-800 text-base group-hover:text-purple-700 transition truncate">{res.title}</h4>
                             <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{res.type === 'GROUP' ? '群組' : '聯絡人'}</span>
                          </div>
                          <p className="text-sm text-slate-500 truncate">{res.subtitle}</p>
                          
                          <div className="mt-2 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded inline-flex items-center gap-1">
                             <Sparkles size={10} />
                             {res.matchReason}
                          </div>
                       </div>
                       <Link to={`/vendors/${res.vendorId}`} className="text-slate-300 hover:text-purple-600 p-2">
                          <ArrowRight size={20} />
                       </Link>
                    </div>
                 </div>
               ))}
             </div>
           ) : !isSearching && query.trim() ? (
              <div className="text-center py-10 text-slate-400">
                 <Bot size={40} className="mx-auto mb-2 opacity-20" />
                 <p>AI 找不到符合 "{query}" 的結果</p>
                 <p className="text-xs mt-1">試著使用更精確的關鍵字，如「水電」、「物流」</p>
              </div>
           ) : null}
        </div>
      </div>
    </div>
  );
};
