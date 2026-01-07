
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  BookOpen, 
  Settings, 
  Menu,
  X,
  CreditCard,
  Briefcase,
  MessageCircle,
  Leaf,
  LogOut,
  ChevronDown,
  History
} from 'lucide-react';
import { clsx } from 'clsx';
import { MOCK_USERS } from '../constants';
import { AdminUser } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<AdminUser>(MOCK_USERS[0]); 
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const location = useLocation();

  const navItems = [
    { 
      name: '統計儀表板', 
      path: '/', 
      icon: <LayoutDashboard size={18} />, 
      permission: currentUser.permissions.viewWarRoom 
    },
    { 
      name: '廠商名錄', 
      path: '/vendors', 
      icon: <Users size={18} />, 
      permission: currentUser.permissions.viewVendors 
    },
    { 
      name: '設備維修紀錄', 
      path: '/maintenance', 
      icon: <History size={18} />, 
      permission: true 
    },
    { 
      name: '日常任務', 
      path: '/tasks', 
      icon: <Briefcase size={18} />, 
      permission: currentUser.permissions.viewTasks 
    },
    { 
      name: '通訊中心', 
      path: '/communication', 
      icon: <MessageCircle size={18} />, 
      permission: currentUser.permissions.viewCommunication 
    },
    { 
      name: '請款與發票管理', 
      path: '/payments', 
      icon: <CreditCard size={18} />, 
      permission: currentUser.permissions.viewPayments 
    },
    { 
      name: '知識庫', 
      path: '/knowledge', 
      icon: <BookOpen size={18} />, 
      permission: currentUser.permissions.viewKnowledge 
    },
    { 
      name: '系統公告', 
      path: '/announcements', 
      icon: <Megaphone size={18} />, 
      permission: currentUser.permissions.viewAnnouncements 
    }, 
    { 
      name: '系統管理', 
      path: '/admin', 
      icon: <Settings size={18} />, 
      permission: currentUser.permissions.accessAdminPanel 
    }, 
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSwitchUser = (user: AdminUser) => {
    setCurrentUser(user);
    setShowRoleSwitcher(false);
  };

  return (
    <div className="flex h-screen bg-[#f9fafb] overflow-hidden font-sans text-slate-800">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col",
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-3 p-6 mb-2">
          <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center text-white">
            <Leaf size={18} fill="currentColor" />
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">精英團隊</span>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8">
           <div>
              <p className="px-4 text-xs font-bold text-gray-400 mb-2 tracking-wider">資源導覽</p>
              <nav className="space-y-1">
                {navItems.slice(0, 5).map((item) => (
                  item.permission && (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={clsx(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                        isActive(item.path) 
                          ? "bg-brand-700 text-white shadow-md shadow-brand-200" 
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  )
                ))}
              </nav>
           </div>

           <div>
              <p className="px-4 text-xs font-bold text-gray-400 mb-2 tracking-wider">管理中心</p>
              <nav className="space-y-1">
                {navItems.slice(5).map((item) => (
                  item.permission && (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={clsx(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                        isActive(item.path) 
                          ? "bg-brand-700 text-white shadow-md shadow-brand-200" 
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  )
                ))}
              </nav>
           </div>
        </div>

        <div className="p-4 border-t border-gray-100 relative">
          {showRoleSwitcher && (
             <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500">切換測試帳號</div>
                {MOCK_USERS.map(u => (
                   <button 
                     key={u.id}
                     onClick={() => handleSwitchUser(u)}
                     className={clsx("w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition text-sm", currentUser.id === u.id && "bg-blue-50 text-blue-600 font-bold")}
                   >
                      <img src={u.avatarUrl} className="w-6 h-6 rounded-full" />
                      <div>
                         <div className="leading-tight">{u.name}</div>
                         <div className="text-[10px] text-slate-400">{u.role}</div>
                      </div>
                   </button>
                ))}
             </div>
          )}

          <div 
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition select-none group"
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
          >
            <img 
              src={currentUser.avatarUrl} 
              alt="User" 
              className="w-9 h-9 rounded-full object-cover border border-gray-200 group-hover:border-slate-300"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser.role}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600"/>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-[#f9fafb]">
        <header className="bg-white border-b border-gray-100 md:hidden flex items-center justify-between p-4 sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
              <Menu size={24} />
            </button>
            <span className="font-bold text-gray-800">PartnerLink Pro</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};
