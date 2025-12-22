
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MOCK_VENDORS, MOCK_SYSTEM_TAGS } from '../constants';
import { ContactStatus, EntityType, TransactionStatus, ContactWindow } from '../types';
import { useTutorial } from './TutorialSystem';
import { 
  ArrowLeft, 
  Globe, 
  MapPin, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Camera, 
  Building2, 
  User, 
  FileDigit,
  Phone,
  Mail,
  ExternalLink,
  Edit2,
  Eye,
  Bot,
  Sparkles,
  Save,
  MessageCircle,
  QrCode,
  Copy,
  Lock,
  Hash,
  Plus,
  Tag
} from 'lucide-react';
import { clsx } from 'clsx';

export const VendorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vendor = MOCK_VENDORS.find(v => v.id === id);
  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'logs' | 'transactions' | 'docs'>('info');

  // Contact Log Modal State
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactWindow | null>(null);
  
  // Admin Mode Simulation (Toggle to see hidden IDs)
  const [isAdminMode, setIsAdminMode] = useState(false);

  if (!vendor) return <div className="p-8">找不到廠商資料</div>;

  // Parse service areas for tag display
  const serviceAreas = vendor.serviceArea.split(',').map(s => s.trim()).filter(Boolean);

  const handleContactClick = (contact: ContactWindow) => {
    setSelectedContact(contact);
    setShowContactModal(true);
  };

  // Helper to mask phone
  const maskPhone = (phone?: string) => {
    if (!phone) return '無號碼';
    // Logic: Keep first 4 chars, mask middle, show/hide rest logic happens on click
    return phone.slice(0, 4) + '****' + phone.slice(-1); // e.g. 0912****8
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={20} className="mr-2" /> 返回列表
        </button>
        
        {/* Admin Toggle Simulation */}
        <div className="flex items-center gap-2 text-xs">
          <span className={clsx("font-bold", isAdminMode ? "text-red-600" : "text-slate-400")}>
            {isAdminMode ? "管理員模式 (Admin View)" : "一般使用者模式 (User View)"}
          </span>
          <button 
             onClick={() => setIsAdminMode(!isAdminMode)}
             className={clsx("w-10 h-5 rounded-full p-1 transition-colors relative", isAdminMode ? "bg-red-500" : "bg-slate-300")}
          >
             <div className={clsx("w-3 h-3 bg-white rounded-full transition-transform", isAdminMode ? "translate-x-5" : "translate-x-0")} />
          </button>
        </div>
      </div>

      {/* Header Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center gap-6">
        <img src={vendor.avatarUrl} alt={vendor.name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50" />
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-slate-800">{vendor.name}</h1>
            <span className="font-mono text-slate-400 text-sm ml-2">#{vendor.id}</span>
            <span className={clsx("px-2 py-1 text-xs rounded-full font-medium self-start md:self-auto flex items-center gap-1",
              vendor.entityType === EntityType.COMPANY ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
            )}>
              {vendor.entityType === EntityType.COMPANY ? <Building2 size={12}/> : <User size={12}/>}
              {vendor.entityType}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
            <span className="flex items-center gap-1"><MapPin size={16} /> 註冊地：{vendor.region}</span>
            {vendor.taxId && (
              <span className="flex items-center gap-1 font-mono bg-slate-100 px-2 rounded"><FileDigit size={16} /> 統編: {vendor.taxId}</span>
            )}
            {vendor.mainPhone && (
              <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600" onClick={() => handleContactClick({id: 'main', name: vendor.name, role: 'Main', mobile: vendor.mainPhone, isMainContact: true})}>
                <Phone size={16} /> {maskPhone(vendor.mainPhone)}
                <Eye size={12} className="ml-1 text-slate-400" />
              </span>
            )}
            <span className="flex items-center gap-1"><Clock size={16} /> 平均回應: 4小時內</span>
          </div>

          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-800 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">用人注意事項：</span>
              {vendor.internalNotes}
            </div>
          </div>
        </div>
        
        <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
           <div className="text-4xl font-bold text-slate-800">{vendor.rating}</div>
           <div className="text-xs text-slate-400 mb-2">基於 {vendor.ratingCount} 次評分</div>
           <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition w-full md:w-auto">
             給予評分
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'info', label: '基本資料' },
          { id: 'contacts', label: `聯繫窗口 & 群組 (${vendor.contacts.length + (vendor.socialGroups?.length || 0)})` }, // Updated Tab Name
          { id: 'logs', label: '聯繫紀錄' },
          { id: 'transactions', label: '合作/驗收' },
          { id: 'docs', label: '勞報/請款' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              "px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap",
              activeTab === tab.id ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[400px]">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-slate-800 mb-4">服務項目 (類別)</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {vendor.categories.map(cat => (
                  <span key={cat} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                    {cat}
                  </span>
                ))}
              </div>

              {/* Enhanced Service Area Display */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                   <h3 className="font-bold text-slate-800">服務範圍 (Service Area)</h3>
                   <Edit2 size={14} className="text-slate-300 cursor-not-allowed" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {serviceAreas.map(area => (
                    <span key={area} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm flex items-center gap-1">
                      <MapPin size={12} /> {area}
                    </span>
                  ))}
                  {serviceAreas.length === 0 && <span className="text-slate-400 text-sm">未設定</span>}
                </div>
              </div>

              {/* Address & Street View Section */}
              <div className="mb-6">
                 <h3 className="font-bold text-slate-800 mb-2">公司/聯絡地址</h3>
                 <div className="flex items-start gap-2 text-sm text-slate-600 mb-3">
                    <MapPin size={16} className="mt-0.5 text-slate-400"/>
                    <div>
                      <p className="font-medium text-slate-800">{vendor.address || '未填寫地址'}</p>
                      {vendor.address && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.address)}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-600 text-xs hover:underline mt-1 inline-block"
                        >
                          在 Google Maps 上查看
                        </a>
                      )}
                    </div>
                 </div>
                 
                 {/* Google Street View Preview (Simulated) */}
                 {vendor.address && (
                   <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200 group">
                      {/* Placeholder Image simulating Street View */}
                      <img 
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800" 
                        alt="Street View Preview" 
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-700"
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                         <div className="flex justify-between items-end">
                            <div>
                               <p className="text-white font-bold text-sm drop-shadow-md">Google Street View</p>
                               <p className="text-white/80 text-xs drop-shadow-md">預覽畫面 (模擬)</p>
                            </div>
                            <a 
                               href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.address)}`} 
                               target="_blank" 
                               rel="noreferrer"
                               className="bg-white/90 hover:bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded shadow-sm flex items-center gap-1 transition"
                            >
                               <ExternalLink size={12} /> 開啟全景地圖
                            </a>
                         </div>
                      </div>
                   </div>
                 )}
              </div>
              
              <h3 className="font-bold text-slate-800 mb-4 mt-6">身分屬性</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {vendor.serviceTypes.map(st => (
                   <li key={st} className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> {st}</li>
                ))}
              </ul>
              
              {vendor.website && (
                <div className="mt-6">
                  <h3 className="font-bold text-slate-800 mb-2">網站</h3>
                  <a href={vendor.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                    <Globe size={16} /> {vendor.website}
                  </a>
                </div>
              )}

              {/* Corporate/Main Social IDs Display */}
              <div className="mt-6 border-t border-slate-100 pt-4">
                 <h3 className="font-bold text-slate-800 mb-2">主要通訊 ID ({vendor.entityType === EntityType.COMPANY ? '企業' : '個人'})</h3>
                 <div className="flex gap-4">
                    {vendor.lineId ? (
                       <span className="flex items-center gap-1 text-sm text-green-600 font-bold bg-green-50 px-2 py-1 rounded">
                          LINE: {vendor.lineId}
                       </span>
                    ) : (
                       <span className="text-sm text-slate-400">未設定 LINE</span>
                    )}
                    {vendor.wechatId ? (
                       <span className="flex items-center gap-1 text-sm text-green-700 font-bold bg-green-100 px-2 py-1 rounded">
                          WeChat: {vendor.wechatId}
                       </span>
                    ) : (
                       <span className="text-sm text-slate-400">未設定 WeChat</span>
                    )}
                 </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-4">名片預覽</h3>
              <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 hover:border-blue-300 transition cursor-pointer">
                <div className="text-center">
                  <Camera size={32} className="mx-auto mb-2" />
                  <span className="block text-sm">點擊上傳名片</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-8">
            {/* Section 1: Project Groups (The New Solution) */}
            <div>
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                     <Hash className="text-purple-600" size={20} /> 專案群組 (Group Code)
                  </h3>
                  <button className="text-purple-600 text-sm font-medium hover:underline flex items-center gap-1">
                     <Plus size={16} /> 建立新群組
                  </button>
               </div>
               
               {vendor.socialGroups && vendor.socialGroups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {vendor.socialGroups.map(group => (
                        <div key={group.id} className="border border-purple-100 bg-purple-50/50 rounded-xl p-4 relative overflow-hidden group">
                           <div className={clsx("absolute top-0 right-0 p-1 rounded-bl-lg text-xs font-bold text-white", 
                              group.platform === 'LINE' ? "bg-green-500" : "bg-green-600"
                           )}>
                              {group.platform}
                           </div>
                           
                           <div className="flex items-start gap-3">
                              <div className="bg-white p-2 rounded-lg border border-purple-100">
                                 <QrCode size={32} className="text-slate-700" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 text-xs font-bold text-purple-700 mb-1">
                                    <span className="bg-purple-100 px-2 py-0.5 rounded border border-purple-200">{group.systemCode}</span>
                                    <span className="text-slate-400 font-normal">系統代碼</span>
                                 </div>
                                 <h4 className="font-bold text-slate-800 truncate" title={group.groupName}>{group.groupName}</h4>
                                 <p className="text-xs text-slate-500 mt-1">{group.note || '無備註'}</p>
                              </div>
                           </div>
                           
                           <div className="mt-4 flex gap-2">
                              {group.inviteLink && (
                                 <a href={group.inviteLink} target="_blank" rel="noreferrer" className="flex-1 bg-white border border-slate-200 hover:border-purple-400 text-slate-700 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition">
                                    <ExternalLink size={14} /> 點擊加入
                                 </a>
                              )}
                              {group.qrCodeUrl && (
                                 <button className="flex-1 bg-white border border-slate-200 hover:border-purple-400 text-slate-700 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition">
                                    <QrCode size={14} /> 顯示 QR
                                 </button>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                     <p>尚未建立專案群組，建議使用代碼建立以利管理。</p>
                  </div>
               )}
            </div>

            {/* Section 2: Contact Persons */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">聯繫人列表</h3>
                <button className="text-blue-600 text-sm font-medium hover:underline">+ 新增窗口</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendor.contacts.map(contact => (
                  <div key={contact.id} className={clsx("p-4 rounded-lg border", contact.isMainContact ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200")}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-slate-800">{contact.name}</h4>
                        <p className="text-xs text-slate-500">{contact.role}</p>
                      </div>
                      {contact.isMainContact && <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">主要窗口</span>}
                    </div>
                    <div className="space-y-2 text-sm text-slate-600 mt-3">
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:text-blue-600 p-1 -ml-1 rounded hover:bg-slate-100 transition" 
                        onClick={() => handleContactClick(contact)}
                      >
                        <Phone size={14} /> {maskPhone(contact.mobile)} <Eye size={12} className="text-slate-400"/>
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} /> {contact.email}
                        </div>
                      )}
                      
                      {/* Personal Social IDs - Only Visible to Admin */}
                      <div className="pt-2 border-t border-slate-200/50 mt-2">
                        {isAdminMode ? (
                           <div className="grid grid-cols-2 gap-2">
                              {contact.lineId ? (
                                 <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                    <span className="font-bold">LINE:</span> {contact.lineId}
                                    <Copy size={10} className="cursor-pointer hover:scale-110"/>
                                 </div>
                              ) : <span className="text-xs text-slate-300">無 LINE ID</span>}
                              
                              {contact.wechatId ? (
                                 <div className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                                    <span className="font-bold">WeChat:</span> {contact.wechatId}
                                    <Copy size={10} className="cursor-pointer hover:scale-110"/>
                                 </div>
                              ) : <span className="text-xs text-slate-300">無 WeChat</span>}
                           </div>
                        ) : (
                           <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-100 px-2 py-1.5 rounded">
                              <Lock size={12} />
                              <span>私人通訊 ID 已隱藏 (僅管理員可見)</span>
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800">歷史紀錄</h3>
                <button className="text-blue-600 text-sm font-medium hover:underline">+ 新增聯繫</button>
             </div>
             <div className="space-y-4">
                {vendor.contactLogs.length > 0 ? vendor.contactLogs.map(log => (
                  <div key={log.id} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className="text-sm font-bold text-slate-700">{log.date.split('-')[1]}/{log.date.split('-')[2]}</div>
                      <div className="text-xs text-slate-400">{log.date.split('-')[0]}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={clsx(
                          "text-xs px-2 py-0.5 rounded font-medium",
                          log.status === ContactStatus.SUCCESS ? "bg-green-100 text-green-700" :
                          log.status === ContactStatus.BUSY ? "bg-red-100 text-red-700" :
                          "bg-slate-200 text-slate-700"
                        )}>{log.status}</span>
                        {log.nextFollowUp && <span className="text-xs text-orange-600 flex items-center gap-1"><Clock size={12} /> 追蹤: {log.nextFollowUp}</span>}
                      </div>
                      <p className="text-slate-700 text-sm">{log.note}</p>
                      {log.aiSummary && (
                        <div className="mt-2 text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-100 flex gap-2 items-start">
                          <Bot size={14} className="mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold">AI 重點：</span>{log.aiSummary}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-500 italic">目前無紀錄</p>
                )}
             </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-500 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">工單號</th>
                    <th className="px-4 py-3">日期</th>
                    <th className="px-4 py-3">項目描述</th>
                    <th className="px-4 py-3 text-center">狀態</th>
                    <th className="px-4 py-3 text-right">金額</th>
                    <th className="px-4 py-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendor.transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50 group">
                      <td className="px-4 py-3 font-mono text-xs">{tx.id}</td>
                      <td className="px-4 py-3">{tx.date}</td>
                      <td className="px-4 py-3 max-w-xs truncate" title={tx.description}>{tx.description}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx(
                          "text-xs px-2 py-1 rounded-full font-bold",
                          tx.status === TransactionStatus.PENDING_APPROVAL ? "bg-yellow-100 text-yellow-800" :
                          tx.status === TransactionStatus.APPROVED ? "bg-green-100 text-green-700" :
                          tx.status === TransactionStatus.PAID ? "bg-slate-200 text-slate-600" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col">
                          <span className="font-medium">${tx.amount.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link 
                          to={`/transactions/${tx.id}`} 
                          className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                        >
                           驗收/詳情 <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vendor.transactions.length === 0 && <p className="p-4 text-slate-500">無交易紀錄</p>}
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800">待辦文件</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Mock Status Cards */}
               <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">勞務報酬單</p>
                    <p className="text-xs text-slate-500">最近一次交易: {vendor.transactions[0]?.date || 'N/A'}</p>
                  </div>
                  <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                    {vendor.transactions[0]?.laborFormStatus || 'N/A'}
                  </div>
               </div>
               <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">銀行帳戶資料</p>
                    <p className="text-xs text-slate-500">用於自動轉帳</p>
                  </div>
                  <button className="text-blue-600 text-sm font-medium">管理</button>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Log Modal */}
      {showContactModal && selectedContact && (
        <ContactLogModal 
          contact={selectedContact} 
          onClose={() => setShowContactModal(false)} 
          vendor={vendor} // Pass vendor to update stats locally
        />
      )}
    </div>
  );
};

/* --- Contact Log Modal --- */
const ContactLogModal: React.FC<{ contact: ContactWindow; onClose: () => void; vendor: any }> = ({ contact, onClose, vendor }) => {
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState('');
  
  // Tutorial Hook
  const { showTutorial } = useTutorial();

  const handleAiSummarize = () => {
    if (!note.trim()) return;
    setIsProcessing(true);
    // Simulate AI
    setTimeout(() => {
       setGeneratedSummary("1. 確認可於週末進場施工。\n2. 報價需重新評估，預計週五前回覆。\n3. 注意停車問題。");
       setIsProcessing(false);
    }, 1200);
  };

  const handleAddTag = (tag: string) => {
    setNote(prev => prev ? `${prev} ${tag}` : tag);
  };

  const handleCloseAttempt = async () => {
    // If note is empty, show tutorial/warning
    if (!note.trim()) {
      const result = await showTutorial('CONTACT_LOG_MISSING');
      
      if (result === 'confirm') {
        // User explicitly chose "Skip anyway"
        if (vendor) {
          vendor.missedContactLogCount = (vendor.missedContactLogCount || 0) + 1;
        }
        onClose();
      } else if (result === 'action') {
        // User chose "I will fill it", do nothing (keep modal open)
      }
      // If cancel, keep open
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
       <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
         <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
           <h2 className="text-lg font-bold flex items-center gap-2">
             <Phone size={20} /> 聯繫詳情
           </h2>
           <button onClick={handleCloseAttempt} className="text-slate-400 hover:text-white">×</button>
         </div>

         <div className="p-6">
           <div className="mb-6 text-center">
             <p className="text-sm text-slate-500 mb-1">正在聯繫</p>
             <h3 className="text-2xl font-bold text-slate-800">{contact.name} ({contact.role})</h3>
             <div className="mt-2 inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-mono font-bold text-xl border border-blue-200">
                {contact.mobile || "無號碼"}
             </div>
             <p className="text-xs text-slate-400 mt-2">請務必記錄聯繫結果，系統將自動追蹤。</p>
           </div>

           <div className="space-y-4">
             <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">快速標籤 (點擊加入)</label>
               <div className="flex flex-wrap gap-2 mb-3">
                 {MOCK_SYSTEM_TAGS.contactTags.map(tag => (
                   <button
                     key={tag}
                     onClick={() => handleAddTag(tag)}
                     className="px-2 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 rounded text-xs text-slate-600 transition flex items-center gap-1 border border-slate-200"
                   >
                     <Tag size={10} /> {tag}
                   </button>
                 ))}
               </div>

               <label className="block text-sm font-bold text-slate-700 mb-2">聯繫筆記</label>
               <textarea 
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="紀錄對話重點..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
               />
               <button 
                 onClick={handleAiSummarize}
                 disabled={isProcessing || !note}
                 className="mt-2 text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 font-bold disabled:opacity-50"
               >
                 <Sparkles size={12} /> {isProcessing ? "AI 分析中..." : "AI 協助整理重點"}
               </button>
             </div>

             {generatedSummary && (
               <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-sm text-slate-700">
                 <div className="flex items-center gap-2 font-bold text-purple-800 mb-1">
                   <Bot size={14} /> AI 摘要建議
                 </div>
                 <pre className="whitespace-pre-wrap font-sans text-xs">{generatedSummary}</pre>
               </div>
             )}

             <div className="flex gap-3 pt-2">
                <button onClick={handleCloseAttempt} className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">取消</button>
                <button className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2">
                   <Save size={16} /> 儲存紀錄
                </button>
             </div>
           </div>
         </div>
       </div>
    </div>
  );
};
