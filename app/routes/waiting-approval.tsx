import { Clock, LogOut } from "lucide-react";
import { Form } from "@remix-run/react";

export default function WaitingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md border border-slate-200">
        {/* 圖示 */}
        <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Clock className="text-yellow-600" size={48} strokeWidth={2.5} />
        </div>
        
        {/* 標題 */}
        <h1 className="text-3xl font-black text-slate-800 mb-4">
          帳號審核中
        </h1>
        
        {/* 說明 */}
        <p className="text-slate-600 mb-3 leading-relaxed">
          您的帳號正在等待管理員審核
        </p>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          審核通過後將會收到電子郵件通知<br/>
          屆時即可使用系統的所有功能
        </p>
        
        {/* 分隔線 */}
        <div className="border-t border-slate-200 my-8"></div>
        
        {/* 登出按鈕 */}
        <Form method="post" action="/logout">
          <button 
            type="submit"
            className="w-full px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <LogOut size={18} />
            登出
          </button>
        </Form>
        
        {/* 底部提示 */}
        <p className="text-xs text-slate-400 mt-6">
          如有疑問，請聯繫系統管理員
        </p>
      </div>
    </div>
  );
}
