import { Form, useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { getUser } from "~/services/auth.server";
import { redirect } from "@remix-run/node";

// 檢查用戶是否已登入，如果已登入則跳轉到首頁
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) {
    return redirect("/");
  }
  return json({ user: null });
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-md">
        {/* 登入卡片 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
          {/* Logo 和標題 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">
              精英團隊
            </h1>
            <p className="text-slate-500 font-medium">
              全球協力廠商戰略名錄
            </p>
          </div>

          {/* 登入按鈕 */}
          <Form action="/auth/google" method="post">
            <button
              type="submit"
              className="w-full bg-white border-2 border-slate-200 text-slate-700 px-6 py-4 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-lg flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              使用 Google 帳號登入
            </button>
          </Form>

          {/* 說明文字 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              登入即表示您同意我們的服務條款和隱私政策
            </p>
          </div>
        </div>

        {/* 底部資訊 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            © 2026 精英團隊 · 全球協力廠商戰略名錄
          </p>
        </div>
      </div>
    </div>
  );
}
