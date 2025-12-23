
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MOCK_VENDORS } from '../constants';
import { Vendor } from '../types';
import { Trophy, Phone, Star, TrendingUp, AlertOctagon, LayoutGrid, Wallet, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const WarRoom: React.FC = () => {
  // Calculate top rated
  const topRated = [...MOCK_VENDORS].sort((a, b) => b.rating - a.rating).slice(0, 5);
  
  // Calculate category distribution
  const categoryData = MOCK_VENDORS.reduce((acc, curr) => {
    curr.categories.forEach(cat => {
      const found = acc.find(i => i.name === cat);
      if (found) found.value++;
      else acc.push({ name: cat, value: 1 });
    });
    return acc;
  }, [] as { name: string; value: number }[]);

  // Calculate usage count (based on transactions length for mock)
  const mostUsed = [...MOCK_VENDORS].sort((a, b) => b.transactions.length - a.transactions.length).slice(0, 5);

  // Calculate missed logs count
  const totalMissedLogs = MOCK_VENDORS.reduce((sum, v) => sum + (v.missedContactLogCount || 0), 0);

  // Reusable Card Component matching the reference image style
  const StatCard = ({ title, value, subtext, icon, colorClass, linkTo }: any) => (
    <Link to={linkTo} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:border-gray-300 transition group flex items-center justify-between h-full">
       <div className="flex flex-col justify-between h-full">
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">{title}</p>
            <h3 className="text-3xl font-extrabold text-gray-800">{value}</h3>
          </div>
          <div className="mt-4 text-xs font-medium text-gray-400 group-hover:text-brand-600 transition flex items-center gap-1">
             {subtext}
          </div>
       </div>
       <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", colorClass)}>
          {icon}
       </div>
    </Link>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">系統管理 / 統計儀表板</h1>
        <div className="flex gap-4 mt-4 border-b border-gray-200">
           <button className="pb-3 border-b-2 border-brand-700 text-brand-700 font-bold text-sm">統計儀表板</button>
           <button className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm transition">費用管理</button>
           <button className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm transition">資源管理</button>
           <button className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm transition">日誌中心</button>
        </div>
      </div>

      {/* KPI Cards Row - Matching Reference Image Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
           title="資源總數 (Vendors)" 
           value={MOCK_VENDORS.length} 
           subtext="已啟用: 全數正常" 
           icon={<LayoutGrid size={28} />} 
           colorClass="bg-blue-50 text-blue-600"
           linkTo="/vendors"
        />
        <StatCard 
           title="年度預估支出" 
           value="NT$ 15.3萬" 
           subtext="月均: $12,736" 
           icon={<Wallet size={28} />} 
           colorClass="bg-pink-50 text-pink-600"
           linkTo="/payments"
        />
        <StatCard 
           title="總使用次數" 
           value="4,210" 
           subtext="累計點擊次數" 
           icon={<Activity size={28} />} 
           colorClass="bg-emerald-50 text-emerald-600"
           linkTo="/tasks"
        />
        <StatCard 
           title="待審核資源" 
           value="0" 
           subtext="等待審核中" 
           icon={<TrendingUp size={28} />} 
           colorClass="bg-amber-50 text-amber-600"
           linkTo="/admin"
        />
      </div>

      {/* Progress Bars / Distribution Section mimicking the reference layout */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]">
         <h3 className="text-lg font-bold text-gray-800 mb-6">各分類資源數量</h3>
         <div className="space-y-8">
            {/* Item 1 */}
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-500">A</div>
               <div className="flex-1">
                  <div className="flex justify-between mb-2">
                     <span className="font-bold text-gray-700">AI 工具與自動化</span>
                     <span className="text-xs text-gray-400"><span className="text-green-600 font-bold">已啟用: 2</span> 總計: 2</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                     <div className="h-full bg-brand-700 w-[40%] rounded-full"></div>
                  </div>
               </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-500">設</div>
               <div className="flex-1">
                  <div className="flex justify-between mb-2">
                     <span className="font-bold text-gray-700">設計工具與外包</span>
                     <span className="text-xs text-gray-400"><span className="text-green-600 font-bold">已啟用: 5</span> 總計: 8</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                     <div className="h-full bg-brand-400 w-[60%] rounded-full"></div>
                  </div>
               </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-500">雲</div>
               <div className="flex-1">
                  <div className="flex justify-between mb-2">
                     <span className="font-bold text-gray-700">雲端服務 (AWS/GCP)</span>
                     <span className="text-xs text-gray-400"><span className="text-green-600 font-bold">已啟用: 12</span> 總計: 12</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                     <div className="h-full bg-brand-600 w-[100%] rounded-full"></div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Rated Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            優質廠商排行 (評分)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRated} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12, fill: '#666'}} />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="rating" fill="#78716c" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rankings List */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="text-lg font-bold text-gray-800">熱門合作廠商</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6 text-left">排名</th>
                  <th className="py-3 px-6 text-left">廠商名稱</th>
                  <th className="py-3 px-6 text-center">次數</th>
                  <th className="py-3 px-6 text-center">評分</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mostUsed.map((vendor, idx) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6 font-bold text-gray-400">#{idx + 1}</td>
                    <td className="py-4 px-6 font-medium text-gray-800 flex items-center gap-2">
                        <img src={vendor.avatarUrl} className="w-6 h-6 rounded-full grayscale opacity-80" />
                        {vendor.name}
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-brand-600">
                      {vendor.transactions.length}
                    </td>
                    <td className="py-4 px-6 text-center flex justify-center items-center gap-1">
                       <Star size={14} className="fill-yellow-400 text-yellow-400" />
                       <span className="text-sm font-medium text-gray-600">{vendor.rating}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
