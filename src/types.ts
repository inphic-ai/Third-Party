
export enum Region {
  TAIWAN = '台灣',
  CHINA = '大陸',
}

export enum EntityType {
  COMPANY = '公司',
  INDIVIDUAL = '個人',
}

export enum ServiceType {
  LABOR = '提供勞務',
  PRODUCT = '提供商品',
  MANUFACTURING = '製造商品',
}

export enum ContactStatus {
  SUCCESS = '聯繫成功',
  BUSY = '在忙',
  TOO_HIGH = '報價過高',
  NO_TIME = '最近沒空',
  BAD_ATTITUDE = '態度不好',
  RESERVED = '已預約', // Added status
}

// Based on user request categories
export enum VendorCategory {
  PLUMBING = '水電',
  GLASS = '玻璃',
  HVAC = '冷凍空調',
  PACKAGING = '包裝耗材',
  IRONWORK = '鐵工修復',
  WOODWORK = '木工修復',
  HYDRAULIC = '油壓設備',
  SCOOTER_REPAIR = '機車維修',
  PLATFORM = '通路平台',
  INTL_LOGISTICS = '國際運輸',
  DOMESTIC_LOGISTICS = '國內運輸',
  DESIGN = '平面設計',
  APPLIANCE = '家電維修',
  BATTERY = '電池',
  STATIONERY = '辦公文具',
  LIGHTING = '燈具',
  HARDWARE = '五金零件',
  LEGAL = '法律',
  INSPECTION = '檢驗單位',
  ENGINEER = '軟硬體工程師',
  BANKING = '銀行＆金流',
  RENOVATION = '裝修工程',
  LALAMOVE = 'LALA司機',
  OTHER = '其它',
}

export interface ContactLog {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  status: ContactStatus;
  note: string;
  aiSummary?: string; // AI Summarized content
  nextFollowUp?: string; // ISO date
  
  // Reservation Specifics
  isReservation?: boolean; 
  reservationTime?: string; // HH:mm
  quoteAmount?: number;
  relatedProductId?: string; // New field for Product ID
}

export enum TransactionStatus {
  IN_PROGRESS = '施工中',
  PENDING_APPROVAL = '待驗收', // Completed by vendor, waiting for manager
  APPROVED = '已驗收/待撥款',  // Approved by manager
  PAID = '已結案',            // Finance paid
  REJECTED = '驗收未過',
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  description?: string;
  uploadedAt: string;
}

export interface Transaction {
  id: string;
  vendorId: string; // Link back to vendor
  date: string; // Job start date
  completionDate?: string; // Job end date
  customerId: string; // Linked customer or Project ID
  description: string;
  
  // Cost
  amount: number; // Final Amount
  initialQuote: number; // For "Quote vs Actual" analysis
  
  // Workflow
  status: TransactionStatus;
  laborFormStatus: 'N/A' | 'Pending' | 'Submitted' | 'Paid'; 
  
  // Acceptance Data
  photosBefore: MediaItem[];
  photosAfter: MediaItem[];
  timeSpentHours: number;
  
  // Quality Control
  managerFeedback?: string;
  qualityRating?: number; // 1-5 rating for this specific job
  approverId?: string;
  approvalDate?: string;
  
  // Knowledge Base Integration
  acceptanceReport?: string;
  generatedQA?: KnowledgeBaseItem[];
}

// New Interface for Multiple Contact Windows (Company Structure)
export interface ContactWindow {
  id: string;
  name: string;
  role: string; // e.g., 業務經理, 會計, 工程師
  mobile?: string;
  email?: string;
  isMainContact: boolean;
  // Personal Accounts (Contact Person Level)
  lineId?: string; 
  wechatId?: string;
}

// New Interface for Project Groups (Public for Internal Users)
export interface SocialGroup {
  id: string;
  platform: 'LINE' | 'WeChat';
  groupName: string; // The messy actual name e.g. "2024 大發水电 x 公司 專案群🚀"
  systemCode: string; // Standardized code e.g. "GRP-C2024001-A"
  inviteLink?: string;
  qrCodeUrl?: string; // For WeChat or LINE QR
  note?: string; // e.g. "主要討論施工細節，請勿傳送無關訊息"
}

export interface Vendor {
  id: string; // ID Logic: C=Company, I=Individual + Year + Seq (e.g., C2024001)
  name: string;
  taxId?: string; // 統一編號 (For Duplicate Check)
  avatarUrl: string;
  region: Region;
  entityType: EntityType;
  serviceTypes: ServiceType[];
  categories: VendorCategory[];
  rating: number; // 0-5
  ratingCount: number;
  
  // Referral System
  createdBy: string; // User ID of the person who referred/added this vendor
  
  // New Fields for Enhanced Search/Display
  priceRange: '$' | '$$' | '$$$' | '$$$$'; // Average cost indication
  tags: string[]; // e.g. ["急件", "配合度高", "夜間施工"]
  isBlacklisted: boolean;
  
  // Contact Info
  mainPhone?: string; // Company Phone (For Duplicate Check)
  address?: string;
  website?: string;
  
  // Corporate/Main Social IDs
  lineId?: string; // Enterprise LINE ID or Main Individual LINE
  wechatId?: string; // Enterprise WeChat ID or Main Individual WeChat
  
  // Multiple Contact Persons
  contacts: ContactWindow[];
  
  // Project Groups (New)
  socialGroups: SocialGroup[];

  contactLogs: ContactLog[];
  transactions: Transaction[];
  serviceArea: string; // e.g., "Taipei, New Taipei"
  internalNotes: string; // "用人注意事項"
  isFavorite: boolean;
  
  // Analytics - NEW FIELDS
  missedContactLogCount: number; // Count of times user opened contact modal but didn't save log
  phoneViewCount: number; // Track how many times users clicked to view phone
  bookingClickCount: number; // Track how many times users clicked to view phone
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'High' | 'Normal';
}

// --- Admin Module Types ---

export type UserRole = 'System Admin' | 'Manager' | 'Editor' | 'Viewer';

export interface UserPermissions {
  // Frontend Navigation
  viewWarRoom: boolean;
  viewVendors: boolean;
  viewTasks: boolean;
  viewCommunication: boolean;
  
  // Admin Center Navigation
  viewPayments: boolean;
  viewKnowledge: boolean;
  viewAnnouncements: boolean;
  accessAdminPanel: boolean;

  // Specific Actions
  canManageCategories: boolean; // Add/Delete Categories
  canManageUsers: boolean;      // Add/Edit Users
  canDeleteVendors: boolean;
}

export interface SecuritySettings {
  allowedIps: string[]; // List of allowed IPs, empty means no restriction
  accessTimeStart: string; // HH:mm (e.g., "09:00")
  accessTimeEnd: string;   // HH:mm (e.g., "18:00")
  isTimeRestricted: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  department: string; // ID or Name
  role: UserRole;
  status: 'Active' | 'Inactive';
  accumulatedBonus: number; // For vendor referrals
  
  // Authentication
  googleLinked: boolean;
  googleEmail?: string;
  
  // Permissions
  permissions: UserPermissions;
  
  // Security
  securitySettings?: SecuritySettings;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  managerName?: string;
  memberCount: number;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  details: string;
  ip?: string; // Added IP field
}

export interface LoginLog {
  id: string;
  timestamp: string;
  user: string;
  ip: string;
  device: string;
  status: 'success' | 'failed';
}

export interface Subscription {
  id: string;
  subject: string;
  service: string; // e.g., AWS, Adobe
  plan: string;
  cost: number;
  currency: 'TWD' | 'USD';
  frequency: 'Monthly' | 'Yearly';
  nextPayment: string;
  paymentMethod: string;
  logoUrl?: string;
}

// --- AI & Knowledge Base & Tags Types ---

export interface AiModelRule {
  id: string;
  category: 'Search' | 'Response' | 'Filter';
  rule: string;
  weight: 'Must' | 'Should' | 'Nice to have';
  isActive: boolean;
}

export interface KnowledgeBaseItem {
  id: string;
  question: string;
  answer: string;
  sourceTransactionId?: string;
  tags: string[];
  createdAt: string;
}

// System Tag Configuration
export interface SystemTags {
  contactTags: string[]; // e.g., "報價中", "已預約", "無人接聽"
  serviceTags: string[]; // e.g., "夜間施工", "急件"
  websiteTags: string[]; // e.g., "優良廠商", "配合度高"
}

// --- Tutorial & Error Guidance System ---
export interface TutorialTip {
  key: string;
  title: string;
  content: string;
  designPrinciple: string; // "Why" this rule exists
  actionText?: string; // Text for the primary action button (e.g. "I understand")
  skipText?: string; // Text for the skip/force button (e.g. "Skip anyway")
  isActive: boolean;
}
