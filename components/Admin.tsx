
import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  History, 
  LayoutGrid,
  Activity,
  Wallet,
  Bot,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Tags,
  X,
  BookOpen,
  Globe,
  Megaphone,
  AlertTriangle,
  Clock,
  Maximize2,
  Power
} from 'lucide-react';
import { clsx } from 'clsx';
import { MOCK_USERS, MOCK_LOGS, MOCK_MODEL_RULES, MOCK_SYSTEM_TAGS, MOCK_TUTORIALS, MOCK_ANNOUNCEMENTS } from '../constants';
import { AiModelRule, SystemTags, TutorialTip, Announcement } from '../types';

type AdminTab = 'dashboard' | 'logs' | 'users' | 'ai' | 'tags' | 'tutorials' | 'settings';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-slate-800 text-white rounded-xl">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">系統管理</h1>
          <p className="text-slate-500 text-sm">全域設定、人員權限與系統日誌</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        {[
          { id: 'dashboard', label: '統計儀表板', icon: <Activity size={18} /> },
          { id: 'settings', label: '系統設定', icon: <Settings size={18} /> }, 
          { id: 'tutorials', label: '使用教學', icon: <BookOpen size={18} /> }, 
          { id: 'users', label: '人員管理', icon: <Users size={18} /> },
          { id: 'ai', label: 'AI 模型設定', icon: <Bot size={18} /> },
          { id: 'tags', label: '標籤管理', icon: <Tags size={18} /> },
          { id: 'logs', label: '日誌中心', icon: <FileText size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={clsx(
              "flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative whitespace-nowrap",
              activeTab === tab.id ? "text-slate-800" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-800" />}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'logs' && <LogCenter />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'ai' && <AiModelTraining />}
        {activeTab === 'tags' && <TagManagement />}
        {activeTab === 'tutorials' && <TutorialManagement />}
        {activeTab === 'settings' && <SystemSettings />}
      </div>
    </div>
  );
};

/* --- Sub-Components --- */

const SystemSettings: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'High'>('Normal');
  const [timezone, setTimezone] = useState('Asia/Taipei');

  const handlePostAnnouncement = () => {
    if(!content || !title) return;
    const item: Announcement = {
      id: Date.now().toString(),
      title: title, 
      content: content,
      date: new Date().toISOString().split('T')[0],
      priority: priority
    };
    setAnnouncements([item, ...announcements]);
    setTitle('');
    setContent('');
    setPriority('Normal');
  };

  const handleDelete = (id: string) => {
    if(window.confirm('確定要刪除此公告嗎？')) {
      setAnnouncements(announcements.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Timezone Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
         <div className="flex items-center gap-3 text-slate-800">
            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Globe size={24} /></div>
            <div>
               <h3 className="font-bold text-lg">系統時區 (Timezone)</h3>
               <p className="text-xs text-slate-500">影響所有時間戳記顯示</p>
            </div>
         </div>
         <select 
           value={timezone}
           onChange={(e) => setTimezone(e.target.value)}
           className="w-full md:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
         >
           <option value="Asia/Taipei">Asia/Taipei (GMT+8)</option>
           <option value="Asia/Shanghai">Asia/Shanghai (GMT+8)</option>
           <option value="UTC">UTC (GMT+0)</option>
         </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Form (2 cols) */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-6">
               <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold text-lg">
                  <Megaphone className="text-indigo-500" size={20} />
                  <h3>發布新公告</h3>
               </div>

               <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">公告標題</label>
                    <input 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="輸入標題..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">公告等級</label>
                    <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
                       <button 
                          onClick={() => setPriority('Normal')}
                          className={clsx("flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all", 
                            priority === 'Normal' ? "bg-white text-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                       >
                          一般通知
                       </button>
                       <button 
                          onClick={() => setPriority('High')}
                          className={clsx("flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all", 
                            priority === 'High' ? "bg-red-50 text-red-600 shadow-sm border border-red-100" : "text-slate-400 hover:text-slate-600"
                          )}
                       >
                          <AlertTriangle size={14} /> 緊急重要
                       </button>
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-slate-500 mb-2">內容</label>
                     <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="輸入公告詳細內容..."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl h-40 outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm leading-relaxed"
                     />
                  </div>

                  <div className="pt-2">
                     <button 
                        onClick={handlePostAnnouncement}
                        disabled={!content || !title}
                        className="w-full bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md flex items-center justify-center gap-2"
                     >
                        <Plus size={16} /> 確認發布
                     </button>
                  </div>
               </div>
            </div>
        </div>

        {/* Right Column: List (3 cols) */}
        <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                      <History className="text-slate-400" size={20} />
                      <h3>公告管理列表</h3>
                  </div>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-500">{announcements.length} 則</span>
               </div>

               <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {announcements.length > 0 ? announcements.map(ann => (
                     <div key={ann.id} className="p-4 rounded-xl bg-white border border-slate-200 group hover:border-indigo-300 transition relative">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                              <span className={clsx(
                                  "text-[10px] px-2 py-0.5 rounded font-bold border",
                                  ann.priority === 'High' ? "bg-red-50 text-red-700 border-red-100" : "bg-blue-50 text-blue-700 border-blue-100"
                              )}>
                                  {ann.priority === 'High' ? '緊急' : '一般'}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock size={12} /> {ann.date}
                              </span>
                           </div>
                           <button 
                             onClick={() => handleDelete(ann.id)}
                             className="text-slate-300 hover:text-red-500 transition p-1"
                             title="刪除"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">{ann.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{ann.content}</p>
                     </div>
                  )) : (
                     <div className="text-center py-20 text-slate-300 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Megaphone size={48} className="mx-auto mb-2 opacity-20" />
                        <p>目前沒有任何公告</p>
                     </div>
                  )}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const TutorialManagement: React.FC = () => {
  const [tutorials, setTutorials] = useState<TutorialTip[]>(MOCK_TUTORIALS);
  const [editingTip, setEditingTip] = useState<TutorialTip | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPrinciple, setEditPrinciple] = useState('');

  const toggleActive = (key: string) => {
    setTutorials(tutorials.map(t => t.key === key ? { ...t, isActive: !t.isActive } : t));
  };

  const handleOpenEdit = (tip: TutorialTip) => {
    setEditingTip(tip);
    setEditTitle(tip.title);
    setEditContent(tip.content);
    setEditPrinciple(tip.designPrinciple);
  };

  const handleSaveEdit = () => {
    if (!editingTip) return;
    setTutorials(tutorials.map(t => 
      t.key === editingTip.key 
        ? { ...t, title: editTitle, content: editContent, designPrinciple: editPrinciple } 
        : t
    ));
    setEditingTip(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-6 flex items-start gap-4">
        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><BookOpen size={24} /></div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">使用教學與錯誤提示管理</h3>
          <p className="text-slate-500 text-sm">設定系統在特定情境下顯示的引導文字。</p>
        </div>
      </div>
      <div className="space-y-4">
        {tutorials.map(tutorial => (
          <div key={tutorial.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 transition hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-xl font-bold text-slate-800">{tutorial.title}</h4>
                  <span className={clsx("text-xs px-2 py-1 rounded font-bold", tutorial.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
                    {tutorial.isActive ? '啟用中' : '已停用'}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-400 px-2 py-1 rounded font-mono uppercase tracking-wider">{tutorial.key}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleOpenEdit(tutorial)} className="text-slate-300 hover:text-slate-600 transition"><Edit2 size={18} /></button>
                  <button onClick={() => toggleActive(tutorial.key)} className={clsx("transition", tutorial.isActive ? "text-green-500" : "text-slate-300")}><Power size={22} /></button>
                </div>
              </div>
              <p className="text-slate-600 mb-6 text-base leading-relaxed pl-1">{tutorial.content}</p>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <span className="block font-bold text-slate-500 mb-2 text-xs">系統設計原則 (System Principle)：</span>
                <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">{tutorial.designPrinciple}</p>
              </div>
          </div>
        ))}
      </div>
      {editingTip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                 <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Edit2 size={20} className="text-orange-600" /> 編輯教學提示</h3>
                 <button onClick={() => setEditingTip(null)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
              </div>
              <div className="p-6 space-y-4">
                 <div><label className="block text-sm font-bold text-slate-600 mb-1">標題</label><input className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={editTitle} onChange={e => setEditTitle(e.target.value)}/></div>
                 <div><label className="block text-sm font-bold text-slate-600 mb-1">內容</label><textarea className="w-full border border-slate-200 rounded-lg p-2 text-sm h-24 resize-none" value={editContent} onChange={e => setEditContent(e.target.value)}/></div>
                 <div><label className="block text-sm font-bold text-slate-600 mb-1">設計原則</label><textarea className="w-full border border-slate-200 rounded-lg p-2 text-sm h-32 resize-none bg-slate-50" value={editPrinciple} onChange={e => setEditPrinciple(e.target.value)}/></div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                 <button onClick={() => setEditingTip(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium text-sm">取消</button>
                 <button onClick={handleSaveEdit} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 shadow-sm">儲存變更</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const TagManagement: React.FC = () => {
  const [tags, setTags] = useState<SystemTags>(MOCK_SYSTEM_TAGS);
  const [newTag, setNewTag] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof SystemTags>('contactTags');

  const categoryLabels: Record<keyof SystemTags, string> = {
    contactTags: '聯繫詳情標籤',
    serviceTags: '服務項目標籤',
    websiteTags: '網站/廠商標籤'
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (tags[activeCategory].includes(newTag.trim())) return;
    setTags({ ...tags, [activeCategory]: [...tags[activeCategory], newTag.trim()] });
    setNewTag('');
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags({ ...tags, [activeCategory]: tags[activeCategory].filter(t => t !== tagToDelete) });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-fit">
         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Tags size={20} className="text-blue-600" /> 標籤類別</h3>
         <div className="space-y-2">
           {(Object.keys(tags) as Array<keyof SystemTags>).map(cat => (
             <button key={cat} onClick={() => setActiveCategory(cat)} className={clsx("w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition flex justify-between items-center", activeCategory === cat ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}>
               {categoryLabels[cat]}
               <span className={clsx("text-xs px-2 py-0.5 rounded-full", activeCategory === cat ? "bg-slate-600" : "bg-slate-200")}>{tags[cat].length}</span>
             </button>
           ))}
         </div>
      </div>
      <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
         <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-800 text-lg">{categoryLabels[activeCategory]}</h3></div>
         <div className="flex gap-2 mb-6">
            <input type="text" className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="輸入新標籤名稱..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}/>
            <button onClick={handleAddTag} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition flex items-center gap-1"><Plus size={16} /> 新增</button>
         </div>
         <div className="flex flex-wrap gap-2">
            {tags[activeCategory].map(tag => (
              <span key={tag} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium flex items-center gap-2 group hover:bg-slate-200 transition">#{tag}<button onClick={() => handleDeleteTag(tag)} className="text-slate-400 hover:text-red-500"><X size={14} /></button></span>
            ))}
         </div>
      </div>
    </div>
  );
};

const AiModelTraining: React.FC = () => {
  const [rules, setRules] = useState<AiModelRule[]>(MOCK_MODEL_RULES);
  const [editingRule, setEditingRule] = useState<AiModelRule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalCategory, setModalCategory] = useState<'Search' | 'Response' | 'Filter'>('Search');
  const [modalWeight, setModalWeight] = useState<'Must' | 'Should' | 'Nice to have'>('Must');

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setRules([...rules, { id: `r${Date.now()}`, category: 'Search', rule: newRule, weight: 'Should', isActive: true }]);
    setNewRule('');
  };

  const handleSaveModal = () => {
    if (!modalContent.trim()) return;
    if (editingRule) {
      setRules(rules.map(r => r.id === editingRule.id ? { ...r, rule: modalContent, category: modalCategory, weight: modalWeight } : r));
    } else {
      setRules([...rules, { id: `r${Date.now()}`, category: modalCategory, rule: modalContent, weight: modalWeight, isActive: true }]);
    }
    setShowEditModal(false); setEditingRule(null); setModalContent('');
  };

  const openEditModal = (rule?: AiModelRule) => {
    if (rule) { setEditingRule(rule); setModalContent(rule.rule); setModalCategory(rule.category); setModalWeight(rule.weight); } 
    else { setEditingRule(null); setModalContent(''); setModalCategory('Search'); setModalWeight('Must'); }
    setShowEditModal(true);
  };

  const toggleRule = (id: string) => setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  const deleteRule = (id: string) => setRules(rules.filter(r => r.id !== id));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-8 text-white relative overflow-hidden shadow-lg">
        <Sparkles className="absolute top-4 right-4 text-white opacity-20" size={120} />
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Bot size={28} /> AI 搜尋模型訓練</h2>
        <p className="opacity-90 max-w-2xl">在此設定系統 AI 搜尋時的底層邏輯與優先順序。</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
             <div className="space-y-3">
               {rules.map(rule => (
                 <div key={rule.id} className={clsx("p-4 rounded-lg border transition-all group", rule.isActive ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60")}>
                    <div className="flex justify-between items-start gap-4">
                       <div className="flex-1 cursor-pointer" onClick={() => openEditModal(rule)}>
                          <div className="flex items-center gap-2 mb-2">
                             <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{rule.category}</span>
                             <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{rule.weight}</span>
                          </div>
                          <p className="text-slate-700 font-medium line-clamp-2">{rule.rule}</p>
                       </div>
                       <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(rule)}><Edit2 size={18} className="text-slate-400 hover:text-blue-600"/></button>
                          <button onClick={() => toggleRule(rule.id)}>{rule.isActive ? <ToggleRight size={24} className="text-blue-600"/> : <ToggleLeft size={24} className="text-slate-400"/>}</button>
                          <button onClick={() => deleteRule(rule.id)}><Trash2 size={18} className="text-slate-300 hover:text-red-500"/></button>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
        <div className="space-y-4">
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18} className="text-blue-600" /> 快速新增</h3>
              <div className="space-y-4">
                 <textarea className="w-full border border-slate-200 rounded-lg p-3 text-sm h-32 resize-none" placeholder="輸入規則..." value={newRule} onChange={(e) => setNewRule(e.target.value)}/>
                 <button onClick={handleAddRule} disabled={!newRule.trim()} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-bold">快速加入</button>
                 <button onClick={() => openEditModal()} className="w-full bg-purple-50 text-purple-700 border border-purple-200 py-2 rounded-lg font-bold flex items-center justify-center gap-2"><Maximize2 size={16} /> 開啟完整編輯器</button>
              </div>
           </div>
        </div>
      </div>
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-lg text-slate-800">編輯規則</h3>
                 <button onClick={() => setShowEditModal(false)}><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                 <div className="grid grid-cols-2 gap-6 mb-6">
                    <div><label className="block text-sm font-bold text-slate-600 mb-2">規則分類</label><select className="w-full border p-2.5 rounded-lg" value={modalCategory} onChange={(e) => setModalCategory(e.target.value as any)}><option value="Search">Search</option><option value="Response">Response</option><option value="Filter">Filter</option></select></div>
                    <div><label className="block text-sm font-bold text-slate-600 mb-2">權重</label><select className="w-full border p-2.5 rounded-lg" value={modalWeight} onChange={(e) => setModalWeight(e.target.value as any)}><option value="Must">Must</option><option value="Should">Should</option><option value="Nice to have">Nice to have</option></select></div>
                 </div>
                 <textarea className="w-full border border-slate-200 rounded-xl p-6 h-[400px] resize-none" value={modalContent} onChange={(e) => setModalContent(e.target.value)}/>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                 <button onClick={() => setShowEditModal(false)} className="px-6 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-bold">取消</button>
                 <button onClick={handleSaveModal} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold">儲存變更</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
     <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between"><div><p className="text-xs font-bold text-slate-500 mb-1">資源總數</p><h3 className="text-3xl font-bold text-slate-800">6</h3></div><div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><LayoutGrid size={24} /></div></div>
     <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between"><div><p className="text-xs font-bold text-slate-500 mb-1">預估支出</p><h3 className="text-2xl font-bold text-slate-800">$15.3萬</h3></div><div className="p-3 bg-red-50 text-red-600 rounded-lg"><Wallet size={24} /></div></div>
     <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between"><div><p className="text-xs font-bold text-slate-500 mb-1">總使用</p><h3 className="text-3xl font-bold text-slate-800">4210</h3></div><div className="p-3 bg-green-50 text-green-600 rounded-lg"><Activity size={24} /></div></div>
     <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between"><div><p className="text-xs font-bold text-slate-500 mb-1">待審核</p><h3 className="text-3xl font-bold text-slate-800">0</h3></div><div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><Activity size={24} /></div></div>
  </div>
);

const LogCenter: React.FC = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
     <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-4">時間</th><th className="px-6 py-4">動作</th><th className="px-6 py-4">詳情</th></tr></thead><tbody>{MOCK_LOGS.map(l => <tr key={l.id} className="hover:bg-slate-50"><td className="px-6 py-4">{l.timestamp}</td><td className="px-6 py-4 font-bold">{l.action}</td><td className="px-6 py-4">{l.details}</td></tr>)}</tbody></table>
  </div>
);

const UserManagement: React.FC = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
     <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-4">姓名</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">角色</th></tr></thead><tbody>{MOCK_USERS.map(u => <tr key={u.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-bold">{u.name}</td><td className="px-6 py-4">{u.email}</td><td className="px-6 py-4">{u.role}</td></tr>)}</tbody></table>
  </div>
);
