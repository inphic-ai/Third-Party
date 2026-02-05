import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { requireUser } from "~/services/auth.server";
import { db } from "../../db";
import { suggestions } from "../../db/schema/suggestions";
import { ClipboardList, Eye, CheckCircle, XCircle, Clock, User, Calendar, AlertCircle } from "lucide-react";
import { useState } from "react";
import { eq } from "drizzle-orm";
import clsx from "clsx";

export async function loader({ request }: LoaderFunctionArgs) {
  // 要求用戶必須登入且為管理員
  const user = await requireUser(request);
  
  if (user.role !== 'ADMIN') {
    throw new Response('Unauthorized', { status: 403 });
  }
  
  try {
    const allSuggestions = await db.select().from(suggestions).orderBy(suggestions.createdAt);
    
    const suggestionsWithMapping = allSuggestions.map(s => ({
      id: s.id,
      submitterName: s.submitterName,
      submitterEmail: s.submitterEmail,
      problem: s.problem,
      improvement: s.improvement,
      page: s.page,
      impact: s.impact,
      consequence: s.consequence,
      urgency: s.urgency,
      attachments: Array.isArray(s.attachments) ? s.attachments : [],
      status: s.status,
      adminNotes: s.adminNotes,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt?.toISOString(),
    }));
    
    return json({ suggestions: suggestionsWithMapping });
  } catch (error) {
    console.error('[Requirements Loader] Error:', error);
    return json({ suggestions: [] });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  
  if (user.role !== 'ADMIN') {
    return json({ success: false, message: '無權限執行此操作' }, { status: 403 });
  }
  
  const formData = await request.formData();
  const action = formData.get('_action');
  
  if (action === 'update_status') {
    try {
      const id = formData.get('id') as string;
      const status = formData.get('status') as string;
      const adminNotes = formData.get('adminNotes') as string;
      
      await db.update(suggestions)
        .set({
          status: status as any,
          adminNotes: adminNotes || null,
          updatedAt: new Date(),
        })
        .where(eq(suggestions.id, id));
      
      return json({ success: true, message: '狀態已更新' });
    } catch (error) {
      console.error('[Requirements Action] Error:', error);
      return json({ success: false, message: '更新失敗' }, { status: 500 });
    }
  }
  
  return json({ success: false, message: '無效的操作' }, { status: 400 });
}

export default function Requirements() {
  const { suggestions: allSuggestions } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [filter, setFilter] = useState<string>('all');
  
  // 統計數據
  const stats = {
    total: allSuggestions.length,
    pending: allSuggestions.filter(s => s.status === 'PENDING').length,
    reviewing: allSuggestions.filter(s => s.status === 'REVIEWING').length,
    approved: allSuggestions.filter(s => s.status === 'APPROVED').length,
    rejected: allSuggestions.filter(s => s.status === 'REJECTED').length,
    completed: allSuggestions.filter(s => s.status === 'COMPLETED').length,
  };
  
  // 過濾建議
  const filteredSuggestions = filter === 'all' 
    ? allSuggestions 
    : allSuggestions.filter(s => s.status === filter.toUpperCase());
  
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: '待處理', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      REVIEWING: { label: '審核中', color: 'bg-blue-100 text-blue-800', icon: Eye },
      APPROVED: { label: '已批准', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { label: '已拒絕', color: 'bg-red-100 text-red-800', icon: XCircle },
      COMPLETED: { label: '已完成', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;
    
    return (
      <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.color)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };
  
  const getUrgencyColor = (urgency: string) => {
    if (urgency === '很急，已影響工作') return 'text-red-600';
    if (urgency === '近期希望改善') return 'text-amber-600';
    return 'text-gray-600';
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">修改建議與需求管理</h1>
                <p className="text-sm text-gray-500 mt-1">AI 已自動完成初步分析，請管理員進行技術複審。</p>
              </div>
            </div>
          </div>
          
          {/* 統計卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">總需求</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-700">待處理</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700">審核中</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.reviewing}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-700">已批准</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{stats.approved}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-700">已拒絕</p>
              <p className="text-2xl font-bold text-red-900 mt-1">{stats.rejected}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">已完成</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completed}</p>
            </div>
          </div>
        </div>
        
        {/* 過濾器 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { value: 'all', label: '全部' },
              { value: 'pending', label: '待處理' },
              { value: 'reviewing', label: '審核中' },
              { value: 'approved', label: '已批准' },
              { value: 'rejected', label: '已拒絕' },
              { value: 'completed', label: '已完成' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  filter === item.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 建議列表 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredSuggestions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>目前沒有建議</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(suggestion.status)}
                        <span className={clsx('text-xs font-medium', getUrgencyColor(suggestion.urgency))}>
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          {suggestion.urgency}
                        </span>
                        <span className="text-xs text-gray-500">
                          {suggestion.page}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {suggestion.improvement}
                      </h3>
                      
                      {suggestion.problem && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>問題：</strong>{suggestion.problem}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {suggestion.submitterName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(suggestion.createdAt).toLocaleDateString('zh-TW')}
                        </span>
                        <span>影響程度：{suggestion.impact}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedSuggestion(suggestion)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      檢視
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 詳細資訊 Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">建議詳情</h2>
                <button
                  onClick={() => setSelectedSuggestion(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 狀態和緊急程度 */}
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedSuggestion.status)}
                <span className={clsx('text-sm font-medium', getUrgencyColor(selectedSuggestion.urgency))}>
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {selectedSuggestion.urgency}
                </span>
              </div>
              
              {/* 提交者資訊 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">提交者資訊</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>姓名：</strong>{selectedSuggestion.submitterName}</p>
                  <p><strong>Email：</strong>{selectedSuggestion.submitterEmail}</p>
                  <p><strong>提交時間：</strong>{new Date(selectedSuggestion.createdAt).toLocaleString('zh-TW')}</p>
                </div>
              </div>
              
              {/* 建議內容 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">希望改善的內容</h3>
                <p className="text-gray-900">{selectedSuggestion.improvement}</p>
              </div>
              
              {selectedSuggestion.problem && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">遇到的問題</h3>
                  <p className="text-gray-900">{selectedSuggestion.problem}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">發生問題的頁面</h3>
                  <p className="text-gray-900">{selectedSuggestion.page}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">影響程度</h3>
                  <p className="text-gray-900">{selectedSuggestion.impact}</p>
                </div>
              </div>
              
              {selectedSuggestion.consequence && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">如果不改的後果</h3>
                  <p className="text-gray-900">{selectedSuggestion.consequence}</p>
                </div>
              )}
              
              {/* 附件 */}
              {selectedSuggestion.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">相關截圖/影片</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSuggestion.attachments.map((url: string, index: number) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video bg-gray-100 rounded-lg overflow-hidden hover:opacity-75 transition-opacity"
                      >
                        <img src={url} alt={`附件 ${index + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 管理員操作 */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">管理員操作</h3>
                <fetcher.Form method="post" className="space-y-4">
                  <input type="hidden" name="_action" value="update_status" />
                  <input type="hidden" name="id" value={selectedSuggestion.id} />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      更新狀態
                    </label>
                    <select
                      name="status"
                      defaultValue={selectedSuggestion.status}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="PENDING">待處理</option>
                      <option value="REVIEWING">審核中</option>
                      <option value="APPROVED">已批准</option>
                      <option value="REJECTED">已拒絕</option>
                      <option value="COMPLETED">已完成</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      管理員備註
                    </label>
                    <textarea
                      name="adminNotes"
                      defaultValue={selectedSuggestion.adminNotes || ''}
                      placeholder="輸入處理備註或回覆..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedSuggestion(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={fetcher.state === 'submitting'}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {fetcher.state === 'submitting' ? '更新中...' : '更新狀態'}
                    </button>
                  </div>
                </fetcher.Form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
