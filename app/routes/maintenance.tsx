import { useState, useEffect, useRef, useMemo } from 'react';
import { canUserDelete } from "~/utils/deletePermissions";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useActionData, useNavigation, Form, useRevalidator } from '@remix-run/react';
import { requireUser } from '~/services/auth.server';
import { requirePermission } from '~/utils/permissions.server';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  X, 
  Camera, 
  MessageSquare,
  ArrowLeft,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Image as ImageIcon,
  Save,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Maximize2,
  Upload,
  Trash2
} from 'lucide-react';
import { db } from '~/services/db.server';
import { maintenanceRecords } from '../../db/schema/operations';
import { vendors } from '../../db/schema/vendor';
import { eq, desc } from 'drizzle-orm';
import { ImageLightbox } from '../components/ImageLightbox';
import { Pagination } from '~/components/Pagination';

// ============================================
// Types
// ============================================

interface MediaItem {
  id: string;
  url: string;
  description: string;
  type: 'image' | 'video';
  uploadedAt: string;
}

// ============================================
// Loader & Action
// ============================================

export async function loader({ request }: LoaderFunctionArgs) {
  // 要求用戶必須登入
  const user = await requireUser(request);
  
  // 檢查用戶是否有設備維修紀錄權限
  requirePermission(user, '/maintenance');
  const records = await db
    .select()
    .from(maintenanceRecords)
    .orderBy(desc(maintenanceRecords.createdAt));

  const vendorList = await db.select().from(vendors);

  return json({ records, vendorList, canDeleteMaintenance: canUserDelete(user, 'maintenance') });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'create') {
    const deviceName = formData.get('deviceName') as string;
    const deviceNo = formData.get('deviceNo') as string;
    const description = formData.get('description') as string;
    const vendorId = formData.get('vendorId') as string;
    const status = formData.get('status') as string || 'PENDING';
    const beforePhotosJson = formData.get('beforePhotos') as string;
    const afterPhotosJson = formData.get('afterPhotos') as string;

    const beforePhotos = beforePhotosJson ? JSON.parse(beforePhotosJson) : [];
    const afterPhotos = afterPhotosJson ? JSON.parse(afterPhotosJson) : [];

    const caseId = `CASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const tags = formData.get('tags') as string;
    const tagsArray = tags ? tags.split(',').map(t => t.trim()) : [];

    // 獲取廠商名稱
    const vendor = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
    const vendorName = vendor[0]?.name || '未指定廠商';

    await db.insert(maintenanceRecords).values({
      caseId,
      deviceName,
      deviceNo,
      status,
      description,
      productTags: tagsArray,
      beforePhotos,
      afterPhotos,
      createdBy: vendorId,
      vendorId,
      vendorName,
      date: new Date(),
    });

    return json({ success: true });
  }

  if (intent === 'updateStatus') {
    const caseId = formData.get('caseId') as string;
    const status = formData.get('status') as string;
    const vendorId = formData.get('vendorId') as string;
    const vendorName = formData.get('vendorName') as string;
    const beforePhotosJson = formData.get('beforePhotos') as string;
    const afterPhotosJson = formData.get('afterPhotos') as string;

    const updateData: any = { status, vendorId, vendorName };
    
    if (beforePhotosJson) {
      updateData.beforePhotos = JSON.parse(beforePhotosJson);
    }
    if (afterPhotosJson) {
      updateData.afterPhotos = JSON.parse(afterPhotosJson);
    }

    await db
      .update(maintenanceRecords)
      .set(updateData)
      .where(eq(maintenanceRecords.caseId, caseId));

    return json({ success: true });
  }

  // 刪除維修紀錄
  if (intent === 'delete') {
    const user = await requireUser(request);
    
    // 檢查刪除權限
    if (!canUserDelete(user, 'maintenance')) {
      return json({ success: false, error: '無權限刪除' }, { status: 403 });
    }
    
    const caseId = formData.get('caseId') as string;

    if (!caseId) {
      return json({ success: false, error: '缺少紀錄 ID' }, { status: 400 });
    }

    try {
      await db.delete(maintenanceRecords).where(eq(maintenanceRecords.caseId, caseId));
      console.log('[Maintenance Action] Deleted record:', caseId);
      return json({ success: true, message: '維修紀錄已刪除' });
    } catch (error) {
      console.error('[Maintenance Action] Failed to delete record:', error);
      return json({ success: false, error: '刪除失敗，請稍後再試' }, { status: 500 });
    }
  }

  return json({ success: false });
}

// ============================================
// Component
// ============================================

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  PENDING: { label: '待處理', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200', icon: Clock },
  IN_PROGRESS: { label: '處理中', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: Wrench },
  COMPLETED: { label: '已完成', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
};

export default function MaintenancePage() {
  const { records, vendorList, isAdmin } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const isSubmitting = navigation.state !== 'idle';

  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); // 預設 20，會在 useEffect 中自動調整

  // 自動選擇最佳筆數（10/20/30）
  useEffect(() => {
    const calculateOptimalPageSize = () => {
      const screenHeight = window.innerHeight;
      const rowHeight = 80; // 每筆資料約 80px（設備維修紀錄比廠商列表高）
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

  // 照片上傳 state
  const [beforePhotos, setBeforePhotos] = useState<MediaItem[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<MediaItem[]>([]);
  const [editBeforePhotos, setEditBeforePhotos] = useState<MediaItem[]>([]);
  const [editAfterPhotos, setEditAfterPhotos] = useState<MediaItem[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState<'before' | 'after' | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 全端閉環：Action 成功後關閉 Modal 並重新載入
  useEffect(() => {
    if (actionData?.success) {
      setIsFormModalOpen(false);
      setSelectedRecord(null);
      setBeforePhotos([]);
      setAfterPhotos([]);
      setEditBeforePhotos([]);
      setEditAfterPhotos([]);
      revalidator.revalidate();
    }
  }, [actionData, revalidator]);

  // 編輯時初始化照片 state
  useEffect(() => {
    if (selectedRecord) {
      setEditBeforePhotos((selectedRecord.beforePhotos as MediaItem[]) || []);
      setEditAfterPhotos((selectedRecord.afterPhotos as MediaItem[]) || []);
    }
  }, [selectedRecord]);

  const filteredRecords = useMemo(() => {
    return records.filter((record: any) => {
      const matchesSearch = record.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            record.caseId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  // 分頁邏輯
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, currentPage, itemsPerPage]);

  // 當篩選條件變化時，重置到第一頁
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleFileUpload = (type: 'before' | 'after', files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto: MediaItem = {
          id: `${Date.now()}-${Math.random()}`,
          url: e.target?.result as string,
          description: file.name,
          type: 'image',
          uploadedAt: new Date().toISOString(),
        };
        
        if (type === 'before') {
          setBeforePhotos(prev => [...prev, newPhoto]);
        } else {
          setAfterPhotos(prev => [...prev, newPhoto]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (type: 'before' | 'after', id: string) => {
    if (type === 'before') {
      setBeforePhotos(prev => prev.filter(p => p.id !== id));
    } else {
      setAfterPhotos(prev => prev.filter(p => p.id !== id));
    }
  };

  const removeEditPhoto = (type: 'before' | 'after', id: string) => {
    if (type === 'before') {
      setEditBeforePhotos(prev => prev.filter(p => p.id !== id));
    } else {
      setEditAfterPhotos(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleEditFileUpload = (type: 'before' | 'after', files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const isVideo = file.type.startsWith('video/');
        const newPhoto: MediaItem = {
          id: `${Date.now()}-${Math.random()}`,
          url: e.target?.result as string,
          description: file.name,
          type: isVideo ? 'video' : 'image',
          uploadedAt: new Date().toISOString(),
        };
        
        if (type === 'before') {
          setEditBeforePhotos(prev => [...prev, newPhoto]);
        } else {
          setEditAfterPhotos(prev => [...prev, newPhoto]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLightboxUpload = (type: 'before' | 'after', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const isVideo = file.type.startsWith('video/');
      const newPhoto: MediaItem = {
        id: `${Date.now()}-${Math.random()}`,
        url: e.target?.result as string,
        description: file.name,
        type: isVideo ? 'video' : 'image',
        uploadedAt: new Date().toISOString(),
      };
      
      if (type === 'before') {
        setEditBeforePhotos(prev => [...prev, newPhoto]);
      } else {
        setEditAfterPhotos(prev => [...prev, newPhoto]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateDescription = (type: 'before' | 'after', photoId: string, description: string) => {
    if (type === 'before') {
      setEditBeforePhotos(prev => prev.map(p => p.id === photoId ? { ...p, description } : p));
    } else {
      setEditAfterPhotos(prev => prev.map(p => p.id === photoId ? { ...p, description } : p));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="w-full px-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Wrench className="text-emerald-600" size={40} />
              設備維修紀錄
            </h1>
            <p className="text-gray-400 font-bold mt-2 uppercase tracking-[0.2em] text-xs">Maintenance Record System</p>
          </div>
          <button
            onClick={() => setIsFormModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            新增維修單
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜尋設備名稱、案件編號..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">全部狀態</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">案件編號</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">設備名稱</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">狀態</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">施工照片</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRecords.map((record: any) => {
                const config = statusConfig[record.status] || statusConfig.PENDING;
                const Icon = config.icon;
                return (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-600">{record.caseId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{record.deviceName}</div>
                        <div className="text-xs text-gray-500 font-mono">{record.deviceNo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bgColor} ${config.color}`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {((record.beforePhotos as any[]) || []).slice(0, 3).map((photo, i) => (
                          <div key={i} className="w-8 h-8 rounded-lg border-2 border-white bg-gray-100 overflow-hidden">
                            <img src={photo.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {((record.beforePhotos as any[]) || []).length > 3 && (
                          <div className="w-8 h-8 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-500">
                            +{((record.beforePhotos as any[]) || []).length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {canDeleteMaintenance && (
                          <Form method="post" onSubmit={(e) => {
                            if (!confirm(`確定要刪除維修紀錄「${record.caseId}」嗎？`)) {
                              e.preventDefault();
                            }
                          }}>
                            <input type="hidden" name="intent" value="delete" />
                            <input type="hidden" name="caseId" value={record.caseId} />
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedRecords.length === 0 && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    查無維修紀錄
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* 分頁控制 */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRecords.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[10, 20, 30]}
        />
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedRecord.deviceName}</h2>
                <p className="text-sm text-gray-500 font-mono mt-1">{selectedRecord.caseId}</p>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <Form method="post" className="space-y-8">
                <input type="hidden" name="intent" value="updateStatus" />
                <input type="hidden" name="caseId" value={selectedRecord.caseId} />
                <input type="hidden" name="beforePhotos" value={JSON.stringify(editBeforePhotos)} />
                <input type="hidden" name="afterPhotos" value={JSON.stringify(editAfterPhotos)} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">維修狀態</label>
                    <select 
                      name="status"
                      defaultValue={selectedRecord.status}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    >
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">負責廠商</label>
                    <select 
                      name="vendorId"
                      defaultValue={selectedRecord.vendorId}
                      onChange={(e) => {
                        const name = e.target.options[e.target.selectedIndex].text;
                        const input = document.getElementById('vendorNameInput') as HTMLInputElement;
                        if (input) input.value = name;
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    >
                      {vendorList.map((v: any) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                    <input type="hidden" id="vendorNameInput" name="vendorName" defaultValue={selectedRecord.vendorName} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    問題描述
                  </h3>
                  <p className="text-gray-600 bg-gray-50 p-4 rounded-xl leading-relaxed">
                    {selectedRecord.description}
                  </p>
                </div>

                {/* 施工前照片 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      施工前照片
                    </label>
                    <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      上傳
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={(e) => handleEditFileUpload('before', e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {editBeforePhotos.length > 0 && (
                    <div className="grid grid-cols-6 gap-2">
                      {editBeforePhotos.slice(0, 6).map((photo, idx) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => {
                            setLightboxOpen('before');
                            setLightboxIndex(idx);
                          }}
                          className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-500 transition-colors"
                        >
                          {photo.type === 'video' ? (
                            <video src={photo.url} className="w-full h-full object-cover" />
                          ) : (
                            <img src={photo.url} alt="" className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeEditPhoto('before', photo.id);
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </button>
                      ))}
                      {editBeforePhotos.length > 6 && (
                        <button
                          type="button"
                          onClick={() => {
                            setLightboxOpen('before');
                            setLightboxIndex(0);
                          }}
                          className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          +{editBeforePhotos.length - 6}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 施工後照片 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      施工後照片
                    </label>
                    <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      上傳
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={(e) => handleEditFileUpload('after', e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {editAfterPhotos.length > 0 && (
                    <div className="grid grid-cols-6 gap-2">
                      {editAfterPhotos.slice(0, 6).map((photo, idx) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => {
                            setLightboxOpen('after');
                            setLightboxIndex(idx);
                          }}
                          className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-500 transition-colors"
                        >
                          {photo.type === 'video' ? (
                            <video src={photo.url} className="w-full h-full object-cover" />
                          ) : (
                            <img src={photo.url} alt="" className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeEditPhoto('after', photo.id);
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </button>
                      ))}
                      {editAfterPhotos.length > 6 && (
                        <button
                          type="button"
                          onClick={() => {
                            setLightboxOpen('after');
                            setLightboxIndex(0);
                          }}
                          className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          +{editAfterPhotos.length - 6}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setSelectedRecord(null)} className="px-6 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-all">取消</button>
                  <button type="submit" disabled={isSubmitting} className="px-8 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {isSubmitting ? '儲存中...' : '儲存變更'}
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">新增維修單</h2>
              <button onClick={() => {
                setIsFormModalOpen(false);
                setBeforePhotos([]);
                setAfterPhotos([]);
              }} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <Form method="post" className="space-y-6">
                <input type="hidden" name="intent" value="create" />
                <input type="hidden" name="beforePhotos" value={JSON.stringify(beforePhotos)} />
                <input type="hidden" name="afterPhotos" value={JSON.stringify(afterPhotos)} />
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">設備名稱</label>
                    <input name="deviceName" required className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">設備編號</label>
                    <input name="deviceNo" required className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">維修狀態</label>
                    <select name="status" defaultValue="PENDING" className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500">
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">負責廠商</label>
                    <select name="vendorId" required className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500">
                      {vendorList.map((v: any) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">問題描述</label>
                  <textarea name="description" rows={4} required className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>

                {/* 施工前照片上傳 */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    施工前照片
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-emerald-500 transition-colors">
                    <input
                      type="file"
                      id="beforePhotosInput"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileUpload('before', e.target.files)}
                      className="hidden"
                    />
                    <label htmlFor="beforePhotosInput" className="flex flex-col items-center gap-2 cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">點擊上傳施工前照片</span>
                    </label>
                  </div>
                  {beforePhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-4">
                      {beforePhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <img src={photo.url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removePhoto('before', photo.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 施工後照片上傳 */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    施工後照片
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-emerald-500 transition-colors">
                    <input
                      type="file"
                      id="afterPhotosInput"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileUpload('after', e.target.files)}
                      className="hidden"
                    />
                    <label htmlFor="afterPhotosInput" className="flex flex-col items-center gap-2 cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">點擊上傳施工後照片</span>
                    </label>
                  </div>
                  {afterPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-4">
                      {afterPhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <img src={photo.url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removePhoto('after', photo.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => {
                    setIsFormModalOpen(false);
                    setBeforePhotos([]);
                    setAfterPhotos([]);
                  }} className="px-6 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-all">取消</button>
                  <button type="submit" disabled={isSubmitting} className="px-8 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold disabled:opacity-50">
                    {isSubmitting ? '建立中...' : '建立維修單'}
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* ImageLightbox for Before Photos */}
      {lightboxOpen === 'before' && editBeforePhotos.length > 0 && (
        <ImageLightbox
          photos={editBeforePhotos}
          activeIndex={lightboxIndex}
          title="施工前照片"
          onClose={() => setLightboxOpen(null)}
          onPrev={() => setLightboxIndex(prev => Math.max(0, prev - 1))}
          onNext={() => setLightboxIndex(prev => Math.min(editBeforePhotos.length - 1, prev + 1))}
          onSelect={(idx) => setLightboxIndex(idx)}
          onUpload={(file) => handleLightboxUpload('before', file)}
          onUpdateDescription={(photoId, description) => handleUpdateDescription('before', photoId, description)}
        />
      )}

      {/* ImageLightbox for After Photos */}
      {lightboxOpen === 'after' && editAfterPhotos.length > 0 && (
        <ImageLightbox
          photos={editAfterPhotos}
          activeIndex={lightboxIndex}
          title="施工後照片"
          onClose={() => setLightboxOpen(null)}
          onPrev={() => setLightboxIndex(prev => Math.max(0, prev - 1))}
          onNext={() => setLightboxIndex(prev => Math.min(editAfterPhotos.length - 1, prev + 1))}
          onSelect={(idx) => setLightboxIndex(idx)}
          onUpload={(file) => handleLightboxUpload('after', file)}
          onUpdateDescription={(photoId, description) => handleUpdateDescription('after', photoId, description)}
        />
      )}
    </div>
  );
}
