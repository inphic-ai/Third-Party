
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
  RESERVED = '已預約',
}

export enum PaymentStatus {
  PENDING = '未請款',
  BILLED = '已請款',
  PAID = '已付款'
}

export enum MaintenanceStatus {
  COMPLETED = '已完成',
  IN_PROGRESS = '維修中',
  ARCHIVED = '已歸檔',
  PENDING = '待處理'
}

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

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  description?: string;
  uploadedAt: string;
}

export interface InvoiceRecord {
  id: string;
  vendorName: string;
  maintenanceId?: string;
  amount: number;
  date: string;
  invoiceNo: string;
  status: PaymentStatus;
  attachmentUrl: string;
}

export interface MaintenanceRecord {
  id: string;
  caseId: string;
  date: string;
  deviceName: string;
  deviceNo: string;
  vendorName: string;
  vendorId: string;
  status: MaintenanceStatus;
  description: string;
  productTags: string[]; // 新增：產品標籤
  beforePhotos: MediaItem[];
  afterPhotos: MediaItem[];
  aiReport?: string;
}

export interface ContactLog {
  id: string;
  date: string;
  status: ContactStatus;
  note: string;
  aiSummary?: string;
  nextFollowUp?: string;
  isReservation?: boolean; 
  reservationTime?: string;
  quoteAmount?: number;
  relatedProductId?: string;
}

export enum TransactionStatus {
  IN_PROGRESS = '施工中',
  PENDING_APPROVAL = '待驗收',
  APPROVED = '已驗收/待撥款',
  PAID = '已結案',
  REJECTED = '驗收未過',
}

export interface KnowledgeBaseItem {
  id: string;
  question: string;
  answer: string;
  sourceTransactionId?: string;
  tags: string[];
  createdAt: string;
}

export interface Transaction {
  id: string;
  vendorId: string;
  date: string;
  completionDate?: string;
  customerId: string;
  description: string;
  amount: number;
  initialQuote: number;
  status: TransactionStatus;
  laborFormStatus: 'N/A' | 'Pending' | 'Submitted' | 'Paid'; 
  photosBefore: MediaItem[];
  photosAfter: MediaItem[];
  timeSpentHours: number;
  managerFeedback?: string;
  qualityRating?: number;
  approverId?: string;
  approvalDate?: string;
  acceptanceReport?: string;
  generatedQA?: KnowledgeBaseItem[];
}

export interface ContactWindow {
  id: string;
  name: string;
  role: string;
  mobile?: string;
  email?: string;
  contactAddress?: string;
  isMainContact: boolean;
  lineId?: string; 
  wechatId?: string;
}

export interface SocialGroup {
  id: string;
  platform: 'LINE' | 'WeChat';
  groupName: string;
  systemCode: string;
  inviteLink?: string;
  qrCodeUrl?: string;
  note?: string;
}

export interface Vendor {
  id: string;
  name: string;
  taxId?: string;
  avatarUrl: string;
  region: Region;
  province?: string;
  entityType: EntityType;
  serviceTypes: ServiceType[];
  categories: VendorCategory[];
  rating: number;
  ratingCount: number;
  createdBy: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  tags: string[];
  serviceScopes?: string[];
  isBlacklisted: boolean;
  mainPhone?: string;
  secondaryPhone?: string;
  address?: string;
  companyAddress?: string;
  website?: string;
  lineId?: string;
  wechatId?: string;
  contacts: ContactWindow[];
  socialGroups: SocialGroup[];
  contactLogs: ContactLog[];
  transactions: Transaction[];
  serviceArea: string;
  internalNotes: string;
  isFavorite: boolean;
  missedContactLogCount: number;
  phoneViewCount: number;
  bookingClickCount: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'High' | 'Normal';
  author?: string;
  tags?: string[];
  targetIdentity?: ServiceType[]; 
  targetRegion?: Region; 
}

export type UserRole = 'System Admin' | 'Manager' | 'Editor' | 'Viewer';

export interface UserPermissions {
  viewWarRoom: boolean;
  viewVendors: boolean;
  viewTasks: boolean;
  viewCommunication: boolean;
  viewPayments: boolean;
  viewKnowledge: boolean;
  viewAnnouncements: boolean;
  accessAdminPanel: boolean;
  canManageCategories: boolean;
  canManageUsers: boolean;
  canDeleteVendors: boolean;
}

export interface SecuritySettings {
  allowedIps: string[];
  accessTimeStart: string;
  accessTimeEnd: string;
  isTimeRestricted: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  department: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  accumulatedBonus: number;
  googleLinked: boolean;
  googleEmail?: string;
  permissions: UserPermissions;
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
  ip?: string;
  userAgent?: string;
  status: 'Update' | 'Create' | 'Delete' | 'System';
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
  service: string;
  plan: string;
  cost: number;
  currency: 'TWD' | 'USD';
  frequency: 'Monthly' | 'Yearly';
  nextPayment: string;
  paymentMethod: string;
  logoUrl?: string;
}

export interface AiModelRule {
  id: string;
  category: 'Search' | 'Response' | 'Filter';
  rule: string;
  weight: 'Must' | 'Should' | 'Nice to have';
  isActive: boolean;
}

export interface SystemTags {
  contactTags: string[];
  serviceTags: string[];
  websiteTags: string[];
}

export interface TutorialTip {
  key: string;
  title: string;
  content: string;
  designPrinciple: string;
  actionText?: string;
  skipText?: string;
  isActive: boolean;
}
