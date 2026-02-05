import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { requireUser } from "~/services/auth.server";
import { requirePermission } from "~/utils/permissions.server";
import { db } from "../../db";
import { suggestions } from "../../db/schema/suggestions";
import { Lightbulb, Send, X } from "lucide-react";
import { useState, useEffect } from "react";
import FileUpload from "~/components/FileUpload";

export async function loader({ request }: LoaderFunctionArgs) {
  // 要求用戶必須登入
  const user = await requireUser(request);
  
  // 檢查用戶是否有功能建議權限
  requirePermission(user, '/suggestions');
  
  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  requirePermission(user, '/suggestions');
  
  const formData = await request.formData();
  const action = formData.get('_action');
  
  if (action === 'submit_suggestion') {
    try {
      const problem = formData.get('problem') as string;
      const improvement = formData.get('improvement') as string;
      const page = formData.get('page') as string;
      const impact = formData.get('impact') as string;
      const consequence = formData.get('consequence') as string;
      const urgency = formData.get('urgency') as string;
      const attachmentsStr = formData.get('attachments') as string;
      
      // 解析附件 URL 陣列
      const attachments = attachmentsStr ? JSON.parse(attachmentsStr) : [];
      
      // 插入新建議
      await db.insert(suggestions).values({
        submitterId: user.id,
        submitterName: user.name,
        submitterEmail: user.email,
        problem: problem || null,
        improvement,
        page: page as any,
        impact: impact as any,
        consequence: consequence || null,
        urgency: urgency as any,
        attachments,
        status: 'PENDING',
      });
      
      return json({ success: true, message: '建議已成功提交！' });
    } catch (error) {
      console.error('[Suggestions Action] Error:', error);
      return json({ success: false, message: '提交失敗，請稍後再試' }, { status: 500 });
    }
  }
  
  return json({ success: false, message: '無效的操作' }, { status: 400 });
}

export default function Suggestions() {
  const { user } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  
  const [formData, setFormData] = useState({
    problem: '',
    improvement: '',
    page: '',
    impact: '',
    consequence: '',
    urgency: '近期希望改善',
    attachments: [] as string[],
  });
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // 監聽提交結果
  useEffect(() => {
    if (fetcher.data?.success) {
      setShowSuccessModal(true);
      // 重置表單
      setFormData({
        problem: '',
        improvement: '',
        page: '',
        impact: '',
        consequence: '',
        urgency: '近期希望改善',
        attachments: [],
      });
    }
  }, [fetcher.data]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證必填欄位
    if (!formData.improvement || !formData.page || !formData.impact || !formData.urgency) {
      alert('請填寫所有必填欄位');
      return;
    }
    
    const submitFormData = new FormData();
    submitFormData.append('_action', 'submit_suggestion');
    submitFormData.append('problem', formData.problem);
    submitFormData.append('improvement', formData.improvement);
    submitFormData.append('page', formData.page);
    submitFormData.append('impact', formData.impact);
    submitFormData.append('consequence', formData.consequence);
    submitFormData.append('urgency', formData.urgency);
    submitFormData.append('attachments', JSON.stringify(formData.attachments));
    
    fetcher.submit(submitFormData, { method: 'post' });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 頁面標題 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">網站修改建議申請</h1>
              <p className="text-sm text-gray-500 mt-1">您的建議將透過 AI 自動分析並轉交工程團隊。</p>
            </div>
          </div>
        </div>
        
        {/* 表單 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* 問題 1: 你現在遇到什麼問題？ */}
          <div>
            <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
              <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-sm text-amber-700">1</span>
              你現在遇到什麼問題？
            </label>
            <p className="text-sm text-gray-500 mb-3">
              請描述實際操作時的不方便、錯誤或卡住的地方。
            </p>
            <textarea
              value={formData.problem}
              onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
              placeholder="例如：客戶列表頁找不到「最近聯絡時間」，每次都要點進去很麻煩。"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
          
          {/* 問題 2: 你希望系統怎麼幫你改善？ */}
          <div>
            <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
              <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-sm text-amber-700">2</span>
              你希望系統怎麼幫你改善？
              <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-3">
              請用「我希望可以...」描述理想中的操作方式。
            </p>
            <textarea
              value={formData.improvement}
              onChange={(e) => setFormData({ ...formData, improvement: e.target.value })}
              placeholder="例如：我希望在列表頁就能直接看到最近聯絡時間。"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              rows={4}
              required
            />
          </div>
          
          {/* 問題 3 & 4: 發生問題的頁面 & 影響程度 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-sm text-amber-700">3</span>
                發生問題的頁面是？
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.page}
                onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              >
                <option value="">請選擇...</option>
                <option value="客戶管理">客戶管理</option>
                <option value="設備管理">設備管理</option>
                <option value="工單系統">工單系統</option>
                <option value="統計報表">統計報表</option>
                <option value="訂單中心">訂單中心</option>
                <option value="其他">其他</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-sm text-amber-700">4</span>
                影響程度？
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              >
                <option value="">偶爾會卡住</option>
                <option value="幾乎不影響">幾乎不影響</option>
                <option value="偶爾會卡住">偶爾會卡住</option>
                <option value="幾乎每天都會遇到">幾乎每天都會遇到</option>
                <option value="會直接影響成交/作業效率">會直接影響成交/作業效率</option>
              </select>
            </div>
          </div>
          
          {/* 問題 5: 如果不改，會發生什麼後果？ */}
          <div>
            <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
              <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-sm text-amber-700">5</span>
              如果不改，會發生什麼後果？
            </label>
            <textarea
              value={formData.consequence}
              onChange={(e) => setFormData({ ...formData, consequence: e.target.value })}
              placeholder="例如：容易漏資料、會算錯、要多花很多時間等等。"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          
          {/* 問題 6: 你有沒有相關畫面或說明？ */}
          <div>
            <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
              <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-sm text-amber-700">6</span>
              你有沒有相關畫面或說明？
            </label>
            <FileUpload
              onFilesUploaded={(urls) => setFormData({ ...formData, attachments: urls })}
              existingFiles={formData.attachments}
              maxFiles={5}
            />
          </div>
          
          {/* 問題 7: 你覺得這個修改急不急？ */}
          <div>
            <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
              <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-sm text-amber-700">7</span>
              你覺得這個修改急不急？
              <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {['可慢慢來', '近期希望改善', '很急，已影響工作'].map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value={option}
                    checked={formData.urgency === option}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 提交按鈕 */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={fetcher.state === 'submitting'}
              className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {fetcher.state === 'submitting' ? (
                <>提交中...</>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  提交申請
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* 成功提示 Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">提交成功！</h3>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              您的建議已成功提交，工程團隊將盡快處理。感謝您的反饋！
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              確定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
