import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, Form } from "@remix-run/react";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Search, Filter, Plus, MapPin, ChevronRight, ChevronLeft, 
  History, X, Camera, Upload, CheckCircle2, Save, Maximize2, Tag, MessageSquare,
  Check, AlertCircle, Clock, Wrench
} from "lucide-react";
import { clsx } from "clsx";
import type { MaintenanceRecord, MediaItem } from "../types";
import { MaintenanceStatus } from "../types";
import { ImageLightbox } from "../components/ImageLightbox";
import { db, maintenanceRecords, vendors } from "../../db";
import { desc } from "drizzle-orm";

export const meta: MetaFunction = () => {
  return [
    { title: "設備維修紀錄 - PartnerLink Pro" },
    { name: "description", content: "追蹤設備維修進度與歷史紀錄" },
  ];
};

// 常見產品標籤
const PRODUCT_TAG_OPTIONS = ['空調', '電力', '水路', '裝修', '家具', '網路', '安控', '結構', '玻璃'];

// Loader: 從資料庫讀取維修記錄
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const records = await db.select().from(maintenanceRecords).orderBy(desc(maintenanceRecords.createdAt));
    return json({ records, error: null });
  } catch (error) {
    console.error('Failed to load maintenance records:', error);
    return json({ records: [], error: 'Failed to load records' });
  }
}

// Action: 處理新增維修記錄
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'create') {
    try {
      const deviceName = formData.get('deviceName') as string;
      const deviceNo = formData.get('deviceNo') as string;
      const description = formData.get('description') as string;
      const productTags = formData.get('productTags') as string;
      const vendorName = formData.get('vendorName') as string || '待指派';
      const beforePhotosJson = formData.get('beforePhotos') as string;
      
      // 驗證必填欄位
      if (!deviceName || !deviceNo || !description) {
        return json({ 
          success: false, 
          error: '請填寫所有必填欄位' 
        }, { status: 400 });
      }

      // 生成案件編號
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 7).replace('-', '');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const caseId = `CASE-${dateStr}-${randomNum}`;

      // 解析產品標籤
      const tagsArray = productTags ? productTags.split(',').filter(Boolean) : [];

      // 解析照片數據
      let beforePhotos: any[] = [];
      try {
        if (beforePhotosJson) {
          const parsed = JSON.parse(beforePhotosJson);
          beforePhotos = parsed.map((photo: any, index: number) => ({
            id: `photo-${Date.now()}-${index}`,
            url: photo.url,
            description: photo.description || `施工前 ${index + 1}`,
            type: 'image' as const,
            uploadedAt: new Date().toISOString(),
          }));
        }
      } catch (error) {
        console.error('Failed to parse beforePhotos:', error);
      }

      // 查詢或創建測試廠商（階段 A 暫時使用）
      let firstVendor = await db.select().from(vendors).limit(1);
      
      if (firstVendor.length === 0) {
        // 創建測試廠商
        const [newVendor] = await db.insert(vendors).values({
          name: vendorName || '測試廠商',
          taxId: '00000000',
          avatarUrl: 'https://via.placeholder.com/150',
          region: 'TAIWAN',
          entityType: 'COMPANY',
          serviceTypes: ['LABOR'],
          categories: ['HVAC'],
          priceRange: '$$',
          address: '測試地址',
          rating: '5.0',
          createdBy: '00000000-0000-0000-0000-000000000000',
        }).returning();
        firstVendor = [newVendor];
      }
      
      const defaultVendorId = firstVendor[0].id;

      // 插入資料庫（階段 B：含 base64 照片）
      await db.insert(maintenanceRecords).values({
        caseId,
        date: now,
        deviceName,
        deviceNo,
        vendorName,
        vendorId: defaultVendorId,
        status: 'PENDING',
        description,
        productTags: tagsArray,
        beforePhotos: beforePhotos,
        afterPhotos: [],
        createdBy: defaultVendorId, // TODO: 從 session 取得使用者 ID
      });

      return json({ success: true, error: null });
    } catch (error) {
      console.error('Failed to create maintenance record:', error);
      return json({ 
        success: false, 
        error: '新增失敗，請稍後再試' 
      }, { status: 500 });
    }
  }

  return json({ success: false, error: 'Invalid intent' }, { status: 400 });
}

// 狀態顏色對應
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  'PENDING': { label: '待處理', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: <Clock className="w-4 h-4" /> },
  'IN_PROGRESS': { label: '進行中', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: <Wrench className="w-4 h-4" /> },
  'COMPLETED': { label: '已完成', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: <CheckCircle2 className="w-4 h-4" /> },
  'ARCHIVED': { label: '已歸檔', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: <X className="w-4 h-4" /> },
};

export default function MaintenancePage() {
  const { records, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductTags, setSelectedProductTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    deviceName: '',
    deviceNo: '',
    description: '',
    vendorName: '',
    productTags: [] as string[],
    beforePhotos: [] as { url: string; description?: string }[],
  });
  
  // 相簿燈箱狀態
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [activePhotoType, setActivePhotoType] = useState<'before' | 'after'>('before');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // 當提交成功後關閉 modal 並重置表單
  useEffect(() => {
    if (actionData?.success) {
      setIsFormModalOpen(false);
      setFormData({
        deviceName: '',
        deviceNo: '',
        description: '',
        vendorName: '',
        productTags: [],
      });
    }
  }, [actionData]);

  // Filtering
  const filteredRecords = useMemo(() => {
    return records.filter((r: MaintenanceRecord) => {
      const matchesSearch = 
        r.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.deviceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.caseId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTags = selectedProductTags.length === 0 || 
        selectedProductTags.some(tag => r.productTags?.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [records, searchTerm, selectedProductTags]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPageDropdownOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 相簿功能
  const openGallery = (index: number, type: 'before' | 'after') => {
    setActivePhotoIndex(index);
    setActivePhotoType(type);
  };

  const handlePrevPhoto = () => {
    if (activePhotoIndex !== null && activePhotoIndex > 0) {
      setActivePhotoIndex(activePhotoIndex - 1);
    }
  };

  const handleNextPhoto = () => {
    if (activePhotoIndex !== null && activePhotos.length > 0 && activePhotoIndex < activePhotos.length - 1) {
      setActivePhotoIndex(activePhotoIndex + 1);
    }
  };

  const handleSelectPhoto = (index: number) => {
    setActivePhotoIndex(index);
  };

  const activePhotos = useMemo(() => {
    if (!selectedRecord) return [];
    return activePhotoType === 'before' ? selectedRecord.beforePhotos : selectedRecord.afterPhotos;
  }, [selectedRecord, activePhotoType]);

  // 產品標籤切換
  const toggleProductTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      productTags: prev.productTags.includes(tag)
        ? prev.productTags.filter(t => t !== tag)
        : [...prev.productTags, tag]
    }));
  };

  // 處理照片上傳
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: { url: string; description?: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      // 轉換為 base64
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = (event) => {
          if (event.target?.result) {
            newPhotos.push({
              url: event.target.result as string,
              description: file.name
            });
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    setFormData(prev => ({
      ...prev,
      beforePhotos: [...prev.beforePhotos, ...newPhotos]
    }));
  };

  // 刪除照片
  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      beforePhotos: prev.beforePhotos.filter((_, i) => i !== index)
    }));
  };

  // 統計數據
  const stats = useMemo(() => {
    const total = records.length;
    const pending = records.filter((r: MaintenanceRecord) => r.status === MaintenanceStatus.PENDING).length;
    const inProgress = records.filter((r: MaintenanceRecord) => r.status === MaintenanceStatus.IN_PROGRESS).length;
    const completed = records.filter((r: MaintenanceRecord) => r.status === MaintenanceStatus.COMPLETED).length;
    return { total, pending, inProgress, completed };
  }, [records]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">設備維修紀錄</h1>
                <p className="text-xs text-slate-500">追蹤設備維修進度與歷史紀錄</p>
              </div>
            </div>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              新增維修單
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <History className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">總維修量</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                <p className="text-xs text-slate-500">待處理</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                <p className="text-xs text-slate-500">進行中</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
                <p className="text-xs text-slate-500">已完成</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜尋設備名稱、編號、廠商..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Tag className="w-4 h-4 text-slate-600" />
                產品標籤
              </button>
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50">
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_TAG_OPTIONS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedProductTags(prev =>
                            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                          );
                        }}
                        className={clsx(
                          "px-3 py-1.5 rounded-full text-sm transition-colors",
                          selectedProductTags.includes(tag)
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">案件編號</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">設備名稱</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">廠商</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">產品標籤</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">狀態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">維修日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">照片</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      {error ? (
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="w-8 h-8 text-red-500" />
                          <p>{error}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Wrench className="w-8 h-8 text-slate-300" />
                          <p>尚無維修記錄</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record: MaintenanceRecord) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{record.caseId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{record.deviceName}</p>
                          <p className="text-xs text-slate-500">{record.deviceNo}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{record.vendorName}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {record.productTags?.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                          {record.productTags && record.productTags.length > 2 && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                              +{record.productTags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={clsx(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                          statusConfig[record.status].bgColor,
                          statusConfig[record.status].color
                        )}>
                          {statusConfig[record.status].icon}
                          {statusConfig[record.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(record.date).toLocaleDateString('zh-TW')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            施工前 ({Array.isArray(record.beforePhotos) ? record.beforePhotos.length : 0})
                          </span>
                          <span className="text-xs text-slate-500">
                            施工後 ({Array.isArray(record.afterPhotos) ? record.afterPhotos.length : 0})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          查看詳情
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                每頁 
                <div className="relative inline-block ml-2" ref={dropdownRef}>
                  <button
                    onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
                    className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    {itemsPerPage}
                  </button>
                  {isPageDropdownOpen && (
                    <div className="absolute bottom-full mb-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                      {[10, 20, 50].map(num => (
                        <button
                          key={num}
                          onClick={() => {
                            setItemsPerPage(num);
                            setIsPageDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className="block w-full px-4 py-2 text-left hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                 筆 | 共 {filteredRecords.length} 筆記錄
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedRecord.deviceName}</h2>
                <p className="text-sm text-gray-500">{selectedRecord.caseId}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">狀態</p>
                  <span className={clsx(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                    statusConfig[selectedRecord.status].bgColor,
                    statusConfig[selectedRecord.status].color
                  )}>
                    {statusConfig[selectedRecord.status].icon}
                    {statusConfig[selectedRecord.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">負責廠商</p>
                  <p className="text-sm font-medium text-gray-900">{selectedRecord.vendorName}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">問題描述</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedRecord.description}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">產品標籤</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRecord.productTags?.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 施工前照片 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-700">
                    施工前照片 ({Array.isArray(selectedRecord.beforePhotos) ? selectedRecord.beforePhotos.length : 0})
                  </p>
                </div>
                {Array.isArray(selectedRecord.beforePhotos) && selectedRecord.beforePhotos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedRecord.beforePhotos.slice(0, 3).map((photo: MediaItem, idx: number) => (
                      <button
                        key={photo.id}
                        onClick={() => openGallery(idx, 'before')}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-500 transition-colors group"
                      >
                        <img
                          src={photo.url}
                          alt={photo.description || `施工前 ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">尚無照片</p>
                )}
              </div>

              {/* 施工後照片 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-medium text-gray-700">
                    施工後照片 ({Array.isArray(selectedRecord.afterPhotos) ? selectedRecord.afterPhotos.length : 0})
                  </p>
                </div>
                {Array.isArray(selectedRecord.afterPhotos) && selectedRecord.afterPhotos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedRecord.afterPhotos.slice(0, 3).map((photo: MediaItem, idx: number) => (
                      <button
                        key={photo.id}
                        onClick={() => openGallery(idx, 'after')}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-500 transition-colors group"
                      >
                        <img
                          src={photo.url}
                          alt={photo.description || `施工後 ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">尚無照片</p>
                )}
              </div>

              {selectedRecord.aiReport && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">AI 分析報告</p>
                      <p className="text-sm text-blue-700 leading-relaxed">{selectedRecord.aiReport}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ImageLightbox */}
      {activePhotoIndex !== null && selectedRecord && (
        <ImageLightbox
          photos={activePhotos}
          activeIndex={activePhotoIndex}
          title={`${activePhotoType === 'before' ? '施工前' : '施工後'}照片`}
          onClose={() => setActivePhotoIndex(null)}
          onPrev={handlePrevPhoto}
          onNext={handleNextPhoto}
          onSelect={handleSelectPhoto}
          onUpload={(file) => {
            // TODO: 階段 B 實作上傳功能
            console.log('Upload file:', file);
          }}
        />
      )}

      {/* Add Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">新增維修單</h2>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <Form method="post" className="p-6 space-y-4">
              <input type="hidden" name="intent" value="create" />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">設備名稱 *</label>
                <input
                  type="text"
                  name="deviceName"
                  value={formData.deviceName}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="輸入設備名稱"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">設備編號 *</label>
                <input
                  type="text"
                  name="deviceNo"
                  value={formData.deviceNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceNo: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="輸入設備編號"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">問題描述 *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                  placeholder="描述問題..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">產品標籤</label>
                <input type="hidden" name="productTags" value={formData.productTags.join(',')} />
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_TAG_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleProductTag(tag)}
                      className={clsx(
                        "px-3 py-1.5 rounded-full text-sm transition-colors",
                        formData.productTags.includes(tag)
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">施工前照片</label>
                <input
                  type="hidden"
                  name="beforePhotos"
                  value={JSON.stringify(formData.beforePhotos)}
                />
                <div className="space-y-3">
                  {/* 上傳按鈕 */}
                  <label className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors block">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">點擊或拖曳上傳照片</p>
                    <p className="text-xs text-gray-400 mt-1">支援多張照片上傳</p>
                  </label>

                  {/* 照片預覽 */}
                  {formData.beforePhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {formData.beforePhotos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                          <img
                            src={photo.url}
                            alt={photo.description || `照片 ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {actionData?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700">{actionData.error}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? '儲存中...' : '儲存'}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
