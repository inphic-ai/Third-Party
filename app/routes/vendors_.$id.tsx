import { useState } from 'react';
import { useNavigate, useLoaderData } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { 
  ArrowLeft, MapPin, Star, Phone, Mail, Globe, 
  Building2, Package, User, Edit, Heart, MessageCircle, FileText,
  TrendingUp, Clock, CheckCircle, AlertCircle, Tag, Users, Briefcase,
  Crown, EyeOff, Eye, CalendarCheck, X, Info, MessageSquare
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
  '黑名單': '因多次違規或品質重大缺失，已被系統標記為暫停合作。需主管權限解鎖。'
};

export default function VendorDetail() {
  const { vendor } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'logs' | 'transactions' | 'docs'>('info');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Helper functions
  const getCategoryLabel = (category: string) => {
    // CATEGORY_GROUPS is Record<string, string[]>, not array
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
            <span className={`font-bold ${isAdminMode ? "text-red-600" : "text-slate-400"}`}>
              {isAdminMode ? "管理員模式" : "一般使用者模式"}
            </span>
            <button 
               onClick={() => setIsAdminMode(!isAdminMode)}
               className={`w-10 h-5 rounded-full p-1 transition-colors relative ${isAdminMode ? "bg-red-500" : "bg-slate-300"}`}
            >
               <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isAdminMode ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {/* Header Profile Card */}
        <div className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden ${isExcellent ? "border-yellow-200" : "border-slate-100"}`}>
          {isExcellent && (
             <div className="absolute top-0 left-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-br-xl shadow-sm z-10 flex items-center gap-1">
                <Crown size={14} /> 優良廠商
             </div>
          )}

          <img src={vendor.avatarUrl} alt={vendor.name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50" />
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
              <h1 className="text-2xl font-bold text-slate-800">{vendor.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                 <button className="flex items-center gap-2 text-sm font-bold text-white bg-yellow-500 border border-yellow-600 hover:bg-yellow-600 px-4 py-2 rounded-xl transition shadow-md">
                    <Edit size={16} /> 編輯資料
                 </button>
                 <span className="font-mono text-slate-400 text-sm">#{vendor.id}</span>
                 <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1 ${
                   vendor.entityType === EntityType.COMPANY ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                 }`}>
                   {vendor.entityType === EntityType.COMPANY ? <Building2 size={12}/> : <User size={12}/>}
                   {vendor.entityType}
                 </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
              <span className="flex items-center gap-1"><MapPin size={16} /> 註冊地：{vendor.region}</span>
              {vendor.taxId && (
                <span className="flex items-center gap-1 font-mono bg-slate-100 px-2 rounded">統編: {vendor.taxId}</span>
              )}
              {vendor.mainPhone && (
                <span 
                  className="flex items-center gap-1 cursor-pointer hover:text-blue-600 group" 
                  onClick={() => toggleRevealPhone('main')}
                  title="點擊查看完整號碼"
                >
                  <Phone size={16} /> 
                  <span className="font-mono">{getDisplayPhone('main', vendor.mainPhone)}</span>
                  {revealedPhones['main'] ? <EyeOff size={12} className="text-slate-400"/> : <Eye size={12} className="text-slate-400 group-hover:text-blue-500"/>}
                </span>
              )}
              <span className="flex items-center gap-1"><Clock size={16} /> 平均回應: 4小時內</span>
            </div>

            {vendor.internalNotes && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-800 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">用人注意事項：</span>
                  {vendor.internalNotes}
                </div>
              </div>
            )}
          </div>
          
          {/* Rating & Actions */}
          <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col items-center md:items-end justify-center gap-3">
             <div className="flex items-start gap-2">
                <div>
                  <div className="text-4xl font-bold text-slate-800">{vendor.rating}</div>
                  <div className="text-xs text-slate-400">基於 {vendor.ratingCount} 次評分</div>
                </div>
                <button 
                   onClick={() => setIsFavorite(!isFavorite)}
                   className={`p-2 rounded-full transition-all border ${
                      isFavorite ? "bg-red-50 border-red-100 text-red-500" : "bg-white border-slate-200 text-slate-300 hover:text-red-300"
                   }`}
                   title={isFavorite ? "取消收藏" : "加入最愛"}
                >
                   <Heart size={20} className={isFavorite ? "fill-current" : ""} />
                </button>
             </div>
             
             <div className="flex flex-col gap-2 w-full md:w-auto mt-2">
               <button className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition shadow-sm flex items-center justify-center gap-2 w-full">
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
            { id: 'info', label: '基本資料', icon: Info },
            { id: 'contacts', label: `聯繫窗口 (${vendor.contacts?.length || 0})`, icon: Users },
            { id: 'logs', label: '聯繫紀錄', icon: MessageSquare },
            { id: 'transactions', label: '合作/驗收', icon: Briefcase },
            { id: 'docs', label: '勞報/請款', icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Tags Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Tag size={16} /> 系統標籤
                </h3>
                <div className="flex flex-wrap gap-2">
                  {vendor.tags?.map((tag: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition cursor-pointer ${
                        tag === '優良廠商' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                        tag === '黑名單' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                        'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">服務資訊</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">主營類別</span>
                      <span className="font-medium">{vendor.mainCategory}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">服務類型</span>
                      <span className="font-medium">{vendor.serviceTypes?.join(', ') || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">價格區間</span>
                      <span className="font-medium">{vendor.priceRange}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">合作狀態</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        vendor.cooperationStatus === '合作中' ? 'bg-green-100 text-green-700' :
                        vendor.cooperationStatus === '暫停合作' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {vendor.cooperationStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">服務區域</h3>
                  <div className="flex flex-wrap gap-2">
                    {serviceAreas.map((area: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">聯絡資訊</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {vendor.email && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Mail size={18} className="text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">Email</div>
                        <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:underline">{vendor.email}</a>
                      </div>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Globe size={18} className="text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">網站</div>
                        <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {vendor.website}
                        </a>
                      </div>
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg md:col-span-2">
                      <MapPin size={18} className="text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">地址</div>
                        <span>{vendor.address}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {vendor.notes && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">備註說明</h3>
                  <div className="p-4 bg-slate-50 rounded-lg text-slate-600">
                    {vendor.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">聯繫窗口</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition">
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
