import { db } from './db.server';
import { systemSettings } from '../../db/schema/systemSettings';
import { eq } from 'drizzle-orm';

/**
 * 系統設定的資料類型
 */
export type SystemSettingDataType = 'string' | 'number' | 'boolean' | 'json';

/**
 * 系統設定項目介面
 */
export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  dataType: SystemSettingDataType;
  updatedAt: Date;
  updatedBy: string | null;
}

/**
 * 取得所有系統設定
 */
export async function getAllSettings(): Promise<SystemSetting[]> {
  try {
    const settings = await db.select().from(systemSettings);
    return settings as SystemSetting[];
  } catch (error) {
    console.error('Failed to get all settings:', error);
    return [];
  }
}

/**
 * 根據 category 取得系統設定
 */
export async function getSettingsByCategory(category: string): Promise<SystemSetting[]> {
  try {
    const settings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.category, category));
    return settings as SystemSetting[];
  } catch (error) {
    console.error(`Failed to get settings for category ${category}:`, error);
    return [];
  }
}

/**
 * 根據 key 取得單一系統設定
 */
export async function getSettingByKey(key: string): Promise<SystemSetting | null> {
  try {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting as SystemSetting || null;
  } catch (error) {
    console.error(`Failed to get setting for key ${key}:`, error);
    return null;
  }
}

/**
 * 取得設定值並轉換為正確的型別
 */
export async function getSettingValue<T = any>(key: string, defaultValue?: T): Promise<T> {
  const setting = await getSettingByKey(key);
  
  if (!setting) {
    return defaultValue as T;
  }

  try {
    switch (setting.dataType) {
      case 'number':
        return parseFloat(setting.value) as T;
      case 'boolean':
        return (setting.value === 'true') as T;
      case 'json':
        return JSON.parse(setting.value) as T;
      case 'string':
      default:
        return setting.value as T;
    }
  } catch (error) {
    console.error(`Failed to parse setting value for key ${key}:`, error);
    return defaultValue as T;
  }
}

/**
 * 更新系統設定
 */
export async function updateSetting(
  key: string,
  value: string,
  updatedBy?: string
): Promise<boolean> {
  try {
    await db
      .update(systemSettings)
      .set({
        value,
        updatedAt: new Date(),
        updatedBy: updatedBy || null,
      })
      .where(eq(systemSettings.key, key));
    return true;
  } catch (error) {
    console.error(`Failed to update setting ${key}:`, error);
    return false;
  }
}

/**
 * 批量更新系統設定
 */
export async function updateSettings(
  updates: Array<{ key: string; value: string }>,
  updatedBy?: string
): Promise<boolean> {
  try {
    for (const update of updates) {
      await updateSetting(update.key, update.value, updatedBy);
    }
    return true;
  } catch (error) {
    console.error('Failed to update settings:', error);
    return false;
  }
}

/**
 * 取得所有設定並按 category 分組
 */
export async function getSettingsGroupedByCategory(): Promise<Record<string, SystemSetting[]>> {
  const allSettings = await getAllSettings();
  const grouped: Record<string, SystemSetting[]> = {};

  for (const setting of allSettings) {
    if (!grouped[setting.category]) {
      grouped[setting.category] = [];
    }
    grouped[setting.category].push(setting);
  }

  return grouped;
}
