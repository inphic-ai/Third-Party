import React, { useState, useEffect } from 'react';
import { useLoaderData, useNavigate, useActionData, useNavigation, Form } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, type ActionFunctionArgs } from "@remix-run/node";
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

import { CATEGORY_GROUPS } from '~/constants';
import { EntityType, ContactStatus, TransactionStatus, type ContactWindow, type ContactLog, type Transaction } from '~/types';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.vendor?.name || '廠商詳情'} - PartnerLink Pro` },
    { name: "description", content: "查看廠商完整資訊" },
  ];
};

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "updateVendor") {
    const id = params.id;
    const name = formData.get("name") as string;
    const entityType = formData.get("entityType") as string;
    const region = formData.get("region") as string;
    const taxId = formData.get("taxId") as string;
    const mainPhone = formData.get("mainPhone") as string;
    const priceRange = formData.get("priceRange") as string;

    try {
      // 映射地區到 enum 值
      const dbRegion = region === '台灣' ? 'TAIWAN' : 'CHINA';
      // 映射身分類型到 enum 值
      const dbEntityType = entityType === '公司行號' ? 'COMPANY' : 'INDIVIDUAL';

      await db.update(vendors)
        .set({
          name,
          entityType: dbEntityType as any,
          region: dbRegion as any,
          taxId: taxId || null,
          mainPhone: mainPhone || null,
          priceRange: priceRange || '$$',
          updatedAt: new Date(),
        })
        .where(eq(vendors.id, id!));

      return json({ success: true, message: "廠商資料已更新" });
    } catch (error) {
      console.error("Failed to update vendor:", error);
      return json({ success: false, message: "更新失敗，請稍後再試" }, { status: 500 });
    }
  }

  return json({ success: false, message: "未知的請求" }, { status: 400 });
}

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, params.id!));
    
    if (!vendor) {
      throw new Response("Not Found", { status: 404 });
    }
    
    const contacts = await db.select().from(contactWindows).where(eq(contactWindows.vendorId, params.id!));
    
    const vendorWithMapping = {
      ...vendor,
      region: vendor.region === 'TAIWAN' ? '台灣' : vendor.region === 'CHINA' ? '大陸' : vendor.region,
      entityType: vendor.entityType === 'COMPANY' ? '公司行號' : vendor.entityType === 'INDIVIDUAL' ? '個人接案' : vendor.entityType,
      contactWindows: contacts,
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

const TAG_RULES: Record<string, string> = {
  '優良廠商': '經系統評核，該廠商過去 1 年內合作次數 > 3 次，且平均評分高於 4.5 分。合作優先推薦。',
  '急件': '該廠商明確表示可接受 24 小時內進場的緊急案件，惟報價可能會有 1.5 ~ 2 倍的加成。',
  '夜間施工': '已確認該廠商具備夜間施工許可與意願，適合百貨專櫃或辦公大樓案型。',
  '配合度高': '窗口回應速度快，且願意配合業主修改需求超過 2 次以上。',
  '價格實惠': '報價經比對低於市場行情 10% 以上，適合預算有限的專案。',
  '含廢棄物清運': '該廠商提供完整的廢棄物清運服務，施工後會負責清理現場。',
  '黑名單': '因多次違規或品質重大缺失，已被系統標記為暫停合作。需主管權限解鎖。'
};

const getContactStatusStyle = (status: ContactStatus) => {
  switch (status) {
    case ContactStatus.SUCCESS: return 'bg-green-100 text-green-700 border-green-200';
    case ContactStatus.RESERVED: return 'bg-blue-100 text-blue-700 border-blue-200';
    case ContactStatus.BUSY: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case ContactStatus.TOO_HIGH: return 'bg-orange-100 text-orange-700 border-orange-200';
    case ContactStatus.NO_TIME: return 'bg-slate-100 text-slate-700 border-slate-200';
    case ContactStatus.BAD_ATTITUDE: return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getTransactionStatusStyle = (status: TransactionStatus) => {
  switch (status) {
    case TransactionStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700';
    case TransactionStatus.PENDING_APPROVAL: return 'bg-yellow-100 text-yellow-700';
    case TransactionStatus.APPROVED: return 'bg-green-100 text-green-700';
    case TransactionStatus.PAID: return 'bg-slate-100 text-slate-700';
    case TransactionStatus.REJECTED: return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const getLaborFormStatusStyle = (status: string) => {
  switch (status) {
    case 'Paid': return 'bg-green-100 text-green-700';
    case 'Submitted': return 'bg-blue-100 text-blue-700';
    case 'Pending': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-slate-100 text-slate-500';
  }
};

export default function VendorDetail() {
  const { vendor } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

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

  useEffect(() => {
    if (actionData?.success) {
      setShowEditModal(false);
    }
  }, [actionData]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(amount);
  };

  const handleContactClick = (contact: ContactWindow, mode: 'log' | 'reservation' = 'log') => {
    setSelectedContact(contact);
    setModalInitialState(mode);
    setShowContactModal(true);
  };

  const isExcellent = (vendor.tags as string[])?.includes('優良廠商') || (vendor.rating || 0) >= 4.8;
  const contactsCount = (vendor.contactWindows as any[])?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/vendors')} className="flex items-center text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft size={20} className="mr-2" /> 返回列表
          </button>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">一般使用者模式</span>
            <button onClick={() => setIsAdminMode(!isAdminMode)} className={`w-10 h-5 rounded-full p-1 transition-colors relative ${isAdminMode ? "bg-emerald-500" : "bg-slate-300"}`}>
               <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isAdminMode ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
          {isExcellent && (
             <div className="absolute top-0 left-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-br-xl shadow-sm z-10 flex items-center gap-1">
                <Crown size={14} /> 優良廠商
             </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <img src={vendor.avatarUrl || 'https://via.placeholder.com/150'} alt={vendor.name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-100" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-800">{vendor.name}</h1>
                <button onClick={() => setShowEditModal(true)} className="flex items-center gap-2 text-sm font-bold text-white bg-yellow-500 border border-yellow-600 hover:bg-yellow-600 px-4 py-2 rounded-xl transition shadow-md">
                   <Pencil size={14} /> 編輯資料
                </button>
                <span className="font-mono text-slate-400 text-sm">#{vendor.id}</span>
                <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1 ${vendor.entityType === EntityType.COMPANY ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                  {vendor.entityType === EntityType.COMPANY ? <Building2 size={12}/> : <User size={12}/>}
                  {vendor.entityType}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 mb-4">
                <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400" /> 註冊地：{vendor.region}</span>
                {vendor.taxId && <span className="flex items-center gap-1 font-mono"><Building2 size={14} className="text-slate-400" /> 統編：{vendor.taxId}</span>}
                {vendor.mainPhone && (
                  <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600 group" onClick={() => toggleRevealPhone('main')}>
                    <Phone size={14} className="text-slate-400" /> <span className="font-mono">{getDisplayPhone('main', vendor.mainPhone)}</span>
                    {revealedPhones['main'] ? <EyeOff size={12} className="text-slate-400"/> : <Eye size={12} className="text-slate-400 group-hover:text-blue-500"/>}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 text-center md:text-right flex flex-col items-center md:items-end justify-start gap-3 md:min-w-[140px]">
               <div className="flex items-start gap-2">
                  <div>
                    <div className="text-4xl font-bold text-slate-800">{vendor.rating || 0}</div>
                    <div className="text-xs text-slate-400">基於 {vendor.ratingCount || 0} 次評分</div>
                  </div>
                  <button onClick={() => setIsFavorite(!isFavorite)} className="p-1">
                     <Heart size={24} className={isFavorite ? "fill-red-500 text-red-500" : "text-slate-300 hover:text-red-300"} />
                  </button>
               </div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-slate-200 overflow-x-auto bg-white rounded-t-xl">
          {[
            { id: 'info', label: '基本資料', icon: Info },
            { id: 'contacts', label: `聯繫窗口 (${contactsCount})`, icon: Users },
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

        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-100 p-6">
           {activeTab === 'info' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">服務項目</h3>
                    <div className="flex flex-wrap gap-2">
                      {(vendor.services as string[])?.map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200">{s}</span>
                      )) || <span className="text-slate-400 text-sm italic">未設定服務項目</span>}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">服務地區</h3>
                    <div className="flex flex-wrap gap-2">
                      {(vendor.serviceArea as string)?.split(',').map((s, i) => (
                        <span key={i} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100"><MapPin size={12} /> {s.trim()}</span>
                      )) || <span className="text-slate-400 text-sm italic">未設定服務地區</span>}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                   <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h3 className="text-sm font-bold text-slate-800 mb-3">財務與規模</h3>
                      <div className="grid grid-cols-2 gap-4">
                         <div><div className="text-xs text-slate-400 mb-1">價格區間</div><div className="font-mono text-blue-600 font-bold">{vendor.priceRange}</div></div>
                         <div><div className="text-xs text-slate-400 mb-1">配合年資</div><div className="font-bold">2.5 年</div></div>
                      </div>
                   </div>
                </div>
             </div>
           )}
           {activeTab !== 'info' && <div className="text-center py-12 text-slate-400">功能開發中，請先查看「基本資料」</div>}
        </div>

        {showEditModal && (
          <EditVendorModal 
            vendor={vendor} 
            onClose={() => setShowEditModal(false)} 
            isSubmitting={isSubmitting}
            actionData={actionData}
          />
        )}
      </div>
    </div>
  );
}

const EditVendorModal: React.FC<{ 
  vendor: any; 
  onClose: () => void;
  isSubmitting: boolean;
  actionData: any;
}> = ({ vendor, onClose, isSubmitting, actionData }) => {
  const [formData, setFormData] = useState({
    name: vendor.name,
    entityType: vendor.entityType,
    region: vendor.region,
    taxId: vendor.taxId || '',
    mainPhone: vendor.mainPhone || '',
    priceRange: vendor.priceRange || '$$'
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <Form method="post" className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <input type="hidden" name="intent" value="updateVendor" />
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Edit size={20} className="text-blue-400" /> 編輯廠商資料
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24}/>
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
           {actionData?.success === false && (
             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
               <AlertCircle size={16} /> {actionData.message}
             </div>
           )}

           <div className="space-y-4">
              <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 text-sm uppercase tracking-wide">基本資料</h4>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">廠商名稱</label>
                    <input name="name" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" value={formData.name} onChange={e => handleChange('name', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">身分類型</label>
                    <select name="entityType" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white" value={formData.entityType} onChange={e => handleChange('entityType', e.target.value)}>
                      <option value="公司行號">公司行號</option>
                      <option value="個人接案">個人接案</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">統一編號</label>
                    <input name="taxId" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" value={formData.taxId} onChange={e => handleChange('taxId', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">主要電話</label>
                    <input name="mainPhone" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" value={formData.mainPhone} onChange={e => handleChange('mainPhone', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">地區</label>
                    <select name="region" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white" value={formData.region} onChange={e => handleChange('region', e.target.value)}>
                      <option value="台灣">台灣</option>
                      <option value="大陸">大陸</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">價格區間</label>
                    <select name="priceRange" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white font-mono" value={formData.priceRange} onChange={e => handleChange('priceRange', e.target.value)}>
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
           <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-sm" disabled={isSubmitting}>取消</button>
           <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md flex items-center gap-2" disabled={isSubmitting}>
             {isSubmitting ? <><Clock size={16} className="animate-spin" /> 儲存中...</> : "儲存變更"}
           </button>
        </div>
      </Form>
    </div>
  );
};
