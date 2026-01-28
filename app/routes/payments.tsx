import { useState, useMemo, useRef, useEffect } from 'react';
import type { MetaFunction } from "@remix-run/node";
import { 
  Search, LayoutGrid, List, FilePlus, Tag, Calendar, 
  DollarSign, ImageIcon, Download, Trash2, ChevronRight, 
  X, Maximize2, Camera, ChevronLeft, MoreHorizontal, ChevronDown,
  Edit3, FileSignature, RefreshCw, ImagePlus, FileText, Plus,
  Layers, CheckCircle2, AlertCircle, Save, Coins, ArrowRightLeft,
  Briefcase, Filter, TrendingUp, HandCoins, Activity, Clock
} from 'lucide-react';
import { clsx } from 'clsx';

import { Pagination } from '~/components/Pagination';
import { ClientOnly } from '~/components/ClientOnly';
import { MOCK_INVOICES, MOCK_VENDORS } from '~/constants';
import { PaymentStatus, InvoiceRecord } from '~/types';

export const meta: MetaFunction = () => {
  return [
    { title: "請款與發票管理 - PartnerLink Pro" },
    { name: "description", content: "管理請款單據與付款狀態" },
  ];
};

type ViewMode = 'GRID' | 'LIST';
type DocType = 'INVOICE' | 'LABOR_FORM';
type Currency = 'TWD' | 'CNY';

interface AttachmentItem {
  id: string;
  url: string;
  description: string;
}

function PaymentsContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currency, setCurrency] = useState<Currency>('TWD');
  const exchangeRate = 4.5; 

  // --- 時間篩選狀態 ---
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Form states
  const [editingDocType, setEditingDocType] = useState<DocType>('INVOICE');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  // 監聽外部點擊以關閉日期選擇器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- 核心過濾邏輯 (包含日期區間) ---
  const filteredInvoices = useMemo(() => {
    return MOCK_INVOICES.filter(inv => {
      const matchesSearch = inv.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      
      // 日期區間判斷
      const matchesStartDate = startDate ? inv.date >= startDate : true;
      const matchesEndDate = endDate ? inv.date <= endDate : true;

      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [searchTerm, statusFilter, startDate, endDate]);

  // --- 數據統計 (與過濾後的資料聯動) ---
  const statsSummary = useMemo(() => {
    let total = 0;
    let pending = 0;
    let billed = 0;
    let paid = 0;

    filteredInvoices.forEach(inv => {
      total += inv.amount;
      if (inv.status === PaymentStatus.PENDING) pending += inv.amount;
      if (inv.status === PaymentStatus.BILLED) billed += inv.amount;
      if (inv.status === PaymentStatus.PAID) paid += inv.amount;
    });

    const pendingCount = filteredInvoices.filter(i => i.status === PaymentStatus.PENDING).length;
    const billedCount = filteredInvoices.filter(i => i.status === PaymentStatus.BILLED).length;
    const paidCount = filteredInvoices.filter(i => i.status === PaymentStatus.PAID).length;

    return { total, pending, billed, paid, pendingCount, billedCount, paidCount };
  }, [filteredInvoices]);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const formatAmount = (val: number) => {
    if (currency === 'CNY') {
      return (val / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val.toLocaleString();
  };

  const handleStatusToggle = (targetStatus: string) => {
    const nextStatus = statusFilter === targetStatus ? 'ALL' : targetStatus;
    setStatusFilter(nextStatus);
    setCurrentPage(1);
  };

  const handleOpenEdit = (inv: InvoiceRecord) => {
    setSelectedInvoice(inv);
    setAttachments([{ id: '1', url: inv.attachmentUrl, description: '主要發票單據正本' }]);
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    setSelectedInvoice(null);
    setAttachments([]);
    setShowModal(true);
  };

  // 快速日期選擇
  const setQuickDate = (type: 'THIS_MONTH' | 'LAST_30' | 'THIS_YEAR' | 'CLEAR') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (type === 'CLEAR') {
      setStartDate(''); setEndDate('');
    } else if (type === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay); setEndDate(todayStr);
    } else if (type === 'LAST_30') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(thirtyDaysAgo); setEndDate(todayStr);
    } else if (type === 'THIS_YEAR') {
      const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      setStartDate(firstDay); setEndDate(todayStr);
    }
    setIsDatePickerOpen(false);
    setCurrentPage(1);
  };

  const statusStyles: Record<PaymentStatus, { bg: string; text: string; label: string; ring: string }> = {
    [PaymentStatus.PAID]: { bg: 'bg-emerald-500', text: 'text-emerald-600', label: '已付款', ring: 'ring-emerald-100' },
    [PaymentStatus.BILLED]: { bg: 'bg-indigo-500', text: 'text-indigo-600', label: '已請款', ring: 'ring-indigo-100' },
    [PaymentStatus.PENDING]: { bg: 'bg-amber-500', text: 'text-amber-600', label: '未請款', ring: 'ring-amber-100' },
  };

  return (
    <div className="flex flex-col space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. 頂部數據看板 (Pulse Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div 
           onClick={() => handleStatusToggle('ALL')}
           className={clsx(
             "p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer transition-all duration-300",
             statusFilter === 'ALL' ? "bg-slate-900 scale-[1.02] ring-4 ring-slate-200" : "bg-slate-800 opacity-80 hover:opacity-100"
           )}
         >
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20"><TrendingUp size={20} className="text-emerald-400" /></div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Flow</div>
               </div>
               <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">累積總額 ({currency})</p>
               <h3 className="text-3xl font-black tracking-tighter">${formatAmount(statsSummary.total)}</h3>
            </div>
            <Activity className="absolute -bottom-10 -right-10 text-white opacity-[0.03] w-48 h-48" />
         </div>

         <div 
           onClick={() => handleStatusToggle(PaymentStatus.PENDING)}
           className={clsx(
             "p-8 rounded-[2.5rem] border transition-all cursor-pointer group shadow-sm hover:shadow-xl",
             statusFilter === PaymentStatus.PENDING ? "bg-amber-50 border-amber-200 ring-2 ring-amber-500 scale-[1.02]" : "bg-white border-slate-100 hover:border-amber-200"
           )}
         >
            <div className="flex justify-between items-start mb-6">
               <div className={clsx("p-3 rounded-2xl transition-colors duration-500", statusFilter === PaymentStatus.PENDING ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white")}><HandCoins size={20} /></div>
               <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">未請款待補</span>
            </div>
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">應收單據水位</p>
            <div className="flex items-end justify-between">
               <h3 className="text-3xl font-black text-slate-800 tracking-tighter">${formatAmount(statsSummary.pending)}</h3>
               <div className="text-sm font-black text-slate-400 mb-1">{statsSummary.pendingCount} 筆</div>
            </div>
         </div>

         <div 
           onClick={() => handleStatusToggle(PaymentStatus.BILLED)}
           className={clsx(
             "p-8 rounded-[2.5rem] border transition-all cursor-pointer group shadow-sm hover:shadow-xl",
             statusFilter === PaymentStatus.BILLED ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500 scale-[1.02]" : "bg-white border-slate-100 hover:border-indigo-200"
           )}
         >
            <div className="flex justify-between items-start mb-6">
               <div className={clsx("p-3 rounded-2xl transition-colors duration-500", statusFilter === PaymentStatus.BILLED ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white")}><FileSignature size={20} /></div>
               <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">已核准待撥</span>
            </div>
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">處理中資金水位</p>
            <div className="flex items-end justify-between">
               <h3 className="text-3xl font-black text-slate-800 tracking-tighter">${formatAmount(statsSummary.billed)}</h3>
               <div className="text-sm font-black text-slate-400 mb-1">{statsSummary.billedCount} 筆</div>
            </div>
         </div>

         <div 
           onClick={() => handleStatusToggle(PaymentStatus.PAID)}
           className={clsx(
             "p-8 rounded-[2.5rem] border transition-all cursor-pointer group shadow-sm hover:shadow-xl",
             statusFilter === PaymentStatus.PAID ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500 scale-[1.02]" : "bg-white border-slate-100 hover:border-emerald-200"
           )}
         >
            <div className="flex justify-between items-start mb-6">
               <div className={clsx("p-3 rounded-2xl transition-colors duration-500", statusFilter === PaymentStatus.PAID ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white")}><CheckCircle2 size={20} /></div>
               <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">已結案支出</span>
            </div>
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">實際完成支付額</p>
            <div className="flex items-end justify-between">
               <h3 className="text-3xl font-black text-slate-800 tracking-tighter">${formatAmount(statsSummary.paid)}</h3>
               <div className="text-sm font-black text-slate-400 mb-1">{statsSummary.paidCount} 筆</div>
            </div>
         </div>
      </div>

      {/* 2. 過濾與操作列 */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 md:min-w-[18rem] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="搜尋廠商、單號..."
              className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur rounded-[1.2rem] border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 shadow-sm text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 時間篩選器 Popover */}
          <div className="relative" ref={datePickerRef}>
            <button 
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className={clsx(
                "flex items-center gap-3 px-6 py-3 rounded-[1.2rem] border transition-all font-bold text-sm shadow-sm whitespace-nowrap",
                (startDate || endDate) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
              )}
            >
              <Calendar size={18} />
              {startDate || endDate ? `${startDate || '開始'} 至 ${endDate || '現在'}` : '所有時間'}
              <ChevronDown size={14} className={clsx("transition-transform", isDatePickerOpen && "rotate-180")} />
            </button>

            {isDatePickerOpen && (
              <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-[60] animate-in fade-in slide-in-from-top-2">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">日期區間篩選</h4>
                 <div className="space-y-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">開始日期</label>
                       <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full border border-slate-100 bg-slate-50 p-3 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">結束日期</label>
                       <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full border border-slate-100 bg-slate-50 p-3 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10" />
                    </div>
                    <div className="pt-2 grid grid-cols-2 gap-2">
                       <button onClick={() => setQuickDate('THIS_MONTH')} className="py-2 bg-slate-50 hover:bg-indigo-50 text-[10px] font-black text-slate-600 hover:text-indigo-600 rounded-lg transition-colors uppercase tracking-widest">本月</button>
                       <button onClick={() => setQuickDate('LAST_30')} className="py-2 bg-slate-50 hover:bg-indigo-50 text-[10px] font-black text-slate-600 hover:text-indigo-600 rounded-lg transition-colors uppercase tracking-widest">近 30 天</button>
                       <button onClick={() => setQuickDate('THIS_YEAR')} className="py-2 bg-slate-50 hover:bg-indigo-50 text-[10px] font-black text-slate-600 hover:text-indigo-600 rounded-lg transition-colors uppercase tracking-widest">今年</button>
                       <button onClick={() => setQuickDate('CLEAR')} className="py-2 bg-rose-50 hover:bg-rose-100 text-[10px] font-black text-rose-600 rounded-lg transition-colors uppercase tracking-widest">清除</button>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* 幣別切換 */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => setCurrency('TWD')} 
              className={clsx("px-4 py-2 rounded-lg text-xs font-black transition-all", currency === 'TWD' ? "bg-slate-900 text-white" : "text-slate-400")}
            >
              TWD
            </button>
            <button 
              onClick={() => setCurrency('CNY')} 
              className={clsx("px-4 py-2 rounded-lg text-xs font-black transition-all", currency === 'CNY' ? "bg-red-600 text-white" : "text-slate-400")}
            >
              CNY
            </button>
          </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
           <div className="flex bg-white/70 backdrop-blur p-1.5 rounded-[1.2rem] border border-slate-100 shadow-sm">
              <button onClick={() => setViewMode('LIST')} className={clsx("p-2.5 rounded-xl transition-all", viewMode === 'LIST' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600")}><List size={20} /></button>
              <button onClick={() => setViewMode('GRID')} className={clsx("p-2.5 rounded-xl transition-all", viewMode === 'GRID' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600")}><LayoutGrid size={20} /></button>
           </div>
           <button onClick={handleOpenCreate} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-3 bg-slate-900 text-white rounded-[1.2rem] font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-indigo-600 transition-all active:scale-95">
             <FilePlus size={16} /> 建立單據
           </button>
        </div>
      </div>

      {/* 3. 數據展示區 */}
      <div className="flex-1 min-h-[400px]">
        {filteredInvoices.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[3rem] bg-white/40">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6"><Search size={40} className="text-slate-200" /></div>
             <p className="text-lg font-black text-slate-400 uppercase tracking-widest">查無對應請款單據</p>
             <button onClick={() => { setQuickDate('CLEAR'); setStatusFilter('ALL'); setSearchTerm(''); }} className="mt-4 text-indigo-600 font-bold hover:underline">重置過濾條件</button>
          </div>
        ) : (
          <>
            {viewMode === 'GRID' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedInvoices.map(inv => (
                  <div 
                    key={inv.id} 
                    className="bg-white rounded-[3rem] p-10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative border border-slate-100 cursor-pointer" 
                    onClick={() => handleOpenEdit(inv)}
                  >
                    <div className="flex justify-between items-start mb-8">
                       <span className={clsx(
                         "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border text-white border-white/20", 
                         statusStyles[inv.status].bg
                       )}>
                         {statusStyles[inv.status].label}
                       </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-8 group-hover:text-indigo-600 transition-colors line-clamp-1">{inv.vendorName}</h3>
                    <div className="space-y-4 mb-10">
                       <div className="flex items-center gap-3 text-slate-400 font-bold text-sm"><Tag size={18} className="text-indigo-400" /><span className="font-mono tracking-wider">{inv.invoiceNo}</span></div>
                       <div className="flex items-center gap-3 text-slate-400 font-bold text-sm"><Calendar size={18} className="text-indigo-400" /><span>{inv.date}</span></div>
                    </div>
                    <div className="flex items-end justify-between pt-8 border-t border-slate-50">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">請款金額 ({currency})</span>
                          <div className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-1">
                             <span className="text-xs font-bold text-slate-300">{currency}</span>
                             {formatAmount(inv.amount)}
                          </div>
                       </div>
                       <div className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg group-hover:scale-110">
                          <ChevronRight size={20} />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50/50 border-b border-slate-100">
                         <tr className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">
                            <th className="px-10 py-6">狀態</th>
                            <th className="px-10 py-6">廠商名稱</th>
                            <th className="px-10 py-6">發票編號</th>
                            <th className="px-10 py-6">日期</th>
                            <th className="px-10 py-6 text-right">請款總額 ({currency})</th>
                            <th className="px-10 py-6 w-20"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {paginatedInvoices.map(inv => (
                            <tr key={inv.id} className="group hover:bg-indigo-50/30 transition-colors cursor-pointer" onClick={() => handleOpenEdit(inv)}>
                               <td className="px-10 py-8">
                                 <span className={clsx("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm", statusStyles[inv.status].bg)}>
                                   {statusStyles[inv.status].label}
                                 </span>
                               </td>
                               <td className="px-10 py-8 font-black text-slate-800 text-lg tracking-tight group-hover:text-indigo-600 transition-colors">{inv.vendorName}</td>
                               <td className="px-10 py-8 font-mono font-bold text-slate-400 text-sm">{inv.invoiceNo}</td>
                               <td className="px-10 py-8 font-bold text-slate-400 text-sm">{inv.date}</td>
                               <td className="px-10 py-8 text-right font-black text-slate-800 text-xl tracking-tighter">${formatAmount(inv.amount)}</td>
                               <td className="px-10 py-8 text-right">
                                 <div className="p-2.5 bg-slate-50 text-slate-300 rounded-xl group-hover:text-indigo-600 group-hover:bg-white transition-all shadow-sm">
                                   <ChevronRight size={20} />
                                 </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. 分頁控制 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredInvoices.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemsPerPageOptions={[15, 30, 50]}
      />

      {/* 5. 單據建立/編輯 Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-lg">
                       {selectedInvoice ? <Edit3 size={28} /> : <FilePlus size={28} />}
                    </div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-800 tracking-tighter">
                         {selectedInvoice ? `編輯單據 - ${selectedInvoice.vendorName}` : '建立請款單據'}
                       </h3>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Invoice & Labor Remuneration System</p>
                    </div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-4 text-slate-300 hover:text-slate-800 transition-all">
                    <X size={32} />
                 </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                 <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 border-r border-slate-100">
                    <div className="mb-8 flex justify-between items-end">
                       <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={18} className="text-indigo-500" /> 附件影像管理</h4>
                       <label className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[11px] uppercase tracking-widest cursor-pointer hover:bg-indigo-600 hover:text-white transition-all">
                          <ImagePlus size={14} /> 新增附件
                          <input type="file" className="hidden" />
                       </label>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                       {attachments.map((att, idx) => (
                         <div key={att.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden flex flex-col group animate-in slide-in-from-bottom-2 shadow-sm">
                            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                               <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">0{idx + 1}</span>
                               <button className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={14} /></button>
                            </div>
                            <div className="relative aspect-video overflow-hidden bg-slate-200 cursor-pointer" onClick={() => setFullscreenImage(att.url)}>
                               <img src={att.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Evidence" />
                               <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Maximize2 className="text-white" size={40} /></div>
                            </div>
                            <div className="p-6">
                               <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none h-24 resize-none" placeholder="輸入單據說明..." defaultValue={att.description} />
                            </div>
                         </div>
                       ))}
                       {attachments.length === 0 && (
                         <div className="col-span-2 py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl">
                           <Camera size={48} className="text-slate-200 mb-4" />
                           <p className="text-sm font-bold text-slate-400">尚無附件，請點擊右上方新增</p>
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="w-full lg:w-[450px] bg-white p-10 overflow-y-auto shadow-2xl">
                    <div className="space-y-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">單據類型</label>
                          <div className="flex p-1.5 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                             <button onClick={() => setEditingDocType('INVOICE')} className={clsx("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", editingDocType === 'INVOICE' ? "bg-white text-indigo-600 shadow-md border" : "text-slate-400")}>統一發票</button>
                             <button onClick={() => setEditingDocType('LABOR_FORM')} className={clsx("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", editingDocType === 'LABOR_FORM' ? "bg-white text-amber-600 shadow-md border" : "text-slate-400")}>勞務報酬單</button>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">請款廠商/對象</label>
                          <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all">
                             <option>請選擇合作對象...</option>
                             {MOCK_VENDORS.map(v => (
                               <option key={v.id} value={v.name}>{v.name}</option>
                             ))}
                          </select>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">發票/單據編號</label>
                          <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none font-mono" placeholder="輸入單號..." defaultValue={selectedInvoice?.invoiceNo} />
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">金額 ({currency})</label>
                          <div className="relative">
                             <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                             <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-xl font-black text-slate-800 outline-none" placeholder="0" defaultValue={selectedInvoice?.amount} />
                          </div>
                       </div>

                       <div className="pt-6">
                          <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-start gap-4">
                             <AlertCircle className="text-indigo-500 shrink-0" size={20} />
                             <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                                上傳之附件影像將經由 AI 進行自動光學識別 (OCR)，若金額與輸入值不符，系統將會提出警示。
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-white flex flex-col md:flex-row justify-end gap-6 shrink-0">
                 <button onClick={() => setShowModal(false)} className="px-10 py-5 bg-slate-50 text-slate-500 font-black rounded-3xl hover:bg-slate-100 transition-all uppercase tracking-widest text-xs">取消操作</button>
                 <button onClick={() => setShowModal(false)} className="px-14 py-5 bg-slate-900 text-white font-black rounded-3xl shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-3"><Save size={18} /> 儲存並提交審核</button>
              </div>
           </div>
        </div>
      )}

      {/* 6. 全螢幕影像檢視器 */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-12 bg-slate-900/95 backdrop-blur-xl animate-in fade-in" onClick={() => setFullscreenImage(null)}>
           <button className="absolute top-10 right-10 p-6 text-white hover:scale-110 transition-transform"><X size={48} /></button>
           <img src={fullscreenImage} className="max-w-full max-h-full object-contain rounded-[3rem] shadow-2xl border-4 border-white/10" alt="Fullscreen" />
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <ClientOnly fallback={<div className="p-8 text-center text-slate-400">載入中...</div>}>
      <PaymentsContent />
    </ClientOnly>
  );
}
