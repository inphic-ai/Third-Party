
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, Form, useNavigation } from "@remix-run/react";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Search, Filter, Plus, MapPin, ChevronRight, ChevronLeft, 
  History, X, Camera, Upload, CheckCircle2, Save, Maximize2, Tag, MessageSquare,
  Check
} from "lucide-react";
import { clsx } from "clsx";
import { db } from "../services/db.server";
import { MaintenanceStatus } from "../types";

// 常見產品標籤
const PRODUCT_TAG_OPTIONS = ['空調', '電力', '水路', '裝修', '家具', '網路', '安控', '結構', '玻璃'];

/**
 * Remix Loader: 在伺服器端運行
 * 從 Postgres 讀取資料並預處理 R2 連結
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const tagFilter = url.searchParams.get("tag") || "";
  
  const allRecords = await db.maintenance.findMany();
  
  // 伺服器端過濾邏輯
  const filtered = allRecords.filter(r => {
    const matchesSearch = r.deviceName.includes(q) || r.vendorName.includes(q);
    const matchesTag = tagFilter ? r.productTags.includes(tagFilter) : true;
    return matchesSearch && matchesTag;
  });

  return json({ records: filtered, q, tagFilter });
}

/**
 * Remix Action: 處理資料寫入與 R2 授權
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const _action = formData.get("_action");

  if (_action === "create_record") {
    const data = {
      deviceName: formData.get("deviceName"),
      productTags: formData.getAll("productTags"),
      // 其他欄位...
    };
    await db.maintenance.create(data);
    return json({ success: true });
  }
  return null;
}

export default function MaintenancePage() {
  const { records, q, tagFilter } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // 相簿狀態
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [activePhotoType, setActivePhotoType] = useState<'before' | 'after'>('before');

  const openGallery = (index: number, type: 'before' | 'after') => {
    setActivePhotoIndex(index);
    setActivePhotoType(type);
  };

  const activePhotos = useMemo(() => {
    if (!selectedRecord) return [];
    return activePhotoType === 'before' ? selectedRecord.beforePhotos : selectedRecord.afterPhotos;
  }, [selectedRecord, activePhotoType]);

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      
      {/* 1. 頂部操作與篩選 */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6 flex-1 w-full">
           <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg"><History size={28}/></div>
           <Form method="get" className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" size={20} />
              <input 
                name="q"
                defaultValue={q}
                placeholder="搜尋設備關鍵字、廠商..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all"
              />
           </Form>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all active:scale-95"
           >
             <Plus size={20} /> 新增維修紀錄
           </button>
        </div>
      </div>

      {/* 2. 資料清單 (含產品標籤顯示) */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-6">維修日期</th>
              <th className="px-10 py-6">設備 / 產品標籤</th>
              <th className="px-10 py-6">承辦廠商</th>
              <th className="px-10 py-6">狀態</th>
              <th className="px-10 py-6 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.map((record: any) => (
              <tr 
                key={record.id} 
                className="group hover:bg-indigo-50/30 transition-colors cursor-pointer"
                onClick={() => setSelectedRecord(record)}
              >
                <td className="px-10 py-8 font-black text-slate-800 font-mono">{record.date}</td>
                <td className="px-10 py-8">
                  <div className="flex flex-col gap-2">
                    <span className="font-extrabold text-slate-800 text-lg tracking-tight group-hover:text-indigo-600">{record.deviceName}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {record.productTags?.map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-10 py-8 font-bold text-slate-600">{record.vendorName}</td>
                <td className="px-10 py-8">
                   <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100 uppercase tracking-widest">{record.status}</span>
                </td>
                <td className="px-10 py-8 text-right">
                   <div className="p-2.5 bg-slate-50 text-slate-300 rounded-xl group-hover:bg-white group-hover:text-indigo-600 transition-all"><ChevronRight size={20}/></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. 維修詳情 Modal (相簿模式：多圖 + 敘述) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedRecord.deviceName}</h3>
                  <span className="text-slate-300 font-mono text-sm">#{selectedRecord.caseId}</span>
               </div>
               <button onClick={() => setSelectedRecord(null)} className="p-2 text-slate-300 hover:text-slate-800 transition-all"><X size={32} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-slate-50/30 custom-scrollbar">
               {/* 維修前影像列表 */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                        <Camera className="text-rose-500" /> 維修前現況相簿 (R2 Signed Storage)
                     </h4>
                     <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded border border-slate-100">{selectedRecord.beforePhotos.length} 張</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     {selectedRecord.beforePhotos.map((photo: any, idx: number) => (
                        <div key={photo.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm group hover:shadow-xl transition-all">
                           <div onClick={() => openGallery(idx, 'before')} className="aspect-square cursor-pointer overflow-hidden bg-slate-200">
                              <img src={photo.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 size={24}/></div>
                           </div>
                           <div className="p-4 bg-white border-t border-slate-50">
                              <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">現場紀錄描述</label>
                              <textarea 
                                className="w-full bg-slate-50 border-none rounded-xl p-2 text-xs font-bold h-16 resize-none focus:ring-2 focus:ring-indigo-500/10" 
                                placeholder="輸入此影像的特定說明..."
                                defaultValue={photo.description}
                              />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* 維修後影像列表 */}
               <div className="space-y-6">
                  <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                     <Upload className="text-emerald-500" /> 維修後完工相簿 (Multiple Evidence)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     {selectedRecord.afterPhotos.map((photo: any, idx: number) => (
                        <div key={photo.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm group hover:shadow-xl transition-all">
                           <div onClick={() => openGallery(idx, 'after')} className="aspect-square cursor-pointer overflow-hidden bg-slate-200">
                              <img src={photo.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 size={24}/></div>
                           </div>
                           <div className="p-4 bg-white border-t border-slate-50">
                              <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">完工品質標註</label>
                              <textarea 
                                className="w-full bg-slate-50 border-none rounded-xl p-2 text-xs font-bold h-16 resize-none focus:ring-2 focus:ring-indigo-500/10" 
                                placeholder="輸入完工說明..."
                                defaultValue={photo.description}
                              />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-white">
               <button onClick={() => setSelectedRecord(null)} className="px-10 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">關閉</button>
               <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"><Save size={18}/> 儲存所有敘述變更</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 相簿全螢幕燈箱切換 */}
      {activePhotoIndex !== null && (
         <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex flex-col animate-in fade-in">
            <div className="p-8 flex justify-between items-center text-white">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">R2 Dynamic Signed Viewer</span>
                  <h4 className="text-lg font-black">{activePhotoType === 'before' ? '維修前' : '維修後'} 影像檢視 ({activePhotoIndex + 1} / {activePhotos.length})</h4>
               </div>
               <button onClick={() => setActivePhotoIndex(null)} className="p-3 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"><X size={48}/></button>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center px-20">
               <button 
                 disabled={activePhotoIndex === 0}
                 onClick={() => setActivePhotoIndex(activePhotoIndex - 1)}
                 className="absolute left-10 p-6 text-white/30 hover:text-white disabled:opacity-0 transition-all"
               >
                 <ChevronLeft size={64} />
               </button>

               <div className="max-w-6xl w-full h-full flex flex-col items-center justify-center">
                  <img src={activePhotos[activePhotoIndex].url} className="max-h-[70vh] object-contain rounded-3xl shadow-2xl border-4 border-white/5 animate-in zoom-in-95 duration-500"/>
                  {activePhotos[activePhotoIndex].description && (
                     <div className="mt-10 bg-white/5 backdrop-blur-xl border border-white/10 px-10 py-6 rounded-[2rem] text-white font-bold text-xl max-w-3xl text-center">
                       {activePhotos[activePhotoIndex].description}
                     </div>
                  )}
               </div>

               <button 
                 disabled={activePhotoIndex === activePhotos.length - 1}
                 onClick={() => setActivePhotoIndex(activePhotoIndex + 1)}
                 className="absolute right-10 p-6 text-white/30 hover:text-white disabled:opacity-0 transition-all"
               >
                 <ChevronRight size={64} />
               </button>
            </div>

            <div className="h-28 bg-black/40 border-t border-white/5 flex items-center justify-center gap-4 px-10">
               {activePhotos.map((p: any, idx: number) => (
                  <button 
                    key={p.id} 
                    onClick={() => setActivePhotoIndex(idx)} 
                    className={clsx(
                      "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300", 
                      activePhotoIndex === idx ? "border-indigo-500 scale-110 shadow-lg" : "border-transparent opacity-30 hover:opacity-100"
                    )}
                  >
                    <img src={p.url} className="w-full h-full object-cover"/>
                  </button>
               ))}
            </div>
         </div>
      )}

      {/* 5. 新增維修紀錄 Modal (含產品標籤勾選) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
           <Form method="post" className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <input type="hidden" name="_action" value="create_record" />
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                 <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">建立維修單據</h3>
                 <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-4 text-slate-300 hover:text-slate-800 transition-all"><X size={32} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/50">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">設備名稱</label>
                       <input name="deviceName" type="text" required className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner" placeholder="輸入設備全名..." />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">產品分類標籤 (勾選勾選區)</label>
                       <div className="flex flex-wrap gap-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-inner">
                          {PRODUCT_TAG_OPTIONS.map(tag => (
                             <label key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-indigo-100">
                                <input type="checkbox" name="productTags" value={tag} className="w-4 h-4 text-indigo-600 rounded" />
                                <span className="text-xs font-black text-slate-600">{tag}</span>
                             </label>
                          ))}
                       </div>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">上傳初步證據影像</label>
                    <div className="grid grid-cols-4 gap-4">
                       <div className="aspect-square border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 hover:border-indigo-300 hover:text-indigo-400 transition-all bg-white group cursor-pointer">
                          <Plus size={32} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest mt-2">Before</span>
                       </div>
                       <div className="aspect-square border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 hover:border-emerald-300 hover:text-emerald-400 transition-all bg-white group cursor-pointer">
                          <Plus size={32} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest mt-2">After</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-10 border-t border-slate-100 bg-white flex gap-6 shrink-0">
                 <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-5 bg-slate-50 text-slate-500 font-black rounded-[1.5rem] hover:bg-slate-100 transition-all uppercase tracking-widest text-xs">取消</button>
                 <button type="submit" className="flex-1 py-5 bg-slate-900 text-white font-black rounded-[1.5rem] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                    <Save size={20} /> 儲存至 Postgres 資料庫
                 </button>
              </div>
           </Form>
        </div>
      )}
    </div>
  );
}
