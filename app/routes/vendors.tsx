import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { 
  Users, Search, Filter, Plus, Star, MapPin, Phone, 
  ArrowRight, Building, User, Tag
} from 'lucide-react';
import { clsx } from 'clsx';
import { Region, EntityType, ServiceType, VendorCategory } from '../types';

export const meta: MetaFunction = () => {
  return [
    { title: "廠商名錄 - PartnerLink Pro" },
    { name: "description", content: "管理所有合作廠商資料" },
  ];
};

// 模擬廠商資料（後續會從資料庫讀取）
const MOCK_VENDORS = [
  {
    id: '1',
    name: '大發水電工程行',
    region: Region.TAIWAN,
    entityType: EntityType.INDIVIDUAL,
    serviceTypes: [ServiceType.LABOR],
    categories: [VendorCategory.PLUMBING],
    rating: 4.8,
    ratingCount: 156,
    priceRange: '$$' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop',
    mainPhone: '0912-345-678',
    address: '台北市信義區信義路五段',
    tags: ['快速響應', '價格合理'],
  },
  {
    id: '2',
    name: '永興冷凍空調',
    region: Region.TAIWAN,
    entityType: EntityType.COMPANY,
    serviceTypes: [ServiceType.LABOR, ServiceType.PRODUCT],
    categories: [VendorCategory.HVAC],
    rating: 4.5,
    ratingCount: 89,
    priceRange: '$$$' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    mainPhone: '02-2345-6789',
    address: '台北市中山區南京東路',
    tags: ['專業認證', '大型設備'],
  },
  {
    id: '3',
    name: '順達玻璃行',
    region: Region.TAIWAN,
    entityType: EntityType.INDIVIDUAL,
    serviceTypes: [ServiceType.PRODUCT],
    categories: [VendorCategory.GLASS],
    rating: 4.2,
    ratingCount: 45,
    priceRange: '$' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    mainPhone: '0933-456-789',
    address: '新北市板橋區文化路',
    tags: ['當日施工'],
  },
];

// 廠商卡片元件
const VendorCard = ({ vendor }: { vendor: typeof MOCK_VENDORS[0] }) => (
  <Link 
    to={`/vendors/${vendor.id}`}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all group"
  >
    <div className="flex items-start gap-4">
      <img 
        src={vendor.avatarUrl} 
        alt={vendor.name}
        className="w-14 h-14 rounded-xl object-cover border border-slate-200"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-bold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
            {vendor.name}
          </h3>
          {vendor.entityType === EntityType.COMPANY ? (
            <Building size={14} className="text-blue-500" />
          ) : (
            <User size={14} className="text-amber-500" />
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <MapPin size={14} />
          <span className="truncate">{vendor.address}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold text-slate-700">{vendor.rating}</span>
            <span className="text-xs text-slate-400">({vendor.ratingCount})</span>
          </div>
          <span className="text-sm font-bold text-emerald-600">{vendor.priceRange}</span>
        </div>
      </div>
      <div className="p-2 bg-slate-50 text-slate-300 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-all">
        <ArrowRight size={16} />
      </div>
    </div>
    
    <div className="mt-4 flex flex-wrap gap-2">
      {vendor.categories.map(cat => (
        <span key={cat} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg">
          {cat}
        </span>
      ))}
      {vendor.serviceTypes.map(st => (
        <span key={st} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg">
          {st}
        </span>
      ))}
    </div>

    {vendor.tags.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-1">
        {vendor.tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">
            #{tag}
          </span>
        ))}
      </div>
    )}
  </Link>
);

export default function VendorsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 頁首 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Users size={28} className="text-blue-600" />
            廠商名錄
          </h1>
          <p className="text-slate-500 mt-1">管理所有合作廠商資料與聯絡資訊</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-bold">
          <Plus size={18} />
          新增廠商
        </button>
      </div>

      {/* 搜尋與篩選 */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="搜尋廠商名稱、電話、地址..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
              <option value="">所有地區</option>
              <option value="taiwan">台灣</option>
              <option value="china">大陸</option>
            </select>
            <select className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
              <option value="">所有類別</option>
              {Object.values(VendorCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-sm">
              <Filter size={16} />
              更多篩選
            </button>
          </div>
        </div>
      </div>

      {/* 統計摘要 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-2xl font-black text-slate-800">{MOCK_VENDORS.length}</p>
          <p className="text-sm text-slate-500">總廠商數</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-2xl font-black text-blue-600">
            {MOCK_VENDORS.filter(v => v.region === Region.TAIWAN).length}
          </p>
          <p className="text-sm text-slate-500">台灣廠商</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-2xl font-black text-amber-600">
            {MOCK_VENDORS.filter(v => v.entityType === EntityType.COMPANY).length}
          </p>
          <p className="text-sm text-slate-500">公司行號</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-2xl font-black text-emerald-600">
            {(MOCK_VENDORS.reduce((acc, v) => acc + v.rating, 0) / MOCK_VENDORS.length).toFixed(1)}
          </p>
          <p className="text-sm text-slate-500">平均評分</p>
        </div>
      </div>

      {/* 廠商列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MOCK_VENDORS.map(vendor => (
          <VendorCard key={vendor.id} vendor={vendor} />
        ))}
      </div>

      {/* 空狀態提示 */}
      {MOCK_VENDORS.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">尚無廠商資料</h3>
          <p className="text-slate-500 mb-4">點擊上方「新增廠商」按鈕開始建立</p>
        </div>
      )}
    </div>
  );
}
