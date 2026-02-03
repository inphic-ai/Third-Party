import { createCookieSessionStorage } from "@remix-run/node";

// Session 儲存配置
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session", // Cookie 名稱
    sameSite: "lax", // CSRF 保護
    path: "/", // Cookie 作用路徑
    httpOnly: true, // 防止 JavaScript 存取（安全性）
    secrets: [process.env.SESSION_SECRET || "default-secret-change-in-production"], // 加密密鑰
    secure: process.env.NODE_ENV === "production", // 生產環境使用 HTTPS
    maxAge: 60 * 60 * 24 * 30, // 30 天過期
  },
});

// 匯出 Session 操作函數
export const { getSession, commitSession, destroySession } = sessionStorage;
