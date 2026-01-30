import React, { useState, useEffect } from 'react';
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useActionData, useNavigation, Form } from '@remix-run/react';
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
  Maximize2
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
    .orderBy(desc(maintenanceRecords.date));
  
  const vendorList = await db
    .select({ id: vendors.id, name: vendors.name })
    .from(vendors);

  return json({ records, vendorList });
}

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
      
      // 生成案件編號
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 7).replace('-', '');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const caseId = `CASE-${dateStr}-${randomNum}`;

      const tagsArray = productTags ? productTags.split(',').filter(Boolean) : [];

      // 查詢預設廠商
      let firstVendor = await db.select().from(vendors).limit(1);
      const defaultVendorId = firstVendor.length > 0 ? firstVendor[0].id : '00000000-0000-0000-0000-000000000000';

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
        beforePhotos: [],
        afterPhotos: [],
        createdBy: defaultVendorId,
      });

      return json({ success: true, error: null });
    } catch (error) {
      console.error('Failed to create maintenance record:', error);
      return json({ success: false, error: '新增失敗' }, { status: 500 });
    }
  }

  if (intent === 'updateStatus') {
    try {
      const caseId = formData.get('caseId') as string;
      const status = formData.get('status') as any;
      const vendorId = formData.get('vendorId') as string;
      const vendorName = formData.get('vendorName') as string;

      if (!caseId || !status) {
        return json({ success: false, error: '缺少必要參數' }, { status: 400 });
      }

      const updateData: any = { status };
      if (vendorId) updateData.vendorId = vendorId;
      if (vendorName) updateData.vendorName = vendorName;

      await db
        .update(maintenanceRecords)
        .set(updateData)
        .where(eq(maintenanceRecords.caseId, caseId));

      return json({ success: true, error: null });
    } catch (error) {
      console.error('Failed to update status:', error);
      return json({ success: false, error: '更新失敗' }, { status: 500 });
    }
  }

  return json({ success: false, error: 'Invalid intent' }, { status: 400 });
}

// ============================================
// UI Components
// ============================================

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  'PENDING': { label: '待處理', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: <Clock className="w-4 h-4" /> },
  'IN_PROGRESS': { label: '進行中', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: <Wrench className="w-4 h-4" /> },
  'COMPLETED': { label: '已完成', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: <CheckCircle2 className="w-4 h-4" /> },
  'ARCHIVED': { label: '已歸檔', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: <X className="w-4 h-4" /> },
};

export default function MaintenancePage() {
  const { records, vendorList } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  useEffect(() => {
    if (actionData?.success) {
      setIsFormModalOpen(false);
      if (selectedRecord) {
        const updated = records.find((r: any) => r.caseId === selectedRecord.caseId);
        if (updated) setSelectedRecord(updated);
      }
    }
  }, [actionData, records, selectedRecord]);

  const filteredRecords = records.filter((r: any) => 
    r.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-7 h-7 text-emerald-600" />
            設備維修紀錄
          </h1>
          <p className="text-gray-500 mt-1">管理與追蹤所有設備維修案件狀態</p>
        </div>
        <button
          onClick={() => setIsFormModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          新增維修單
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待處理</p>
              <p className="text-2xl font-bold text-gray-900">{records.filter((r: any) => r.status === 'PENDING').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">維修中</p>
              <p className="text-2xl font-bold text-gray-900">{records.filter((r: any) => r.status === 'IN_PROGRESS').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-gray-900">{records.filter((r: any) => r.status === 'COMPLETED').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">總案件數</p>
              <p className="text-2xl font-bold text-gray-900">{records.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋案件編號、設備名稱、廠商..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-all border border-gray-100">
          <Filter className="w-4 h-4" />
          篩選條件
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">案件資訊</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">狀態</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">負責廠商</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">照片</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRecords.map((record: any) => (
              <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{record.deviceName}</div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{record.caseId}</span>
                    <span>•</span>
                    <span>{new Date(record.date).toLocaleDateString()}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[record.status].bgColor} ${statusConfig[record.status].color}`}>
                    {statusConfig[record.status].icon}
                    {statusConfig[record.status].label}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {record.vendorName}
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
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedRecord(record)}
                    className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center gap-1"
                  >
                    查看詳情
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
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
                          <Maximize2 className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {isSubmitting ? '儲存中...' : '儲存變更'}
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">新增維修單</h2>
              <button onClick={() => setIsFormModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <Form method="post" className="p-8 space-y-6">
              <input type="hidden" name="intent" value="create" />
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">問題描述</label>
                <textarea name="description" rows={4} required className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-all">取消</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold disabled:opacity-50">
                  {isSubmitting ? '建立中...' : '建立維修單'}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
