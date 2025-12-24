
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MOCK_VENDORS, MOCK_SYSTEM_TAGS, CATEGORY_OPTIONS, MOCK_USERS } from './constants';
import { ContactStatus, EntityType, TransactionStatus, ContactWindow, Vendor, ContactLog, Region, VendorCategory } from './types';
import { useTutorial } from './TutorialSystem';
import { ContactLogModal } from './ContactLogModal'; // Import from new separate file
import { 
  ArrowLeft, Globe, MapPin, Clock, AlertCircle, CheckCircle, Camera, Building2, User, FileDigit, Phone, Mail, ExternalLink, Edit2, Eye, Bot, Sparkles, Save, MessageCircle, QrCode, Copy, Lock, Hash, Plus, Tag, Info, ArrowRight, Crown, X, CalendarCheck, DollarSign, EyeOff, Heart, Package
} from 'lucide-react';
import { clsx } from 'clsx';

// Simulated Tag Rule Definitions (Source of Truth for Admin Settings)
const TAG_RULES: Record<string, string> = {
  '優良廠商': '經系統評核，該廠商過去 1 年內合作次數 > 3 次，且平均評分高於 4.5 分。合作優先推薦。',
  '急件': '該廠商明確表示可接受 24 小時內進場的緊急案件，惟報價可能會有 1.5 ~ 2 倍的加成。',
  '夜間施工': '已確認該廠商具備夜間施工許可與意願，適合百貨專櫃或辦公大樓案型。',
  '配合度高': '窗口回應速度快，且願意配合業主修改需求超過 2 次以上。',
  '價格實惠': '報價經比對低於市場行情 10% 以上，適合預算有限的專案。',
  '黑名單': '因多次違規或品質重大缺失，已被系統標記為暫停合作。需主管權限解鎖。'
};

export const VendorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vendor = MOCK_VENDORS.find(v => v.id === id);
  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'logs' | 'transactions' | 'docs'>('info');

  // Contact Log Modal State
  const [showContactModal, setShowContactModal] = useState(false);
  const [modalInitialState, setModalInitialState] = useState<'log' | 'reservation'>('log');
  const [selectedContact, setSelectedContact] = useState<ContactWindow | null>(null);
  
  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);

  // Tag Insight Modal State
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Admin Mode Simulation (Toggle to see hidden IDs)
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Phone Reveal State (Map of ContactID -> Boolean)
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});

  // Local state for favorites to simulate interactivity
  const [isFavorite, setIsFavorite] = useState(vendor?.isFavorite || false);

  // Simulate permission check
  const canEditVendors = MOCK_USERS[0].permissions.canEditVendors;

  if (!vendor) return <div className="p-8">找不到廠商資料</div>;

  // Parse service areas for tag display
  const serviceAreas = vendor.serviceArea.split(',').map(s => s.trim()).filter(Boolean);
  const isExcellent = vendor.tags.includes('優良廠商') || vendor.rating >= 4.8;

  const handleContactClick = (contact: ContactWindow, mode: 'log' | 'reservation' = 'log') => {
    setSelectedContact(contact);
    setModalInitialState(mode);
    setShowContactModal(true);
  };

  const handleQuickAddLog = () => {
    // Default to main contact or first available
    const mainContact = vendor.contacts.find(c => c.isMainContact) || vendor.contacts[0];
    if (mainContact) {
      handleContactClick(mainContact, 'log');
    }
  };

  const handleQuickReservation = () => {
    // Tracking Logic: Increment booking click count
    if (vendor) {
        vendor.bookingClickCount = (vendor.bookingClickCount || 0) + 1;
    }

    // Default to main contact or first available
    const mainContact = vendor.contacts.find(c => c.isMainContact) || vendor.contacts[0];
    if (mainContact) {
      handleContactClick(mainContact, 'reservation');
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
  };

  const toggleRevealPhone = (contactId: string, contact?: ContactWindow) => {
    setRevealedPhones(prev => ({ ...prev, [contactId]: !prev[contactId] }));
    
    // Tracking Logic: Only track on first reveal (when turning true)
    if (!revealedPhones[contactId]) {
      if (vendor) {
         vendor.phoneViewCount = (vendor.phoneViewCount || 0) + 1;
      }
      
      // Intent Log logic: User clicked to view phone, system tracks this.
      // We automatically open the Contact Log Modal to encourage logging.
      if (contact) {
         // Pass 'true' to ContactLogModal to indicate this was triggered by phone reveal
         handleContactClick(contact, 'log'); 
      }
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In real app, dispatch API call here
  };

  // Helper to mask/format phone based on revealed state
  const getDisplayPhone = (contactId: string, phone?: string) => {
    if (!phone) return '無號碼';
    if (revealedPhones[contactId]) return phone;
    
    // Mask logic: 0912345678 -> 0912-***-678
    // Check if it's mobile or landline roughly
    if (phone.startsWith('09')) {
       return phone.replace(/(\d{4})(-?)(\d+)(-?)(\d{3})/, '$1-***-$5');
    }
    // Simple mask for others
    return phone.slice(0, 3) + '****' + phone.slice(-3);
  };

  // Helper to mask LINE ID
  const getDisplayLineId = (lineId?: string) => {
    if (!lineId) return null;
    if (isAdminMode) return lineId;
    // Mask: dafa888 -> dafa***
    return lineId.length > 4 ? lineId.slice(0, 4) + '****' : lineId.slice(0, 1) + '****'; 
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={20} className="mr-2" /> 返回列表
        </button>
        
        {/* Admin Toggle Simulation */}
        <div className="flex items-center gap-2 text-xs">
          <span className={clsx("font-bold", isAdminMode ? "text-red-600" : "text-slate-400")}>
            {isAdminMode ? "管理員模式 (Admin View)" : "一般使用者模式 (User View)"}
          </span>
          <button 
             onClick={() => setIsAdminMode(!isAdminMode)}
             className={clsx("w-10 h-5 rounded-full p-1 transition-colors relative", isAdminMode ? "bg-red-500" : "bg-slate-300")}
          >
             <div className={clsx("w-3 h-3 bg-white rounded-full transition-transform", isAdminMode ? "translate-x-5" : "translate-x-0")} />
          </button>
        </div>
      </div>

      {/* Header Profile */}
      <div className={clsx("bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden", isExcellent ? "border-yellow-200" : "border-slate-100")}>
        {isExcellent && (
           <div className="absolute top-0 left-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-br-xl shadow-sm z-10 flex items-center gap-1">
              <Crown size={14} fill="currentColor" /> 優良廠商
           </div>
        )}

        <img src={vendor.avatarUrl} alt={vendor.name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50" />
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
               {vendor.name}
            </h1>
            <div className="flex items-center gap-2">
               {canEditVendors && (
                 <button 
                   onClick={() => setShowEditModal(true)}
                   className="flex items-center gap-2 text-sm font-bold text-white bg-yellow-500 border border-yellow-600 hover:bg-yellow-600 px-4 py-2 rounded-xl transition shadow-md transform hover:scale-105"
                 >
                    <Edit2 size={16} /> 編輯資料
                 </button>
               )}
               <span className="font-mono text-slate-400 text-sm ml-2">#{vendor.id}</span>
               <span className={clsx("px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1",
                 vendor.entityType === EntityType.COMPANY ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
               )}>
                 {vendor.entityType === EntityType.COMPANY ? <Building2 size={12}/> : <User size={12}/>}
                 {vendor.entityType}
               </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
            <span className="flex items-center gap-1"><MapPin size={16} /> 註冊地：{vendor.region}</span>
            {vendor.taxId && (
              <span className="flex items-center gap-1 font-mono bg-slate-100 px-2 rounded"><FileDigit size={16} /> 統編: {vendor.taxId}</span>
            )}
            {vendor.mainPhone && (
              <span 
                className="flex items-center gap-1 cursor-pointer hover:text-blue-600 group" 
                onClick={() => toggleRevealPhone('main', vendor.contacts[0])} // Assume main contact matches main phone roughly for this demo
                title="點擊查看完整號碼 (將會開啟紀錄視窗)"
              >
                <Phone size={16} /> 
                <span className="font-mono">{getDisplayPhone('main', vendor.mainPhone)}</span>
                {revealedPhones['main'] ? <EyeOff size={12} className="text-slate-400"/> : <Eye size={12} className="text-slate-400 group-hover:text-blue-500"/>}
              </span>
            )}
            <span className="flex items-center gap-1"><Clock size={16} /> 平均回應: 4小時內</span>
          </div>

          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-800 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">用人注意事項：</span>
              {vendor.internalNotes}
            </div>
          </div>
        </div>
        
        <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col items-center md:items-end justify-center gap-3">
           <div className="flex items-start gap-2">
              <div>
                <div className="text-4xl font-bold text-slate-800">{vendor.rating}</div>
                <div className="text-xs text-slate-400">基於 {vendor.ratingCount} 次評分</div>
              </div>
              <button 
                 onClick={toggleFavorite}
                 className={clsx("p-2 rounded-full transition-all border", 
                    isFavorite ? "bg-red-50 border-red-100 text-red-500" : "bg-white border-slate-200 text-slate-300 hover:text-red-300"
                 )}
                 title={isFavorite ? "取消收藏" : "加入最愛"}
              >
                 <Heart size={20} className={clsx(isFavorite && "fill-current")} />
              </button>
           </div>
           
           <div className="flex flex-col gap-2 w-full md:w-auto mt-2">
             <button 
               onClick={handleQuickReservation}
               className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 w-full"
             >
               <CalendarCheck size={16} /> 立即預約
             </button>
             <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition w-full">
               給予評分
             </button>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'info', label: '基本資料' },
          { id: 'contacts', label: `聯繫窗口 & 群組 (${vendor.contacts.length + (vendor.socialGroups?.length || 0)})` }, // Updated Tab Name
          { id: 'logs', label: '聯繫紀錄' },
          { id: 'transactions', label: '合作/驗收' },
          { id: 'docs', label: '勞報/請款' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              "px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap",
              activeTab === tab.id ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
          </button>
        ))}
      </div>

      {/* Content of Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[400px]">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              {/* Tags Section with Click Interaction */}
              <div className="mb-6">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center justify-between">
                   <span>廠商標籤 (點擊查看規則)</span>
                   <button onClick={() => setShowEditModal(true)} className="text-xs text-blue-600 hover:underline">管理標籤</button>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {vendor.tags.map(tag => (
                    <button 
                      key={tag} 
                      onClick={() => handleTagClick(tag)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded-full text-sm transition flex items-center gap-1 group"
                    >
                      <Tag size={12} className="text-slate-400 group-hover:text-blue-500" />
                      {tag}
                    </button>
                  ))}
                  {isExcellent && !vendor.tags.includes('優良廠商') && (
                     <button 
                       onClick={() => handleTagClick('優良廠商')}
                       className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-full text-sm transition flex items-center gap-1 font-bold"
                     >
                        <Crown size={12} /> 優良廠商
                     </button>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-slate-800 mb-4">服務項目 (類別)</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {vendor.categories.map(cat => (
                  <span key={cat} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                    {cat}
                  </span>
                ))}
              </div>

              {/* Enhanced Service Area Display */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                   <h3 className="font-bold text-slate-800">服務範圍 (Service Area)</h3>
                   <button onClick={() => setShowEditModal(true)}><Edit2 size={14} className="text-slate-400 hover:text-blue-600" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {serviceAreas.map(area => (
                    <span key={area} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm flex items-center gap-1">
                      <MapPin size={12} /> {area}
                    </span>
                  ))}
                  {serviceAreas.length === 0 && <span className="text-slate-400 text-sm">未設定</span>}
                </div>
              </div>

              {/* Address & Street View Section */}
              <div className="mb-6">
                 <h3 className="font-bold text-slate-800 mb-2">公司/聯絡地址</h3>
                 <div className="flex items-start gap-2 text-sm text-slate-600 mb-3">
                    <MapPin size={16} className="mt-0.5 text-slate-400"/>
                    <div>
                      <p className="font-medium text-slate-800">{vendor.address || '未填寫地址'}</p>
                      {vendor.address && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.address)}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-600 text-xs hover:underline mt-1 inline-block"
                        >
                          在 Google Maps 上查看
                        </a>
                      )}
                    </div>
                 </div>
                 
                 {vendor.address && (
                   <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200 group">
                      <img 
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800" 
                        alt="Street View Preview" 
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                         <div className="flex justify-between items-end">
                            <div>
                               <p className="text-white font-bold text-sm drop-shadow-md">Google Street View</p>
                               <p className="text-white/80 text-xs drop-shadow-md">預覽畫面 (模擬)</p>
                            </div>
                            <a 
                               href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.address)}`} 
                               target="_blank" 
                               rel="noreferrer"
                               className="bg-white/90 hover:bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded shadow-sm flex items-center gap-1 transition"
                            >
                               <ExternalLink size={12} /> 開啟全景地圖
                            </a>
                         </div>
                      </div>
                   </div>
                 )}
              </div>
              
              <h3 className="font-bold text-slate-800 mb-4 mt-6">身分屬性</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {vendor.serviceTypes.map(st => (
                   <li key={st} className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> {st}</li>
                ))}
              </ul>
              
              {vendor.website && (
                <div className="mt-6">
                  <h3 className="font-bold text-slate-800 mb-2">網站</h3>
                  <a href={vendor.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                    <Globe size={16} /> {vendor.website}
                  </a>
                </div>
              )}

              {/* Corporate/Main Social IDs Display */}
              <div className="mt-6 border-t border-slate-100 pt-4">
                 <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    主要通訊 ID ({vendor.entityType === EntityType.COMPANY ? '企業' : '個人'})
                    <button onClick={() => setShowEditModal(true)}><Edit2 size={14} className="text-slate-400 hover:text-blue-600"/></button>
                 </h3>
                 <div className="flex gap-4">
                    {vendor.lineId ? (
                       <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                          <span className="font-bold">LINE:</span> 
                          <span className="font-mono">{getDisplayLineId(vendor.lineId)}</span>
                          {isAdminMode && <Copy size={10} className="cursor-pointer hover:scale-110 ml-1"/>}
                          {!isAdminMode && (
                            <span title="僅管理員可見完整 ID">
                              <Lock size={10} className="ml-1 text-green-400" />
                            </span>
                          )}
                       </div>
                    ) : (
                       <span className="text-sm text-slate-400">未設定 LINE</span>
                    )}
                    
                    {vendor.wechatId ? (
                       <div className="flex items-center gap-1 text-sm text-green-700 bg-green-100 px-2 py-1 rounded border border-green-200">
                          <span className="font-bold">WeChat:</span> 
                          <span className="font-mono">{getDisplayLineId(vendor.wechatId)}</span>
                          {isAdminMode && <Copy size={10} className="cursor-pointer hover:scale-110 ml-1"/>}
                          {!isAdminMode && (
                            <span title="僅管理員可見完整 ID">
                              <Lock size={10} className="ml-1 text-green-500" />
                            </span>
                          )}
                       </div>
                    ) : (
                       <span className="text-sm text-slate-400">未設定 WeChat</span>
                    )}
                 </div>
                 {!isAdminMode && (
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                       <Lock size={10} /> 通訊 ID 已遮罩，請使用群組或預約功能進行聯繫，或聯繫管理員取得。
                    </p>
                 )}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-4">名片預覽</h3>
              <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 hover:border-blue-300 transition cursor-pointer">
                <div className="text-center">
                  <Camera size={32} className="mx-auto mb-2" />
                  <span className="block text-sm">點擊上傳名片</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ... (Rest of the tabs code unchanged) ... */}
        {activeTab === 'contacts' && (
          <div className="space-y-8">
            {/* Section 1: Project Groups (The New Solution) */}
            <div>
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                     <Hash className="text-purple-600" size={20} /> 專案群組 (Group Code)
                  </h3>
                  <button className="text-purple-600 text-sm font-medium hover:underline flex items-center gap-1">
                     <Plus size={16} /> 建立新群組
                  </button>
               </div>
               
               {vendor.socialGroups && vendor.socialGroups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {vendor.socialGroups.map(group => (
                        <div key={group.id} className="border border-purple-100 bg-purple-50/50 rounded-xl p-4 relative overflow-hidden group">
                           <div className={clsx("absolute top-0 right-0 p-1 rounded-bl-lg text-xs font-bold text-white", 
                              group.platform === 'LINE' ? "bg-green-500" : "bg-green-600"
                           )}>
                              {group.platform}
                           </div>
                           
                           <div className="flex items-start gap-3">
                              <div className="bg-white p-2 rounded-lg border border-purple-100">
                                 <QrCode size={32} className="text-slate-700" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 text-xs font-bold text-purple-700 mb-1">
                                    <span className="bg-purple-100 px-2 py-0.5 rounded border border-purple-200">{group.systemCode}</span>
                                    <span className="text-slate-400 font-normal">系統代碼</span>
                                 </div>
                                 <h4 className="font-bold text-slate-800 truncate" title={group.groupName}>{group.groupName}</h4>
                                 <p className="text-xs text-slate-500 mt-1">{group.note || '無備註'}</p>
                              </div>
                           </div>
                           
                           <div className="mt-4 flex gap-2">
                              {group.inviteLink && (
                                 <a href={group.inviteLink} target="_blank" rel="noreferrer" className="flex-1 bg-white border border-slate-200 hover:border-purple-400 text-slate-700 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition">
                                    <ExternalLink size={14} /> 點擊加入
                                 </a>
                              )}
                              {group.qrCodeUrl && (
                                 <button className="flex-1 bg-white border border-slate-200 hover:border-purple-400 text-slate-700 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition">
                                    <QrCode size={14} /> 顯示 QR
                                 </button>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                     <p>尚未建立專案群組，建議使用代碼建立以利管理。</p>
                  </div>
               )}
            </div>

            {/* Section 2: Contact Persons */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">聯繫人列表</h3>
                <button className="text-blue-600 text-sm font-medium hover:underline">+ 新增窗口</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendor.contacts.map(contact => (
                  <div key={contact.id} className={clsx("p-4 rounded-lg border", contact.isMainContact ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200")}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-slate-800">{contact.name}</h4>
                        <p className="text-xs text-slate-500">{contact.role}</p>
                      </div>
                      {contact.isMainContact && <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">主要窗口</span>}
                    </div>
                    <div className="space-y-2 text-sm text-slate-600 mt-3">
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:text-blue-600 p-1 -ml-1 rounded hover:bg-slate-100 transition group" 
                        onClick={() => toggleRevealPhone(contact.id, contact)}
                        title="點擊顯示/隱藏 (開啟紀錄)"
                      >
                        <Phone size={14} /> 
                        <span className="font-mono">{getDisplayPhone(contact.id, contact.mobile)}</span>
                        {revealedPhones[contact.id] ? <EyeOff size={12} className="text-slate-400"/> : <Eye size={12} className="text-slate-400 group-hover:text-blue-500"/>}
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} /> {contact.email}
                        </div>
                      )}
                      
                      {/* Personal Social IDs - Only Visible to Admin */}
                      <div className="pt-2 border-t border-slate-200/50 mt-2">
                        <div className="grid grid-cols-2 gap-2">
                           {contact.lineId ? (
                              <div className={clsx("flex items-center gap-1 text-xs px-2 py-1 rounded border", 
                                 isAdminMode ? "text-green-600 bg-green-50 border-green-100" : "text-slate-400 bg-slate-50 border-slate-200"
                              )}>
                                 <span className="font-bold">LINE:</span> 
                                 <span className="font-mono truncate">{getDisplayLineId(contact.lineId)}</span>
                                 {isAdminMode && <Copy size={10} className="cursor-pointer hover:scale-110 shrink-0"/>}
                              </div>
                           ) : <span className="text-xs text-slate-300">無 LINE ID</span>}
                           
                           {contact.wechatId ? (
                              <div className={clsx("flex items-center gap-1 text-xs px-2 py-1 rounded border",
                                 isAdminMode ? "text-green-700 bg-green-100 border-green-200" : "text-slate-400 bg-slate-50 border-slate-200"
                              )}>
                                 <span className="font-bold">WeChat:</span> 
                                 <span className="font-mono truncate">{getDisplayLineId(contact.wechatId)}</span>
                                 {isAdminMode && <Copy size={10} className="cursor-pointer hover:scale-110 shrink-0"/>}
                              </div>
                           ) : <span className="text-xs text-slate-300">無 WeChat</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800">歷史紀錄</h3>
                <button className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1" onClick={handleQuickAddLog}>
                  <Plus size={16} /> 新增聯繫
                </button>
             </div>
             <div className="space-y-4">
                {vendor.contactLogs.length > 0 ? vendor.contactLogs.map(log => (
                  <div key={log.id} className={clsx("flex gap-4 p-4 rounded-lg border", log.isReservation ? "bg-orange-50 border-orange-200" : "bg-slate-50 border-slate-100")}>
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className="text-sm font-bold text-slate-700">{log.date.split('-')[1]}/{log.date.split('-')[2]}</div>
                      <div className="text-xs text-slate-400">{log.date.split('-')[0]}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={clsx(
                          "text-xs px-2 py-0.5 rounded font-medium",
                          log.status === ContactStatus.SUCCESS ? "bg-green-100 text-green-700" :
                          log.status === ContactStatus.BUSY ? "bg-red-100 text-red-700" :
                          log.status === ContactStatus.RESERVED ? "bg-orange-600 text-white" :
                          "bg-slate-200 text-slate-700"
                        )}>{log.status}</span>
                        {log.isReservation && (
                           <span className="flex items-center gap-1 text-xs font-bold text-orange-700">
                              <Clock size={12} /> {log.reservationTime} 預約
                           </span>
                        )}
                        {log.nextFollowUp && !log.isReservation && <span className="text-xs text-orange-600 flex items-center gap-1"><Clock size={12} /> 追蹤: {log.nextFollowUp}</span>}
                      </div>
                      <p className="text-slate-700 text-sm">{log.note}</p>
                      {log.quoteAmount && (
                         <div className="mt-1 text-xs font-bold text-slate-600 flex items-center gap-1">
                            <DollarSign size={12} /> 報價: ${log.quoteAmount.toLocaleString()}
                         </div>
                      )}
                      {log.aiSummary && (
                        <div className="mt-2 text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-100 flex gap-2 items-start">
                          <Bot size={14} className="mt-0.5 shrink-0" />
                          <div><span className="font-bold">AI 重點：</span>{log.aiSummary}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-500 italic">目前無紀錄</p>
                )}
             </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-500 bg-slate-50 border-b border-slate-100">
                  <tr><th className="px-4 py-3">工單號</th><th className="px-4 py-3">日期</th><th className="px-4 py-3">項目描述</th><th className="px-4 py-3 text-center">狀態</th><th className="px-4 py-3 text-right">金額</th><th className="px-4 py-3 text-center">操作</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendor.transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50 group">
                      <td className="px-4 py-3 font-mono text-xs">{tx.id}</td>
                      <td className="px-4 py-3">{tx.date}</td>
                      <td className="px-4 py-3 max-w-xs truncate" title={tx.description}>{tx.description}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx("text-xs px-2 py-1 rounded-full font-bold", tx.status === TransactionStatus.PENDING_APPROVAL ? "bg-yellow-100 text-yellow-800" : tx.status === TransactionStatus.APPROVED ? "bg-green-100 text-green-700" : tx.status === TransactionStatus.PAID ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-700")}>{tx.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right"><span className="font-medium">${tx.amount.toLocaleString()}</span></td>
                      <td className="px-4 py-3 text-center"><Link to={`/transactions/${tx.id}`} className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1">驗收/詳情 <ExternalLink size={12} /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vendor.transactions.length === 0 && <p className="p-4 text-slate-500">無交易紀錄</p>}
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800">待辦文件</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between"><div><p className="text-sm font-medium text-slate-700">勞務報酬單</p><p className="text-xs text-slate-500">最近一次交易: {vendor.transactions[0]?.date || 'N/A'}</p></div><div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">{vendor.transactions[0]?.laborFormStatus || 'N/A'}</div></div>
               <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between"><div><p className="text-sm font-medium text-slate-700">銀行帳戶資料</p><p className="text-xs text-slate-500">用於自動轉帳</p></div><button className="text-blue-600 text-sm font-medium">管理</button></div>
            </div>
          </div>
        )}
      </div>

      {showContactModal && selectedContact && (
        <ContactLogModal 
          contact={selectedContact} 
          initialIsReservation={modalInitialState === 'reservation'}
          onClose={() => setShowContactModal(false)} 
          vendor={vendor} 
        />
      )}

      {showEditModal && <EditVendorModal vendor={vendor} onClose={() => setShowEditModal(false)} />}
      {selectedTag && <TagInsightModal tag={selectedTag} onClose={() => setSelectedTag(null)} />}
    </div>
  );
};

/* --- Edit Vendor Modal and TagInsightModal remain as they were --- */
const EditVendorModal: React.FC<{ vendor: Vendor; onClose: () => void }> = ({ vendor, onClose }) => {
  const [formData, setFormData] = useState({
    name: vendor.name, entityType: vendor.entityType, region: vendor.region, taxId: vendor.taxId || '', mainPhone: vendor.mainPhone || '', address: vendor.address || '', serviceArea: vendor.serviceArea, internalNotes: vendor.internalNotes, website: vendor.website || '', tags: vendor.tags.join(', '), priceRange: vendor.priceRange || '$$', lineId: vendor.lineId || '', wechatId: vendor.wechatId || '', categories: vendor.categories
  });

  const handleSave = () => { alert("資料已更新 (模擬)"); onClose(); };
  const handleChange = (field: string, value: any) => { setFormData(prev => ({ ...prev, [field]: value })); };
  const handleCategoryToggle = (cat: VendorCategory) => {
    const currentCats = formData.categories;
    if (currentCats.includes(cat)) { handleChange('categories', currentCats.filter(c => c !== cat)); } else { handleChange('categories', [...currentCats, cat]); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0"><h3 className="text-lg font-bold flex items-center gap-2"><Edit2 size={20} className="text-blue-400" /> 編輯廠商資料</h3><button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button></div>
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
           <div className="space-y-4">
              <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 text-sm uppercase tracking-wide">基本資料</h4>
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-slate-700 mb-1">廠商名稱</label><input className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" value={formData.name} onChange={e => handleChange('name', e.target.value)} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-1">身分類型</label><select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white" value={formData.entityType} onChange={e => handleChange('entityType', e.target.value)}><option value={EntityType.COMPANY}>公司行號</option><option value={EntityType.INDIVIDUAL}>個人接案</option></select></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-1">統一編號</label><input className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" value={formData.taxId} onChange={e => handleChange('taxId', e.target.value)} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-1">主要電話</label><input className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" value={formData.mainPhone} onChange={e => handleChange('mainPhone', e.target.value)} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-1">地區</label><select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white" value={formData.region} onChange={e => handleChange('region', e.target.value)}><option value={Region.TAIWAN}>台灣</option><option value={Region.CHINA}>大陸</option></select></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-1">價格區間</label><select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white font-mono" value={formData.priceRange} onChange={e => handleChange('priceRange', e.target.value)}><option value="$">$ (平價)</option><option value="$$">$$ (中等)</option><option value="$$$">$$$ (中高)</option><option value="$$$$">$$$$ (昂貴)</option></select></div>
              </div>
           </div>
           {/* ... Other sections omitted for brevity but would be here ... */}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
           <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-sm">取消</button>
           <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md">儲存變更</button>
        </div>
      </div>
    </div>
  );
};

/* --- Tag Insight Modal --- */
const TagInsightModal: React.FC<{ tag: string; onClose: () => void }> = ({ tag, onClose }) => {
  const navigate = useNavigate();
  const matchingVendors = MOCK_VENDORS.filter(v => v.tags.includes(tag) || (tag === '優良廠商' && v.rating >= 5));
  const ruleDescription = TAG_RULES[tag] || "此標籤尚未設定詳細定義，請參考系統管理規範。";
  const handleNavigate = () => { navigate(`/vendors?q=${encodeURIComponent(tag)}`); onClose(); };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex justify-between items-center text-white"><div className="flex items-center gap-2"><Tag size={20} className="text-blue-400" /><h2 className="text-lg font-bold">標籤詳情：#{tag}</h2></div><button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button></div>
          <div className="p-6 space-y-6">
             <div className="bg-blue-50 border border-blue-100 rounded-xl p-4"><h4 className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1 uppercase tracking-wider"><Info size={12} /> 系統定義規則</h4><p className="text-sm text-slate-700 leading-relaxed font-medium">{ruleDescription}</p></div>
             <div>
                <div className="flex justify-between items-end mb-3"><h4 className="text-sm font-bold text-slate-700">符合此標籤的廠商</h4><span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold">共 {matchingVendors.length} 家</span></div>
                <button onClick={handleNavigate} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-slate-200">開啟廠商清單 <ArrowRight size={16} /></button>
             </div>
          </div>
       </div>
    </div>
  );
};
