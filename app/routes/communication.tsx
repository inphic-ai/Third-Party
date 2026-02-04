import { useState, useEffect, useMemo } from 'react';
import { canUserDelete } from "~/utils/deletePermissions";
import { useLoaderData, Link, useFetcher } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { eq } from 'drizzle-orm';
import { db } from '../services/db.server';
import { contactLogs } from '../../db/schema/operations';
import { transactions } from '../../db/schema/financial';
import { vendors, socialGroups, contactWindows } from '../../db/schema/vendor';
import { requireUser } from '~/services/auth.server';
import { requirePermission } from '~/utils/permissions.server';
import { 
  MessageCircle, 
  Search, 
  ExternalLink, 
  Copy, 
  Hash, 
  User, 
  Building2, 
  Users,
  Filter,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Sparkles,
  GripVertical,
  Settings,
  Trash2
} from 'lucide-react';
import { clsx } from 'clsx';

import { ClientOnly } from '~/components/ClientOnly';
import { Pagination } from '~/components/Pagination';
import { MOCK_VENDORS, CATEGORY_OPTIONS } from '~/constants';
import { SocialGroup, EntityType, VendorCategory } from '~/types';

export const meta: MetaFunction = () => {
  return [
    { title: "通訊中心 - PartnerLink Pro" },
    { name: "description", content: "統一管理 LINE/WeChat 平台的所有群組資產與聯絡人" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // 要求用戶必須登入
  const user = await requireUser(request);
  
  // 檢查用戶是否有通訊中心權限
  requirePermission(user, '/communication');
  
  try {
    console.log('[Communication Loader] Loading contact logs and vendors...');
    
    // 讀取所有聯絡紀錄、廠商、群組和聯絡窗口
    const [allContactLogs, allVendors, allSocialGroups, allContactWindows] = await Promise.all([
      db.select().from(contactLogs),
      db.select().from(vendors),
      db.select().from(socialGroups),
      db.select().from(contactWindows)
    ]);
    
    console.log(`[Communication Loader] Loaded ${allContactLogs.length} contact logs, ${allVendors.length} vendors, ${allSocialGroups.length} social groups, ${allContactWindows.length} contact windows`);
    
    // 轉換為前端格式
    const contactLogsWithMapping = allContactLogs.map(log => ({
      id: log.id,
      vendorId: log.vendorId,
      date: log.date.toISOString(),
      status: log.status,
      note: log.note,
      aiSummary: log.aiSummary || undefined,
      nextFollowUp: log.nextFollowUp?.toISOString() || undefined,
      isReservation: log.isReservation || false,
      reservationTime: log.reservationTime?.toISOString() || undefined,
      quoteAmount: log.quoteAmount ? parseFloat(String(log.quoteAmount)) : undefined,
    }));
    
    // 建立 vendor map 以便快速查詢
    const vendorMap = new Map(allVendors.map(v => [v.id, v]));
    
    // 按 vendorId 分組 socialGroups
    const groupsByVendor = new Map<string, any[]>();
    allSocialGroups.forEach(group => {
      if (!groupsByVendor.has(group.vendorId)) {
        groupsByVendor.set(group.vendorId, []);
      }
      groupsByVendor.get(group.vendorId)!.push({
        id: group.id,
        platform: group.platform,
        groupName: group.groupName,
        systemCode: group.systemCode,
        inviteLink: group.inviteLink || '',
        qrCodeUrl: group.qrCodeUrl || '',
        note: group.note || ''
      });
    });
    
    // 按 vendorId 分組 contactWindows
    const contactsByVendor = new Map<string, any[]>();
    allContactWindows.forEach(contact => {
      if (!contactsByVendor.has(contact.vendorId)) {
        contactsByVendor.set(contact.vendorId, []);
      }
      contactsByVendor.get(contact.vendorId)!.push({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        mobile: contact.mobile || '',
        email: contact.email || '',
        lineId: contact.lineId || '',
        wechatId: contact.wechatId || '',
        isMainContact: contact.isMainContact || false
      });
    });
    
    const vendorsWithMapping = allVendors.map(vendor => ({
      id: vendor.id,
      name: vendor.name || '',
      avatarUrl: vendor.avatarUrl || '',
      categories: Array.isArray(vendor.categories) ? vendor.categories : [],
      socialGroups: groupsByVendor.get(vendor.id) || [],
      contacts: contactsByVendor.get(vendor.id) || []
    }));
    
    return json({ 
      contactLogs: contactLogsWithMapping,
      vendors: vendorsWithMapping,
      canDeleteCommunication: canUserDelete(user, 'communication')
    });
  } catch (error) {
    console.error('[Communication Loader] Error:', error);
    return json({ 
      contactLogs: [],
      vendors: [],
      canDeleteCommunication: canUserDelete(user, 'communication')
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  // 新增通訊群組
  if (intent === "createGroup") {
    const user = await requireUser(request);
    
    const vendorId = formData.get("vendorId") as string;
    const platform = formData.get("platform") as string;
    const groupName = formData.get("groupName") as string;
    const systemCode = formData.get("systemCode") as string;
    const inviteLink = formData.get("inviteLink") as string;
    const qrCodeUrl = formData.get("qrCodeUrl") as string;
    const note = formData.get("note") as string;
    
    // 驗證必填欄位
    if (!vendorId || !platform || !groupName || !systemCode) {
      return json({ success: false, message: "請填寫所有必填欄位" }, { status: 400 });
    }
    
    // 驗證平台
    if (platform !== 'LINE' && platform !== 'WECHAT') {
      return json({ success: false, message: "無效的平台" }, { status: 400 });
    }
    
    try {
      // 檢查 systemCode 是否已存在
      const [existing] = await db.select()
        .from(socialGroups)
        .where(eq(socialGroups.systemCode, systemCode));
      
      if (existing) {
        return json({ success: false, message: "系統代碼已存在，請使用其他代碼" }, { status: 400 });
      }
      
      // 建立新群組
      const [newGroup] = await db.insert(socialGroups).values({
        vendorId,
        platform: platform as 'LINE' | 'WECHAT',
        groupName: groupName.trim(),
        systemCode: systemCode.trim(),
        inviteLink: inviteLink?.trim() || null,
        qrCodeUrl: qrCodeUrl?.trim() || null,
        note: note?.trim() || null
      }).returning();
      
      console.log('[Communication Action] Created group:', newGroup.id);
      
      return json({ success: true, message: "群組已建立", group: newGroup });
    } catch (error) {
      console.error('[Communication Action] Failed to create group:', error);
      return json({ success: false, message: "建立失敗，請稍後再試" }, { status: 500 });
    }
  }
  
  // AI 智能分析群組
  if (intent === "aiAnalyzeGroups") {
    const user = await requireUser(request);
    
    try {
      // 1. 載入所有廠商、群組、聯絡紀錄、交易
      const [allVendors, allGroups, allContactLogs, allTransactions] = await Promise.all([
        db.select().from(vendors),
        db.select().from(socialGroups),
        db.select().from(contactLogs),
        db.select().from(transactions)
      ]);
      
      // 2. 建立廠商群組映射
      const groupsByVendor = new Map<string, any[]>();
      allGroups.forEach(group => {
        if (!groupsByVendor.has(group.vendorId)) {
          groupsByVendor.set(group.vendorId, []);
        }
        groupsByVendor.get(group.vendorId)!.push(group);
      });
      
      // 3. 建立廠商聯絡紀錄統計
      const contactCountByVendor = new Map<string, number>();
      allContactLogs.forEach(log => {
        contactCountByVendor.set(log.vendorId, (contactCountByVendor.get(log.vendorId) || 0) + 1);
      });
      
      // 4. 建立廠商交易總額統計
      const transactionSumByVendor = new Map<string, number>();
      allTransactions.forEach(tx => {
        const current = transactionSumByVendor.get(tx.vendorId) || 0;
        transactionSumByVendor.set(tx.vendorId, current + parseFloat(String(tx.amount)));
      });
      
      // 5. 分析每個廠商
      const recommendations: any[] = [];
      
      allVendors.forEach(vendor => {
        const existingGroups = groupsByVendor.get(vendor.id) || [];
        const contactCount = contactCountByVendor.get(vendor.id) || 0;
        const transactionSum = transactionSumByVendor.get(vendor.id) || 0;
        
        const hasLineGroup = existingGroups.some(g => g.platform === 'LINE');
        const hasWeChatGroup = existingGroups.some(g => g.platform === 'WECHAT');
        
        // 規則 1: 完全沒有群組
        if (existingGroups.length === 0) {
          recommendations.push({
            id: `temp-${vendor.id}-LINE`,
            vendorId: vendor.id,
            vendorName: vendor.name,
            vendorAvatar: vendor.avatarUrl,
            platform: 'LINE',
            suggestedGroupName: `${vendor.name} - 工作溝通群`,
            suggestedSystemCode: `LINE_${vendor.name}_${Date.now()}`,
            reason: `此廠商尚未建立任何群組，建議優先建立 LINE 群組`,
            priority: 5,
            isSelected: true
          });
        }
        
        // 規則 2: 只有 LINE 沒有 WeChat
        if (hasLineGroup && !hasWeChatGroup && contactCount > 3) {
          recommendations.push({
            id: `temp-${vendor.id}-WECHAT`,
            vendorId: vendor.id,
            vendorName: vendor.name,
            vendorAvatar: vendor.avatarUrl,
            platform: 'WECHAT',
            suggestedGroupName: `${vendor.name} - 微信溝通群`,
            suggestedSystemCode: `WECHAT_${vendor.name}_${Date.now()}`,
            reason: `此廠商已有 LINE 群組，但聯絡頻繁（${contactCount} 次），建議建立 WeChat 群組`,
            priority: 4,
            isSelected: true
          });
        }
        
        // 規則 3: 高頻聯絡但沒有群組
        if (existingGroups.length === 0 && contactCount > 5) {
          recommendations.push({
            id: `temp-${vendor.id}-LINE-HIGH`,
            vendorId: vendor.id,
            vendorName: vendor.name,
            vendorAvatar: vendor.avatarUrl,
            platform: 'LINE',
            suggestedGroupName: `${vendor.name} - 重要聯絡群`,
            suggestedSystemCode: `LINE_${vendor.name}_${Date.now()}`,
            reason: `此廠商有 ${contactCount} 筆聯絡紀錄但尚未建立群組，建議立即建立`,
            priority: 5,
            isSelected: true
          });
        }
        
        // 規則 4: 高金額但沒有群組
        if (existingGroups.length === 0 && transactionSum > 100000) {
          recommendations.push({
            id: `temp-${vendor.id}-LINE-VIP`,
            vendorId: vendor.id,
            vendorName: vendor.name,
            vendorAvatar: vendor.avatarUrl,
            platform: 'LINE',
            suggestedGroupName: `${vendor.name} - VIP 客戶群`,
            suggestedSystemCode: `LINE_${vendor.name}_VIP_${Date.now()}`,
            reason: `此廠商交易總額達 ${transactionSum.toLocaleString()} 元，建議建立 VIP 群組`,
            priority: 4,
            isSelected: true
          });
        }
      });
      
      // 6. 依優先級排序
      recommendations.sort((a, b) => b.priority - a.priority);
      
      console.log(`[Communication AI] Generated ${recommendations.length} recommendations`);
      
      return json({ success: true, recommendations });
    } catch (error) {
      console.error('[Communication AI] Failed to analyze:', error);
      return json({ success: false, message: "AI 分析失敗，請稍後再試" }, { status: 500 });
    }
  }
  
  // 批量建立群組
  if (intent === "batchCreateGroups") {
    const user = await requireUser(request);
    
    const recommendationsJson = formData.get("recommendations") as string;
    const recommendations: any[] = JSON.parse(recommendationsJson);
    
    // 只處理被選中的推薦
    const selectedRecommendations = recommendations.filter(r => r.isSelected);
    
    if (selectedRecommendations.length === 0) {
      return json({ success: false, message: "請至少選擇一個群組" }, { status: 400 });
    }
    
    try {
      const createdGroups = [];
      const errors = [];
      
      for (const rec of selectedRecommendations) {
        try {
          // 檢查 systemCode 是否已存在
          const [existing] = await db.select()
            .from(socialGroups)
            .where(eq(socialGroups.systemCode, rec.suggestedSystemCode));
          
          if (existing) {
            errors.push(`${rec.vendorName}: 系統代碼已存在`);
            continue;
          }
          
          // 建立群組
          const [newGroup] = await db.insert(socialGroups).values({
            vendorId: rec.vendorId,
            platform: rec.platform,
            groupName: rec.suggestedGroupName,
            systemCode: rec.suggestedSystemCode,
            note: `AI 智能建群 - ${rec.reason}`
          }).returning();
          
          createdGroups.push(newGroup);
        } catch (error) {
          console.error(`[Communication AI] Failed to create group for ${rec.vendorName}:`, error);
          errors.push(`${rec.vendorName}: 建立失敗`);
        }
      }
      
      console.log(`[Communication AI] Created ${createdGroups.length} groups, ${errors.length} errors`);
      
      return json({ 
        success: true, 
        message: `成功建立 ${createdGroups.length} 個群組`,
        createdCount: createdGroups.length,
        errors
      });
    } catch (error) {
      console.error('[Communication AI] Failed to batch create:', error);
      return json({ success: false, message: "批量建立失敗，請稍後再試" }, { status: 500 });
    }
  }
  
  // 編輯通訊群組
  if (intent === "editGroup") {
    const groupId = formData.get("groupId") as string;
    const groupName = formData.get("groupName") as string;
    const platform = formData.get("platform") as string;
    const inviteLink = formData.get("inviteLink") as string;

    if (!groupId || !groupName) {
      return json({ success: false, message: "缺少必要欄位" }, { status: 400 });
    }

    try {
      await db.update(socialGroups)
        .set({
          groupName: groupName.trim(),
          platform: platform as any,
          inviteLink: inviteLink?.trim() || null,
          updatedAt: new Date()
        })
        .where(eq(socialGroups.id, groupId));

      console.log('[Communication Action] Updated group:', groupId);

      return json({ success: true, message: "群組資料已更新" });
    } catch (error) {
      console.error('[Communication Action] Failed to update group:', error);
      return json({ success: false, message: "更新失敗，請稍後再試" }, { status: 500 });
    }
  }

  // 刪除通訊群組
  if (intent === "deleteGroup") {
    const user = await requireUser(request);
    
    // 只有管理員可以刪除
    if (!canUserDelete(user, 'communication')) {
      return json({ success: false, message: "無權限刪除" }, { status: 403 });
    }
    
    const groupId = formData.get("groupId") as string;

    if (!groupId) {
      return json({ success: false, message: "缺少群組 ID" }, { status: 400 });
    }

    try {
      await db.delete(socialGroups).where(eq(socialGroups.id, groupId));

      console.log('[Communication Action] Deleted group:', groupId);

      return json({ success: true, message: "群組已刪除" });
    } catch (error) {
      console.error('[Communication Action] Failed to delete group:', error);
      return json({ success: false, message: "刪除失敗，請稍後再試" }, { status: 500 });
    }
  }

  // 編輯聯繫紀錄
  if (intent === "editLog") {
    const logId = formData.get("logId") as string;
    const note = formData.get("note") as string;
    const status = formData.get("status") as string;

    if (!logId || !note) {
      return json({ success: false, message: "缺少必要欄位" }, { status: 400 });
    }

    try {
      await db.update(contactLogs)
        .set({
          note: note.trim(),
          status: status as any,
          updatedAt: new Date()
        })
        .where(eq(contactLogs.id, logId));

      console.log('[Communication Action] Updated log:', logId);

      return json({ success: true, message: "聯繫紀錄已更新" });
    } catch (error) {
      console.error('[Communication Action] Failed to update log:', error);
      return json({ success: false, message: "更新失敗，請稍後再試" }, { status: 500 });
    }
  }

  // 刪除聯繫紀錄
  if (intent === "deleteLog") {
    const user = await requireUser(request);
    
    // 只有管理員可以刪除
    if (!canUserDelete(user, 'communication')) {
      return json({ success: false, message: "無權限刪除" }, { status: 403 });
    }
    
    const logId = formData.get("logId") as string;

    if (!logId) {
      return json({ success: false, message: "缺少紀錄 ID" }, { status: 400 });
    }

    try {
      await db.delete(contactLogs).where(eq(contactLogs.id, logId));

      console.log('[Communication Action] Deleted log:', logId);

      return json({ success: true, message: "聯繫紀錄已刪除" });
    } catch (error) {
      console.error('[Communication Action] Failed to delete log:', error);
      return json({ success: false, message: "刪除失敗，請稍後再試" }, { status: 500 });
    }
  }

  return json({ success: false, message: "未知的請求" }, { status: 400 });
}

type Platform = 'LINE' | 'WeChat';
type ViewType = 'GROUPS' | 'CONTACTS';

interface FlattenedGroup extends SocialGroup {
  vendorName: string;
  vendorId: string;
  vendorAvatar: string;
  vendorCategories: VendorCategory[];
}

interface FlattenedContact {
  id: string;
  name: string;
  role: string;
  vendorName: string;
  vendorId: string;
  vendorAvatar: string;
  accountId: string;
  isCorporate: boolean;
  isMainContact: boolean;
  vendorCategories: VendorCategory[];
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 30];

// 動態高度計算函數
const calculateOptimalItemsPerPage = () => {
  // 取得視窗高度
  const windowHeight = window.innerHeight;
  
  // Header 高度（約 100px） + 分頁高度（約 80px） + 留白（約 50px）
  const fixedHeight = 230;
  
  // 可用高度
  const availableHeight = windowHeight - fixedHeight;
  
  // 每個項目的高度（LIST 模式約 60px，GRID 模式約 120px）
  const itemHeight = 60; // 預設使用 LIST 模式
  
  // 計算可顯示的項目數
  const calculatedItems = Math.floor(availableHeight / itemHeight);
  
  // 選擇最接近的選項（10/20/30）
  if (calculatedItems <= 15) return 10;
  if (calculatedItems <= 25) return 20;
  return 30;
};

function CommunicationContent() {
  const { vendors: dbVendors, contactLogs: dbContactLogs, isAdmin } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [platform, setPlatform] = useState<Platform>('LINE');
  const [viewType, setViewType] = useState<ViewType>('GROUPS');
  const [groupViewMode, setGroupViewMode] = useState<'GRID' | 'LIST'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => calculateOptimalItemsPerPage());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<FlattenedGroup | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editPlatform, setEditPlatform] = useState<Platform>('LINE');
  const [editInviteLink, setEditInviteLink] = useState('');
  
  // 新增群組表單狀態
  const [newGroupVendorId, setNewGroupVendorId] = useState('');
  const [newGroupPlatform, setNewGroupPlatform] = useState<Platform>(platform);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSystemCode, setNewGroupSystemCode] = useState('');
  const [newGroupInviteLink, setNewGroupInviteLink] = useState('');
  const [newGroupQrCodeUrl, setNewGroupQrCodeUrl] = useState('');
  const [newGroupNote, setNewGroupNote] = useState('');
  
  // AI 智能建群狀態
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Reset pagination when main controls change
  const handlePlatformChange = (p: Platform) => {
    setPlatform(p);
    setSelectedCategoryFilter('');
    setSelectedRoleFilter('');
    setCurrentPage(1);
  };

  const handleViewTypeChange = (v: ViewType) => {
    setViewType(v);
    setCurrentPage(1);
  };

  // 視窗大小變化時自動調整每頁筆數
  useEffect(() => {
    const handleResize = () => {
      const optimalItems = calculateOptimalItemsPerPage();
      if (optimalItems !== itemsPerPage) {
        setItemsPerPage(optimalItems);
        setCurrentPage(1); // 重設到第一頁
      }
    };

    // 監聽視窗大小變化
    window.addEventListener('resize', handleResize);

    // 清理監聽器
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerPage]);

  // Initialize Data
  const allGroups: FlattenedGroup[] = useMemo(() => {
    return dbVendors.flatMap((v: any) => 
      (v.socialGroups || []).map(g => ({
        ...g,
        vendorName: v.name,
        vendorId: v.id,
        vendorAvatar: v.avatarUrl,
        vendorCategories: v.categories
      }))
    );
  }, []);

  // Flatten Contact Data
  const allContacts: FlattenedContact[] = useMemo(() => {
    const contacts: FlattenedContact[] = [];

    dbVendors.forEach((v: any) => {
      const common = {
        vendorName: v.name,
        vendorId: v.id,
        vendorAvatar: v.avatarUrl,
        vendorCategories: v.categories
      };

      // Add Corporate/Main Account if exists
      if (platform === 'LINE' && v.lineId) {
        contacts.push({
          ...common,
          id: `${v.id}-corp-line`,
          name: v.entityType === EntityType.COMPANY ? '官方帳號/主帳號' : v.name,
          role: '企業窗口',
          accountId: v.lineId,
          isCorporate: true,
          isMainContact: false
        });
      }
      if (platform === 'WeChat' && v.wechatId) {
        contacts.push({
          ...common,
          id: `${v.id}-corp-wechat`,
          name: v.entityType === EntityType.COMPANY ? '官方帳號/主帳號' : v.name,
          role: '企業窗口',
          accountId: v.wechatId,
          isCorporate: true,
          isMainContact: false
        });
      }

      // Add Individual Contacts
      v.contacts.forEach(c => {
        const accId = platform === 'LINE' ? c.lineId : c.wechatId;
        if (accId) {
          contacts.push({
            ...common,
            id: `${v.id}-${c.id}`,
            name: c.name,
            role: c.role,
            accountId: accId,
            isCorporate: false,
            isMainContact: c.isMainContact
          });
        }
      });
    });

    return contacts;
  }, [platform]);

  // Unique lists for dropdowns
  const roleOptions = useMemo(() => Array.from(new Set(allContacts.map(c => c.role))), [allContacts]);

  // Filtering Logic
  const filteredGroups = allGroups.filter(g => {
    const matchesPlatform = g.platform === platform;
    const matchesSearch = g.groupName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          g.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.systemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter 
      ? g.vendorCategories.includes(selectedCategoryFilter as VendorCategory) 
      : true;
    
    return matchesPlatform && matchesSearch && matchesCategory;
  });

  const filteredContacts = allContacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.accountId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter 
      ? c.vendorCategories.includes(selectedCategoryFilter as VendorCategory) 
      : true;
    const matchesRole = selectedRoleFilter ? c.role === selectedRoleFilter : true;

    return matchesSearch && matchesCategory && matchesRole;
  });

  // Pagination Data
  const currentData = viewType === 'GROUPS' ? filteredGroups : filteredContacts;
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const paginatedData = currentData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`已複製 ID: ${text}`);
  };

  const handleEditGroup = (group: FlattenedGroup) => {
    setSelectedGroup(group);
    setEditGroupName(group.groupName);
    setEditPlatform(group.platform as Platform);
    setEditInviteLink(group.inviteLink || '');
    setShowEditGroupModal(true);
  };

  const handleSaveGroup = () => {
    if (!selectedGroup || !editGroupName.trim()) return;

    const formData = new FormData();
    formData.append('intent', 'editGroup');
    formData.append('groupId', selectedGroup.id);
    formData.append('groupName', editGroupName.trim());
    formData.append('platform', editPlatform);
    formData.append('inviteLink', editInviteLink.trim());

    fetcher.submit(formData, { method: 'post' });

    setShowEditGroupModal(false);
    setSelectedGroup(null);
  };

  const handleDeleteGroup = () => {
    if (!selectedGroup) return;
    if (!confirm(`確定要刪除群組「${selectedGroup.groupName}」嗎？`)) return;

    const formData = new FormData();
    formData.append('intent', 'deleteGroup');
    formData.append('groupId', selectedGroup.id);

    fetcher.submit(formData, { method: 'post' });

    setShowEditGroupModal(false);
    setSelectedGroup(null);
  };
  
  // 自動生成系統代碼
  const generateSystemCode = () => {
    const vendor = dbVendors.find(v => v.id === newGroupVendorId);
    if (!vendor) {
      alert('請先選擇廠商');
      return;
    }
    
    const timestamp = Date.now();
    const platformPrefix = newGroupPlatform === 'LINE' ? 'LINE' : 'WECHAT';
    const code = `${platformPrefix}_${vendor.name}_${timestamp}`;
    setNewGroupSystemCode(code);
  };
  
  // 建立新群組
  const handleCreateGroup = () => {
    if (!newGroupVendorId || !newGroupName.trim() || !newGroupSystemCode.trim()) {
      alert('請填寫所有必填欄位（廠商、群組名稱、系統代碼）');
      return;
    }
    
    const formData = new FormData();
    formData.append('intent', 'createGroup');
    formData.append('vendorId', newGroupVendorId);
    formData.append('platform', newGroupPlatform);
    formData.append('groupName', newGroupName.trim());
    formData.append('systemCode', newGroupSystemCode.trim());
    formData.append('inviteLink', newGroupInviteLink.trim());
    formData.append('qrCodeUrl', newGroupQrCodeUrl.trim());
    formData.append('note', newGroupNote.trim());
    
    fetcher.submit(formData, { method: 'post' });
    
    // 清空表單並關閉模態框
    setNewGroupVendorId('');
    setNewGroupName('');
    setNewGroupSystemCode('');
    setNewGroupInviteLink('');
    setNewGroupQrCodeUrl('');
    setNewGroupNote('');
    setShowAddGroupModal(false);
  };
  
  // AI 智能分析
  const handleAIAnalyze = async () => {
    setShowAIModal(true);
    setIsAnalyzing(true);
    setAiRecommendations([]);
    
    try {
      const formData = new FormData();
      formData.append('intent', 'aiAnalyzeGroups');
      
      const response = await fetch('', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success && result.recommendations) {
        setAiRecommendations(result.recommendations);
      } else {
        alert(result.message || 'AI 分析失敗');
      }
    } catch (error) {
      console.error('AI 分析錯誤:', error);
      alert('AI 分析失敗，請稍後再試');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 切換 AI 推薦選擇
  const toggleAIRecommendation = (id: string) => {
    setAiRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, isSelected: !rec.isSelected } : rec
      )
    );
  };
  
  // 批量建立群組
  const handleBatchCreate = () => {
    const selectedCount = aiRecommendations.filter(r => r.isSelected).length;
    
    if (selectedCount === 0) {
      alert('請至少選擇一個群組');
      return;
    }
    
    if (!confirm(`確定要建立 ${selectedCount} 個群組嗎？`)) {
      return;
    }
    
    const formData = new FormData();
    formData.append('intent', 'batchCreateGroups');
    formData.append('recommendations', JSON.stringify(aiRecommendations));
    
    fetcher.submit(formData, { method: 'post' });
    
    // 關閉模態框
    setShowAIModal(false);
    setAiRecommendations([]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      {/* Header Area */}
      <div>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={clsx("p-3 rounded-xl transition-colors", platform === 'LINE' ? "bg-green-100 text-green-600" : "bg-green-700 text-white")}>
              <MessageCircle size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">通訊軟體管理中心</h1>
              <p className="text-slate-500 text-sm">統一管理 {platform} 平台的所有群組資產與聯絡人</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
               onClick={handleAIAnalyze}
               className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
               <Sparkles size={18} className="text-yellow-300" /> AI 智能建群
            </button>
            
            {viewType === 'GROUPS' && (
              <button 
                onClick={() => setShowAddGroupModal(true)}
                className={clsx(
                  "px-4 py-2 rounded-lg text-white font-bold shadow-md flex items-center gap-2 transition hover:opacity-90",
                  platform === 'LINE' ? "bg-[#06C755]" : "bg-[#07C160]"
                )}
              >
                <Plus size={18} /> 新增群組
              </button>
            )}
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex gap-4 border-b border-slate-200">
          <button 
            onClick={() => handlePlatformChange('LINE')}
            className={clsx(
              "px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all",
              platform === 'LINE' ? "border-green-500 text-green-600 bg-green-50/50" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            LINE
            <span className="ml-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">
              {allGroups.filter(g => g.platform === 'LINE').length} 群
            </span>
          </button>
          <button 
            onClick={() => handlePlatformChange('WeChat')}
            className={clsx(
              "px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all",
              platform === 'WeChat' ? "border-green-600 text-green-700 bg-green-50/50" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-green-700"></span>
            WeChat (微信)
            <span className="ml-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">
              {allGroups.filter(g => g.platform === 'WeChat').length} 群
            </span>
          </button>
        </div>
      </div>

      {/* Controls & Sub-tabs & Advanced Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex w-full lg:w-auto items-center gap-2">
            {/* View Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg flex-1 lg:flex-none">
              <button 
                onClick={() => handleViewTypeChange('GROUPS')}
                className={clsx("flex-1 lg:flex-none px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition", viewType === 'GROUPS' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}
              >
                <Hash size={16} /> 專案群組
              </button>
              <button 
                onClick={() => handleViewTypeChange('CONTACTS')}
                className={clsx("flex-1 lg:flex-none px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition", viewType === 'CONTACTS' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}
              >
                <Users size={16} /> 聯絡人
              </button>
            </div>

            {/* Grid/List Toggle for Groups */}
            {viewType === 'GROUPS' && (
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setGroupViewMode('GRID')}
                  className={clsx("p-2 rounded-md transition", groupViewMode === 'GRID' ? "bg-white shadow-sm text-slate-800" : "text-slate-400")}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setGroupViewMode('LIST')}
                  className={clsx("p-2 rounded-md transition", groupViewMode === 'LIST' ? "bg-white shadow-sm text-slate-800" : "text-slate-400")}
                >
                  <LayoutList size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder={viewType === 'GROUPS' ? "搜尋群組名稱、廠商、代碼..." : "搜尋聯絡人、廠商、ID..."}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => { setSelectedCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none bg-white cursor-pointer"
              >
                <option value="">所有類別</option>
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Role Filter (Contacts Only) */}
            {viewType === 'CONTACTS' && (
              <select
                value={selectedRoleFilter}
                onChange={(e) => { setSelectedRoleFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none bg-white cursor-pointer"
              >
                <option value="">所有角色</option>
                {roleOptions.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Data Display Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {viewType === 'GROUPS' ? (
          // Groups View
          groupViewMode === 'GRID' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto p-1">
              {(paginatedData as FlattenedGroup[]).map(group => (
                <div key={group.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img src={group.vendorAvatar} alt="" className="w-10 h-10 rounded-full border" />
                      <div>
                        <h3 className="font-bold text-slate-800">{group.groupName}</h3>
                        <Link to={`/vendors/${group.vendorId}`} className="text-xs text-slate-500 hover:text-indigo-600">
                          {group.vendorName}
                        </Link>
                      </div>
                    </div>
                    <span className={clsx(
                      "px-2 py-0.5 rounded text-xs font-bold",
                      group.platform === 'LINE' ? "bg-green-100 text-green-700" : "bg-green-700 text-white"
                    )}>
                      {group.platform}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-mono">{group.systemCode}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditGroup(group)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600" title="編輯群組">
                        <Settings size={14} />
                      </button>
                      <button onClick={() => copyToClipboard(group.systemCode)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600" title="複製代碼">
                        <Copy size={14} />
                      </button>
                      <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600" title="開啟連結">
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List View
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
              <div className="overflow-x-auto flex-1">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="w-8"></th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">群組名稱</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">關聯廠商</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">系統代碼</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">成員數</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(paginatedData as FlattenedGroup[]).map(group => (
                      <tr key={group.id} className="hover:bg-slate-50 transition group">
                        <td className="pl-2">
                          <GripVertical size={16} className="text-slate-300 cursor-grab" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Hash size={16} className={platform === 'LINE' ? "text-green-500" : "text-green-700"} />
                            <span className="font-bold text-slate-800">{group.groupName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/vendors/${group.vendorId}`} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600">
                            <img src={group.vendorAvatar} alt="" className="w-6 h-6 rounded-full" />
                            {group.vendorName}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{group.systemCode}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">- 人</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => handleEditGroup(group)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600" title="編輯群組">
                              <Settings size={14} />
                            </button>
                            <button onClick={() => copyToClipboard(group.systemCode)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600" title="複製代碼">
                              <Copy size={14} />
                            </button>
                            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600" title="開啟連結">
                              <ExternalLink size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          // Contacts View
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">聯絡人</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">角色</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">關聯廠商</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{platform} ID</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(paginatedData as FlattenedContact[]).map(contact => (
                    <tr key={contact.id} className="hover:bg-slate-50 transition group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {contact.isCorporate ? (
                            <Building2 size={18} className="text-indigo-500" />
                          ) : (
                            <User size={18} className="text-slate-400" />
                          )}
                          <span className={clsx("font-bold", contact.isCorporate ? "text-indigo-600" : "text-slate-800")}>
                            {contact.name}
                          </span>
                          {contact.isMainContact && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-bold">主要</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{contact.role}</td>
                      <td className="px-4 py-3">
                        <Link to={`/vendors/${contact.vendorId}`} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600">
                          <img src={contact.vendorAvatar} alt="" className="w-6 h-6 rounded-full" />
                          {contact.vendorName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-slate-500">{contact.accountId}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => copyToClipboard(contact.accountId)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                            <Copy size={14} />
                          </button>
                          <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={currentData.length}
        itemsPerPage={itemsPerPage}
        itemsPerPageOptions={ITEMS_PER_PAGE_OPTIONS}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
      />

      {/* Add Group Modal */}
      {showAddGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">新增 {platform} 群組</h2>
              <button onClick={() => setShowAddGroupModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-4">此功能將在後續版本開放</p>
            <button 
              onClick={() => setShowAddGroupModal(false)}
              className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 新增群組模態框 */}
      {showAddGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddGroupModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">新增 {newGroupPlatform} 群組</h3>
              <button
                onClick={() => setShowAddGroupModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* 選擇廠商 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">選擇廠商 *</label>
                <select
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  value={newGroupVendorId}
                  onChange={(e) => setNewGroupVendorId(e.target.value)}
                >
                  <option value="">請選擇廠商...</option>
                  {dbVendors.map((vendor: any) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 選擇平台 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">選擇平台 *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="platform"
                      value="LINE"
                      checked={newGroupPlatform === 'LINE'}
                      onChange={(e) => setNewGroupPlatform(e.target.value as Platform)}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm text-slate-700">🟢 LINE</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="platform"
                      value="WeChat"
                      checked={newGroupPlatform === 'WeChat'}
                      onChange={(e) => setNewGroupPlatform(e.target.value as Platform)}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm text-slate-700">🟢 WeChat（微信）</span>
                  </label>
                </div>
              </div>

              {/* 群組名稱 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">群組名稱 *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="輸入群組名稱..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  maxLength={100}
                />
              </div>

              {/* 系統代碼 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">系統代碼 *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="輸入系統代碼..."
                    value={newGroupSystemCode}
                    onChange={(e) => setNewGroupSystemCode(e.target.value)}
                    maxLength={50}
                  />
                  <button
                    onClick={generateSystemCode}
                    className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition whitespace-nowrap"
                  >
                    自動生成
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">ℹ️ 系統代碼必須唯一，用於內部識別</p>
              </div>

              {/* 邀請連結 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">邀請連結</label>
                <input
                  type="url"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="https://line.me/R/ti/g/..."
                  value={newGroupInviteLink}
                  onChange={(e) => setNewGroupInviteLink(e.target.value)}
                />
              </div>

              {/* QR Code 圖片 URL */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">QR Code 圖片 URL</label>
                <input
                  type="url"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="https://..."
                  value={newGroupQrCodeUrl}
                  onChange={(e) => setNewGroupQrCodeUrl(e.target.value)}
                />
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">備註</label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="輸入備註..."
                  value={newGroupNote}
                  onChange={(e) => setNewGroupNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddGroupModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
              >
                取消
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupVendorId || !newGroupName.trim() || !newGroupSystemCode.trim() || fetcher.state === 'submitting'}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fetcher.state === 'submitting' ? '建立中...' : '建立群組 ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI 智能建群模態框 */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAIModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={24} className="text-indigo-600" />
                AI 智能建群推薦
              </h3>
              <button
                onClick={() => setShowAIModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-slate-600">🔍 AI 分析中...</p>
                <p className="text-slate-400 text-sm mt-2">正在分析廠商、群組、聯絡紀錄和交易資料...</p>
              </div>
            ) : aiRecommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-slate-600 font-bold">太棒了！所有廠商都已建立群組</p>
                <p className="text-slate-400 text-sm mt-2">沒有找到需要建立群組的廠商</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                  <p className="text-sm text-indigo-800">
                    🤖 AI 已分析完成，共找到 <span className="font-bold">{aiRecommendations.length}</span> 個建議。
                    請勾選您想要建立的群組，然後點擊「批量建立」。
                  </p>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {aiRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className={clsx(
                        "border-2 rounded-xl p-4 cursor-pointer transition",
                        rec.isSelected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                      onClick={() => toggleAIRecommendation(rec.id)}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={rec.isSelected}
                          onChange={() => toggleAIRecommendation(rec.id)}
                          className="mt-1 w-5 h-5 text-indigo-600 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <img
                          src={rec.vendorAvatar}
                          alt={rec.vendorName}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-800">{rec.suggestedGroupName}</h4>
                            <span className={clsx(
                              "px-2 py-0.5 rounded text-xs font-bold",
                              rec.platform === 'LINE' ? "bg-green-100 text-green-700" : "bg-green-700 text-white"
                            )}>
                              {rec.platform}
                            </span>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">
                              優先級 {rec.priority}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{rec.vendorName}</p>
                          <p className="text-sm text-slate-500">💡 {rec.reason}</p>
                          <p className="text-xs text-slate-400 mt-1 font-mono">系統代碼: {rec.suggestedSystemCode}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowAIModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleBatchCreate}
                    disabled={aiRecommendations.filter(r => r.isSelected).length === 0 || fetcher.state === 'submitting'}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {fetcher.state === 'submitting' ? '建立中...' : `批量建立 (${aiRecommendations.filter(r => r.isSelected).length})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 編輯群組模態框 */}
      {showEditGroupModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditGroupModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">編輯群組</h3>
              <button
                onClick={() => setShowEditGroupModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">群組名稱 *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="輸入群組名稱..."
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">平台</label>
                <select
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  value={editPlatform}
                  onChange={(e) => setEditPlatform(e.target.value as Platform)}
                >
                  <option value="LINE">LINE</option>
                  <option value="WeChat">WeChat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">邀請連結</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="輸入邀請連結..."
                  value={editInviteLink}
                  onChange={(e) => setEditInviteLink(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">系統代碼</label>
                <div className="text-sm text-slate-500 bg-slate-50 px-4 py-3 rounded-xl font-mono">
                  {selectedGroup.systemCode}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {canDeleteCommunication && (
                <button
                  onClick={handleDeleteGroup}
                  disabled={fetcher.state === 'submitting'}
                  className="px-4 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  刪除
                </button>
              )}
              <button
                onClick={() => setShowEditGroupModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
              >
                取消
              </button>
              <button
                onClick={handleSaveGroup}
                disabled={!editGroupName.trim() || fetcher.state === 'submitting'}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fetcher.state === 'submitting' ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunicationPage() {
  return (
    <ClientOnly fallback={<div className="p-8 text-center text-slate-400">載入中...</div>}>
      <CommunicationContent />
    </ClientOnly>
  );
}
