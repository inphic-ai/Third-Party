import { useState, useMemo, useEffect, useRef } from 'react';
import { useLoaderData, useActionData, useNavigation, Form } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { db } from '../services/db.server';
import { invoiceRecords } from '../../db/schema/financial';
import { vendors } from '../../db/schema/vendor';
import { eq, desc } from 'drizzle-orm';
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
import { PaymentStatus } from '~/types';

export const meta: MetaFunction = () => {
  return [
    { title: "請款與發票管理 - PartnerLink Pro" },
    { name: "description", content: "管理請款單據與付款狀態" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const allInvoices = await db.select().from(invoiceRecords).orderBy(desc(invoiceRecords.date));
    const vendorList = await db.select({ id: vendors.id, name: vendors.name }).from(vendors);
    
    const invoicesWithMapping = allInvoices.map(invoice => ({
      id: invoice.id,
      vendorName: invoice.vendorName,
      maintenanceId: invoice.maintenanceId || undefined,
      amount: parseFloat(String(invoice.amount)),
      date: invoice.date.toISOString().split('T')[0],
      invoiceNo: invoice.invoiceNo,
      status: invoice.status,
      attachmentUrl: invoice.attachmentUrl,
    }));
    return json({ invoices: invoicesWithMapping, vendorList });
  } catch (error) {
    console.error('[Payments Loader] Error:', error);
    return json({ invoices: [], vendorList: [] });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'create' || intent === 'update') {
    try {
      const id = formData.get('id') as string;
      const vendorName = formData.get('vendorName') as string;
      const invoiceNo = formData.get('invoiceNo') as string;
      const amount = formData.get('amount') as string;
      const status = formData.get('status') as any;
      const attachmentUrl = formData.get('attachmentUrl') as string || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000';

      if (!vendorName || !invoiceNo || !amount) {
        return json({ success: false, error: '缺少必要欄位' }, { status: 400 });
      }

      const data = {
        vendorName,
        invoiceNo,
        amount: amount,
        status: status || 'PENDING',
        attachmentUrl,
        date: new Date(),
        createdBy: '00000000-0000-0000-0000-000000000000',
      };

      if (intent === 'create') {
        await db.insert(invoiceRecords).values(data as any);
      } else {
        await db.update(invoiceRecords).set(data as any).where(eq(invoiceRecords.id, id));
      }

      return json({ success: true, error: null });
    } catch (error) {
      console.error('Failed to save invoice:', error);
      return json({ success: false, error: '儲存失敗' }, { status: 500 });
    }
  }

  return json({ success: false, error: 'Invalid intent' }, { status: 400 });
}

type ViewMode = 'GRID' | 'LIST';
type DocType = 'INVOICE' | 'LABOR_FORM';
type Currency = 'TWD' | 'CNY';

interface AttachmentItem {
  id: string;
  url: string;
  description: string;
}

function PaymentsContent() {
  const { invoices: dbInvoices, vendorList } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currency, setCurrency] = useState<Currency>('TWD');
  const exchangeRate = 4.5; 

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const [editingDocType, setEditingDocType] = useState<DocType>('INVOICE');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  useEffect(() => {
    if (actionData?.success) {
      setShowModal(false);
    }
  }, [actionData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredInvoices = useMemo(() => {
    return dbInvoices.filter((inv: any) => {
      const matchesSearch = inv.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchesStartDate = startDate ? inv.date >= startDate : true;
      const matchesEndDate = endDate ? inv.date <= endDate : true;
      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [dbInvoices, searchTerm, statusFilter, startDate, endDate]);

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

    return { total, pending, billed, paid };
  }, [filteredInvoices]);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const formatAmount = (val: number) => {
    if (currency === 'CNY') {
      return (val / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val.toLocaleString();
  };

  const handleOpenEdit = (inv: any) => {
    setSelectedInvoice(inv);
    setAttachments([{ id: '1', url: inv.attachmentUrl, description: '主要發票單據正本' }]);
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    setSelectedInvoice(null);
    setAttachments([]);
    setShowModal(true);
  };

  const statusStyles: Record<string, { bg: string; text: string; label: string; ring: string }> = {
    [PaymentStatus.PAID]: { bg: 'bg-emerald-500', text: 'text-emerald-600', label: '已付款', ring: 'ring-emerald-100' },
    [PaymentStatus.BILLED]: { bg: 'bg-indigo-500', text: 'text-indigo-600', label: '已請款', ring: 'ring-indigo-100' },
    [PaymentStatus.PENDING]: { bg: 'bg-amber-500', text: 'text-amber-600', label: '未請款', ring: 'ring-amber-100' },
  };

  return (
    <div className="flex flex-col space-y-10 p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <Coins className="text-indigo-600" size={40} />
            請款與發票管理
          </h1>
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] text-xs">Financial Document Control Center</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={handleOpenCreate}
             className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black text-sm flex items-center gap-3 shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
           >
             <FilePlus size={20} />
             建立新單據
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 mb-1">總計金額</p>
          <p className="text-2xl font-black text-slate-900">${formatAmount(statsSummary.total)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 mb-1">未請款</p>
          <p className="text-2xl font-black text-amber-600">${formatAmount(statsSummary.pending)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 mb-1">已請款</p>
          <p className="text-2xl font-black text-indigo-600">${formatAmount(statsSummary.billed)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 mb-1">已付款</p>
          <p className="text-2xl font-black text-emerald-600">${formatAmount(statsSummary.paid)}</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6 bg-slate-50/30">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="搜尋廠商名稱、發票編號..." 
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none"
            >
              <option value="ALL">全部狀態</option>
              <option value="PENDING">未請款</option>
              <option value="BILLED">已請款</option>
              <option value="PAID">已付款</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">發票資訊</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">廠商名稱</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">金額</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">日期</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">狀態</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedInvoices.map((inv: any) => (
                <tr key={inv.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-md transition-all">
                        <FileText size={20} />
                      </div>
                      <span className="text-sm font-black text-slate-800 font-mono">{inv.invoiceNo}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-sm font-bold text-slate-600">{inv.vendorName}</td>
                  <td className="px-10 py-6 text-sm font-black text-slate-900">${inv.amount.toLocaleString()}</td>
                  <td className="px-10 py-6 text-sm font-bold text-slate-400">{inv.date}</td>
                  <td className="px-10 py-6">
                    <span className={clsx("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border", statusStyles[inv.status]?.text || "text-gray-600", "bg-white")}>
                      {statusStyles[inv.status]?.label || inv.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button onClick={() => handleOpenEdit(inv)} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      <Edit3 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-lg">
                       {selectedInvoice ? <Edit3 size={28} /> : <FilePlus size={28} />}
                    </div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-800 tracking-tighter">
                         {selectedInvoice ? `編輯單據` : '建立請款單據'}
                       </h3>
                    </div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-4 text-slate-300 hover:text-slate-800 transition-all">
                    <X size={32} />
                 </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                 <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 border-r border-slate-100">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6"><ImageIcon size={18} className="text-indigo-500" /> 附件預覽</h4>
                    {attachments.length > 0 ? (
                      <div className="aspect-video rounded-3xl overflow-hidden bg-slate-200 shadow-inner">
                        <img src={attachments[0].url} className="w-full h-full object-cover" alt="Invoice" />
                      </div>
                    ) : (
                      <div className="aspect-video rounded-3xl border-2 border-dashed border-slate-200 flex flex-center items-center justify-center text-slate-400 font-bold">
                        尚未上傳附件
                      </div>
                    )}
                 </div>

                 <Form method="post" className="w-full lg:w-[450px] bg-white p-10 overflow-y-auto flex flex-col">
                    <input type="hidden" name="intent" value={selectedInvoice ? 'update' : 'create'} />
                    {selectedInvoice && <input type="hidden" name="id" value={selectedInvoice.id} />}
                    <div className="space-y-8 flex-1">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">請款廠商/對象</label>
                          <select name="vendorName" defaultValue={selectedInvoice?.vendorName} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none">
                             <option value="">請選擇合作對象...</option>
                             {vendorList.map((v: any) => (
                               <option key={v.id} value={v.name}>{v.name}</option>
                             ))}
                          </select>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">發票/單據編號</label>
                          <input name="invoiceNo" type="text" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none" defaultValue={selectedInvoice?.invoiceNo} />
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">金額</label>
                          <input name="amount" type="number" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xl font-black text-slate-800 outline-none" defaultValue={selectedInvoice?.amount} />
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">單據狀態</label>
                          <select name="status" defaultValue={selectedInvoice?.status || 'PENDING'} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none">
                             <option value="PENDING">未請款</option>
                             <option value="BILLED">已請款</option>
                             <option value="PAID">已付款</option>
                          </select>
                       </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                       <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 font-black rounded-2xl">取消</button>
                       <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg">儲存</button>
                    </div>
                 </Form>
              </div>
           </div>
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
