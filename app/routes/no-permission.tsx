import { Link } from '@remix-run/react';
import { ShieldX, ArrowLeft } from 'lucide-react';
import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: '無權限訪問 - PartnerLink Pro' },
    { name: 'description', content: '您沒有權限訪問此頁面' },
  ];
};

export default function NoPermission() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldX className="w-12 h-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          無權限訪問
        </h1>
        
        <p className="text-lg text-slate-600 mb-8">
          抱歉，您沒有權限訪問此頁面。<br />
          請聯繫系統管理員以獲取相關權限。
        </p>
        
        <div className="space-y-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft size={18} />
            返回首頁
          </Link>
          
          <p className="text-sm text-slate-500">
            如有疑問，請聯繫系統管理員
          </p>
        </div>
      </div>
    </div>
  );
}
