import { useState, useMemo, useEffect } from 'react';
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useActionData, useNavigation, Form, useRevalidator } from '@remix-run/react';
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
  Upload
} from 'lucide-react';
import { db } from '~/services/db.server';
import { maintenanceRecords } from '../../db/schema/operations';
import { vendors } from '../../db/schema/vendor';
import { eq, desc } from 'drizzle-orm';

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
  const records = await db
    .select()
    .from(maintenanceRecords)
    .orderBy(desc(maintenanceRecords.createdAt));

  const vendorList = await db.select().from(vendors);

  return json({ records, vendorList });
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
      vendorName: '', // Will be populated by client
    });

    return json({ success: true });
  }

  if (intent === 'updateStatus') {
    const caseId = formData.get('caseId') as string;
    const status = formData.get('status') as string;
    const vendorId = formData.get('vendorId') as string;
    const vendorName = formData.get('vendorName') as string;

    await db
      .update(maintenanceRecords)
      .set({ status, vendorId, vendorName })
      .where(eq(maintenanceRecords.caseId, caseId));

    return json({ success: true });
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
  const { records, vendorList } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const isSubmitting = navigation.state !== 'idle';

  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // 照片上傳 state
  const [beforePhotos, setBeforePhotos] = useState<MediaItem[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<MediaItem[]>([]);

  // 全端閉環：Action 成功後關閉 Modal 並重新載入
  useEffect(() => {
    if (actionData?.success) {
      setIsFormModalOpen(false);
      setSelectedRecord(null);
      setBeforePhotos([]);
      setAfterPhotos([]);
      revalidator.revalidate();
    }
  }, [actionData, revalidator]);

  const filteredRecords = useMemo(() => {
    return records.filter((record: any) => {
      const matchesSearch = record.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            record.caseId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
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
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
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
              {filteredRecords.map((record: any) => {
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
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
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

                <div className="space-y-6">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    施工照片
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {((selectedRecord.beforePhotos as any[]) || []).map((photo, i) => (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm group relative">
                        <img src={photo.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="p-2 bg-white rounded-full shadow-lg">
                            <Maximize2 className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
    </div>
  );
}
