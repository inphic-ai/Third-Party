import { db } from './db.server';
import { systemLogs } from '../../db/schema/system';

export type SystemLogAction = 
  | '登入系統'
  | '登出系統'
  | '新增廠商'
  | '編輯廠商'
  | '刪除廠商'
  | '新增聯繫窗口'
  | '編輯聯繫窗口'
  | '刪除聯繫窗口'
  | '新增請款'
  | '編輯請款'
  | '刪除請款'
  | '新增發票'
  | '編輯發票'
  | '刪除發票'
  | '更新權限'
  | '新增公告'
  | '編輯公告'
  | '刪除公告'
  | '新增標籤'
  | '編輯標籤'
  | '刪除標籤'
  | '新增類別'
  | '編輯類別'
  | '刪除類別'
  | '新增部門'
  | '編輯部門'
  | '刪除部門'
  | '其他操作';

export type SystemLogStatus = 'success' | 'failed';

interface LogSystemActionParams {
  userId: string;
  action: SystemLogAction;
  target: string;
  details: string;
  ip: string;
  userAgent: string;
  status: SystemLogStatus;
}

/**
 * 記錄系統操作日誌
 */
export async function logSystemAction(params: LogSystemActionParams) {
  try {
    await db.insert(systemLogs).values({
      user: params.userId,
      action: params.action,
      target: params.target,
      details: params.details,
      ip: params.ip,
      userAgent: params.userAgent,
      status: params.status,
    });
  } catch (error) {
    console.error('Failed to log system action:', error);
    // 日誌記錄失敗不應影響主要操作，所以只記錄錯誤不拋出
  }
}

/**
 * 從 Request 物件中提取 IP 和 User Agent
 */
export function extractRequestInfo(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ip, userAgent };
}
