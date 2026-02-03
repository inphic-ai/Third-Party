import { Resend } from 'resend';

// 初始化 Resend 客戶端
const resend = new Resend(process.env.RESEND_API_KEY);

// 郵件寄件者資訊
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
const FROM_NAME = process.env.FROM_NAME || 'Third-Party 管理系統';

/**
 * 發送用戶批准通知郵件
 */
export async function sendApprovalEmail(
  userEmail: string,
  userName: string,
  departmentName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: userEmail,
      subject: '✅ 您的帳號已通過審核',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .info-box {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">🎉 帳號審核通過</h1>
          </div>
          <div class="content">
            <p>親愛的 <strong>${userName}</strong>，您好：</p>
            
            <p>恭喜您！您的 Third-Party 管理系統帳號已通過管理員審核，現在可以開始使用系統了。</p>
            
            <div class="info-box">
              <p style="margin: 5px 0;"><strong>帳號資訊：</strong></p>
              <p style="margin: 5px 0;">• 姓名：${userName}</p>
              <p style="margin: 5px 0;">• Email：${userEmail}</p>
              <p style="margin: 5px 0;">• 部門：${departmentName}</p>
            </div>
            
            <p>請點擊下方按鈕登入系統：</p>
            
            <div style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}" class="button">
                立即登入系統
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              如有任何問題，請聯繫系統管理員。
            </p>
          </div>
          <div class="footer">
            <p>此郵件由 Third-Party 管理系統自動發送，請勿直接回覆。</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email Service] Failed to send approval email:', error);
      return { success: false, error };
    }

    console.log('[Email Service] Approval email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Email Service] Error sending approval email:', error);
    return { success: false, error };
  }
}

/**
 * 發送用戶拒絕通知郵件
 */
export async function sendRejectionEmail(
  userEmail: string,
  userName: string,
  reason: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: userEmail,
      subject: '❌ 您的帳號申請未通過審核',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .reason-box {
              background: #fef2f2;
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">帳號申請未通過</h1>
          </div>
          <div class="content">
            <p>親愛的 <strong>${userName}</strong>，您好：</p>
            
            <p>很遺憾通知您，您的 Third-Party 管理系統帳號申請未通過審核。</p>
            
            <div class="reason-box">
              <p style="margin: 5px 0; font-weight: bold;">拒絕原因：</p>
              <p style="margin: 5px 0;">${reason}</p>
            </div>
            
            <p>如果您認為這是一個錯誤，或需要進一步說明，請聯繫系統管理員。</p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              感謝您的理解與配合。
            </p>
          </div>
          <div class="footer">
            <p>此郵件由 Third-Party 管理系統自動發送，請勿直接回覆。</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email Service] Failed to send rejection email:', error);
      return { success: false, error };
    }

    console.log('[Email Service] Rejection email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Email Service] Error sending rejection email:', error);
    return { success: false, error };
  }
}
