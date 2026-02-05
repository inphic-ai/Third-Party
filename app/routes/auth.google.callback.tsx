import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { logLoginSuccess, logLoginFailure } from "~/services/loginLog.server";

// Google OAuth 回調路由
// Google 會將用戶重新導向到這個路由，並帶上授權碼
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // 完成 OAuth 流程，取得用戶資訊並建立 session
    const user = await authenticator.authenticate("google", request, {
      throwOnError: true, // 拋出錯誤而不是重新導向
    });
    
    // 記錄登入成功
    await logLoginSuccess(request, user.id, user.email, user.name);
    
    // 手動重新導向到首頁
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  } catch (error) {
    console.error("Google authentication failed:", error);
    
    // 記錄登入失敗（如果能取得 email）
    // 注意：這裡可能無法取得 email，因為認證失敗了
    await logLoginFailure(request, "Unknown", error instanceof Error ? error.message : "Authentication failed");
    
    // 重新導向到登入頁
    return new Response(null, {
      status: 302,
      headers: { Location: "/login" },
    });
  }
}
