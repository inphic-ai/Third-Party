import type { MetaFunction } from "@remix-run/node";
import { 
  BookOpen, Search, Plus, Tag, Clock, ChevronRight
} from 'lucide-react';

export const meta: MetaFunction = () => {
  return [
    { title: "知識庫 - PartnerLink Pro" },
    { name: "description", content: "查詢常見問題與解決方案" },
  ];
};

// 模擬知識庫資料
const MOCK_KNOWLEDGE = [
  {
    id: '1',
    question: '空調不冷怎麼處理？',
    answer: '首先檢查冷媒壓力是否正常，若壓力偏低可能需要補充冷媒。同時檢查濾網是否堵塞，建議每月清洗一次。',
    tags: ['空調', '維修', '常見問題'],
    createdAt: '2026-01-10',
  },
  {
    id: '2',
    question: '水管漏水的緊急處理方式？',
    answer: '立即關閉該區域的水閥，使用防水膠帶暫時止漏，並盡快聯繫專業水電師傅進行修復。',
    tags: ['水電', '緊急處理', '漏水'],
    createdAt: '2026-01-08',
  },
  {
    id: '3',
    question: '如何選擇合適的玻璃材質？',
    answer: '根據使用場景選擇：一般窗戶可用普通浮法玻璃，浴室建議使用強化玻璃，隔音需求可選擇中空玻璃。',
    tags: ['玻璃', '材質選擇', '裝修'],
    createdAt: '2026-01-05',
  },
];

export default function KnowledgePage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 頁首 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <BookOpen size={28} className="text-violet-600" />
            知識庫
          </h1>
          <p className="text-slate-500 mt-1">查詢常見問題與解決方案</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition font-bold">
          <Plus size={18} />
          新增知識
        </button>
      </div>

      {/* 搜尋 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="搜尋問題或關鍵字..."
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-lg"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-slate-500">熱門標籤：</span>
          {['空調', '水電', '玻璃', '維修', '緊急處理'].map(tag => (
            <button 
              key={tag}
              className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-violet-100 hover:text-violet-600 transition"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* 知識列表 */}
      <div className="space-y-4">
        {MOCK_KNOWLEDGE.map(item => (
          <div 
            key={item.id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-violet-200 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-violet-600 transition-colors">
                  {item.question}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {item.answer}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock size={14} />
                    <span>{item.createdAt}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(tag => (
                      <span 
                        key={tag}
                        className="px-2 py-0.5 bg-violet-50 text-violet-600 text-xs rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-2 bg-slate-50 text-slate-300 rounded-full group-hover:bg-violet-600 group-hover:text-white transition-all">
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 統計 */}
      <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-violet-600 font-medium">知識庫統計</p>
            <p className="text-2xl font-black text-violet-800 mt-1">{MOCK_KNOWLEDGE.length} 篇文章</p>
          </div>
          <BookOpen size={40} className="text-violet-300" />
        </div>
      </div>
    </div>
  );
}
