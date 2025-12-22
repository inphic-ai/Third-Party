
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
  MessageCircle
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: '營運戰情室', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: '廠商名錄', path: '/vendors', icon: <Users size={20} /> },
    { name: '通訊軟體', path: '/communication', icon: <MessageCircle size={20} /> }, // New Entry
    { name: '支付紀錄', path: '/payments', icon: <CreditCard size={20} /> },
    { name: '日常任務', path: '/tasks', icon: <Briefcase size={20} /> },
    { name: '知識庫', path: '/knowledge', icon: <BookOpen size={20} /> },
    { name: '系統公告', path: '/announcements', icon: <Megaphone size={20} /> }, 
    { name: '系統管理', path: '/admin', icon: <Settings size={20} /> }, 
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">P</div>
            <span className="text-xl font-bold">PartnerLink</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path) 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium tracking-wide">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <img 
              src="https://picsum.photos/40/40?random=user" 
              alt="User" 
              className="w-10 h-10 rounded-full border-2 border-slate-600"
            />
            <div>
              <p className="text-sm font-medium text-white">管理員</p>
              <p className="text-xs text-slate-400">採購經理</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header (Mobile) */}
        <header className="bg-white shadow-sm md:hidden flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600">
              <Menu size={24} />
            </button>
            <span className="font-bold text-slate-800">PartnerLink Pro</span>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
