import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

// 這個路由只處理 POST 請求，觸發 Google OAuth 流程
export async function loader() {
  return redirect("/login");
}

export async function action({ request }: ActionFunctionArgs) {
  // 觸發 Google OAuth 認證流程
  return authenticator.authenticate("google", request);
}
