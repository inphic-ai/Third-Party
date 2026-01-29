import React, { useState } from 'react';
import { useLoaderData, useNavigate } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { db } from '../services/db.server';
import { vendors, contactWindows } from '../../db/schema/vendor';
import { eq } from 'drizzle-orm';
import { 
  ArrowLeft, MapPin, Star, Phone, Mail, Globe, 
  Building2, Package, User, Edit, Heart, MessageCircle, FileText,
  TrendingUp, Clock, CheckCircle, AlertCircle, Tag, Users, Briefcase,
  Crown, EyeOff, Eye, CalendarCheck, X, Info, MessageSquare, Camera,
  ExternalLink, Settings, Pencil, Plus, Calendar, DollarSign, Image,
  ThumbsUp, ThumbsDown, FileCheck, Receipt, Upload, Download, Sparkles, Edit2
} from 'lucide-react';

import { MOCK_VENDORS, CATEGORY_GROUPS } from '~/constants';
import { EntityType, ContactStatus, TransactionStatus, type ContactWindow, type ContactLog, type Transaction } from '~/types';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.vendor?.name || '廠商詳情'} - PartnerLink Pro` },
    { name: "description", content: "查看廠商完整資訊" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    // 從資料庫讀取廠商資料
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, params.id!));
    
    if (!vendor) {
      throw new Response("Not Found", { status: 404 });
    }
    
    // 讀取廠商的聯絡窗口
    const contacts = await db.select().from(contactWindows).where(eq(contactWindows.vendorId, params.id!));
    
    // 將資料庫 enum 值轉換為前端顯示用的中文
    const vendorWithMapping = {
      ...vendor,
      region: vendor.region === 'TAIWAN' ? '台灣' : vendor.region === 'CHINA' ? '大陸' : vendor.region,
      contactWindows: contacts,
      // 模擬資料（待實作）
      contactLogs: [],
      transactions: [],
      laborForms: [],
    };
    
    return json({ vendor: vendorWithMapping });
  } catch (error) {
    console.error('Failed to load vendor:', error);
    throw new Response("Internal Server Error", { status: 500 });
  }
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

// Contact Status Color Mapping
const getContactStatusStyle = (status: ContactStatus) => {
  switch (status) {
    case ContactStatus.SUCCESS:
      return 'bg-green-100 text-green-700 border-green-200';
    case ContactStatus.RESERVED:
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case ContactStatus.BUSY:
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case ContactStatus.TOO_HIGH:
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case ContactStatus.NO_TIME:
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case ContactStatus.BAD_ATTITUDE:
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

// Transaction Status Color Mapping
const getTransactionStatusStyle = (status: TransactionStatus) => {
  switch (status) {
    case TransactionStatus.IN_PROGRESS:
      return 'bg-blue-100 text-blue-700';
    case TransactionStatus.PENDING_APPROVAL:
      return 'bg-yellow-100 text-yellow-700';
    case TransactionStatus.APPROVED:
      return 'bg-green-100 text-green-700';
    case TransactionStatus.PAID:
      return 'bg-slate-100 text-slate-700';
    case TransactionStatus.REJECTED:
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

// Labor Form Status Color Mapping
const getLaborFormStatusStyle = (status: string) => {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-700';
    case 'Submitted':
      return 'bg-blue-100 text-blue-700';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'N/A':
    default:
      return 'bg-slate-100 text-slate-500';
  }
};

const getLaborFormStatusLabel = (status: string) => {
  switch (status) {
    case 'Paid':
      return '已付款';
    case 'Submitted':
      return '已提交';
    case 'Pending':
      return '待提交';
    case 'N/A':
    default:
      return '不適用';
  }
};

export default function VendorDetail() {
  const { vendor } = useLoaderData<typeof loader>();
  // const navigate = useNavigate(); // Not needed for now
  const [isFavorite, setIsFavorite] = useState(vendor.isFavorite || false);
  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'logs' | 'transactions' | 'docs'>('info');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactWindow | null>(null);
  const [modalInitialState, setModalInitialState] = useState<'log' | 'reservation'>('log');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState(vendor.address || '');

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(amount);
  };

  const handleContactClick = (contact: ContactWindow, mode: 'log' | 'reservation' = 'log') => {
    setSelectedContact(contact);
    setModalInitialState(mode);
    setShowContactModal(true);
  };

  const handleQuickReservation = () => {
    const mainContact = vendor.contacts?.find(c => c.isMainContact) || vendor.contacts?.[0];
    if (mainContact) {
      handleContactClick(mainContact, 'reservation');
    }
  };

  const serviceAreas = vendor.serviceArea?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
  const isExcellent = vendor.tags?.includes('優良廠商') || vendor.rating >= 4.8;
  
  // Get social groups count for tab label
  const socialGroupsCount = vendor.socialGroups?.length || 0;
  const contactsCount = vendor.contacts?.length || 0;
  const totalContactsAndGroups = contactsCount + socialGroupsCount;

  // Separate contact logs into regular logs and reservations
  const regularLogs = vendor.contactLogs?.filter((log: ContactLog) => !log.isReservation) || [];
  const reservations = vendor.contactLogs?.filter((log: ContactLog) => log.isReservation) || [];

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
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 text-sm font-bold text-white bg-yellow-500 border border-yellow-600 hover:bg-yellow-600 px-4 py-2 rounded-xl transition shadow-md"
                >
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
                 <button 
                   onClick={handleQuickReservation}
                   className="bg-orange-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-600 transition shadow-sm flex items-center justify-center gap-2 w-full"
                 >
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-800">公司/聯絡地址</h3>
                    {!isEditingAddress ? (
                      <button 
                        onClick={() => setIsEditingAddress(true)}
                        className="text-slate-400 hover:text-slate-600 transition"
                      >
                        <Edit2 size={16} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            // Save address logic here
                            setIsEditingAddress(false);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                        >
                          儲存
                        </button>
                        <button 
                          onClick={() => {
                            setEditedAddress(vendor.address || '');
                            setIsEditingAddress(false);
                          }}
                          className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300 transition"
                        >
                          取消
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {vendor.address && (
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-slate-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-xs text-slate-400 mb-1">地址</div>
                          {isEditingAddress ? (
                            <input
                              type="text"
                              value={editedAddress}
                              onChange={(e) => setEditedAddress(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="請輸入地址"
                            />
                          ) : (
                            <div className="text-slate-700">{editedAddress || vendor.address}</div>
                          )}
                          {!isEditingAddress && (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editedAddress || vendor.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mt-1"
                            >
                              在 Google Maps 上查看 <ExternalLink size={12} />
                            </a>
                          )}
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
                  <button 
                    onClick={() => {
                      const mainContact = vendor.contacts?.find(c => c.isMainContact) || vendor.contacts?.[0];
                      if (mainContact) handleContactClick(mainContact, 'log');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                  >
                    <Plus size={16} /> 新增紀錄
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
                          <button 
                            onClick={() => handleContactClick(contact, 'log')}
                            className="flex-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition"
                          >
                            新增紀錄
                          </button>
                          <button 
                            onClick={() => handleContactClick(contact, 'reservation')}
                            className="flex-1 px-3 py-2 bg-orange-100 text-orange-600 rounded-lg text-sm hover:bg-orange-200 transition"
                          >
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

          {/* 聯繫紀錄 Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              {/* Header with Add Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">聯繫紀錄</h3>
                <button 
                  onClick={() => {
                    const mainContact = vendor.contacts?.find(c => c.isMainContact) || vendor.contacts?.[0];
                    if (mainContact) handleContactClick(mainContact, 'log');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                >
                  <Plus size={16} /> 新增紀錄
                </button>
              </div>

              {/* Reservations Section */}
              {reservations.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                    <CalendarCheck size={16} className="text-blue-500" />
                    已預約的服務
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {reservations.map((log: ContactLog, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-blue-200 bg-blue-50">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getContactStatusStyle(log.status as ContactStatus)}`}>
                            {log.status}
                          </span>
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <Calendar size={14} />
                            {log.date}
                          </span>
                        </div>
                        <p className="text-slate-700 text-sm">{log.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Contact Logs */}
              {regularLogs.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                    <MessageSquare size={16} className="text-slate-500" />
                    聯繫歷程
                  </h4>
                  {regularLogs.map((log: ContactLog, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getContactStatusStyle(log.status as ContactStatus)}`}>
                          {log.status}
                        </span>
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Calendar size={14} />
                          {log.date}
                        </span>
                      </div>
                      <p className="text-slate-700">{log.note}</p>
                      {log.nextFollowUp && (
                        <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                          <Clock size={12} />
                          下次跟進：{log.nextFollowUp}
                        </div>
                      )}
                      {log.aiSummary && (
                        <div className="mt-2 p-2 bg-slate-50 rounded-lg text-xs text-slate-600">
                          <span className="font-medium">AI 摘要：</span> {log.aiSummary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                !reservations.length && (
                  <div className="text-center py-12 text-slate-400">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p>尚無聯繫紀錄</p>
                    <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium">
                      新增第一筆紀錄
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {/* 合作/驗收 Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Header with Add Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">合作/驗收紀錄</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition text-sm font-medium">
                  <Plus size={16} /> 新增合作
                </button>
              </div>

              {/* Transactions List */}
              {vendor.transactions && vendor.transactions.length > 0 ? (
                <div className="space-y-4">
                  {vendor.transactions.map((tx: Transaction, idx: number) => (
                    <div key={idx} className="p-5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        {/* Left: Main Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTransactionStatusStyle(tx.status as TransactionStatus)}`}>
                              {tx.status}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">#{tx.id}</span>
                          </div>
                          <h4 className="text-lg font-bold text-slate-800 mb-2">{tx.description}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              施工日：{tx.date}
                            </span>
                            {tx.completionDate && (
                              <span className="flex items-center gap-1">
                                <CheckCircle size={14} />
                                完工日：{tx.completionDate}
                              </span>
                            )}
                            {tx.timeSpentHours > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                工時：{tx.timeSpentHours} 小時
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-800">{formatCurrency(tx.amount)}</div>
                          {tx.initialQuote !== tx.amount && (
                            <div className="text-xs text-slate-400">
                              原報價：{formatCurrency(tx.initialQuote)}
                            </div>
                          )}
                          <div className="flex gap-2 mt-3 justify-end">
                            <button 
                              onClick={() => setSelectedTransaction(tx)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition"
                            >
                              查看詳情
                            </button>
                            {tx.status === TransactionStatus.PENDING_APPROVAL && (
                              <button className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition">
                                驗收
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Photos Preview */}
                      {(tx.photosBefore?.length > 0 || tx.photosAfter?.length > 0) && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="flex gap-4">
                            {tx.photosBefore?.length > 0 && (
                              <div className="flex-1">
                                <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                  <Image size={12} /> 施工前 ({tx.photosBefore.length})
                                </div>
                                <div className="flex gap-2">
                                  {tx.photosBefore.slice(0, 3).map((photo, pIdx) => (
                                    <img 
                                      key={pIdx}
                                      src={photo.url} 
                                      alt={photo.description || '施工前照片'}
                                      className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {tx.photosAfter?.length > 0 && (
                              <div className="flex-1">
                                <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                  <Image size={12} /> 施工後 ({tx.photosAfter.length})
                                </div>
                                <div className="flex gap-2">
                                  {tx.photosAfter.slice(0, 3).map((photo, pIdx) => (
                                    <img 
                                      key={pIdx}
                                      src={photo.url} 
                                      alt={photo.description || '施工後照片'}
                                      className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Manager Feedback */}
                      {tx.managerFeedback && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                            <User size={12} /> 主管評語
                          </div>
                          <p className="text-sm text-slate-700">{tx.managerFeedback}</p>
                          {tx.qualityRating && (
                            <div className="mt-2 flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={14} 
                                  className={i < tx.qualityRating! ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'} 
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                  <p>尚無合作紀錄</p>
                  <button className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition text-sm font-medium">
                    新增第一筆合作
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 勞報/請款 Tab */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              {/* Header with Actions */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">勞報/請款管理</h3>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium">
                    <Upload size={16} /> 上傳勞報單
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition text-sm font-medium">
                    <Receipt size={16} /> 新增請款
                  </button>
                </div>
              </div>

              {/* Labor Form Status Summary */}
              {vendor.transactions && vendor.transactions.length > 0 && (
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-2xl font-bold text-slate-800">{vendor.transactions.length}</div>
                    <div className="text-sm text-slate-500">總合作案件</div>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                    <div className="text-2xl font-bold text-green-700">
                      {vendor.transactions.filter((t: Transaction) => t.laborFormStatus === 'Paid').length}
                    </div>
                    <div className="text-sm text-green-600">已付款</div>
                  </div>
                  <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100">
                    <div className="text-2xl font-bold text-yellow-700">
                      {vendor.transactions.filter((t: Transaction) => t.laborFormStatus === 'Pending' || t.laborFormStatus === 'Submitted').length}
                    </div>
                    <div className="text-sm text-yellow-600">處理中</div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="text-2xl font-bold text-blue-700">
                      {formatCurrency(vendor.transactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0))}
                    </div>
                    <div className="text-sm text-blue-600">總金額</div>
                  </div>
                </div>
              )}

              {/* Transactions with Labor Form Status */}
              {vendor.transactions && vendor.transactions.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-600 mb-3">請款明細</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">案件</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">日期</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">金額</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">勞報狀態</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">驗收狀態</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendor.transactions.map((tx: Transaction, idx: number) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-800">{tx.description}</div>
                              <div className="text-xs text-slate-400 font-mono">#{tx.id}</div>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600">{tx.date}</td>
                            <td className="py-3 px-4 text-right font-medium text-slate-800">{formatCurrency(tx.amount)}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLaborFormStatusStyle(tx.laborFormStatus)}`}>
                                {getLaborFormStatusLabel(tx.laborFormStatus)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTransactionStatusStyle(tx.status as TransactionStatus)}`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex gap-2 justify-end">
                                {tx.laborFormStatus === 'N/A' && (
                                  <button className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs hover:bg-blue-200 transition">
                                    上傳勞報
                                  </button>
                                )}
                                {tx.laborFormStatus === 'Pending' && (
                                  <button className="px-3 py-1.5 bg-yellow-100 text-yellow-600 rounded-lg text-xs hover:bg-yellow-200 transition">
                                    提交審核
                                  </button>
                                )}
                                <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200 transition">
                                  <Download size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>尚無請款紀錄</p>
                  <p className="text-sm mt-2">完成合作案件後，可在此管理勞報單與請款</p>
                </div>
              )}
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

        {/* Contact Log Modal */}
        {showContactModal && selectedContact && (
          <ContactLogModal 
            contact={selectedContact}
            vendor={vendor}
            initialIsReservation={modalInitialState === 'reservation'}
            onClose={() => setShowContactModal(false)}
          />
        )}

        {/* Edit Vendor Modal */}
        {showEditModal && (
          <EditVendorModal 
            vendor={vendor}
            onClose={() => setShowEditModal(false)}
          />
        )}

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTransaction(null)}>
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-800">合作詳情</h3>
                <button onClick={() => setSelectedTransaction(null)} className="p-1 hover:bg-slate-100 rounded">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{selectedTransaction.description}</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTransactionStatusStyle(selectedTransaction.status as TransactionStatus)}`}>
                      {selectedTransaction.status}
                    </span>
                    <span className="text-sm text-slate-400 font-mono">#{selectedTransaction.id}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <div className="text-xs text-slate-500">施工日期</div>
                    <div className="font-medium">{selectedTransaction.date}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">完工日期</div>
                    <div className="font-medium">{selectedTransaction.completionDate || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">金額</div>
                    <div className="font-bold text-lg">{formatCurrency(selectedTransaction.amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">工時</div>
                    <div className="font-medium">{selectedTransaction.timeSpentHours} 小時</div>
                  </div>
                </div>

                {/* Photos */}
                {selectedTransaction.photosBefore?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-bold text-slate-600 mb-2">施工前照片</h5>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedTransaction.photosBefore.map((photo, idx) => (
                        <div key={idx} className="relative">
                          <img src={photo.url} alt={photo.description} className="w-full h-24 object-cover rounded-lg" />
                          {photo.description && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate">
                              {photo.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTransaction.photosAfter?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-bold text-slate-600 mb-2">施工後照片</h5>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedTransaction.photosAfter.map((photo, idx) => (
                        <div key={idx} className="relative">
                          <img src={photo.url} alt={photo.description} className="w-full h-24 object-cover rounded-lg" />
                          {photo.description && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate">
                              {photo.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  {selectedTransaction.status === TransactionStatus.PENDING_APPROVAL && (
                    <>
                      <button className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition flex items-center justify-center gap-2">
                        <ThumbsUp size={16} /> 通過驗收
                      </button>
                      <button className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2">
                        <ThumbsDown size={16} /> 退回修改
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => setSelectedTransaction(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
                  >
                    關閉
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ===== Modal Components =====

const MOCK_SYSTEM_TAGS = {
  contactTags: ['報價中', '已預約', '無人接聽', '已確認檔期', '等待報價', '報價過高', '態度良好', '需要主管確認', '約定場勘']
};

const ContactLogModal: React.FC<{ 
  contact: ContactWindow; 
  vendor: any;
  initialIsReservation?: boolean;
  onClose: () => void; 
}> = ({ contact, vendor, initialIsReservation = false, onClose }) => {
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isReservation, setIsReservation] = useState(initialIsReservation);
  const [resDate, setResDate] = useState(new Date().toISOString().split('T')[0]);
  const [resTime, setResTime] = useState('10:00');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [productId, setProductId] = useState('');

  const handleAiSummarize = () => {
    if (!note.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
       setGeneratedSummary("1. 確認可於週末進場施工。\n2. 報價需重新評估，預計週五前回覆。\n3. 注意停車問題。");
       setIsProcessing(false);
    }, 1200);
  };

  const handleAddTag = (tag: string) => {
    setNote(prev => prev ? `${prev} ${tag}` : tag);
  };

  const handleSave = () => {
    alert('聯繫紀錄已儲存（模擬）');
    onClose();
  };

  const contactPhone = contact.mobile || vendor.mainPhone;

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4">
       <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
         <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
           <h2 className="text-lg font-bold flex items-center gap-2">
             <Phone size={20} /> 聯繫詳情
           </h2>
           <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
         </div>

         <div className="p-6">
           <div className="mb-6 text-center">
             <p className="text-sm text-slate-500 mb-1">正在聯繫</p>
             <h3 className="text-2xl font-bold text-slate-800">{contact.name} ({contact.role})</h3>
             
             <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-mono font-bold text-xl border border-blue-200">
                {contactPhone || "無號碼"}
                <Phone size={16} className="animate-pulse" />
             </div>
             <p className="text-[10px] text-slate-400 mt-1">系統將自動記錄此次聯繫意圖</p>
           </div>

           <div className="space-y-4">
             <div className={`border rounded-xl p-4 transition-all ${isReservation ? "bg-orange-50 border-orange-300" : "bg-white border-slate-200"}`}>
               <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                     <input type="checkbox" className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" checked={isReservation} onChange={(e) => setIsReservation(e.target.checked)} />
                     確認預約 / 場勘 / 施工
                  </label>
                  {isReservation && <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded font-bold">RESERVATION</span>}
               </div>
               
               {isReservation && (
                 <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">預約日期</label>
                       <div className="relative">
                          <CalendarCheck size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-500"/>
                          <input type="date" value={resDate} onChange={(e) => setResDate(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">預約時間</label>
                       <input type="time" value={resTime} onChange={(e) => setResTime(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                    </div>
                    <div className="col-span-2">
                       <label className="block text-xs font-bold text-slate-500 mb-1">預估報價 (若有)</label>
                       <div className="relative">
                          <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                          <input type="number" placeholder="輸入金額..." value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                       </div>
                    </div>
                    <div className="col-span-2">
                       <label className="block text-xs font-bold text-slate-500 mb-1">商品/專案編號 (Product ID/SKU)</label>
                       <div className="relative">
                          <Package size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-500"/>
                          <input 
                            type="text" 
                            placeholder="例如：P-2024-001 (將自動標記於知識庫)" 
                            value={productId} 
                            onChange={(e) => setProductId(e.target.value)} 
                            className="w-full pl-8 pr-2 py-1.5 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" 
                          />
                       </div>
                    </div>
                 </div>
               )}
             </div>

             <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">智慧標籤 (快速填寫)</label>
               <div className="flex flex-wrap gap-2 mb-3">
                 {MOCK_SYSTEM_TAGS.contactTags.map(tag => (
                   <button
                     key={tag}
                     onClick={() => handleAddTag(tag)}
                     className="px-3 py-1.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 rounded-full text-xs text-slate-600 transition flex items-center gap-1 border border-slate-200 shadow-sm"
                   >
                     <Tag size={10} /> {tag}
                   </button>
                 ))}
               </div>

               <label className="block text-sm font-bold text-slate-700 mb-2">聯繫筆記</label>
               <textarea 
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="紀錄對話重點..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
               />
               <button 
                 onClick={handleAiSummarize}
                 disabled={isProcessing || !note}
                 className="mt-2 text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 font-bold disabled:opacity-50"
               >
                 <Sparkles size={12} /> {isProcessing ? "AI 分析中..." : "AI 協助整理重點"}
               </button>
             </div>

             {generatedSummary && (
               <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-sm text-slate-700">
                 <div className="flex items-center gap-2 font-bold text-purple-800 mb-1">
                   <MessageCircle size={14} /> AI 摘要建議
                 </div>
                 <pre className="whitespace-pre-wrap font-sans text-xs">{generatedSummary}</pre>
               </div>
             )}

             <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">取消</button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2"
                >
                   <CheckCircle size={16} /> {isReservation ? "建立預約並儲存" : "儲存紀錄"}
                </button>
             </div>
           </div>
         </div>
       </div>
    </div>
  );
};

const EditVendorModal: React.FC<{ vendor: any; onClose: () => void }> = ({ vendor, onClose }) => {
  const [formData, setFormData] = useState({
    name: vendor.name,
    entityType: vendor.entityType,
    region: vendor.region,
    taxId: vendor.taxId || '',
    mainPhone: vendor.mainPhone || '',
    priceRange: vendor.priceRange || '$$'
  });

  const handleSave = () => {
    alert("資料已更新 (模擬)");
    onClose();
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Edit size={20} className="text-blue-400" /> 編輯廠商資料
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24}/>
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
           <div className="space-y-4">
              <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 text-sm uppercase tracking-wide">基本資料</h4>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">廠商名稱</label>
                    <input 
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" 
                      value={formData.name} 
                      onChange={e => handleChange('name', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">身分類型</label>
                    <select 
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white" 
                      value={formData.entityType} 
                      onChange={e => handleChange('entityType', e.target.value)}
                    >
                      <option value="公司行號">公司行號</option>
                      <option value="個人接案">個人接案</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">統一編號</label>
                    <input 
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" 
                      value={formData.taxId} 
                      onChange={e => handleChange('taxId', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">主要電話</label>
                    <input 
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" 
                      value={formData.mainPhone} 
                      onChange={e => handleChange('mainPhone', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">地區</label>
                    <select 
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white" 
                      value={formData.region} 
                      onChange={e => handleChange('region', e.target.value)}
                    >
                      <option value="台灣">台灣</option>
                      <option value="大陸">大陸</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">價格區間</label>
                    <select 
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white font-mono" 
                      value={formData.priceRange} 
                      onChange={e => handleChange('priceRange', e.target.value)}
                    >
                      <option value="$">$ (平價)</option>
                      <option value="$$">$$ (中等)</option>
                      <option value="$$$">$$$ (中高)</option>
                      <option value="$$$$">$$$$ (昂貴)</option>
                    </select>
                  </div>
              </div>
           </div>
        </div>
        
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
           <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-sm">取消</button>
           <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md">儲存變更</button>
        </div>
      </div>
    </div>
  );
};
