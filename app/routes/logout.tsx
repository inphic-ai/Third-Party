import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { destroySession, getSession } from "~/services/session.server";

// 登出路由
export async function action({ request }: ActionFunctionArgs) {
  // 清除 session 並重新導向到登入頁
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

// 如果有人直接訪問 /logout，重新導向到登入頁
export async function loader() {
  return redirect("/login");
}
