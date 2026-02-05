import { db } from "./db.server";
import { loginLogs } from "../../db/schema/login";

/**
 * 解析 User-Agent 字串，提取瀏覽器和作業系統資訊
 */
function parseUserAgent(userAgent: string): { browser: string; os: string; device: string } {
  let browser = 'Unknown';
  let os = 'Unknown';
  
  // 解析瀏覽器
  if (userAgent.includes('Edg/')) {
    browser = 'Edge';
  } else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    browser = 'Safari';
  } else if (userAgent.includes('Firefox/')) {
    browser = 'Firefox';
  }
  
  // 解析作業系統
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS X')) {
    os = 'Mac';
  } else if (userAgent.includes('iPhone')) {
    os = 'iPhone';
  } else if (userAgent.includes('iPad')) {
    os = 'iPad';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  }
  
  const device = `${browser} / ${os}`;
  
  return { browser, os, device };
}

/**
 * 從 Request 物件中取得 IP 地址
 */
function getClientIP(request: Request): string {
  // 優先從 X-Forwarded-For header 取得（適用於 proxy 環境）
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // 其他常見的 header
  const realIP = request.headers.get('X-Real-IP');
  if (realIP) {
    return realIP;
  }
  
  // 預設值
  return 'Unknown';
}

/**
 * 記錄登入成功
 */
export async function logLoginSuccess(
  request: Request,
  userId: string,
  email: string,
  userName: string
): Promise<void> {
  try {
    const userAgent = request.headers.get('User-Agent') || 'Unknown';
    const ip = getClientIP(request);
    const { browser, os, device } = parseUserAgent(userAgent);
    
    await db.insert(loginLogs).values({
      userId,
      email,
      userName,
      ip,
      userAgent,
      browser,
      os,
      device,
      status: 'SUCCESS',
      timestamp: new Date(),
    });
    
    console.log(`[LoginLog] Success: ${email} from ${ip} (${device})`);
  } catch (error) {
    console.error('[LoginLog] Failed to log login success:', error);
    // 不拋出錯誤，避免影響登入流程
  }
}

/**
 * 記錄登入失敗
 */
export async function logLoginFailure(
  request: Request,
  email: string,
  reason: string
): Promise<void> {
  try {
    const userAgent = request.headers.get('User-Agent') || 'Unknown';
    const ip = getClientIP(request);
    const { browser, os, device } = parseUserAgent(userAgent);
    
    await db.insert(loginLogs).values({
      userId: null,
      email,
      userName: null,
      ip,
      userAgent,
      browser,
      os,
      device,
      status: 'FAILED',
      failureReason: reason,
      timestamp: new Date(),
    });
    
    console.log(`[LoginLog] Failure: ${email} from ${ip} - ${reason}`);
  } catch (error) {
    console.error('[LoginLog] Failed to log login failure:', error);
    // 不拋出錯誤
  }
}
