import { Authenticator } from "remix-auth";
import { GoogleStrategy, GoogleProfile } from "remix-auth-google";
import { sessionStorage } from "./session.server";
import { db } from "./db.server";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { User } from "../../db/schema/user";

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

        return updatedUser;
      } else {
        // 建立新用戶
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            name,
            avatarUrl,
            googleId,
            isActive: true,
            lastLoginAt: new Date(),
          })
          .returning();

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
  return user;
}

// 輔助函數：檢查用戶是否已登入（不重新導向）
export async function getUser(request: Request) {
  return await authenticator.isAuthenticated(request);
}
