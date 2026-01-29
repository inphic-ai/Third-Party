import { useState, useMemo } from 'react';
import { useLoaderData, Link } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { db } from '../services/db.server';
import { knowledgeBaseItems } from '../../db/schema/system';
import { BookOpen, Search, ChevronDown, ChevronRight, ExternalLink, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

import { ClientOnly } from '~/components/ClientOnly';
import { MOCK_KNOWLEDGE_BASE } from '~/constants';

export const meta: MetaFunction = () => {
  return [
    { title: "知識庫 - PartnerLink Pro" },
    { name: "description", content: "累積專案經驗，傳承驗收標準與異常處理技巧" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    <div className="space-y-6 max-w-5xl mx-auto">
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
