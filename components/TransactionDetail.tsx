
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_VENDORS, MOCK_USERS } from '../constants';
import { TransactionStatus, MediaItem, KnowledgeBaseItem } from '../types';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Camera, 
  FileText, 
  User,
  Calendar,
  AlertTriangle,
  PlayCircle,
  ThumbsUp,
  CreditCard,
  BookOpen,
  Bot,
  Sparkles,
  Save,
  ChevronDown,
  Gift
} from 'lucide-react';
import { clsx } from 'clsx';

export const TransactionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // This is transaction ID
  const navigate = useNavigate();

  // Find transaction from all vendors (In real app, fetch by ID)
  let transaction = null;
  let vendor = null;

  for (const v of MOCK_VENDORS) {
    const t = v.transactions.find(t => t.id === id);
    if (t) {
      transaction = t;
      vendor = v;
      break;
    }
  }

  // Local state for approval simulation
  const [localStatus, setLocalStatus] = useState(transaction?.status);
  const [feedback, setFeedback] = useState(transaction?.managerFeedback || '');
  const [rating, setRating] = useState(transaction?.qualityRating || 5);
  
  // Knowledge Base State
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingQA, setIsGeneratingQA] = useState(false);
  const [generatedQA, setGeneratedQA] = useState<KnowledgeBaseItem[]>([]);
  const [isSavedToKB, setIsSavedToKB] = useState(false);

  if (!transaction || !vendor) return <div className="p-8">找不到工單資料</div>;

  const referrer = MOCK_USERS.find(u => u.id === vendor?.createdBy);

  const costDiff = transaction.amount - transaction.initialQuote;
  const costDiffPercent = (costDiff / transaction.initialQuote) * 100;
  
  const handleApprove = () => {
    // In real app: API call
    setLocalStatus(TransactionStatus.APPROVED);
    
    let message = `工單 ${transaction?.id} 已通過驗收，轉入待撥款列表。`;
    alert(message);
    // Navigate back or stay
  };

  const handleReject = () => {
     setLocalStatus(TransactionStatus.REJECTED);
     alert('已退回工單，請廠商修正後重新提交。');
  };

  const handleGenerateQA = () => {
    if (!reportContent.trim()) return;
    setIsGeneratingQA(true);
    // Simulate AI Generation
    setTimeout(() => {
      const mockQA: KnowledgeBaseItem[] = [
        {
          id: `qa-${Date.now()}-1`,
          question: `針對 ${transaction?.categories?.[0] || '此類'} 專案，常見的驗收重點為何？`,
          answer: "根據本次驗收經驗，需特別注意管線接合處的壓力測試，以及收邊的矽利康完整性。",
          tags: ['驗收', '注意事項'],
          createdAt: new Date().toISOString()
        },
        {
          id: `qa-${Date.now()}-2`,
          question: "施工過程中遇到突發狀況如何處理？",
          answer: "本次遇到舊管線尺寸不合問題，廠商採用轉接頭方案解決，成本增加約 5%，效果良好。",
          tags: ['異常處理', '成本控制'],
          createdAt: new Date().toISOString()
        }
      ];
      setGeneratedQA(mockQA);
      setIsGeneratingQA(false);
    }, 2000);
  };

  const handleSaveToKB = () => {
    setIsSavedToKB(true);
    // In real app: API POST to save to knowledge base
  };

  const StatusBadge = ({ status }: { status: TransactionStatus }) => {
    const styles = {
      [TransactionStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700',
      [TransactionStatus.PENDING_APPROVAL]: 'bg-yellow-100 text-yellow-800 animate-pulse',
      [TransactionStatus.APPROVED]: 'bg-green-100 text-green-700',
      [TransactionStatus.PAID]: 'bg-slate-100 text-slate-600',
      [TransactionStatus.REJECTED]: 'bg-red-100 text-red-700',
    };
    return (
      <span className={clsx("px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2", styles[status])}>
        {status === TransactionStatus.PENDING_APPROVAL && <Clock size={16} />}
        {status === TransactionStatus.APPROVED && <CheckCircle size={16} />}
        {status}
      </span>
    );
  };

  const MediaGallery = ({ title, items }: { title: string, items: MediaItem[] }) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <Camera size={18} /> {title}
        </h3>
        <span className="text-xs text-slate-500">{items.length} 個檔案</span>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
        {items.length > 0 ? items.map(item => (
          <div key={item.id} className="group relative rounded-lg overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition">
             <div className="aspect-video bg-slate-100 relative">
                <img src={item.url} alt={item.description} className="w-full h-full object-cover" />
                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition">
                    <PlayCircle size={32} className="text-white opacity-80" />
                  </div>
                )}
             </div>
             <div className="p-2 bg-white text-xs text-slate-600">
               <p className="font-medium truncate">{item.description || '無描述'}</p>
               <p className="text-slate-400 text-[10px]">{item.uploadedAt}</p>
             </div>
          </div>
        )) : (
          <div className="col-span-full h-32 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
             <Camera size={24} className="mb-2 opacity-20" />
             <span className="text-sm">無影像資料</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={20} className="mr-2" /> 返回
        </button>
        <div className="flex items-center gap-3">
           <span className="text-slate-500 text-sm">工單編號: {transaction.id}</span>
           <div className="h-4 w-px bg-slate-300"></div>
           <StatusBadge status={localStatus || TransactionStatus.IN_PROGRESS} />
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1">
             <h1 className="text-2xl font-bold text-slate-800 mb-2">{transaction.description}</h1>
             <div className="flex items-center gap-2 text-blue-600 font-medium mb-4">
                <User size={18} />
                <span className="cursor-pointer hover:underline" onClick={() => navigate(`/vendors/${vendor.id}`)}>
                  {vendor.name}
                </span>
                <span className="text-slate-400 text-sm">({vendor.id})</span>
                {referrer && (
                   <span className="ml-2 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100 flex items-center gap-1" title="推薦此廠商的員工">
                      <Gift size={10} /> 推薦人: {referrer.name}
                   </span>
                )}
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">客戶/專案代號</p>
                  <p className="font-mono font-medium">{transaction.customerId}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">施工日期</p>
                  <p className="font-medium flex items-center gap-1"><Calendar size={14} /> {transaction.date}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">完工日期</p>
                  <p className="font-medium">{transaction.completionDate || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">投入工時</p>
                  <p className="font-medium">{transaction.timeSpentHours} 小時</p>
                </div>
             </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 min-w-[280px] border border-slate-100">
             <div className="flex justify-between items-center mb-2">
               <span className="text-sm text-slate-500">預估報價</span>
               <span className="font-mono text-slate-600">${transaction.initialQuote.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-end mb-1">
               <span className="text-sm font-bold text-slate-700">最終請款金額</span>
               <span className="font-mono text-2xl font-bold text-blue-600">${transaction.amount.toLocaleString()}</span>
             </div>
             <div className="flex justify-end items-center gap-2">
               <span className={clsx("text-xs font-bold px-2 py-0.5 rounded", costDiff > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>
                 {costDiff > 0 ? '+' : ''}{costDiffPercent.toFixed(1)}% 差異
               </span>
             </div>
          </div>
        </div>
      </div>

      {/* Before / After Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[500px]">
        <MediaGallery title="施工前 (Before)" items={transaction.photosBefore} />
        <MediaGallery title="完工驗收 (After)" items={transaction.photosAfter} />
      </div>

      {/* Approval & Feedback Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText size={20} /> 驗收審核與評語
          </h3>
        </div>
        <div className="p-6">
           {localStatus === TransactionStatus.PENDING_APPROVAL ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">主管評語 (Feedback)</label>
                    <textarea 
                      className="w-full border border-slate-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="請輸入針對此案件的工藝品質、配合度等具體評價..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">本次評分 (1-5)</label>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button 
                            key={star}
                            onClick={() => setRating(star)}
                            className={clsx("p-2 rounded-full transition", star <= rating ? "text-yellow-400 bg-yellow-50" : "text-slate-300")}
                          >
                            <ThumbsUp size={24} fill={star <= rating ? "currentColor" : "none"} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col justify-center gap-4 border-l border-slate-100 pl-6">
                   <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-2">
                      <p className="font-bold mb-1"><InfoIcon size={16} className="inline mr-1"/> 審核說明</p>
                      通過驗收後，此工單將自動進入財務的「待撥款」清單。
                   </div>
                   <button 
                    onClick={handleApprove}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 transition"
                   >
                     <CheckCircle size={20} /> 通過驗收 (Approve)
                   </button>
                   <button 
                    onClick={handleReject}
                    className="w-full py-3 bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 rounded-lg font-bold flex items-center justify-center gap-2 transition"
                   >
                     <XCircle size={20} /> 退回重做 (Reject)
                   </button>
                </div>
             </div>
           ) : (
             <div className="flex items-start gap-4">
               <div className="flex-1">
                 <p className="text-sm font-bold text-slate-500 mb-1">審核結果</p>
                 <StatusBadge status={localStatus || TransactionStatus.IN_PROGRESS} />
                 
                 {transaction.managerFeedback && (
                   <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                     <p className="text-xs font-bold text-slate-400 mb-1">主管評語</p>
                     <p className="text-slate-800">{transaction.managerFeedback}</p>
                   </div>
                 )}
               </div>
               <div className="text-right">
                  <p className="text-sm text-slate-400 mb-1">審核日期</p>
                  <p className="font-medium">{transaction.approvalDate || new Date().toISOString().split('T')[0]}</p>
                  <p className="text-sm text-slate-400 mt-2 mb-1">評分</p>
                  <div className="flex text-yellow-400 justify-end">
                    {Array.from({ length: transaction.qualityRating || rating }).map((_, i) => <ThumbsUp key={i} size={16} fill="currentColor" />)}
                  </div>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Acceptance Report & Knowledge Base Extraction (New Feature) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 border-b border-blue-500 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2">
               <BookOpen size={20} /> 驗收報告與知識庫
            </h3>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">AI Assisted</span>
         </div>
         <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">驗收總結報告</label>
                     <textarea 
                        className="w-full border border-slate-300 rounded-lg p-3 h-48 focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50"
                        placeholder="請貼上或輸入詳細的驗收狀況描述，AI 將協助提取可再利用的知識與常見問題..."
                        value={reportContent}
                        onChange={(e) => setReportContent(e.target.value)}
                     />
                  </div>
                  <button 
                     onClick={handleGenerateQA}
                     disabled={isGeneratingQA || !reportContent.trim()}
                     className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2 w-full md:w-auto justify-center"
                  >
                     {isGeneratingQA ? <Sparkles className="animate-spin" size={18}/> : <Bot size={18}/>}
                     {isGeneratingQA ? 'AI 生成中...' : '生成 QA 並提取知識'}
                  </button>
               </div>

               <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative min-h-[250px]">
                  {!generatedQA.length && !isGeneratingQA && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                        <Bot size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">尚未生成知識內容</p>
                     </div>
                  )}

                  {isGeneratingQA && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-500">
                        <Sparkles size={32} className="mb-2 animate-bounce" />
                        <p className="text-sm font-bold">正在分析報告內容...</p>
                     </div>
                  )}

                  {generatedQA.length > 0 && (
                     <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="font-bold text-slate-800 flex items-center gap-2"><Sparkles size={16} className="text-yellow-500"/> 建議收錄的 QA</h4>
                        </div>
                        {generatedQA.map((qa, idx) => (
                           <div key={qa.id} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                              <p className="font-bold text-slate-800 text-sm mb-1">Q: {qa.question}</p>
                              <p className="text-slate-600 text-xs mb-2">A: {qa.answer}</p>
                              <div className="flex gap-1">
                                 {qa.tags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">#{tag}</span>
                                 ))}
                              </div>
                           </div>
                        ))}
                        
                        {!isSavedToKB ? (
                           <button 
                              onClick={handleSaveToKB}
                              className="w-full py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 mt-4"
                           >
                              <Save size={16} /> 確認存入知識庫
                           </button>
                        ) : (
                           <div className="text-center py-2 text-green-600 font-bold flex items-center justify-center gap-2 mt-4 bg-green-50 rounded-lg border border-green-200">
                              <CheckCircle size={16} /> 已成功收錄
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const InfoIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);
