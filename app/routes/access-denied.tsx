import { ShieldX, LogOut, Mail } from "lucide-react";
import { Form, useLoaderData } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

export default function AccessDenied() {
  const { user } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-slate-100">
      <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md border border-red-200">
        {/* 圖示 */}
        <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <ShieldX className="text-red-600" size={48} strokeWidth={2.5} />
        </div>
        
        {/* 標題 */}
        <h1 className="text-3xl font-black text-slate-800 mb-4">
          訪問被拒絕
        </h1>
        
        {/* 說明 */}
        <p className="text-slate-600 mb-3 leading-relaxed">
          您的帳號申請已被管理員拒絕
        </p>
        
        {/* 拒絕原因 */}
        {user?.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-bold text-red-800 mb-1">拒絕原因：</p>
            <p className="text-sm text-red-700">{user.rejectionReason}</p>
          </div>
        )}
        
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          如有疑問，請聯繫系統管理員
        </p>
        
        {/* 分隔線 */}
        <div className="border-t border-slate-200 my-8"></div>
        
        {/* 操作按鈕 */}
        <div className="space-y-3">
          <Form method="post" action="/logout">
            <button 
              type="submit"
              className="w-full px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <LogOut size={18} />
              登出
            </button>
          </Form>
          
          <a 
            href="mailto:admin@example.com"
            className="w-full px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-bold flex items-center justify-center gap-2"
          >
            <Mail size={18} />
            聯繫管理員
          </a>
        </div>
        
        {/* 底部提示 */}
        <p className="text-xs text-slate-400 mt-6">
          精英團隊 - 全球協力廠商戰略名錄
        </p>
      </div>
    </div>
  );
}
