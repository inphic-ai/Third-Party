
import React, { useState, useMemo } from 'react';
import { MOCK_VENDORS } from '../constants';
import { TransactionStatus } from '../types';
import { CreditCard, Calendar, ArrowRight, DollarSign, CheckCircle, Clock, Gift, X, ChevronLeft, ChevronRight, Users, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

type PaymentFilter = 'ALL' | 'PENDING';
const ITEMS_PER_PAGE = 10;

export const Payments: React.FC = () => {
  const [filter, setFilter] = useState<PaymentFilter>('ALL');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper for Month Navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setCurrentPage(1);
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setCurrentPage(1);
  };

  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Aggregate approved and paid transactions
  const allTransactions = useMemo(() => {
    return MOCK_VENDORS.flatMap(v => 
      v.transactions
        .filter(t => t.status === TransactionStatus.APPROVED || t.status === TransactionStatus.PAID)
        .map(t => ({ ...t, vendorName: v.name, vendorId: v.id }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  // Filter Logic: 1. By Date (Month), 2. By Status (Filter Toggle), 3. By Search Term
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      // Search Filter (Highest priority for visibility)
      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        const matchesSearch = 
          t.id.toLowerCase().includes(lowerTerm) || 
          t.vendorName.toLowerCase().includes(lowerTerm) ||
          t.description.toLowerCase().includes(lowerTerm);
        if (!matchesSearch) return false;
      } else {
        // Date Filter only applies if not searching (or strict month view)
        // Usually payment records strictly follow month views, but search might span across.
        // For this design, let's keep Month view strict even with search, to filter within month.
        const matchesMonth = t.date.startsWith(currentMonthStr);
        if (!matchesMonth) return false;
      }

      // Status Filter
      if (filter === 'PENDING') return t.status === TransactionStatus.APPROVED;
      return true;
    });
  }, [allTransactions, currentMonthStr, filter, searchTerm]);

  // Statistics for Current Month (filtered by month only, not search)
  const monthlyStats = useMemo(() => {
     const monthlyData = allTransactions.filter(t => t.date.startsWith(currentMonthStr));
     const totalAmount = monthlyData.reduce((sum, t) => sum + t.amount, 0);
     const pendingAmount = monthlyData.filter(t => t.status === TransactionStatus.APPROVED).reduce((sum, t) => sum + t.amount, 0);
     const uniqueVendors = new Set(monthlyData.map(t => t.vendorId)).size;
     const pendingCount = monthlyData.filter(t => t.status === TransactionStatus.APPROVED).length;
     return { totalAmount, pendingAmount, uniqueVendors, pendingCount, totalCount: monthlyData.length };
  }, [allTransactions, currentMonthStr]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <CreditCard size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">支付紀錄 & 撥款中心</h1>
            <p className="text-slate-500 text-sm">管理已通過驗收的款項與歷史支付紀錄</p>
          </div>
        </div>

        {/* Month Picker */}
        <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm self-start md:self-auto">
           <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition">
             <ChevronLeft size={20} />
           </button>
           <span className="px-4 font-bold text-slate-800 min-w-[120px] text-center">
             {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
           </span>
           <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition">
             <ChevronRight size={20} />
           </button>
        </div>
      </div>

      {/* Summary Cards (Always show month stats regardless of search to provide context) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => { setFilter(filter === 'PENDING' ? 'ALL' : 'PENDING'); setCurrentPage(1); }}
          className={clsx(
            "p-6 rounded-xl shadow-sm border border-l-4 cursor-pointer transition-all",
            filter === 'PENDING' 
              ? "bg-green-50 border-green-200 border-l-green-600 ring-2 ring-green-500 ring-offset-2" 
              : "bg-white border-slate-100 border-l-green-500 hover:shadow-md"
          )}
        >
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500">本月總金額 ({filter === 'PENDING' ? '待撥' : '全部'})</p>
               <h3 className="text-3xl font-bold text-slate-800 mt-2">
                 ${(filter === 'PENDING' ? monthlyStats.pendingAmount : monthlyStats.totalAmount).toLocaleString()}
               </h3>
             </div>
             {filter === 'PENDING' ? <CheckCircle className="text-green-600" size={24} /> : <DollarSign className="text-green-600" size={24} />}
           </div>
           <p className="text-xs text-slate-400 mt-2">共 {filter === 'PENDING' ? monthlyStats.pendingCount : monthlyStats.totalCount} 筆款項</p>
           {filter === 'PENDING' && <p className="text-xs text-green-700 font-bold mt-2">已套用篩選: 僅顯示待撥款</p>}
        </div>

        <div className="p-6 rounded-xl shadow-sm border border-l-4 bg-white border-slate-100 border-l-blue-500">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500">合作廠商數</p>
               <h3 className="text-3xl font-bold text-slate-800 mt-2">{monthlyStats.uniqueVendors} 家</h3>
             </div>
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Users size={24} />
             </div>
           </div>
           <p className="text-xs text-slate-400 mt-2">本月有請款紀錄的廠商</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
             <h3 className="font-bold text-slate-800 whitespace-nowrap">款項列表 ({currentDate.getMonth() + 1}月)</h3>
             {filter !== 'ALL' && (
               <button 
                 onClick={() => { setFilter('ALL'); setCurrentPage(1); }}
                 className="text-xs flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-full hover:bg-slate-200 transition"
               >
                 清除篩選 <X size={12}/>
               </button>
             )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             {/* Search Input */}
             <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="搜尋工單號、廠商..." 
                  className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
             </div>

             <div className="flex gap-2 text-sm">
                <span className={clsx("flex items-center gap-1 px-2 py-1 rounded transition", filter === 'PENDING' ? "bg-green-100 text-green-800 font-bold" : "bg-green-50 text-green-700")}>
                  <CheckCircle size={14}/> 待撥款
                </span>
                <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded"><Clock size={14}/> 已結案</span>
             </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3">工單/廠商</th>
                <th className="px-6 py-3">描述</th>
                <th className="px-6 py-3">驗收日期</th>
                <th className="px-6 py-3 text-right">金額</th>
                <th className="px-6 py-3 text-center">狀態</th>
                <th className="px-6 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{t.id}</div>
                    <Link to={`/vendors/${t.vendorId}`} className="text-blue-600 hover:underline text-xs">{t.vendorName}</Link>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    {t.description}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {t.approvalDate || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-slate-800">
                    ${t.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={clsx(
                      "px-2 py-1 rounded-full text-xs font-bold",
                      t.status === TransactionStatus.APPROVED ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                    )}>
                      {t.status === TransactionStatus.APPROVED ? '待撥款' : '已付款'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link 
                      to={`/transactions/${t.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      詳情 <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
              {paginatedTransactions.length === 0 && (
                 <tr><td colSpan={6} className="text-center py-8 text-slate-400">本月沒有符合條件的項目</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
             <div className="text-sm text-slate-500">
                顯示 {(currentPage - 1) * ITEMS_PER_PAGE + 1} 到 {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} 筆，共 {filteredTransactions.length} 筆
             </div>
             <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={clsx(
                      "w-8 h-8 rounded border text-sm font-medium transition",
                      currentPage === i + 1 ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                >
                  <ChevronRight size={16} />
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
