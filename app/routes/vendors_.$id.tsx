import { useState } from 'react';
import { useNavigate, useLoaderData } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { 
  ArrowLeft, MapPin, Star, Phone, Mail, Globe, 
  Building2, Package, User, Edit, Heart, MessageCircle, FileText,
  TrendingUp, Clock, CheckCircle, AlertCircle, Tag, Users, Briefcase,
  Crown, EyeOff, Eye, CalendarCheck, X, Info, MessageSquare, Camera,
  ExternalLink, Settings, Pencil
} from 'lucide-react';

import { MOCK_VENDORS, CATEGORY_GROUPS } from '~/constants';
import { EntityType, ContactStatus, type ContactWindow } from '~/types';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.vendor?.name || '廠商詳情'} - PartnerLink Pro` },
    { name: "description", content: "查看廠商完整資訊" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const vendor = MOCK_VENDORS.find(v => v.id === params.id);
  
  if (!vendor) {
    throw new Response("Not Found", { status: 404 });
  }
  
  return json({ vendor });
}

// Tag Rule Definitions
const TAG_RULES: Record<string, string> = {
  '優良廠商': '經系統評核，該廠商過去 1 年內合作次數 > 3 次，且平均評分高於 4.5 分。合作優先推薦。',
  '急件': '該廠商明確表示可接受 24 小時內進場的緊急案件，惟報價可能會有 1.5 ~ 2 倍的加成。',
  '夜間施工': '已確認該廠商具備夜間施工許可與意願，適合百貨專櫃或辦公大樓案型。',
  '配合度高': '窗口回應速度快，且願意配合業主修改需求超過 2 次以上。',
  '價格實惠': '報價經比對低於市場行情 10% 以上，適合預算有限的專案。',
  '含廢棄物清運': '該廠商提供完整的廢棄物清運服務，施工後會負責清理現場。',
  '黑名單': '因多次違規或品質重大缺失，已被系統標記為暫停合作。需主管權限解鎖。'
};

export default function VendorDetail() {
  const { vendor } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(vendor.isFavorite || false);
  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'logs' | 'transactions' | 'docs'>('info');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Helper functions
  const getCategoryLabel = (category: string) => {
    for (const [groupName, items] of Object.entries(CATEGORY_GROUPS)) {
      if (items.includes(category)) {
        return category;
      }
    }
    return category;
  };

  const toggleRevealPhone = (contactId: string) => {
    setRevealedPhones(prev => ({ ...prev, [contactId]: !prev[contactId] }));
  };

  const getDisplayPhone = (contactId: string, phone?: string) => {
    if (!phone) return '無號碼';
    if (revealedPhones[contactId]) return phone;
    if (phone.startsWith('09') || phone.startsWith('+86')) {
       return phone.slice(0, 4) + '-***-' + phone.slice(-3);
    }
    return phone.slice(0, 3) + '****' + phone.slice(-3);
  };

  const getDisplayLineId = (lineId?: string) => {
    if (!lineId) return null;
    if (isAdminMode) return lineId;
    return lineId.length > 4 ? lineId.slice(0, 4) + '****' : lineId.slice(0, 1) + '****'; 
  };

  const serviceAreas = vendor.serviceArea?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
  const isExcellent = vendor.tags?.includes('優良廠商') || vendor.rating >= 4.8;
  
  // Get social groups count for tab label
  const socialGroupsCount = vendor.socialGroups?.length || 0;
  const contactsCount = vendor.contacts?.length || 0;
  const totalContactsAndGroups = contactsCount + socialGroupsCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate('/vendors')} 
            className="flex items-center text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft size={20} className="mr-2" /> 返回列表
          </button>
          
          {/* Admin Toggle */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">一般使用者模式 (User View)</span>
            <button 
               onClick={() => setIsAdminMode(!isAdminMode)}
               className={`w-10 h-5 rounded-full p-1 transition-colors relative ${isAdminMode ? "bg-emerald-500" : "bg-slate-300"}`}
            >
               <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isAdminMode ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {/* Header Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
          {/* Excellent Badge */}
          {isExcellent && (
             <div className="absolute top-0 left-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-br-xl shadow-sm z-10 flex items-center gap-1">
                <Crown size={14} /> 優良廠商
             </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img 
                src={vendor.avatarUrl} 
                alt={vendor.name} 
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-100" 
              />
            </div>
            
            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-800">{vendor.name}</h1>
                <button className="flex items-center gap-2 text-sm font-bold text-white bg-yellow-500 border border-yellow-600 hover:bg-yellow-600 px-4 py-2 rounded-xl transition shadow-md">
                   <Pencil size={14} /> 編輯資料
                </button>
                <span className="font-mono text-slate-400 text-sm">#{vendor.id}</span>
                <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1 ${
                  vendor.entityType === EntityType.COMPANY ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                }`}>
                  {vendor.entityType === EntityType.COMPANY ? <Building2 size={12}/> : <User size={12}/>}
                  {vendor.entityType}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 mb-4">
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-slate-400" /> 
                  註冊地：{vendor.region}
                </span>
                {vendor.taxId && (
                  <span className="flex items-center gap-1">
                    <Building2 size={14} className="text-slate-400" />
                    統編：<span className="font-mono">{vendor.taxId}</span>
                  </span>
                )}
                {vendor.mainPhone && (
                  <span 
                    className="flex items-center gap-1 cursor-pointer hover:text-blue-600 group" 
                    onClick={() => toggleRevealPhone('main')}
                    title="點擊查看完整號碼"
                  >
                    <Phone size={14} className="text-slate-400" /> 
                    <span className="font-mono">{getDisplayPhone('main', vendor.mainPhone)}</span>
                    {revealedPhones['main'] ? <EyeOff size={12} className="text-slate-400"/> : <Eye size={12} className="text-slate-400 group-hover:text-blue-500"/>}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-slate-400" /> 
                  平均回應: 4小時內
                </span>
              </div>

              {/* Internal Notes Alert */}
              {vendor.internalNotes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-yellow-600" />
                  <div>
                    <span className="font-bold text-yellow-700">用人注意事項：</span>
                    <span className="text-yellow-800">{vendor.internalNotes}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Rating & Actions */}
            <div className="flex-shrink-0 text-center md:text-right flex flex-col items-center md:items-end justify-start gap-3 md:min-w-[140px]">
               <div className="flex items-start gap-2">
                  <div>
                    <div className="text-4xl font-bold text-slate-800">{vendor.rating}</div>
                    <div className="text-xs text-slate-400">基於 {vendor.ratingCount} 次評分</div>
                  </div>
                  <button 
                     onClick={() => setIsFavorite(!isFavorite)}
                     className="p-1"
                     title={isFavorite ? "取消收藏" : "加入最愛"}
                  >
                     <Heart 
                       size={24} 
                       className={isFavorite ? "fill-red-500 text-red-500" : "text-slate-300 hover:text-red-300"} 
                     />
                  </button>
               </div>
               
               <div className="flex flex-col gap-2 w-full">
                 <button className="bg-orange-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-600 transition shadow-sm flex items-center justify-center gap-2 w-full">
                   <CalendarCheck size={16} /> 立即預約
                 </button>
                 <button className="bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition w-full">
                   給予評分
                 </button>
               </div>
            </div>
          </div>
        </div>

        {/* Tabs - Updated to match design */}
        <div className="flex border-b border-slate-200 overflow-x-auto bg-white rounded-t-xl">
          {[
            { id: 'info', label: '基本資料', icon: Info },
            { id: 'contacts', label: `聯繫窗口 & 群組 (${totalContactsAndGroups})`, icon: Users },
            { id: 'logs', label: '聯繫紀錄', icon: MessageSquare },
            { id: 'transactions', label: '合作/驗收', icon: Briefcase },
            { id: 'docs', label: '勞報/請款', icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-100 p-6">
          {activeTab === 'info' && (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Left Column - Tags and Service Info */}
              <div className="md:col-span-2 space-y-8">
                {/* Tags Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-800">廠商標籤 (點擊查看規則)</h3>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      管理標籤
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {vendor.tags?.map((tag: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer border flex items-center gap-1.5 ${
                          tag === '優良廠商' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' :
                          tag === '黑名單' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                          'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Tag size={14} />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Categories */}
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-4">服務項目 (類別)</h3>
                  <div className="flex flex-wrap gap-2">
                    {vendor.categories?.map((cat: string, idx: number) => (
                      <span key={idx} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Service Area */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-base font-bold text-slate-800">服務範圍 (Service Area)</h3>
                    <button className="text-slate-400 hover:text-slate-600">
                      <Pencil size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {serviceAreas.map((area: string, idx: number) => (
                      <span key={idx} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1.5">
                        <MapPin size={14} />
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-4">公司/聯絡地址</h3>
                  <div className="space-y-3">
                    {vendor.address && (
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-slate-400 mt-0.5" />
                        <div>
                          <div className="text-xs text-slate-400 mb-1">地址</div>
                          <div className="text-slate-700">{vendor.address}</div>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mt-1"
                          >
                            在 Google Maps 上查看 <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Google Street View Placeholder */}
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <div className="relative h-48 bg-slate-200">
                    <img 
                      src="https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&q=80&w=800"
                      alt="Street View"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <div className="text-white font-bold">Google Street View</div>
                      <div className="text-white/70 text-sm">預覽畫面 (模擬)</div>
                    </div>
                    <button className="absolute bottom-4 right-4 bg-white text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-slate-50 transition shadow-sm">
                      <ExternalLink size={14} />
                      開啟全景地圖
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Business Card Preview */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-4">名片預覽</h3>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center min-h-[200px] bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                    <Camera size={32} className="text-slate-300 mb-3" />
                    <span className="text-slate-400 text-sm">點擊上傳名片</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-6">
              {/* Contacts Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">聯繫窗口</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition text-sm font-medium">
                    <Users size={16} /> 新增窗口
                  </button>
                </div>
                
                {vendor.contacts && vendor.contacts.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {vendor.contacts.map((contact: ContactWindow, idx: number) => (
                      <div key={idx} className={`p-4 rounded-xl border ${contact.isMainContact ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                              {contact.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-2">
                                {contact.name}
                                {contact.isMainContact && (
                                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">主要</span>
                                )}
                              </div>
                              <div className="text-sm text-slate-500">{contact.role || '聯絡人'}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          {contact.mobile && (
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                              onClick={() => toggleRevealPhone(contact.id)}
                            >
                              <Phone size={14} className="text-slate-400" />
                              <span className="font-mono">{getDisplayPhone(contact.id, contact.mobile)}</span>
                              {revealedPhones[contact.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                            </div>
                          )}
                          {contact.lineId && (
                            <div className="flex items-center gap-2">
                              <MessageCircle size={14} className="text-green-500" />
                              <span className="font-mono">{getDisplayLineId(contact.lineId)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                          <button className="flex-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition">
                            新增紀錄
                          </button>
                          <button className="flex-1 px-3 py-2 bg-orange-100 text-orange-600 rounded-lg text-sm hover:bg-orange-200 transition">
                            預約服務
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>尚無聯繫窗口資料</p>
                  </div>
                )}
              </div>

              {/* Social Groups Section */}
              {vendor.socialGroups && vendor.socialGroups.length > 0 && (
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">通訊群組</h3>
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-medium">
                      <MessageCircle size={16} /> 新增群組
                    </button>
                  </div>
                  <div className="space-y-3">
                    {vendor.socialGroups.map((group: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            group.platform === 'LINE' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <MessageCircle size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{group.groupName}</div>
                            <div className="text-xs text-slate-400">{group.platform} • {group.systemCode}</div>
                          </div>
                        </div>
                        {group.inviteLink && (
                          <a 
                            href={group.inviteLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                          >
                            加入群組 <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>聯繫紀錄功能開發中...</p>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="text-center py-12 text-slate-400">
              <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
              <p>合作/驗收紀錄功能開發中...</p>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="text-center py-12 text-slate-400">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>勞報/請款功能開發中...</p>
            </div>
          )}
        </div>

        {/* Tag Insight Modal */}
        {selectedTag && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTag(null)}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Tag size={20} /> 標籤說明
                </h3>
                <button onClick={() => setSelectedTag(null)} className="p-1 hover:bg-slate-100 rounded">
                  <X size={20} />
                </button>
              </div>
              <div className="mb-4">
                <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${
                  selectedTag === '優良廠商' ? 'bg-yellow-100 text-yellow-700' :
                  selectedTag === '黑名單' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {selectedTag}
                </span>
              </div>
              <p className="text-slate-600">
                {TAG_RULES[selectedTag] || '此標籤尚無詳細說明。'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
