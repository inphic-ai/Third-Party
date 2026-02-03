import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

// Google OAuth 回調路由
// Google 會將用戶重新導向到這個路由，並帶上授權碼
export async function loader({ request }: LoaderFunctionArgs) {
  // 完成 OAuth 流程，取得用戶資訊並建立 session
  return authenticator.authenticate("google", request, {
    successRedirect: "/", // 登入成功後跳轉到首頁
    failureRedirect: "/login", // 登入失敗後跳轉到登入頁
  });
}
