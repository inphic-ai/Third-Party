import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { 
  CreditCard, Search, Filter, Plus, FileText, 
  CheckCircle, Clock, AlertCircle, DollarSign
} from 'lucide-react';
import { clsx } from 'clsx';
import { PaymentStatus } from '../types';

export const meta: MetaFunction = () => {
  return [
    { title: "請款與發票管理 - PartnerLink Pro" },
    { name: "description", content: "管理請款單據與付款狀態" },
  ];
};

// 模擬發票資料
const MOCK_INVOICES = [
  {
    id: '1',
    vendorName: '大發水電工程行',
    invoiceNo: 'INV-2026-001',
    amount: 25000,
    date: '2026-01-15',
    status: PaymentStatus.PAID,
    description: '主會客室空調維修',
  },
  {
    id: '2',
    vendorName: '永興冷凍空調',
    invoiceNo: 'INV-2026-002',
    amount: 45000,
    date: '2026-01-18',
    status: PaymentStatus.BILLED,
    description: '中央空調系統保養',
  },
  {
    id: '3',
    vendorName: '順達玻璃行',
    invoiceNo: 'INV-2026-003',
    amount: 8500,
    date: '2026-01-20',
    status: PaymentStatus.PENDING,
    description: '辦公室玻璃更換',
  },
];

const getStatusConfig = (status: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.PAID:
      return { 
        label: '已付款', 
        icon: <CheckCircle size={14} />, 
        className: 'bg-emerald-50 text-emerald-600' 
      };
    case PaymentStatus.BILLED:
      return { 
        label: '已請款', 
        icon: <Clock size={14} />, 
        className: 'bg-amber-50 text-amber-600' 
      };
    case PaymentStatus.PENDING:
      return { 
        label: '未請款', 
        icon: <AlertCircle size={14} />, 
        className: 'bg-rose-50 text-rose-600' 
      };
  }
};

export default function PaymentsPage() {
  const totalAmount = MOCK_INVOICES.reduce((acc, inv) => acc + inv.amount, 0);
  const paidAmount = MOCK_INVOICES.filter(inv => inv.status === PaymentStatus.PAID)
    .reduce((acc, inv) => acc + inv.amount, 0);
  const pendingAmount = MOCK_INVOICES.filter(inv => inv.status !== PaymentStatus.PAID)
    .reduce((acc, inv) => acc + inv.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 頁首 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <CreditCard size={28} className="text-emerald-600" />
            請款與發票管理
          </h1>
          <p className="text-slate-500 mt-1">管理請款單據與付款狀態</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-bold">
          <Plus size={18} />
          新增請款
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800">{MOCK_INVOICES.length}</p>
          <p className="text-sm text-slate-500">總請款單數</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800">
            ${totalAmount.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500">總金額</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            ${paidAmount.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500">已付款</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">
            ${pendingAmount.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500">待付款</p>
        </div>
      </div>

      {/* 搜尋與篩選 */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="搜尋發票號碼、廠商名稱..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
              <option value="">所有狀態</option>
              <option value="paid">已付款</option>
              <option value="billed">已請款</option>
              <option value="pending">未請款</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-sm">
              <Filter size={16} />
              更多篩選
            </button>
          </div>
        </div>
      </div>

      {/* 發票列表 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">發票號碼</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">廠商</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">說明</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">金額</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">日期</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_INVOICES.map(invoice => {
              const statusConfig = getStatusConfig(invoice.status);
              return (
                <tr key={invoice.id} className="hover:bg-slate-50 transition cursor-pointer">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-slate-800">{invoice.invoiceNo}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-700">{invoice.vendorName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-500 text-sm">{invoice.description}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-slate-800">${invoice.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-500 text-sm">{invoice.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
                      statusConfig.className
                    )}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
