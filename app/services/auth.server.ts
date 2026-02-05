import { Authenticator } from "remix-auth";
import { GoogleStrategy, GoogleProfile } from "remix-auth-google";
import { sessionStorage } from "./session.server";
import { db } from "./db.server";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { User } from "../../db/schema/user";
import { logLoginSuccessSimple } from "./loginLog.server";

// 建立 Authenticator 實例
export const authenticator = new Authenticator<User>(sessionStorage);

// Google OAuth Strategy 配置
const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback",
  },
  async ({ profile }: { profile: GoogleProfile }) => {
    try {
      // 從 Google profile 取得用戶資訊
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const avatarUrl = profile.photos[0]?.value || null;
      const googleId = profile.id;

      // 檢查用戶是否已存在
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUsers.length > 0) {
        // 用戶已存在，更新最後登入時間和 Google ID（如果沒有）
        const [updatedUser] = await db
          .update(users)
          .set({
            lastLoginAt: new Date(),
            googleId: existingUsers[0].googleId || googleId,
            avatarUrl: avatarUrl || existingUsers[0].avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUsers[0].id))
          .returning();

        // 記錄登入成功
        await logLoginSuccessSimple(updatedUser.id, updatedUser.email, updatedUser.name);

        return updatedUser;
      } else {
        // 檢查是否為第一個用戶
        const allUsers = await db.select().from(users);
        const isFirstUser = allUsers.length === 0;
        
        // 建立新用戶
        // 第一個用戶：自動批准為 admin
        // 其他用戶：預設為 pending 狀態，等待管理員審核
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            name,
            avatarUrl,
            googleId,
            role: isFirstUser ? 'admin' : 'user',
            status: isFirstUser ? 'approved' : 'pending',
            isActive: true,
            lastLoginAt: new Date(),
            approvedAt: isFirstUser ? new Date() : undefined,
          })
          .returning();

        // 記錄登入成功（新用戶）
        await logLoginSuccessSimple(newUser.id, newUser.email, newUser.name);

        return newUser;
      }
    } catch (error) {
      console.error("Google authentication error:", error);
      throw new Error("Failed to authenticate with Google");
    }
  }
);

// 註冊 Google Strategy
authenticator.use(googleStrategy);

// 輔助函數：取得當前登入用戶
export async function requireUser(request: Request) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  
  // 檢查用戶審核狀態
  if (user.status === 'pending') {
    throw new Response(null, {
      status: 302,
      headers: { Location: '/waiting-approval' },
    });
  }
  
  if (user.status === 'rejected') {
    throw new Response(null, {
      status: 302,
      headers: { Location: '/access-denied' },
    });
  }
  
  return user;
}

// 輔助函數：檢查用戶是否已登入（不重新導向）
export async function getUser(request: Request) {
  const sessionUser = await authenticator.isAuthenticated(request);
  
  if (!sessionUser) {
    return null;
  }
  
  // 從資料庫重新讀取最新的用戶資料（包括 permissions 等欄位）
  try {
    const [latestUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1);
    
    return latestUser || sessionUser;
  } catch (error) {
    console.error('Failed to fetch latest user data:', error);
    return sessionUser;
  }
}

// 輔助函數：要求管理員權限
export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  
  if (user.role !== 'admin') {
    throw new Response("無權訪問：需要管理員權限", { status: 403 });
  }
  
  return user;
}
