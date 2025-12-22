import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MOCK_VENDORS } from '../constants';
import { Vendor } from '../types';
import { Trophy, Phone, Star, TrendingUp, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <TrendingUp className="text-blue-600" />
        營運戰情室
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link to="/vendors" className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition group cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 group-hover:text-blue-600 transition">合作廠商總數</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{MOCK_VENDORS.length}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <span>本週新增 2 家</span>
          </div>
        </Link>

        <Link to="/payments" className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-green-200 transition group cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 group-hover:text-green-600 transition">本月支出預估</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">$82,500</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <Star size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-500">
            <span>來自 12 筆交易</span>
          </div>
        </Link>

        <Link to="/vendors?filter=contacting" className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-orange-200 transition group cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 group-hover:text-orange-600 transition">聯繫中案件</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">8</h3>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <Phone size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-orange-600">
            <span>3 件需緊急跟進</span>
          </div>
        </Link>

        <Link to="/vendors?filter=missed" className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-red-200 transition group cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 group-hover:text-red-600 transition">聯繫紀錄缺失</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{totalMissedLogs}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <AlertOctagon size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-red-600 font-bold">
            <span>次未落實紀錄</span>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Rated Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            優質廠商排行 (評分)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRated} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="rating" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">廠商類別分佈</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name}) => name}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rankings List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">熱門合作廠商</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-600 text-sm">
              <tr>
                <th className="py-3 px-6 text-left">排名</th>
                <th className="py-3 px-6 text-left">廠商名稱</th>
                <th className="py-3 px-6 text-left">類別</th>
                <th className="py-3 px-6 text-center">成交次數</th>
                <th className="py-3 px-6 text-center">平均評分</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mostUsed.map((vendor, idx) => (
                <tr key={vendor.id} className="hover:bg-slate-50">
                  <td className="py-4 px-6 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-4 px-6 font-medium text-slate-800">{vendor.name}</td>
                  <td className="py-4 px-6">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                      {vendor.categories[0]}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center font-bold text-blue-600">
                    {vendor.transactions.length}
                  </td>
                  <td className="py-4 px-6 text-center flex justify-center items-center gap-1">
                     <Star size={14} className="fill-yellow-400 text-yellow-400" />
                     {vendor.rating}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};