
import React, { useState, useMemo } from 'react';
import { MOCK_VENDORS, CATEGORY_OPTIONS } from '../constants';
import { SocialGroup, ContactWindow, EntityType, Vendor } from '../types';
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
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

type Platform = 'LINE' | 'WeChat';
type ViewType = 'GROUPS' | 'CONTACTS';

interface FlattenedGroup extends SocialGroup {
  vendorName: string;
  vendorId: string;
  vendorAvatar: string;
}

const ITEMS_PER_PAGE = 9; // 3x3 Grid

export const CommunicationHub: React.FC = () => {
  const [platform, setPlatform] = useState<Platform>('LINE');
  const [viewType, setViewType] = useState<ViewType>('GROUPS');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Advanced Filters
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');

  // Modal State
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);

  // Reset pagination when main controls change
  const handlePlatformChange = (p: Platform) => {
    setPlatform(p);
    setSelectedVendorFilter('');
    setSelectedRoleFilter('');
    setCurrentPage(1);
  };

  const handleViewTypeChange = (v: ViewType) => {
    setViewType(v);
    setCurrentPage(1);
  };

  // Initialize Local State with Mock Data to allow "Adding" groups in this session
  const initialGroups = useMemo(() => {
    return MOCK_VENDORS.flatMap(v => 
      (v.socialGroups || []).map(g => ({
        ...g,
        vendorName: v.name,
        vendorId: v.id,
        vendorAvatar: v.avatarUrl
      }))
    );
  }, []);

  const [allGroups, setAllGroups] = useState<FlattenedGroup[]>(initialGroups);

  // 1. Flatten Contact Data (Corporate IDs + Individual Contacts)
  const allContacts = useMemo(() => {
    const contacts: Array<{
      id: string; // Unique key
      name: string;
      role: string;
      vendorName: string;
      vendorId: string;
      vendorAvatar: string;
      accountId: string; // The Line/Wechat ID
      isCorporate: boolean;
      isMainContact: boolean;
    }> = [];

    MOCK_VENDORS.forEach(v => {
      // Add Corporate/Main Account if exists
      if (platform === 'LINE' && v.lineId) {
        contacts.push({
          id: `${v.id}-corp-line`,
          name: v.entityType === EntityType.COMPANY ? '官方帳號/主帳號' : v.name,
          role: '企業窗口',
          vendorName: v.name,
          vendorId: v.id,
          vendorAvatar: v.avatarUrl,
          accountId: v.lineId,
          isCorporate: true,
          isMainContact: false
        });
      }
      if (platform === 'WeChat' && v.wechatId) {
        contacts.push({
          id: `${v.id}-corp-wechat`,
          name: v.entityType === EntityType.COMPANY ? '官方帳號/主帳號' : v.name,
          role: '企業窗口',
          vendorName: v.name,
          vendorId: v.id,
          vendorAvatar: v.avatarUrl,
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
            id: `${v.id}-${c.id}`,
            name: c.name,
            role: c.role,
            vendorName: v.name,
            vendorId: v.id,
            vendorAvatar: v.avatarUrl,
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
  const vendorOptions = useMemo(() => Array.from(new Set(MOCK_VENDORS.map(v => v.name))), []);
  const roleOptions = useMemo(() => Array.from(new Set(allContacts.map(c => c.role))), [allContacts]);

  // Filtering Logic
  const filteredGroups = allGroups.filter(g => {
    const matchesPlatform = g.platform === platform;
    const matchesSearch = g.groupName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          g.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.systemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor = selectedVendorFilter ? g.vendorName === selectedVendorFilter : true;
    
    return matchesPlatform && matchesSearch && matchesVendor;
  });

  const filteredContacts = allContacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.accountId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor = selectedVendorFilter ? c.vendorName === selectedVendorFilter : true;
    const matchesRole = selectedRoleFilter ? c.role === selectedRoleFilter : true;

    return matchesSearch && matchesVendor && matchesRole;
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      {/* Header Area */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={clsx("p-3 rounded-xl transition-colors", platform === 'LINE' ? "bg-green-100 text-green-600" : "bg-green-700 text-white")}>
              <MessageCircle size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">通訊軟體管理中心</h1>
              <p className="text-slate-500 text-sm">統一管理 {platform} 平台的所有群組資產與聯絡人</p>
            </div>
          </div>
          
          {viewType === 'GROUPS' && (
            <button 
              onClick={() => setShowAddGroupModal(true)}
              className={clsx(
                "px-4 py-2 rounded-lg text-white font-bold shadow-md flex items-center gap-2 transition hover:opacity-90",
                platform === 'LINE' ? "bg-[#06C755]" : "bg-[#07C160]"
              )}
            >
              <Plus size={18} /> 新增 {platform} 群組
            </button>
          )}
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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* View Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
            <button 
              onClick={() => handleViewTypeChange('GROUPS')}
              className={clsx("flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition", viewType === 'GROUPS' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}
            >
              <Hash size={16} /> 專案群組清單
            </button>
            <button 
              onClick={() => handleViewTypeChange('CONTACTS')}
              className={clsx("flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition", viewType === 'CONTACTS' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}
            >
              <Users size={16} /> 聯絡人 ID 總表
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
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
           
           {/* Vendor Filter (Common) */}
           <select 
             className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-green-500 cursor-pointer hover:bg-slate-100"
             value={selectedVendorFilter}
             onChange={(e) => { setSelectedVendorFilter(e.target.value); setCurrentPage(1); }}
           >
             <option value="">所有廠商</option>
             {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
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

           {(selectedVendorFilter || selectedRoleFilter) && (
             <button 
               onClick={() => { setSelectedVendorFilter(''); setSelectedRoleFilter(''); setCurrentPage(1); }}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedData.map((group: any, idx) => (
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
                      <Link to={`/vendors/${group.vendorId}`} className="text-sm text-slate-600 hover:text-blue-600 hover:underline truncate">
                        {group.vendorName}
                      </Link>
                    </div>

                    <p className="text-xs text-slate-400 mb-4 h-8 line-clamp-2">
                      {group.note || "無備註說明"}
                    </p>

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
              {paginatedData.length === 0 && (
                <div className="col-span-full text-center py-20 text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200">
                  <p>找不到符合的群組</p>
                </div>
              )}
            </div>
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
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">所屬廠商</p>
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
    </div>
  );
};

/* --- Add Group Modal --- */
interface AddGroupModalProps {
  platform: Platform;
  onClose: () => void;
  onSubmit: (group: FlattenedGroup) => void;
}

const AddGroupModal: React.FC<AddGroupModalProps> = ({ platform, onClose, onSubmit }) => {
  const [vendorId, setVendorId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [systemCode, setSystemCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [note, setNote] = useState('');

  // Auto-generate code when vendor is selected
  const handleVendorChange = (id: string) => {
    setVendorId(id);
    if (id && !systemCode) {
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(Math.random() * 90) + 10;
      setSystemCode(`GRP-${id}-${platform === 'LINE' ? 'L' : 'W'}${randomSuffix}`);
    }
  };

  const handleSubmit = () => {
    const selectedVendor = MOCK_VENDORS.find(v => v.id === vendorId);
    if (!selectedVendor || !groupName || !systemCode) return;

    const newGroup: FlattenedGroup = {
      id: `new-${Date.now()}`,
      platform,
      groupName,
      systemCode,
      inviteLink,
      qrCodeUrl,
      note,
      vendorName: selectedVendor.name,
      vendorId: selectedVendor.id,
      vendorAvatar: selectedVendor.avatarUrl
    };

    onSubmit(newGroup);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={clsx("px-6 py-4 flex justify-between items-center text-white", platform === 'LINE' ? "bg-[#06C755]" : "bg-[#07C160]")}>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Plus size={20} /> 新增 {platform} 群組
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">所屬廠商 <span className="text-red-500">*</span></label>
            <select 
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              value={vendorId}
              onChange={(e) => handleVendorChange(e.target.value)}
            >
              <option value="">請選擇廠商...</option>
              {MOCK_VENDORS.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.id})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">系統代碼 (Code) <span className="text-red-500">*</span></label>
                <div className="relative">
                   <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-green-500 outline-none uppercase"
                      value={systemCode}
                      onChange={(e) => setSystemCode(e.target.value.toUpperCase())}
                      placeholder="GRP-XXXX"
                   />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">此代碼將在列表中優先顯示</p>
             </div>
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">原始群組名稱 <span className="text-red-500">*</span></label>
                <input 
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                   value={groupName}
                   onChange={(e) => setGroupName(e.target.value)}
                   placeholder="App上的名稱"
                />
             </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">邀請連結 (Invite Link)</label>
            <div className="relative">
               <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  value={inviteLink}
                  onChange={(e) => setInviteLink(e.target.value)}
                  placeholder={`https://${platform === 'LINE' ? 'line.me' : 'weixin.qq.com'}/...`}
               />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">QR Code 圖片連結 (選填)</label>
            <input 
               className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
               value={qrCodeUrl}
               onChange={(e) => setQrCodeUrl(e.target.value)}
               placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">備註</label>
            <textarea 
               className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-20 focus:ring-2 focus:ring-green-500 outline-none resize-none"
               value={note}
               onChange={(e) => setNote(e.target.value)}
               placeholder="例如：僅供施工進度回報，勿聊閒事"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium text-sm transition">
            取消
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!vendorId || !groupName || !systemCode}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <Save size={16} /> 儲存並加入
          </button>
        </div>
      </div>
    </div>
  );
};
