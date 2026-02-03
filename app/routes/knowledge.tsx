import { useState, useRef, useEffect } from 'react';
import { useLoaderData, Link, useFetcher, useActionData } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { db } from '../services/db.server';
import { knowledgeBaseItems } from '../../db/schema/system';
import { requireUser } from '~/services/auth.server';/system';
import { BookOpen, Search, ChevronDown, ChevronRight, ExternalLink, Calendar, Plus, X, Save } from 'lucide-react';
import { clsx } from 'clsx';

import { ClientOnly } from '~/components/ClientOnly';
import { MOCK_KNOWLEDGE_BASE } from '~/constants';

export const meta: MetaFunction = () => {
  return [
    { title: "知識庫 - PartnerLink Pro" },
    { name: "description", content: "累積專案經驗，傳承驗收標準與異常處理技巧" },
  ];
};

// Action 函數處理新增知識
export async function action({ request }: any) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'createKnowledge') {
    try {
      const question = formData.get('question') as string;
      const answer = formData.get('answer') as string;
      const tags = (formData.get('tags') as string || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      if (!question || !answer) {
        return json({ success: false, error: '問題與答案為必填欄位' }, { status: 400 });
      }

      await db.insert(knowledgeBaseItems).values({
        question,
        answer,
        tags,
        sourceTransactionId: null,
      });

      return json({ success: true, error: null });
    } catch (error) {
      console.error('Failed to create knowledge:', error);
      return json({ success: false, error: '建立失敗' }, { status: 500 });
    }
  }

  return json({ success: false, error: 'Invalid intent' }, { status: 400 });
}

export async function loader({ request }: LoaderFunctionArgs) {
  // 要求用戶必須登入
  await requireUser(request);
  
  try {
    console.log('[Knowledge Loader] Loading knowledge base items...');
    
    const allKnowledgeItems = await db.select().from(knowledgeBaseItems);
    
    console.log(`[Knowledge Loader] Loaded ${allKnowledgeItems.length} items`);
    
    const itemsWithMapping = allKnowledgeItems.map(item => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      sourceTransactionId: item.sourceTransactionId || undefined,
      tags: Array.isArray(item.tags) ? item.tags : [],
      createdAt: item.createdAt.toISOString(),
    }));
    
    return json({ knowledgeItems: itemsWithMapping });
  } catch (error) {
    console.error('[Knowledge Loader] Error:', error);
    return json({ knowledgeItems: [] });
  }
}

function KnowledgeContent() {
  const { knowledgeItems: dbKnowledgeItems } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // 監聽表單提交成功後關閉 Modal
  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      setShowAddModal(false);
      formRef.current?.reset();
    }
  }, [actionData]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    dbKnowledgeItems.forEach((item: any) => item.tags.forEach((t: string) => tags.add(t)));
    return Array.from(tags);
  }, []);

  const filteredItems = useMemo(() => {
    return dbKnowledgeItems.filter((item: any) => {
      const terms = searchTerm.toLowerCase().split(' ').filter(Boolean);
      const matchesSearch = terms.every(term => 
        item.question.toLowerCase().includes(term) || 
        item.answer.toLowerCase().includes(term) ||
        item.tags.some(t => t.toLowerCase().includes(term))
      );
      
      const matchesTag = selectedTag ? item.tags.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [searchTerm, selectedTag]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      {/* 新增知識浮動按鈕 */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all hover:scale-110 z-50 flex items-center gap-2"
        title="新增知識"
      >
        <Plus size={24} />
        <span className="font-bold pr-2">新增知識</span>
      </button>
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
           <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
             <BookOpen size={32} /> 企業知識庫
           </h1>
           <p className="text-blue-100 mb-6 text-lg">
             累積專案經驗，傳承驗收標準與異常處理技巧。
           </p>
           
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             <input 
               type="text" 
               className="w-full pl-12 pr-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-sm"
               placeholder="搜尋問題關鍵字 (如：大陸 報關)..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
        {/* Background Decoration */}
        <BookOpen size={200} className="absolute -bottom-10 -right-10 text-white opacity-10 rotate-12" />
      </div>

      {/* Filter Tags */}
      <div className="flex flex-wrap gap-2">
         <button 
           onClick={() => setSelectedTag(null)}
           className={clsx(
             "px-4 py-2 rounded-full text-sm font-medium transition",
             !selectedTag ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
           )}
         >
           全部
         </button>
         {allTags.map(tag => (
           <button 
             key={tag}
             onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
             className={clsx(
               "px-4 py-2 rounded-full text-sm font-medium transition border",
               selectedTag === tag 
                 ? "bg-blue-100 text-blue-700 border-blue-200" 
                 : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
             )}
           >
             #{tag}
           </button>
         ))}
      </div>

      {/* Q&A List */}
      <div className="space-y-4">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
             <button 
               onClick={() => toggleExpand(item.id)}
               className="w-full px-6 py-4 flex items-start text-left hover:bg-slate-50 transition"
             >
               <div className="flex-1">
                 <h3 className={clsx("font-bold text-lg mb-2 flex items-center gap-2", expandedId === item.id ? "text-blue-600" : "text-slate-800")}>
                   <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded uppercase font-black">Q</span>
                   {item.question}
                 </h3>
                 <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {item.createdAt}</span>
                    <div className="flex gap-1">
                       {item.tags.map(tag => (
                          <span key={tag} className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">#{tag}</span>
                       ))}
                    </div>
                 </div>
               </div>
               {expandedId === item.id ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}
             </button>

             {expandedId === item.id && (
               <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/50">
                  <div className="flex gap-3">
                     <div className="mt-1 bg-green-100 text-green-700 text-xs w-6 h-6 rounded flex items-center justify-center font-black shrink-0">A</div>
                     <div className="flex-1">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{item.answer}</p>
                        
                        {item.sourceTransactionId && (
                           <div className="mt-4 inline-block">
                              <Link to={`/transactions/${item.sourceTransactionId}`} className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:underline bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                                 <ExternalLink size={14} />
                                 查看來源工單 ({item.sourceTransactionId})
                              </Link>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
             )}
          </div>
        ))}

        {filteredItems.length === 0 && (
           <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
              <p>找不到相關的知識內容</p>
           </div>
        )}
      </div>

      {/* 新增知識 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <BookOpen size={28} className="text-blue-600" />
                  新增知識條目
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <fetcher.Form method="post" ref={formRef} className="space-y-6">
                <input type="hidden" name="intent" value="createKnowledge" />

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    問題 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="question"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例：大陸地區報關流程是否需要提供原產地證明？"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    答案 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="answer"
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="請詳細描述答案、流程或解決方案..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    標籤 (以逗號分隔)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例：大陸, 報關, 物流"
                  />
                </div>

                {actionData?.error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {actionData.error}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    儲存知識
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    取消
                  </button>
                </div>
              </fetcher.Form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <ClientOnly fallback={<div className="p-8 text-center text-slate-400">載入中...</div>}>
      <KnowledgeContent />
    </ClientOnly>
  );
}
