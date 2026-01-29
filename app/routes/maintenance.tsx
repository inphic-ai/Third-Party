import { json, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Search, Filter, Plus, MapPin, ChevronRight, ChevronLeft, 
  History, X, Camera, Upload, CheckCircle2, Save, Maximize2, Tag, MessageSquare,
  Check, AlertCircle, Clock, Wrench
} from "lucide-react";
import { clsx } from "clsx";
import { MOCK_MAINTENANCE } from "../constants";
import type { MaintenanceRecord, MediaItem } from "../types";
import { MaintenanceStatus } from "../types";
import { ImageLightbox } from "../components/ImageLightbox";

export const meta: MetaFunction = () => {
  return [
    { title: "設備維修紀錄 - PartnerLink Pro" },
    { name: "description", content: "追蹤設備維修進度與歷史紀錄" },
  ];
};

// 常見產品標籤
const PRODUCT_TAG_OPTIONS = ['空調', '電力', '水路', '裝修', '家具', '網路', '安控', '結構', '玻璃'];

// Loader: 使用 Mock 資料
export async function loader() {
  return json({ records: MOCK_MAINTENANCE });
}

// 狀態顏色對應
const statusConfig: Record<MaintenanceStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  [MaintenanceStatus.PENDING]: { label: '待處理', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: <Clock className="w-4 h-4" /> },
  [MaintenanceStatus.IN_PROGRESS]: { label: '進行中', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: <Wrench className="w-4 h-4" /> },
  [MaintenanceStatus.COMPLETED]: { label: '已完成', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: <CheckCircle2 className="w-4 h-4" /> },
  [MaintenanceStatus.ARCHIVED]: { label: '已歸檔', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: <X className="w-4 h-4" /> },
};

export default function MaintenancePage() {
  const { records } = useLoaderData<typeof loader>();
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductTags, setSelectedProductTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  
  // 相簿燈箱狀態
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [activePhotoType, setActivePhotoType] = useState<'before' | 'after'>('before');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

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

  const closeGallery = () => {
    setActivePhotoIndex(null);
  };

  const activePhotos = useMemo(() => {
    if (!selectedRecord) return [];
    return activePhotoType === 'before' ? selectedRecord.beforePhotos : selectedRecord.afterPhotos;
  }, [selectedRecord, activePhotoType]);

  const handleNextPhoto = () => {
    if (activePhotoIndex !== null && activePhotoIndex < activePhotos.length - 1) {
      setActivePhotoIndex(activePhotoIndex + 1);
    }
  };

  const handlePrevPhoto = () => {
    if (activePhotoIndex !== null && activePhotoIndex > 0) {
      setActivePhotoIndex(activePhotoIndex - 1);
    }
  };

  // 統計卡片資料
  const stats = useMemo(() => {
    const pending = records.filter((r: MaintenanceRecord) => r.status === MaintenanceStatus.PENDING).length;
    const inProgress = records.filter((r: MaintenanceRecord) => r.status === MaintenanceStatus.IN_PROGRESS).length;
    const completed = records.filter((r: MaintenanceRecord) => r.status === MaintenanceStatus.COMPLETED).length;
    return { pending, inProgress, completed, total: records.length };
  }, [records]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <History className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">設備維修紀錄</h1>
            <p className="text-sm text-gray-500">追蹤維修進度與歷史紀錄</p>
          </div>
        </div>
        <button 
          onClick={() => setIsFormModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增維修單
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">總維修單</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">待處理</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-sm text-gray-500">進行中</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
              <p className="text-sm text-gray-500">已完成</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋設備名稱、編號、廠商..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        
        {/* 產品標籤篩選 */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors",
              selectedProductTags.length > 0 
                ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                : "border-gray-200 hover:bg-gray-50"
            )}
          >
            <Tag className="w-4 h-4" />
            產品標籤
            {selectedProductTags.length > 0 && (
              <span className="bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {selectedProductTags.length}
              </span>
            )}
          </button>
          
          {isFilterOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-20">
              <p className="text-sm font-medium text-gray-700 mb-3">選擇產品標籤</p>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_TAG_OPTIONS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedProductTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                    className={clsx(
                      "px-3 py-1.5 rounded-full text-sm transition-colors",
                      selectedProductTags.includes(tag)
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {selectedProductTags.length > 0 && (
                <button
                  onClick={() => setSelectedProductTags([])}
                  className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                >
                  清除全部
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">案件編號</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">設備名稱</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">廠商</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">產品標籤</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">狀態</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">報修日期</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">照片</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedRecords.map((record: MaintenanceRecord) => {
              const status = statusConfig[record.status];
              return (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-gray-600">{record.caseId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{record.deviceName}</p>
                      <p className="text-xs text-gray-500">{record.deviceNo}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">{record.vendorName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {record.productTags?.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                      {record.productTags && record.productTags.length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                          +{record.productTags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", status.bgColor, status.color)}>
                      {status.icon}
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{record.date}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {record.beforePhotos && record.beforePhotos.length > 0 && (
                        <span className="text-xs text-gray-500">
                          施工前 {record.beforePhotos.length}
                        </span>
                      )}
                      {record.afterPhotos && record.afterPhotos.length > 0 && (
                        <span className="text-xs text-emerald-600">
                          施工後 {record.afterPhotos.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      查看詳情
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2" ref={dropdownRef}>
            <span className="text-sm text-gray-500">每頁</span>
            <div className="relative">
              <button
                onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50"
              >
                {itemsPerPage}
                <ChevronRight className={clsx("w-4 h-4 transition-transform", isPageDropdownOpen && "rotate-90")} />
              </button>
              {isPageDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                  {[10, 25, 50].map(num => (
                    <button
                      key={num}
                      onClick={() => {
                        setItemsPerPage(num);
                        setCurrentPage(1);
                        setIsPageDropdownOpen(false);
                      }}
                      className={clsx(
                        "w-full px-4 py-2 text-left text-sm hover:bg-gray-50",
                        itemsPerPage === num && "bg-emerald-50 text-emerald-600"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500">共 {filteredRecords.length} 筆紀錄</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedRecord.deviceName}</h2>
                  <p className="text-sm text-gray-500">{selectedRecord.caseId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status & Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">狀態</p>
                  <span className={clsx(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                    statusConfig[selectedRecord.status].bgColor,
                    statusConfig[selectedRecord.status].color
                  )}>
                    {statusConfig[selectedRecord.status].icon}
                    {statusConfig[selectedRecord.status].label}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">負責廠商</p>
                  <p className="font-medium text-gray-900">{selectedRecord.vendorName}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">問題描述</h3>
                <p className="text-gray-600 bg-gray-50 rounded-xl p-4">{selectedRecord.description}</p>
              </div>

              {/* Product Tags */}
              {selectedRecord.productTags && selectedRecord.productTags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">產品標籤</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecord.productTags.map(tag => (
                      <span key={tag} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              <div className="grid grid-cols-2 gap-6">
                {/* Before Photos */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    施工前照片 ({selectedRecord.beforePhotos?.length || 0})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRecord.beforePhotos?.map((photo, idx) => (
                      <button
                        key={idx}
                        onClick={() => openGallery(idx, 'before')}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <img src={photo.url} alt={photo.caption || '施工前'} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {(!selectedRecord.beforePhotos || selectedRecord.beforePhotos.length === 0) && (
                      <div className="col-span-3 aspect-video bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>

                {/* After Photos */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    施工後照片 ({selectedRecord.afterPhotos?.length || 0})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRecord.afterPhotos?.map((photo, idx) => (
                      <button
                        key={idx}
                        onClick={() => openGallery(idx, 'after')}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <img src={photo.url} alt={photo.caption || '施工後'} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {(!selectedRecord.afterPhotos || selectedRecord.afterPhotos.length === 0) && (
                      <div className="col-span-3 aspect-video bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {activePhotoIndex !== null && activePhotos.length > 0 && (
        <ImageLightbox
          photos={activePhotos}
          activeIndex={activePhotoIndex}
          title={activePhotoType === 'before' ? '施工前照片' : '施工後照片'}
          onClose={closeGallery}
          onPrev={handlePrevPhoto}
          onNext={handleNextPhoto}
          onSelect={setActivePhotoIndex}
          onUpload={(file) => {
            if (!selectedRecord) return;
            
            // 讀取檔案並轉換為 Data URL
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              
              // 創建新的 MediaItem
              const newPhoto = {
                id: `uploaded-${Date.now()}`,
                url: dataUrl,
                type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
                description: file.name
              };
              
              // 根據 activePhotoType 更新對應的照片陣列
              const updatedRecord = {
                ...selectedRecord,
                beforePhotos: activePhotoType === 'before' 
                  ? [...selectedRecord.beforePhotos, newPhoto]
                  : selectedRecord.beforePhotos,
                afterPhotos: activePhotoType === 'after'
                  ? [...selectedRecord.afterPhotos, newPhoto]
                  : selectedRecord.afterPhotos
              };
              
              // 更新狀態
              setSelectedRecord(updatedRecord);
              
              // 自動切換到新上傳的照片
              const newIndex = activePhotoType === 'before'
                ? updatedRecord.beforePhotos.length - 1
                : updatedRecord.afterPhotos.length - 1;
              setActivePhotoIndex(newIndex);
            };
            reader.readAsDataURL(file);
          }}
          onUpdateDescription={(photoId, description) => {
            console.log('Update description:', photoId, description);
            // TODO: 實作更新說明功能
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
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">設備名稱</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="輸入設備名稱" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">設備編號</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="輸入設備編號" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">問題描述</label>
                <textarea className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24" placeholder="描述問題..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">產品標籤</label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_TAG_OPTIONS.map(tag => (
                    <button key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">施工前照片</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">點擊或拖曳上傳照片</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
