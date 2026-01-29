import { useState } from 'react';
import { useParams, Link, useNavigate, useLoaderData } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { 
  ArrowLeft, MapPin, Star, Phone, Mail, Globe, 
  Building2, Package, DollarSign, Calendar, User,
  Edit, Trash2, Heart, MessageCircle, FileText,
  TrendingUp, Clock, CheckCircle, AlertCircle
} from 'lucide-react';

import { MOCK_VENDORS, CATEGORY_GROUPS } from '~/constants';
import type { Vendor } from '~/types';

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

export default function VendorDetail() {
  const { vendor } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const getCategoryLabel = (category: string) => {
    for (const group of CATEGORY_GROUPS) {
      const found = group.items.find(item => item.value === category);
      if (found) return found.label;
    }
    return category;
  };

  const getRegionLabel = (region: string) => {
    const regionMap: Record<string, string> = {
      'taiwan': '台灣',
      'china': '中國',
      'asia': '亞洲其他',
      'europe': '歐洲',
      'americas': '美洲',
      'oceania': '大洋洲'
    };
    return regionMap[region] || region;
  };

  const getPriceRangeLabel = (range: string) => {
    const priceMap: Record<string, string> = {
      'budget': '經濟實惠',
      'mid': '中等價位',
      'premium': '高端品質',
      'luxury': '頂級奢華'
    };
    return priceMap[range] || range;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 返回按鈕 */}
        <button
          onClick={() => navigate('/vendors')}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          返回廠商名錄
        </button>

        {/* 主要內容區 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：基本資訊卡片 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-8">
              {/* 廠商頭像 */}
              <div className="relative h-48 bg-gradient-to-br from-emerald-400 to-teal-600">
                {vendor.avatar && (
                  <img 
                    src={vendor.avatar} 
                    alt={vendor.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-2 rounded-full backdrop-blur-sm transition ${
                      isFavorite 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white/80 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* 廠商名稱與評分 */}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{vendor.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-semibold">{vendor.rating}</span>
                  </div>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 text-sm">系統編號: {vendor.id}</span>
                </div>

                {/* 主要類別標籤 */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    {getCategoryLabel(vendor.category)}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {getRegionLabel(vendor.region)}
                  </span>
                </div>

                {/* 聯絡資訊 */}
                <div className="space-y-3 border-t pt-4">
                  {vendor.phone && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Phone className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Mail className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Globe className="w-5 h-5 text-emerald-600" />
                      <a 
                        href={vendor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm hover:text-emerald-600 transition"
                      >
                        {vendor.website}
                      </a>
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-start gap-3 text-slate-600">
                      <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <span className="text-sm">{vendor.address}</span>
                    </div>
                  )}
                </div>

                {/* 操作按鈕 */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition">
                    <MessageCircle className="w-4 h-4" />
                    聯繫
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition">
                    <Edit className="w-4 h-4" />
                    編輯
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右側：詳細資訊 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本資訊 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-emerald-600" />
                基本資訊
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-500 mb-1 block">實體類型</label>
                  <p className="text-slate-900 font-medium">{vendor.entityType === 'company' ? '公司' : '個人'}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-500 mb-1 block">服務類型</label>
                  <p className="text-slate-900 font-medium">
                    {vendor.serviceType === 'product' ? '產品供應' : '服務提供'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-500 mb-1 block">價格區間</label>
                  <p className="text-slate-900 font-medium">{getPriceRangeLabel(vendor.priceRange)}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-500 mb-1 block">合作狀態</label>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    vendor.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {vendor.status === 'active' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        合作中
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        暫停
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* 服務項目 */}
            {vendor.services && vendor.services.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-6 h-6 text-emerald-600" />
                  服務項目
                </h2>
                <div className="flex flex-wrap gap-2">
                  {vendor.services.map((service, index) => (
                    <span 
                      key={index}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 備註說明 */}
            {vendor.notes && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-emerald-600" />
                  備註說明
                </h2>
                <p className="text-slate-600 leading-relaxed">{vendor.notes}</p>
              </div>
            )}

            {/* 合作統計 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                合作統計
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-sm text-blue-600 mb-1">合作項目</div>
                  <div className="text-2xl font-bold text-blue-900">12 個</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                  <div className="text-sm text-emerald-600 mb-1">累計金額</div>
                  <div className="text-2xl font-bold text-emerald-900">$45,600</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                  <div className="text-sm text-amber-600 mb-1">合作天數</div>
                  <div className="text-2xl font-bold text-amber-900">365 天</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
