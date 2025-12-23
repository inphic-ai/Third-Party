
import React, { useState } from 'react';
import { ContactWindow, Vendor, ContactLog, ContactStatus } from '../types';
import { MOCK_SYSTEM_TAGS } from '../constants';
import { useTutorial } from './TutorialSystem';
import { Phone, CalendarCheck, DollarSign, Package, Tag, Sparkles, Bot, Save, X } from 'lucide-react';
import { clsx } from 'clsx';

export const ContactLogModal: React.FC<{ 
  contact: ContactWindow; 
  initialIsReservation?: boolean;
  onClose: () => void; 
  vendor: Vendor 
}> = ({ contact, initialIsReservation = false, onClose, vendor }) => {
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState('');
  
  // Reservation States
  const [isReservation, setIsReservation] = useState(initialIsReservation);
  const [resDate, setResDate] = useState(new Date().toISOString().split('T')[0]);
  const [resTime, setResTime] = useState('10:00');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [productId, setProductId] = useState('');

  // Tutorial Hook
  const { showTutorial } = useTutorial();

  const handleAiSummarize = () => {
    if (!note.trim()) return;
    setIsProcessing(true);
    // Simulate AI
    setTimeout(() => {
       setGeneratedSummary("1. 確認可於週末進場施工。\n2. 報價需重新評估，預計週五前回覆。\n3. 注意停車問題。");
       setIsProcessing(false);
    }, 1200);
  };

  const handleAddTag = (tag: string) => {
    setNote(prev => prev ? `${prev} ${tag}` : tag);
  };

  const handleSave = () => {
    // Append product ID to note as a hashtag for KB searching
    const finalNote = productId ? `${note} #${productId}` : note;

    // Create new log object
    const newLog: ContactLog = {
      id: `L-new-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: isReservation ? ContactStatus.RESERVED : ContactStatus.SUCCESS,
      note: finalNote,
      aiSummary: generatedSummary,
      nextFollowUp: isReservation ? resDate : undefined,
      isReservation: isReservation,
      reservationTime: isReservation ? resTime : undefined,
      quoteAmount: isReservation && quoteAmount ? Number(quoteAmount) : undefined,
      relatedProductId: isReservation ? productId : undefined
    };

    // Push to mock data (in real app, this would be an API call)
    vendor.contactLogs.unshift(newLog);
    onClose();
  };

  const handleCloseAttempt = async () => {
    // Only warn if it's a regular contact log (not reservation) and empty
    if (!isReservation && !note.trim()) {
      const result = await showTutorial('CONTACT_LOG_MISSING');
      
      if (result === 'confirm') {
        if (vendor) {
          vendor.missedContactLogCount = (vendor.missedContactLogCount || 0) + 1;
        }
        onClose();
      }
    } else {
      onClose();
    }
  };

  // When opening reservation log, unmask the phone automatically
  const contactPhone = contact.mobile || vendor.mainPhone;

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4">
       <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
         <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
           <h2 className="text-lg font-bold flex items-center gap-2">
             <Phone size={20} /> 聯繫詳情
           </h2>
           <button onClick={handleCloseAttempt} className="text-slate-400 hover:text-white"><X size={24}/></button>
         </div>

         <div className="p-6">
           <div className="mb-6 text-center">
             <p className="text-sm text-slate-500 mb-1">正在聯繫</p>
             <h3 className="text-2xl font-bold text-slate-800">{contact.name} ({contact.role})</h3>
             
             {/* Phone Number Display */}
             <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-mono font-bold text-xl border border-blue-200">
                {contactPhone || "無號碼"}
                <Phone size={16} className="animate-pulse" />
             </div>
             <p className="text-[10px] text-slate-400 mt-1">系統將自動記錄此次聯繫意圖</p>
           </div>

           <div className="space-y-4">
             {/* Reservation Toggle */}
             <div className={clsx("border rounded-xl p-4 transition-all", isReservation ? "bg-orange-50 border-orange-300" : "bg-white border-slate-200")}>
               <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                     <input type="checkbox" className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" checked={isReservation} onChange={(e) => setIsReservation(e.target.checked)} />
                     確認預約 / 場勘 / 施工
                  </label>
                  {isReservation && <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded font-bold">RESERVATION</span>}
               </div>
               
               {isReservation && (
                 <div className="grid grid-cols-2 gap-3 mt-3 animate-in slide-in-from-top-2 duration-200">
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">預約日期</label>
                       <div className="relative">
                          <CalendarCheck size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-500"/>
                          <input type="date" value={resDate} onChange={(e) => setResDate(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">預約時間</label>
                       <input type="time" value={resTime} onChange={(e) => setResTime(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                    </div>
                    <div className="col-span-2">
                       <label className="block text-xs font-bold text-slate-500 mb-1">預估報價 (若有)</label>
                       <div className="relative">
                          <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                          <input type="number" placeholder="輸入金額..." value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                       </div>
                    </div>
                    {/* New Product ID Field */}
                    <div className="col-span-2">
                       <label className="block text-xs font-bold text-slate-500 mb-1">商品/專案編號 (Product ID/SKU)</label>
                       <div className="relative">
                          <Package size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-500"/>
                          <input 
                            type="text" 
                            placeholder="例如：P-2024-001 (將自動標記於知識庫)" 
                            value={productId} 
                            onChange={(e) => setProductId(e.target.value)} 
                            className="w-full pl-8 pr-2 py-1.5 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" 
                          />
                       </div>
                    </div>
                 </div>
               )}
             </div>

             <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">智慧標籤 (快速填寫)</label>
               <div className="flex flex-wrap gap-2 mb-3">
                 {MOCK_SYSTEM_TAGS.contactTags.map(tag => (
                   <button
                     key={tag}
                     onClick={() => handleAddTag(tag)}
                     className="px-3 py-1.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 rounded-full text-xs text-slate-600 transition flex items-center gap-1 border border-slate-200 shadow-sm"
                   >
                     <Tag size={10} /> {tag}
                   </button>
                 ))}
               </div>

               <label className="block text-sm font-bold text-slate-700 mb-2">聯繫筆記</label>
               <textarea 
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="紀錄對話重點..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
               />
               <button 
                 onClick={handleAiSummarize}
                 disabled={isProcessing || !note}
                 className="mt-2 text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 font-bold disabled:opacity-50"
               >
                 <Sparkles size={12} /> {isProcessing ? "AI 分析中..." : "AI 協助整理重點"}
               </button>
             </div>

             {generatedSummary && (
               <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-sm text-slate-700">
                 <div className="flex items-center gap-2 font-bold text-purple-800 mb-1">
                   <Bot size={14} /> AI 摘要建議
                 </div>
                 <pre className="whitespace-pre-wrap font-sans text-xs">{generatedSummary}</pre>
               </div>
             )}

             <div className="flex gap-3 pt-2">
                <button onClick={handleCloseAttempt} className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">取消</button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2"
                >
                   <Save size={16} /> {isReservation ? "建立預約並儲存" : "儲存紀錄"}
                </button>
             </div>
           </div>
         </div>
       </div>
    </div>
  );
};
