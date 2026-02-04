import { useState } from 'react';
import { Link, useLocation, useRouteLoaderData } from '@remix-run/react';
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
  ChevronDown,
  History,
  LogOut
} from 'lucide-react';
import { clsx } from 'clsx';
import { PERMISSIONS, parsePermissions, type Permission } from '~/utils/permissions';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  
  // 嘗試從 root loader 取得用戶資料
  const rootData = useRouteLoaderData('root') as { user?: any } | undefined;
  const currentUser = rootData?.user || {
    id: '1',
    name: '系統管理員',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  };
  
  const isAdmin = currentUser.role === 'admin';
  
  // 獲取用戶權限
  const userPermissions: Permission[] = isAdmin 
    ? Object.values(PERMISSIONS) // Admin 擁有所有權限
    : parsePermissions(currentUser.permissions || null);
  
  // 檢查用戶是否有指定權限
  const hasPermission = (permission: Permission) => {
    return isAdmin || userPermissions.includes(permission);
  };

  const navItems = [
    { 
      name: '統計儀表板', 
      path: '/', 
      icon: <LayoutDashboard size={18} />, 
      permission: hasPermission(PERMISSIONS.DASHBOARD)
    },
    { 
      name: '廠商名錄', 
      path: '/vendors', 
      icon: <Users size={18} />, 
      permission: hasPermission(PERMISSIONS.VENDORS)
    },
    { 
      name: '設備維修紀錄', 
      path: '/maintenance', 
      icon: <History size={18} />, 
      permission: hasPermission(PERMISSIONS.MAINTENANCE)
    },
    { 
      name: '日常任務', 
      path: '/tasks', 
      icon: <Briefcase size={18} />, 
      permission: hasPermission(PERMISSIONS.TASKS)
    },
    { 
      name: '通訊中心', 
      path: '/communication', 
      icon: <MessageCircle size={18} />, 
      permission: hasPermission(PERMISSIONS.COMMUNICATION)
    },
    { 
      name: '請款與發票管理', 
      path: '/payments', 
      icon: <CreditCard size={18} />, 
      permission: hasPermission(PERMISSIONS.INVOICES)
    },
    { 
      name: '知識庫', 
      path: '/knowledge', 
      icon: <BookOpen size={18} />, 
      permission: hasPermission(PERMISSIONS.KNOWLEDGE)
    },
    { 
      name: '系統公告', 
      path: '/announcements', 
      icon: <Megaphone size={18} />, 
      permission: hasPermission(PERMISSIONS.ANNOUNCEMENTS)
    }, 
    { 
      name: '系統管理', 
      path: '/admin', 
      icon: <Settings size={18} />, 
      permission: hasPermission(PERMISSIONS.SYSTEM)
    }, 
  ];

  const isActive = (path: string) => location.pathname === path;

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
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
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
                          ? "bg-emerald-600 text-white shadow-md" 
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
                          ? "bg-emerald-600 text-white shadow-md" 
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

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2 rounded-xl mb-2">
            <img 
              src={currentUser.avatarUrl} 
              alt="User" 
              className="w-9 h-9 rounded-full object-cover border border-gray-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded uppercase tracking-wider">
                    Admin
                  </span>
                )}
                <p className="text-xs text-gray-400 truncate">{currentUser.email || ''}</p>
              </div>
            </div>
          </div>
          <form method="post" action="/logout">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>登出</span>
            </button>
          </form>
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
