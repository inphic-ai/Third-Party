import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link, useFetcher, useLoaderData } from '@remix-run/react';
import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { db } from '../services/db.server';
import { vendors, contactWindows } from '../../db/schema/vendor';
import { requireUser } from '~/services/auth.server';
import { requirePermission } from '~/utils/permissions.server';
import { PERMISSIONS } from '~/utils/permissions';
import { eq } from 'drizzle-orm';
import { 
  Search, MapPin, Star, ChevronRight, LayoutGrid, 
  LayoutList, Plus, Sparkles, X, Heart, 
  ArrowRight, Package, Hammer, Factory, Info, Globe, Filter,
  ChevronDown, Save, Phone, Mail, Building2
} from 'lucide-react';
import { clsx } from 'clsx';

import { Pagination } from '~/components/Pagination';
import { ClientOnly } from '~/components/ClientOnly';
import { MOCK_VENDORS, CATEGORY_GROUPS, TAIWAN_REGIONS, CHINA_REGIONS } from '~/constants';
import { Region, ServiceType, Vendor } from '~/types';

export const meta: MetaFunction = () => {
  return [
    { title: "廠商名錄 - PartnerLink Pro" },
    { name: "description", content: "管理所有合作廠商資料" },
  ];
};

// Action 函數處理表單提交
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'createVendor') {
    try {
      // 取得表單資料
      const name = formData.get('name') as string;
      const taxId = formData.get('taxId') as string;
      const region = formData.get('region') as string;
      const category = formData.get('category') as string;
      const serviceTypes = formData.getAll('serviceType') as string[];
      const contactName = formData.get('contactName') as string;
      const contactPhone = formData.get('contactPhone') as string;
      const contactEmail = formData.get('contactEmail') as string;
      const contactAddress = formData.get('contactAddress') as string;
      const serviceScopes = (formData.getAll('serviceScopes') as string[])
        .map(scope => scope.trim())
        .filter(Boolean);
      const notes = formData.get('notes') as string;

      // 表單驗證
      if (!name || !region || !category || serviceTypes.length === 0) {
        return json({ 
          success: false, 
          error: '請填寫所有必填欄位（廠商名稱、地區、主營類別、身分屬性）' 
        }, { status: 400 });
      }

      // 將中文 region 映射為資料庫 enum 值
      const regionMap: Record<string, string> = {
        '台灣': 'TAIWAN',
        '大陸': 'CHINA',
      };
      const dbRegion = regionMap[region] || region;

      // 生成預設頭像 URL（使用 UI Avatars）
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e293b&color=fff&size=128`;

      // 插入廠商資料
      const [newVendor] = await db.insert(vendors).values({
        name,
        taxId: taxId || null,
        avatarUrl,
        region: dbRegion as any,
        entityType: taxId && taxId.length === 8 ? 'COMPANY' : 'INDIVIDUAL',
        serviceTypes,
        categories: [category],
        priceRange: '$$',
        tags: [],
        serviceScopes,
        companyAddress: contactAddress || null,
        internalNotes: notes || null,
        createdBy: '00000000-0000-0000-0000-000000000000', // TODO: 替換為實際登入用戶 ID
      }).returning();

      // 如果有聯絡人資訊，插入聯絡窗口
      if (contactName || contactPhone || contactEmail) {
        await db.insert(contactWindows).values({
          vendorId: newVendor.id,
          name: contactName || '未提供',
          role: '主要聯絡人',
          mobile: contactPhone || null,
          email: contactEmail || null,
          contactAddress: contactAddress || null,
          isMainContact: true,
        });
      }

      return json({ success: true, error: null, vendorId: newVendor.id });
    } catch (error) {
      console.error('Failed to create vendor:', error);
      return json({ 
        success: false, 
        error: '建立失敗，請稍後再試' 
      }, { status: 500 });
    }
  }

  if (intent === 'aiRecommend') {
    try {
      // 取得表單資料
      const projectType = formData.get('projectType') as string;
      const budgetMinStr = formData.get('budgetMin') as string;
      const budgetMaxStr = formData.get('budgetMax') as string;
      const budgetMin = budgetMinStr ? parseInt(budgetMinStr) : null;
      const budgetMax = budgetMaxStr ? parseInt(budgetMaxStr) : null;
      const regionPreferences = formData.getAll('regionPreference') as string[];
      const serviceTypePreferences = formData.getAll('serviceTypePreference') as string[];
      const requirements = formData.get('requirements') as string;

      // 表單驗證
      if (!projectType) {
        return json({ 
          success: false, 
          error: '請填寫專案類型' 
        }, { status: 400 });
      }

      // 從資料庫讀取所有廠商
      const allVendors = await db.select().from(vendors);

      // 篩選符合條件的廠商
      let filteredVendors = allVendors.filter(vendor => {
        // 地區篩選
        if (regionPreferences.length > 0 && !regionPreferences.includes('ALL')) {
          if (!regionPreferences.includes(vendor.region)) return false;
        }
        
        // 身分屬性篩選
        if (serviceTypePreferences.length > 0) {
          const hasMatchingServiceType = serviceTypePreferences.some(pref => 
            vendor.serviceTypes.includes(pref)
          );
          if (!hasMatchingServiceType) return false;
        }
        
        // 預算篩選（根據 priceRange 轉換為估計金額）
        if (budgetMin !== null || budgetMax !== null) {
          // priceRange 轉換為估計金額範圍
          const priceRangeMap: Record<string, { min: number; max: number }> = {
            '$': { min: 0, max: 50000 },
            '$$': { min: 50000, max: 200000 },
            '$$$': { min: 200000, max: 1000000 },
            '$$$$': { min: 1000000, max: Infinity }
          };
          
          const vendorPriceRange = priceRangeMap[vendor.priceRange] || { min: 0, max: Infinity };
          
          // 檢查是否有交集
          if (budgetMin !== null && vendorPriceRange.max < budgetMin) return false;
          if (budgetMax !== null && vendorPriceRange.min > budgetMax) return false;
        }
        
        return true;
      });

      // 使用 Gemini API 進行智能分析和排序
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // 準備預算描述
      let budgetDescription = '不限';
      if (budgetMin !== null && budgetMax !== null) {
        budgetDescription = `${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()} 元`;
      } else if (budgetMin !== null) {
        budgetDescription = `${budgetMin.toLocaleString()} 元以上`;
      } else if (budgetMax !== null) {
        budgetDescription = `${budgetMax.toLocaleString()} 元以下`;
      }

      // 準備提示詞
      const prompt = `你是一個廠商推薦專家。根據以下需求和廠商列表，請推薦最適合的 3-5 家廠商，並說明推薦理由。

需求條件：
- 專案類型：${projectType}
- 預算範圍：${budgetDescription}
- 地區偏好：${regionPreferences.join(', ') || '不限'}
- 身分屬性：${serviceTypePreferences.join(', ') || '不限'}
- 其他需求：${requirements || '無'}

廠商列表（JSON 格式）：
${JSON.stringify(filteredVendors.slice(0, 20).map(v => ({
  id: v.id,
  name: v.name,
  region: v.region,
  serviceTypes: v.serviceTypes,
  categories: v.categories,
  rating: v.rating,
  priceRange: v.priceRange,
  tags: v.tags
})), null, 2)}

請以以下 JSON 格式回傳：
{
  "recommendations": [
    {
      "vendorId": "廠商 ID",
      "matchScore": 95,
      "reason": "推薦理由（繁體中文，50 字以內）"
    }
  ]
}

注意：
1. 推薦 3-5 家最適合的廠商
2. matchScore 為 0-100 的匹配度分數
3. reason 要簡潔有力，說明為什麼推薦這家廠商
4. 只回傳 JSON，不要其他文字`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // 解析 AI 回應
      let aiResponse;
      try {
        // 移除可能的 markdown 代碼區塊標記
        const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        aiResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', responseText);
        // 如果 AI 回應解析失敗，使用預設推薦
        aiResponse = {
          recommendations: filteredVendors.slice(0, 3).map((v, i) => ({
            vendorId: v.id,
            matchScore: 90 - i * 5,
            reason: `符合您的${projectType}需求，評分 ${v.rating} 星`
          }))
        };
      }

      // 組合推薦結果
      const recommendations = aiResponse.recommendations.map((rec: any) => {
        const vendor = allVendors.find(v => v.id === rec.vendorId);
        if (!vendor) return null;
        
        return {
          vendor: {
            id: vendor.id,
            name: vendor.name,
            avatarUrl: vendor.avatarUrl,
            region: vendor.region,
            serviceTypes: vendor.serviceTypes,
            categories: vendor.categories,
            rating: vendor.rating,
            priceRange: vendor.priceRange
          },
          matchScore: rec.matchScore,
          reason: rec.reason
        };
      }).filter(Boolean);

      return json({ 
        success: true, 
        error: null,
        recommendations 
      });
    } catch (error) {
      console.error('Failed to generate AI recommendations:', error);
      return json({ 
        success: false, 
        error: 'AI 推薦失敗，請稍後再試' 
      }, { status: 500 });
    }
  }

  if (intent === 'toggleFavorite') {
    try {
      const vendorId = formData.get('vendorId') as string;
      const isFavorite = formData.get('isFavorite') === 'true';

      if (!vendorId) {
        return json({ success: false, error: '缺少廠商 ID' }, { status: 400 });
      }

      // 更新收藏狀態
      await db.update(vendors)
        .set({ isFavorite: !isFavorite })
        .where(eq(vendors.id, vendorId));

      return json({ success: true, error: null });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return json({ 
        success: false, 
        error: '更新失敗，請稍後再試' 
      }, { status: 500 });
    }
  }

  return json({ success: false, error: 'Invalid intent' }, { status: 400 });
}

// Loader 函數從資料庫讀取廠商列表
export async function loader({ request }: LoaderFunctionArgs) {
  // 要求用戶必須登入
  const user = await requireUser(request);
  
  // 檢查用戶是否有廠商名錄權限
  requirePermission(user, '/vendors');
  
  try {
    console.log('[Vendors Loader] Starting to load vendors...');
    
    // 從資料庫讀取所有廠商
    const allVendors = await db.select().from(vendors);
    
    console.log(`[Vendors Loader] Loaded ${allVendors.length} vendors from database`);
    
    // 將資料庫 enum 值轉換為前端顯示用的中文
    const vendorsWithMapping = allVendors.map(vendor => {
      try {
        return {
          id: vendor.id,
          name: vendor.name || '',
          taxId: vendor.taxId || '',
          avatarUrl: vendor.avatarUrl || '',
          region: vendor.region === 'TAIWAN' ? '台灣' : vendor.region === 'CHINA' ? '大陸' : vendor.region,
          entityType: vendor.entityType || 'INDIVIDUAL',
          serviceTypes: Array.isArray(vendor.serviceTypes) ? vendor.serviceTypes : [],
          categories: Array.isArray(vendor.categories) ? vendor.categories : [],
          rating: vendor.rating ? parseFloat(String(vendor.rating)) : 0,
          ratingCount: vendor.ratingCount || 0,
          tags: Array.isArray(vendor.tags) ? vendor.tags : [],
          serviceScopes: Array.isArray(vendor.serviceScopes) ? vendor.serviceScopes : [],
          priceRange: vendor.priceRange || '$$',
          isBlacklisted: vendor.isBlacklisted || false,
          isFavorite: vendor.isFavorite || false,
          contacts: [], // TODO: 從 contact_windows 表讀取
        };
      } catch (mapError) {
        console.error('[Vendors Loader] Error mapping vendor:', vendor.id, mapError);
        return null;
      }
    }).filter(v => v !== null);
    
    console.log(`[Vendors Loader] Successfully mapped ${vendorsWithMapping.length} vendors`);
    
    return json({ vendors: vendorsWithMapping, isAdmin: user.role === 'ADMIN' });
  } catch (error) {
    console.error('[Vendors Loader] Fatal error:', error);
    console.error('[Vendors Loader] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    // 發生錯誤時返回空陣列，讓頁面至少能顯示
    return json({ vendors: [], isAdmin: user.role === 'ADMIN' });
  }
}


type ViewMode = 'grid' | 'card' | 'list';

function VendorDirectoryContent() {
  const [searchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const actionData = fetcher.data;
  const formRef = useRef<HTMLFormElement | null>(null);
  
  // 從 loader 讀取真實廠商資料
  const allVendors = loaderData.vendors as any[];
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>(searchParams.get('search') || ''); 
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [serviceScopeInput, setServiceScopeInput] = useState('');
  const [serviceScopes, setServiceScopes] = useState<string[]>([]);
  
  // AI 推薦功能狀態
  const [showAiRecommendModal, setShowAiRecommendModal] = useState(false);
  const [aiRecommendStep, setAiRecommendStep] = useState<'form' | 'result'>('form');
  const [aiRecommending, setAiRecommending] = useState(false);
  const [aiRecommendResults, setAiRecommendResults] = useState<any[]>([]);

  
  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); // 預設 20，會在 useEffect 中自動調整

  // 自動選擇最佳筆數（10/20/30）
  useEffect(() => {
    const calculateOptimalPageSize = () => {
      const screenHeight = window.innerHeight;
      const rowHeight = 60; // 每筆資料約 60px
      const headerHeight = 200; // 頂部導航和標題
      const paginationHeight = 80; // 底部分頁控制
      
      const availableHeight = screenHeight - headerHeight - paginationHeight;
      const optimalRows = Math.floor(availableHeight / rowHeight);
      
      // 對應到 10/20/30
      if (optimalRows >= 25) return 30;
      if (optimalRows >= 15) return 20;
      return 10;
    };
    
    setItemsPerPage(calculateOptimalPageSize());
    
    // 監聽視窗大小變化
    const handleResize = () => {
      setItemsPerPage(calculateOptimalPageSize());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 監聽 URL 變化
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) {
      if (Object.values(ServiceType).includes(q as ServiceType)) {
         setSelectedServiceType(q);
         setSearchTerm('');
      } else {
         setSearchTerm(q);
      }
    }
  }, [searchParams]);

  // 監聽表單提交成功後關閉 Modal
  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      // 處理新增廠商
      if ('vendorId' in actionData && actionData.vendorId) {
        setShowAddModal(false);
        setServiceScopeInput('');
        setServiceScopes([]);
        formRef.current?.reset();
      }
      // 處理 AI 推薦
      if ('recommendations' in actionData && actionData.recommendations) {
        setAiRecommendResults(actionData.recommendations as any[]);
        setAiRecommendStep('result');
        setAiRecommending(false);
      }
      // Remix 會自動重新驗證 loader，無需手動重新載入
    }
    // 處理錯誤
    if (!actionData.success && actionData.error) {
      setAiRecommending(false);
    }
  }, [actionData]);

  useEffect(() => {
    if (showAddModal) {
      setServiceScopeInput('');
      setServiceScopes([]);
    }
  }, [showAddModal]);

  const filteredVendors = useMemo(() => {
    return allVendors.filter(vendor => {
      const matchesSearch = vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (vendor.tags || []).some(t => t.includes(searchTerm));
      const matchesRegion = selectedRegion ? vendor.region === selectedRegion : true;
      const matchesService = selectedServiceType ? (vendor.serviceTypes || []).includes(selectedServiceType as ServiceType) : true;
      return matchesSearch && matchesRegion && matchesService;
    });
  }, [allVendors, searchTerm, selectedRegion, selectedServiceType]);

  // 分頁後的資料
  const paginatedVendors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVendors.slice(start, start + itemsPerPage);
  }, [filteredVendors, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);

  const favoriteFetcher = useFetcher();

  const handleToggleFavorite = (vendorId: string) => {
    const vendor = allVendors.find(v => v.id === vendorId);
    if (!vendor) return;

    const formData = new FormData();
    formData.append('intent', 'toggleFavorite');
    formData.append('vendorId', vendorId);
    formData.append('isFavorite', String(vendor.isFavorite));

    favoriteFetcher.submit(formData, { method: 'post' });
  };

  // 重置分頁當篩選條件變更
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRegion, selectedServiceType]);

  const addServiceScopeTokens = (value: string) => {
    const tokens = value
      .split(',')
      .map(token => token.trim())
      .filter(Boolean);

    if (tokens.length === 0) return;

    setServiceScopes(prev => {
      const existing = new Set(prev.map(scope => scope.toLowerCase()));
      const next = [...prev];
      tokens.forEach(token => {
        if (token.length > 20) return;
        const normalized = token.toLowerCase();
        if (existing.has(normalized)) return;
        existing.add(normalized);
        next.push(token);
      });
      return next;
    });
  };

  const handleServiceScopeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addServiceScopeTokens(serviceScopeInput);
      setServiceScopeInput('');
      return;
    }

    if (event.key === 'Backspace' && !serviceScopeInput && serviceScopes.length > 0) {
      setServiceScopes(prev => prev.slice(0, -1));
    }
  };

  const handleServiceScopeBlur = () => {
    if (!serviceScopeInput) return;
    addServiceScopeTokens(serviceScopeInput);
    setServiceScopeInput('');
  };

  return (
    <div className="flex flex-col h-screen space-y-6 animate-in fade-in duration-700">
      {/* 頂部標題與操作 */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 tracking-tight">全球協作廠商戰術名錄</h1>
           <p className="text-gray-500 text-sm mt-1">
             管理 {MOCK_VENDORS.length} 家兩岸三地合作夥伴 • <span className="font-bold text-slate-800">身分屬性識別系統</span> 運行中
           </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
           {/* 視角切換 */}
           <div className="bg-white p-1 rounded-xl border border-gray-200 flex items-center shadow-sm">
              <button 
                onClick={() => setViewMode('grid')} 
                className={clsx(
                  "p-2 rounded-lg transition", 
                  viewMode === 'grid' ? "bg-slate-900 text-white" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('card')} 
                className={clsx(
                  "p-2 rounded-lg transition", 
                  viewMode === 'card' ? "bg-slate-900 text-white" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <LayoutList size={18} />
              </button>
           </div>
           <button 
             onClick={() => setShowAiRecommendModal(true)}
             className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition font-bold flex items-center gap-2 shadow-md"
           >
             <Sparkles size={18} /> AI 智能推薦
           </button>
           <button 
             onClick={() => setShowAddModal(true)} 
             className="bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-900 transition font-bold flex items-center gap-2 shadow-md"
           >
             <Plus size={18} /> 新增廠商
           </button>
        </div>
      </div>

      {/* 搜尋與篩選 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-4">
           <div className="flex-1 relative group">
             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-slate-800 transition-colors" size={20} />
             <input
               type="text"
               placeholder="搜尋廠商名稱、標籤、系統 ID..."
               className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium text-slate-700"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="flex flex-wrap gap-2">
             {/* 身分屬性篩選 */}
             <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 border border-slate-100">
               <Info size={16} className="text-slate-400" />
               <select 
                 className="py-3.5 bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
                 value={selectedServiceType}
                 onChange={(e) => setSelectedServiceType(e.target.value)}
               >
                 <option value="">所有身分屬性</option>
                 <option value={ServiceType.LABOR}>🛠️ 提供勞務</option>
                 <option value={ServiceType.PRODUCT}>📦 提供商品</option>
                 <option value={ServiceType.MANUFACTURING}>🏭 製造商品</option>
               </select>
             </div>
             
             {/* 地區篩選 */}
             <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 border border-slate-100">
               <Globe size={16} className="text-slate-400" />
               <select 
                 className="py-3.5 bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
                 value={selectedRegion}
                 onChange={(e) => setSelectedRegion(e.target.value)}
               >
                 <option value="">所有地區廠商</option>
                 <option value={Region.TAIWAN}>🇹🇼 台灣地區</option>
                 <option value={Region.CHINA}>🇨🇳 大陸地區</option>
               </select>
             </div>
           </div>
        </div>
      </div>

      {/* 廠商列表 - 卡片視圖 */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedVendors.map(vendor => (
              <div key={vendor.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 hover:shadow-2xl hover:shadow-slate-200 transition-all group relative h-full flex flex-col overflow-hidden">
                <div className="absolute top-4 right-4 flex gap-1">
                   <button 
                     onClick={(e) => { e.preventDefault(); handleToggleFavorite(vendor.id); }} 
                     className={clsx(
                       "p-2 rounded-full transition bg-white/80 backdrop-blur", 
                       vendor.isFavorite ? "text-red-500 shadow-inner" : "text-gray-300 hover:text-red-300 shadow-sm"
                     )}
                   >
                     <Heart size={20} className={clsx(vendor.isFavorite && "fill-current")} />
                   </button>
                </div>

                <Link to={`/vendors/${vendor.id}`} className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <img src={vendor.avatarUrl} className="w-16 h-16 rounded-[1.5rem] object-cover border-2 border-white shadow-md transition group-hover:scale-105" />
                      <div className={clsx(
                        "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm text-[10px] font-black",
                        vendor.region === Region.TAIWAN ? "bg-blue-500 text-white" : "bg-red-500 text-white"
                      )}>
                        {vendor.region === Region.TAIWAN ? "T" : "C"}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-gray-800 line-clamp-1 group-hover:text-blue-600 transition tracking-tight">{vendor.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 uppercase font-black tracking-widest">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">{vendor.id}</span>
                        <span className="flex items-center gap-1"><MapPin size={10}/> {vendor.region}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {vendor.serviceTypes.map(st => (
                      <div key={st} className={clsx(
                        "flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border shadow-sm",
                        st === ServiceType.LABOR ? "bg-blue-50 text-blue-700 border-blue-100" : 
                        st === ServiceType.PRODUCT ? "bg-orange-50 text-orange-700 border-orange-100" : 
                        "bg-indigo-50 text-indigo-700 border-indigo-100"
                      )}>
                        {st === ServiceType.LABOR ? <Hammer size={12}/> : st === ServiceType.PRODUCT ? <Package size={12}/> : <Factory size={12}/>}
                        {st}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block mb-1 font-bold uppercase tracking-tighter">主營類別</span>
                      <span className="font-black text-slate-700">{vendor.categories[0]}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block mb-1 font-bold uppercase tracking-tighter">好評等級</span>
                      <div className="flex items-center justify-end gap-1 font-black text-yellow-600">
                         {vendor.rating} <Star size={12} fill="currentColor"/>
                      </div>
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
                   </div>
                   <Link to={`/vendors/${vendor.id}`} className="text-xs font-black text-slate-900 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-900 hover:text-white transition flex items-center gap-2 uppercase tracking-widest">
                      Detail <ArrowRight size={14} />
                   </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 列表視圖 */}
        {viewMode === 'grid' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4 text-left">廠商資訊</th>
                  <th className="px-6 py-4 text-left">身分屬性</th>
                  <th className="px-6 py-4 text-left">地區</th>
                  <th className="px-6 py-4 text-left">主營類別</th>
                  <th className="px-6 py-4 text-center">評分</th>
                  <th className="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={vendor.avatarUrl} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <div className="font-bold text-slate-800">{vendor.name}</div>
                          <div className="text-xs text-slate-400">{vendor.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {vendor.serviceTypes.map(st => (
                          <span key={st} className={clsx(
                            "text-[9px] font-black px-2 py-1 rounded-lg",
                            st === ServiceType.LABOR ? "bg-blue-50 text-blue-600" : 
                            st === ServiceType.PRODUCT ? "bg-orange-50 text-orange-600" : 
                            "bg-indigo-50 text-indigo-600"
                          )}>
                            {st}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "text-xs font-bold px-2 py-1 rounded-lg",
                        vendor.region === Region.TAIWAN ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                      )}>
                        {vendor.region === Region.TAIWAN ? "🇹🇼 台灣" : "🇨🇳 大陸"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{vendor.categories[0]}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-yellow-600 font-bold">
                        {vendor.rating} <Star size={14} fill="currentColor"/>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/vendors/${vendor.id}`} 
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        查看詳情 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 分頁控制 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredVendors.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemsPerPageOptions={[10, 20, 30]}
      />

      {/* 新增廠商 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-white rounded-2xl">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">新增協力廠商</h3>
                  <p className="text-sm text-slate-400">填寫基本資料建立新的合作夥伴檔案</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-3 text-slate-300 hover:text-slate-800 hover:bg-slate-100 rounded-full transition"
              >
                <X size={28} />
              </button>
            </div>

            {/* Modal Body */}
            <fetcher.Form ref={formRef} method="post" className="flex-1 overflow-y-auto p-8 space-y-8">
              <input type="hidden" name="intent" value="createVendor" />
              
              {/* 顯示錯誤訊息 */}
              {actionData && !actionData.success && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-bold">
                  {actionData.error}
                </div>
              )}
              
              {/* 顯示成功訊息 */}
              {actionData && actionData.success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm font-bold">
                  廠商建立成功！
                </div>
              )}
              
              <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">廠商名稱 *</label>
                  <input 
                    type="text"
                    name="name"
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" 
                    placeholder="輸入公司或個人名稱..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">統一編號 / 身分證</label>
                  <input 
                    type="text"
                    name="taxId"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" 
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">地區 *</label>
                  <input 
                    type="text"
                    name="region"
                    list="region-list"
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    placeholder="請選擇地區..."
                  />
                  <datalist id="region-list">
                    <option value={Region.TAIWAN}>🇹🇼 台灣地區</option>
                    <option value={Region.CHINA}>🇨🇳 大陸地區</option>
                  </datalist>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">主營類別 *</label>
                  <input 
                    type="text"
                    name="category"
                    list="category-list"
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    placeholder="請選擇類別..."
                  />
                  <datalist id="category-list">
                    {Object.entries(CATEGORY_GROUPS).map(([group, categories]) => (
                      categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                    ))}
                  </datalist>
                </div>
              </div>

              {/* 身分屬性 */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">身分屬性 (可複選) *</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: ServiceType.LABOR, label: '🛠️ 提供勞務', color: 'blue' },
                    { value: ServiceType.PRODUCT, label: '📦 提供商品', color: 'orange' },
                    { value: ServiceType.MANUFACTURING, label: '🏭 製造商品', color: 'indigo' }
                  ].map(item => (
                    <label key={item.value} className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-300 transition-all">
                      <input type="checkbox" name="serviceType" value={item.value} className="w-4 h-4 rounded text-indigo-600" />
                      <span className="text-sm font-bold text-slate-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 聯絡資訊 */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Phone size={16} /> 主要聯絡人
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">姓名</label>
                    <input 
                      type="text"
                      name="contactName"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                      placeholder="聯絡人姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">電話</label>
                    <input 
                      type="tel"
                      name="contactPhone"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                      placeholder="0912-345-678"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                    <input 
                      type="email"
                      name="contactEmail"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">公司/聯絡地址</label>
                    <textarea
                      name="contactAddress"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all h-20 resize-none"
                      placeholder="例如：桃園市○○區○○路○○號（可填公司地址或聯絡地址）"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">服務範圍</label>
                    <input
                      type="text"
                      value={serviceScopeInput}
                      onChange={event => setServiceScopeInput(event.target.value)}
                      onKeyDown={handleServiceScopeKeyDown}
                      onBlur={handleServiceScopeBlur}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      placeholder="輸入服務範圍後按 Enter 或逗號"
                    />
                    {serviceScopes.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {serviceScopes.map(scope => (
                          <span
                            key={scope}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold"
                          >
                            {scope}
                            <button
                              type="button"
                              onClick={() =>
                                setServiceScopes(prev => prev.filter(item => item !== scope))
                              }
                              className="text-indigo-400 hover:text-indigo-700"
                              aria-label={`移除 ${scope}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {serviceScopes.map(scope => (
                      <input key={`${scope}-hidden`} type="hidden" name="serviceScopes" value={scope} />
                    ))}
                  </div>
                </div>
              </div>

              {/* 備註 */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">備註說明</label>
                <textarea
                  name="notes"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all h-24 resize-none" 
                  placeholder="其他補充說明..."
                />
              </div>
            </div>
              
              {/* Modal Footer */}
              <div className="p-8 border-t border-slate-100 flex gap-4 shrink-0">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)} 
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  disabled={isSubmitting}
                >
                  取消
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span> 建立中...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> 建立廠商檔案
                    </>
                  )}
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      )}

      {/* AI 智能推薦 Modal */}
      {showAiRecommendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">AI 智能推薦廠商</h3>
                  <p className="text-sm text-slate-400">告訴我您的需求，AI 將為您推薦最適合的廠商</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAiRecommendModal(false);
                  setAiRecommendStep('form');
                  setAiRecommendResults([]);
                }} 
                className="p-3 text-slate-300 hover:text-slate-800 hover:bg-slate-100 rounded-full transition"
              >
                <X size={28} />
              </button>
            </div>

            {/* Modal Body */}
            {aiRecommendStep === 'form' ? (
              <fetcher.Form 
                method="post" 
                className="flex-1 overflow-y-auto p-8 space-y-6"
                onSubmit={() => setAiRecommending(true)}
              >
                <input type="hidden" name="intent" value="aiRecommend" />
                
                {/* 專案類型 */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">專案類型 *</label>
                  <input 
                    type="text"
                    name="projectType"
                    list="project-type-list"
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    placeholder="例如：辦公室裝修、設備維修、製造外包..."
                  />
                  <datalist id="project-type-list">
                    <option value="辦公室裝修" />
                    <option value="設備維修" />
                    <option value="製造外包" />
                    <option value="系統整合" />
                    <option value="工程施工" />
                  </datalist>
                </div>

                {/* 預算範圍 */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">預算範圍</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">最低預算（元）</label>
                      <input 
                        type="number"
                        name="budgetMin"
                        min="0"
                        step="1000"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">最高預算（元）</label>
                      <input 
                        type="number"
                        name="budgetMax"
                        min="0"
                        step="1000"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                        placeholder="不限"
                      />
                    </div>
                  </div>
                </div>

                {/* 地區偏好 */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">地區偏好</label>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-300 transition-all">
                      <input type="checkbox" name="regionPreference" value="TAIWAN" className="w-4 h-4 rounded text-indigo-600" />
                      <span className="text-sm font-bold text-slate-700">🇹🇼 台灣</span>
                    </label>
                    <label className="flex-1 flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-300 transition-all">
                      <input type="checkbox" name="regionPreference" value="CHINA" className="w-4 h-4 rounded text-indigo-600" />
                      <span className="text-sm font-bold text-slate-700">🇨🇳 大陸</span>
                    </label>
                    <label className="flex-1 flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-300 transition-all">
                      <input type="checkbox" name="regionPreference" value="ALL" className="w-4 h-4 rounded text-indigo-600" defaultChecked />
                      <span className="text-sm font-bold text-slate-700">不限</span>
                    </label>
                  </div>
                </div>

                {/* 身分屬性偏好 */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">身分屬性偏好</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: ServiceType.LABOR, label: '🛠️ 提供勞務' },
                      { value: ServiceType.PRODUCT, label: '📦 提供商品' },
                      { value: ServiceType.MANUFACTURING, label: '🏭 製造商品' }
                    ].map(item => (
                      <label key={item.value} className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-300 transition-all">
                        <input type="checkbox" name="serviceTypePreference" value={item.value} className="w-4 h-4 rounded text-indigo-600" />
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 其他需求 */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">其他需求（選填）</label>
                  <textarea
                    name="requirements"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all h-24 resize-none" 
                    placeholder="例如：需要有 ISO 認證、希望能在週末施工、需要提供保固..."
                  />
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-slate-100 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAiRecommendModal(false);
                      setAiRecommendStep('form');
                    }} 
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                    disabled={aiRecommending}
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    disabled={aiRecommending}
                    className="flex-1 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold rounded-2xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiRecommending ? (
                      <>
                        <span className="animate-spin">⏳</span> AI 分析中...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} /> 開始推薦
                      </>
                    )}
                  </button>
                </div>
              </fetcher.Form>
            ) : (
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="text-center py-4">
                  <div className="text-lg font-bold text-slate-800 mb-2">🎯 AI 為您推薦以下廠商</div>
                  <p className="text-sm text-slate-500">根據您的需求條件，我們找到了 {aiRecommendResults.length} 家適合的廠商</p>
                </div>

                {aiRecommendResults.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
                    <p>沒有找到符合條件的廠商</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiRecommendResults.map((result: any, index: number) => (
                      <div key={index} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-indigo-200 transition-all">
                        <div className="flex items-start gap-4">
                          <img src={result.vendor.avatarUrl} className="w-16 h-16 rounded-xl object-cover" />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-black text-slate-800">{result.vendor.name}</h4>
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                                匹配度 {result.matchScore}%
                              </span>
                              <div className="flex items-center gap-1 text-yellow-600">
                                {result.vendor.rating} <Star size={14} fill="currentColor"/>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{result.reason}</p>
                            <div className="flex flex-wrap gap-2">
                              {result.vendor.serviceTypes.map((st: string) => (
                                <span key={st} className="text-xs font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-600">
                                  {st}
                                </span>
                              ))}
                            </div>
                          </div>
                          <Link 
                            to={`/vendors/${result.vendor.id}`}
                            className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-all"
                          >
                            查看詳情
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 結果 Footer */}
                <div className="pt-4 border-t border-slate-100 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setAiRecommendStep('form')} 
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    重新推薦
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAiRecommendModal(false);
                      setAiRecommendStep('form');
                      setAiRecommendResults([]);
                    }} 
                    className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all"
                  >
                    關閉
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorsPage() {
  return (
    <ClientOnly fallback={<div className="p-8 text-center text-slate-400">載入中...</div>}>
      <VendorDirectoryContent />
    </ClientOnly>
  );
}
