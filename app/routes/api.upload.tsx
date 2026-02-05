import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return json({ error: '沒有檔案' }, { status: 400 });
    }
    
    // 驗證檔案類型
    if (!file.type.startsWith('image/')) {
      return json({ error: '只能上傳圖片檔案' }, { status: 400 });
    }
    
    // 驗證檔案大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return json({ error: '圖片大小不能超過 5MB' }, { status: 400 });
    }
    
    // 生成唯一檔名
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `announcement_${timestamp}.${ext}`;
    const tempPath = join('/tmp', filename);
    
    // 將檔案寫入臨時目錄
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(tempPath, buffer);
    
    try {
      // 使用 manus-upload-file 上傳到 S3
      const { stdout } = await execAsync(`manus-upload-file ${tempPath}`);
      const url = stdout.trim();
      
      // 刪除臨時檔案
      await unlink(tempPath);
      
      return json({ url, success: true });
    } catch (uploadError) {
      // 刪除臨時檔案
      await unlink(tempPath);
      console.error('Upload error:', uploadError);
      return json({ error: '圖片上傳失敗' }, { status: 500 });
    }
  } catch (error) {
    console.error('API upload error:', error);
    return json({ error: '處理失敗' }, { status: 500 });
  }
}
