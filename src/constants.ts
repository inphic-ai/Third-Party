
import { Vendor, Region, EntityType, ServiceType, VendorCategory, ContactStatus, TransactionStatus, AdminUser, SystemLog, LoginLog, Subscription, AiModelRule, SystemTags, TutorialTip, Announcement, KnowledgeBaseItem, Department } from './types';

export const TAIWAN_REGIONS = [
  '全部', '台北市', '基隆市', '新北市', '宜蘭縣', '桃園市', '新竹市', '新竹縣', 
  '苗栗縣', '台中市', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', 
  '台南市', '高雄市', '屏東縣', '澎湖縣', '台東縣', '花蓮縣', 
  '金門縣', '連江縣', '釣魚台', '南海島'
];

export const CHINA_REGIONS = [
  '全部', '廣東省', '上海市', '北京市', '江蘇省', '浙江省', '福建省', '山東省', 
  '四川省', '湖北省', '湖南省', '河南省', '河北省', '遼寧省', '安徽省', 
  '重慶市', '天津市', '廣西', '江西省', '陝西省', '雲南省', '香港', '澳門'
];

// Grouping Categories for better UX in Dropdowns
export const CATEGORY_GROUPS: Record<string, string[]> = {
  '工程與維修': ['水電', '玻璃', '冷凍空調', '鐵工修復', '木工修復', '油壓設備', '機車維修', '家電維修', '裝修工程', '燈具'],
  '物流與供應鏈': ['國際運輸', '國內運輸', 'LALA司機', '包裝耗材', '電池', '五金零件'],
  '專業服務': ['平面設計', '軟硬體工程師', '法律', '檢驗單位', '銀行＆金流', '通路平台', '辦公文具'],
  '其他': ['其它']
};

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: '2024 年度廠商評鑑開始', content: '請各部門於月底前完成主要合作廠商的年度評分。', date: '2024-05-20', priority: 'High' },
  { id: '2', title: '大陸物流規定更新', content: '針對華南地區的進出口報關流程有新規定，請參閱知識庫。', date: '2024-05-18', priority: 'Normal' },
];

export const MOCK_KNOWLEDGE_BASE: KnowledgeBaseItem[] = [
  {
    id: 'kb-001',
    question: '大陸進口五金零件的報關稅則歸類注意事項',
    answer: '針對不鏽鋼螺絲與銅製接頭，海關近期查驗嚴格。建議在 Invoice 上明確標註材質比例（例如：Copper 80%, Zinc 20%），並附上原廠材質證明書 (Mill Test Certificate)，可加快通關速度約 2-3 天。',
    tags: ['報關', '物流', '五金', '異常處理'],
    sourceTransactionId: 'T2',
    createdAt: '2024-04-26'
  },
  {
    id: 'kb-002',
    question: '辦公室茶水間管線重拉 - 舊管線鏽蝕處理',
    answer: '若遇到舊有鍍鋅鋼管鏽蝕嚴重無法對接新管，建議不使用車牙對接，改用「機械式快速接頭」或直接更換整段至總管處。本次施工發現轉接處易滲水，需使用缺氧膠加強密封。',
    tags: ['水電', '施工細節', '維修'],
    sourceTransactionId: 'T1',
    createdAt: '2024-05-02'
  },
  {
    id: 'kb-003',
    question: '急件設計發包的溝通技巧',
    answer: '針對 3 天內需完稿的急件，務必在發包時提供明確的「風格參考圖 (Reference)」與「文字定稿」。避免讓設計師自由發揮後再修改。本次經驗顯示，提供 moodboard 可減少 50% 的來回修改時間。',
    tags: ['設計', '溝通', '專案管理'],
    sourceTransactionId: 'T3',
    createdAt: '2024-03-21'
  }
];

// Default System Tags - Updated based on user request
export const MOCK_SYSTEM_TAGS: SystemTags = {
  contactTags: ['報價中', '已預約', '無人接聽', '已確認檔期', '等待報價', '報價過高', '態度良好', '需要主管確認', '約定場勘'],
  serviceTags: ['夜間施工', '急件處理', '含廢棄物清運', '需支付訂金', '可配合輪班', '自有工班'],
  websiteTags: ['優良廠商', '配合度高', '價格實惠', 'CP值高', '老字號', '新創團隊']
};

export const MOCK_TUTORIALS: TutorialTip[] = [
  {
    key: 'TASKS_GUIDE',
    title: '歡迎來到日常戰術中心',
    content: '這裡不只是日曆，而是您的每日行動指揮部。\n\n1. 左側月曆：快速切換日期。\n2. 智慧整合：系統會自動抓取「工單施工日」與「聯繫跟進日」顯示於右側。\n3. 手動待辦：您也可以隨時新增個人的臨時備忘。',
    designPrinciple: '將被動的「查詢」轉為主動的「執行」。透過整合不同來源的任務，減少您在不同頁面切換的時間，確保重要事項不遺漏。',
    actionText: '開始使用',
    isActive: true,
  },
  {
    key: 'CONTACT_LOG_MISSING',
    title: '別讓努力白費：請紀錄聯繫詳情',
    content: '您即將關閉視窗，但尚未填寫任何聯繫紀錄。系統偵測到您開啟了聯繫窗口，建議您簡單紀錄此次溝通的重點（哪怕只是「無人接聽」）。',
    designPrinciple: '完整的聯繫足跡能保護您的工作成果。當廠商發生爭議時，您的紀錄將是最佳佐證；此外，主管也能透過紀錄了解您的開發進度，提供必要協助。未填寫紀錄將會被列入「待改進統計」中。',
    actionText: '好，我來填寫',
    skipText: '這次先略過 (列入統計)',
    isActive: true,
  },
  {
    key: 'TIMELINE_PAST_DRAG',
    title: '時光不可逆：無效的操作',
    content: '您將任務拖曳到了已經過去的時間點。',
    designPrinciple: '1. 時間分配僅能針對「現在」或「未來」的時段。\n2. 若需補登工時，請使用「歷程紀錄」手動調整，而非拖曳排程。',
    isActive: true,
  },
  {
    key: 'TIMELINE_NOT_TODAY',
    title: '僅限今日排程',
    content: '時間分配功能專注於「今日 (Today)」的執行力。',
    designPrinciple: '若您需要規劃明後天的行程，請先在「日常任務」中設定「截止日期」，屆時該任務會自動出現在當天的待辦清單中。',
    isActive: true,
  }
];

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'C2024001', // C = Company
    name: '大發水電工程行',
    taxId: '23456789',
    mainPhone: '02-2788-1234',
    avatarUrl: 'https://picsum.photos/id/10/200/200',
    region: Region.TAIWAN,
    entityType: EntityType.COMPANY,
    serviceTypes: [ServiceType.LABOR],
    categories: [VendorCategory.PLUMBING, VendorCategory.RENOVATION],
    rating: 4.8,
    ratingCount: 15,
    createdBy: 'u1', // Alex Created this
    priceRange: '$$',
    tags: ['優良廠商', '夜間施工', '配合度高', '含廢棄物清運'], // Added Excellent tag
    isBlacklisted: false,
    serviceArea: '台北市, 新北市',
    address: '台北市信義區忠孝東路五段100號',
    internalNotes: '配合度高，但在忙時很難約，建議提前兩週。',
    lineId: '@dafa_official', // Corporate ID
    isFavorite: true,
    missedContactLogCount: 2,
    phoneViewCount: 45, // High view count
    bookingClickCount: 12,
    contacts: [
        { id: 'c1', name: '張大發', role: '負責人', mobile: '0912-345-678', isMainContact: true, lineId: 'dafa888' },
        { id: 'c2', name: '李小姐', role: '會計', mobile: '0922-111-222', isMainContact: false }
    ],
    socialGroups: [
      { 
        id: 'g1', 
        platform: 'LINE', 
        groupName: '🏗️ 2024 大發 x 信義區專案群 (施工進度)', 
        systemCode: 'GRP-C2024001', 
        inviteLink: 'https://line.me/ti/g/example',
        note: '施工照片回報與進度追蹤'
      }
    ],
    contactLogs: [
      { id: 'L1', date: '2024-05-15', status: ContactStatus.SUCCESS, note: '確認 5/20 進場施工' },
      { id: 'L2', date: '2024-04-10', status: ContactStatus.BUSY, note: '師傅說案子滿了', nextFollowUp: '2024-04-12' },
      { id: 'L1-res', date: '2024-05-18', status: ContactStatus.RESERVED, note: '確認進場', isReservation: true },
      { id: 'L1-res2', date: '2024-06-01', status: ContactStatus.RESERVED, note: '二期工程', isReservation: true }
    ],
    transactions: [
      {
        id: 'T1', vendorId: 'C2024001', date: '2024-05-01', completionDate: '2024-05-02', 
        customerId: 'Project-A1', description: '辦公室茶水間管線重拉', amount: 15000, initialQuote: 14000,
        status: TransactionStatus.PENDING_APPROVAL,
        laborFormStatus: 'N/A', 
        timeSpentHours: 8,
        photosBefore: [
          { id: 'b1', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400', type: 'image', uploadedAt: '2024-05-01', description: '舊有管線漏水處' }
        ], 
        photosAfter: [
          { id: 'a1', url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400', type: 'image', uploadedAt: '2024-05-02', description: '更換為不鏽鋼管' },
          { id: 'a2', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400', type: 'image', uploadedAt: '2024-05-02', description: '完工測試水壓正常' }
        ]
      }
    ]
  },
  {
    id: 'I2024001', // I = Individual
    name: '陳志豪',
    mainPhone: '0988-777-666',
    avatarUrl: 'https://picsum.photos/id/32/200/200',
    region: Region.TAIWAN,
    entityType: EntityType.INDIVIDUAL,
    serviceTypes: [ServiceType.LABOR],
    categories: [VendorCategory.WOODWORK, VendorCategory.RENOVATION],
    rating: 2.5,
    ratingCount: 4,
    createdBy: 'u2', // Sarah Created this
    priceRange: '$$$',
    tags: ['手藝精細', '情緒化'],
    isBlacklisted: true,
    serviceArea: '台中市, 南投縣, 彰化縣',
    address: '台中市西屯區台灣大道三段',
    internalNotes: '技術好但個性急，報價偏高，多次與現場人員起衝突，暫時列入黑名單。',
    lineId: 'chen_wood_master', // Personal Main ID
    isFavorite: false,
    missedContactLogCount: 5,
    phoneViewCount: 20, // Many views
    bookingClickCount: 1, // Low booking
    contacts: [
        { id: 'c3', name: '陳志豪', role: '木工師傅', mobile: '0988-777-666', isMainContact: true, lineId: 'chen_wood_master' }
    ],
    socialGroups: [],
    contactLogs: [
      { id: 'L3', date: '2024-05-10', status: ContactStatus.TOO_HIGH, note: '報價比行情高 20%' }
    ],
    transactions: [
       {
        id: 'T4', vendorId: 'I2024001', date: '2023-11-15', completionDate: '2023-11-20',
        customerId: 'Cust-002', description: '櫃檯木作修補', amount: 45000, initialQuote: 45000,
        status: TransactionStatus.PAID,
        laborFormStatus: 'Paid', timeSpentHours: 20,
        photosBefore: [], photosAfter: [],
        managerFeedback: '成品尚可，但現場溝通困難。',
        qualityRating: 2,
      }
    ]
  },
  {
    id: 'C2024002',
    name: '深圳速達物流',
    taxId: 'CN-555888',
    mainPhone: '+86-755-12345678',
    avatarUrl: 'https://picsum.photos/id/45/200/200',
    region: Region.CHINA,
    entityType: EntityType.COMPANY,
    serviceTypes: [ServiceType.PRODUCT, ServiceType.LABOR],
    categories: [VendorCategory.INTL_LOGISTICS],
    rating: 4.2,
    ratingCount: 50,
    createdBy: 'u1',
    priceRange: '$',
    tags: ['時效穩', '清關快', '華南專線'],
    isBlacklisted: false,
    serviceArea: '廣東省, 福建省',
    address: '廣東省深圳市南山區科技園',
    internalNotes: '時效穩定，窗口回覆快。',
    wechatId: 'suda_logistics_official', // Corporate WeChat
    isFavorite: true,
    missedContactLogCount: 1,
    phoneViewCount: 30,
    bookingClickCount: 8,
    contacts: [
        { id: 'c4', name: '王經理', role: '業務窗口', mobile: '+86-138-0000-0000', isMainContact: true, wechatId: 'suda_logistics_wang' }
    ],
    socialGroups: [
      { 
        id: 'g2', 
        platform: 'WeChat', 
        groupName: '🌊 深圳速達-台灣專線 VIP 客服群', 
        systemCode: 'GRP-CN-LOG-001', 
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WeChatGroupExample',
        note: '查件、報關異常處理'
      }
    ],
    contactLogs: [],
    transactions: [
      {
        id: 'T2', vendorId: 'C2024002', date: '2024-04-20', completionDate: '2024-04-25',
        customerId: 'Stock-001', description: '五金零件進口報關 (500kg)', amount: 50000, initialQuote: 50000,
        status: TransactionStatus.APPROVED,
        laborFormStatus: 'N/A', photosBefore: [], photosAfter: [], timeSpentHours: 0,
        managerFeedback: '通關速度符合預期，文件無誤。',
        qualityRating: 5,
        approverId: 'Admin',
        approvalDate: '2024-04-26'
      }
    ]
  },
  {
    id: 'I2024002',
    name: '林小美',
    mainPhone: '0911-222-333',
    avatarUrl: 'https://picsum.photos/id/64/200/200',
    region: Region.TAIWAN,
    entityType: EntityType.INDIVIDUAL,
    serviceTypes: [ServiceType.LABOR],
    categories: [VendorCategory.DESIGN],
    rating: 5.0,
    ratingCount: 8,
    createdBy: 'u4', // Emily Created
    priceRange: '$$',
    tags: ['優良廠商', '風格清新', '好溝通', '準時交件'], // Added Excellent tag
    isBlacklisted: false,
    serviceArea: '全部',
    address: '新北市板橋區文化路一段',
    website: 'https://behance.net/example',
    internalNotes: '風格清新，適合保養品客戶。勞報單記得提醒。',
    lineId: 'may_lin_design',
    isFavorite: true,
    missedContactLogCount: 0,
    phoneViewCount: 15,
    bookingClickCount: 10,
    contacts: [
         { id: 'c5', name: '林小美', role: '設計師', mobile: '0911-222-333', isMainContact: true, lineId: 'may_lin_design' }
    ],
    socialGroups: [],
    contactLogs: [],
    transactions: [
      {
        id: 'T3', vendorId: 'I2024002', date: '2024-03-15', completionDate: '2024-03-20',
        customerId: 'Cust-991', description: '春季活動主視覺海報設計', amount: 8000, initialQuote: 8000,
        status: TransactionStatus.PAID,
        laborFormStatus: 'Pending', timeSpentHours: 12,
        photosBefore: [], 
        photosAfter: [
          { id: 'a3', url: 'https://images.unsplash.com/photo-1626785774573-4b7993143a2d?auto=format&fit=crop&q=80&w=400', type: 'image', uploadedAt: '2024-03-20', description: '最終定稿 AI 檔' }
        ],
        managerFeedback: '設計精美，一次定稿，非常優秀。',
        qualityRating: 5,
        approverId: 'Admin',
        approvalDate: '2024-03-21',
      }
    ]
  },
  {
    id: 'I2024003',
    name: '王大力',
    mainPhone: '0955-666-777',
    avatarUrl: 'https://picsum.photos/id/77/200/200',
    region: Region.TAIWAN,
    entityType: EntityType.INDIVIDUAL,
    serviceTypes: [ServiceType.LABOR],
    categories: [VendorCategory.LALAMOVE, VendorCategory.DOMESTIC_LOGISTICS],
    rating: 4.9,
    ratingCount: 22,
    createdBy: 'u1',
    priceRange: '$',
    tags: ['隨叫隨到', '有尾門', '搬運小心'],
    isBlacklisted: false,
    serviceArea: '台北市, 新北市, 桃園市',
    address: '新北市三重區重新路',
    internalNotes: '隨叫隨到，有升降尾門。',
    lineId: 'big_power_wang',
    isFavorite: false,
    missedContactLogCount: 2,
    phoneViewCount: 60,
    bookingClickCount: 30,
    contacts: [
        { id: 'c6', name: '王大力', role: '司機', mobile: '0955-666-777', isMainContact: true, lineId: 'big_power_wang' }
    ],
    socialGroups: [],
    contactLogs: [],
    transactions: []
  }
];

export const CATEGORY_OPTIONS = Object.values(VendorCategory);

// --- Admin Mock Data (Updated with Permissions) ---

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'D001', name: '研發部', description: '軟體開發與技術維護', managerName: 'Alex Chen', memberCount: 5 },
  { id: 'D002', name: '設計部', description: 'UI/UX 設計與行銷素材', managerName: 'Sarah Lin', memberCount: 3 },
  { id: 'D003', name: '業務部', description: '國內外市場開發', managerName: 'Mike Wang', memberCount: 8 },
  { id: 'D004', name: '產品部', description: '產品規劃與時程控管', managerName: 'Emily Wu', memberCount: 4 },
];

export const MOCK_USERS: AdminUser[] = [
  { 
    id: 'u1', 
    name: 'Alex Chen', 
    email: 'alex@company.com', 
    department: '研發部', 
    role: 'System Admin', 
    status: 'Active', 
    avatarUrl: 'https://picsum.photos/id/55/100/100', 
    accumulatedBonus: 300,
    googleLinked: true,
    googleEmail: 'alex.c@gmail.com',
    permissions: {
      viewWarRoom: true,
      viewVendors: true,
      viewTasks: true,
      viewCommunication: true,
      viewPayments: true,
      viewKnowledge: true,
      viewAnnouncements: true,
      accessAdminPanel: true,
      canManageCategories: true,
      canManageUsers: true,
      canDeleteVendors: true
    },
    securitySettings: {
      allowedIps: [],
      accessTimeStart: '00:00',
      accessTimeEnd: '23:59',
      isTimeRestricted: false
    }
  },
  { 
    id: 'u2', 
    name: 'Sarah Lin', 
    email: 'sarah@company.com', 
    department: '設計部', 
    role: 'Editor', 
    status: 'Active', 
    avatarUrl: 'https://picsum.photos/id/66/100/100', 
    accumulatedBonus: 0,
    googleLinked: false,
    permissions: {
      viewWarRoom: true,
      viewVendors: true,
      viewTasks: true,
      viewCommunication: true,
      viewPayments: false, // Restricted
      viewKnowledge: true,
      viewAnnouncements: true,
      accessAdminPanel: false, // Restricted
      canManageCategories: false,
      canManageUsers: false,
      canDeleteVendors: false
    },
    securitySettings: {
      allowedIps: ['192.168.1.50'],
      accessTimeStart: '09:00',
      accessTimeEnd: '18:00',
      isTimeRestricted: true
    }
  },
  { 
    id: 'u3', 
    name: 'Mike Wang', 
    email: 'mike@company.com', 
    department: '業務部', 
    role: 'Viewer', 
    status: 'Inactive', 
    avatarUrl: 'https://picsum.photos/id/77/100/100', 
    accumulatedBonus: 0,
    googleLinked: true,
    permissions: {
      viewWarRoom: false,
      viewVendors: true,
      viewTasks: true,
      viewCommunication: false,
      viewPayments: false,
      viewKnowledge: true,
      viewAnnouncements: true,
      accessAdminPanel: false,
      canManageCategories: false,
      canManageUsers: false,
      canDeleteVendors: false
    },
    securitySettings: {
      allowedIps: [],
      accessTimeStart: '00:00',
      accessTimeEnd: '23:59',
      isTimeRestricted: false
    }
  },
  { 
    id: 'u4', 
    name: 'Emily Wu', 
    email: 'emily@company.com', 
    department: '產品部', 
    role: 'Editor', 
    status: 'Active', 
    avatarUrl: 'https://picsum.photos/id/88/100/100', 
    accumulatedBonus: 100,
    googleLinked: false,
    permissions: {
      viewWarRoom: true,
      viewVendors: true,
      viewTasks: true,
      viewCommunication: true,
      viewPayments: false,
      viewKnowledge: true,
      viewAnnouncements: true,
      accessAdminPanel: false,
      canManageCategories: false,
      canManageUsers: false,
      canDeleteVendors: false
    },
    securitySettings: {
      allowedIps: [],
      accessTimeStart: '00:00',
      accessTimeEnd: '23:59',
      isTimeRestricted: false
    }
  },
];

export const MOCK_LOGS: SystemLog[] = [
  { id: 'l1', timestamp: '2024-03-15 14:30', user: 'Alex Chen', action: '更新資源', target: 'Firebase Studio', details: '修改了描述與標籤', ip: '192.168.1.101' },
  { id: 'l2', timestamp: '2024-03-15 11:20', user: 'Sarah Lin', action: '新增資源', target: 'Midjourney', details: '建立新項目', ip: '192.168.1.102' },
  { id: 'l3', timestamp: '2024-03-14 16:45', user: 'Alex Chen', action: '系統設定', target: 'API Key', details: '更新了 Gemini API Key', ip: '192.168.1.101' },
  { id: 'l4', timestamp: '2024-03-14 09:15', user: 'Emily Wu', action: '刪除資源', target: 'Old Tool', details: '移除非必要項目', ip: '192.168.1.105' },
];

export const MOCK_LOGIN_LOGS: LoginLog[] = [
  { id: 'li1', timestamp: '2024-03-15 09:00', user: 'Alex Chen', ip: '192.168.1.101', device: 'Chrome / Mac', status: 'success' },
  { id: 'li2', timestamp: '2024-03-15 09:05', user: 'Sarah Lin', ip: '192.168.1.102', device: 'Safari / iPhone', status: 'success' },
  { id: 'li3', timestamp: '2024-03-14 18:30', user: 'Unknown', ip: '203.145.2.11', device: 'Firefox / Windows', status: 'failed' },
  { id: 'li4', timestamp: '2024-03-14 09:00', user: 'Mike Wang', ip: '192.168.1.103', device: 'Edge / Windows', status: 'success' },
];

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  { id: 's1', subject: 'AWS Production Env', service: 'AWS', plan: 'Pay as you go', cost: 350, currency: 'USD', frequency: 'Monthly', nextPayment: '2024-04-01', paymentMethod: 'Company Master', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg' },
  { id: 's2', subject: '光世代 500M/250M', service: '中華電信', plan: 'Fixed IP', cost: 1099, currency: 'TWD', frequency: 'Monthly', nextPayment: '2024-04-05', paymentMethod: 'Bank Transfer' },
  { id: 's3', subject: 'Adobe CC All Apps', service: 'Adobe', plan: 'Enterprise', cost: 2800, currency: 'TWD', frequency: 'Monthly', nextPayment: '2024-04-10', paymentMethod: 'Company Visa', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Creative_Cloud.svg' },
  { id: 's4', subject: 'Midjourney Pro', service: 'Midjourney', plan: 'Pro Plan', cost: 60, currency: 'USD', frequency: 'Monthly', nextPayment: '2024-04-15', paymentMethod: 'Company Master' },
  { id: 's5', subject: 'GitHub Copilot', service: 'GitHub', plan: 'Business', cost: 19, currency: 'USD', frequency: 'Monthly', nextPayment: '2024-04-20', paymentMethod: 'Company Visa', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/GitHub_Invertocat_Logo.svg' },
];

export const MOCK_MODEL_RULES: AiModelRule[] = [
  { id: 'r1', category: 'Search', rule: '搜尋結果應優先顯示評分 4.5 以上的廠商', weight: 'Must', isActive: true },
  { id: 'r2', category: 'Search', rule: '若需求包含「急件」，則必須排除「最近沒空」的廠商', weight: 'Must', isActive: true },
  { id: 'r3', category: 'Response', rule: '推薦原因需具體引用該廠商的 Tags 或歷史評價', weight: 'Should', isActive: true },
  { id: 'r4', category: 'Filter', rule: '自動隱藏所有標記為黑名單的廠商，除非使用者明確要求', weight: 'Must', isActive: true },
];
