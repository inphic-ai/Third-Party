import { pgTable, uuid, varchar, text, boolean, integer, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// ============================================
// 列舉定義 (Enums)
// ============================================

export const regionEnum = pgEnum('region', ['TAIWAN', 'CHINA']);
export const entityTypeEnum = pgEnum('entity_type', ['COMPANY', 'INDIVIDUAL']);
export const serviceTypeEnum = pgEnum('service_type', ['LABOR', 'PRODUCT', 'MANUFACTURING']);
export const priceRangeEnum = pgEnum('price_range', ['$', '$$', '$$$', '$$$$']);

export const vendorCategoryEnum = pgEnum('vendor_category', [
  'PLUMBING',
  'GLASS',
  'HVAC',
  'PACKAGING',
  'IRONWORK',
  'WOODWORK',
  'HYDRAULIC',
  'SCOOTER_REPAIR',
  'PLATFORM',
  'INTL_LOGISTICS',
  'DOMESTIC_LOGISTICS',
  'DESIGN',
  'APPLIANCE',
  'BATTERY',
  'STATIONERY',
  'LIGHTING',
  'HARDWARE',
  'LEGAL',
  'INSPECTION',
  'ENGINEER',
  'BANKING',
  'RENOVATION',
  'LALAMOVE',
  'OTHER'
]);

// ============================================
// 廠商名錄 (Vendor)
// ============================================

export const vendors = pgTable('vendors', {
  // 識別資訊
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  taxId: varchar('tax_id', { length: 8 }),
  avatarUrl: text('avatar_url').notNull(),
  
  // 分類資訊
  region: regionEnum('region').notNull(),
  province: varchar('province', { length: 50 }),
  entityType: entityTypeEnum('entity_type').notNull(),
  serviceTypes: text('service_types').array().notNull(), // ServiceType[]
  categories: text('categories').array().notNull(), // VendorCategory[]
  
  // 評價資訊
  rating: decimal('rating', { precision: 2, scale: 1 }).default('0.0'),
  ratingCount: integer('rating_count').default(0),
  
  // 聯絡資訊
  mainPhone: varchar('main_phone', { length: 20 }),
  secondaryPhone: varchar('secondary_phone', { length: 20 }),
  address: text('address'),
  companyAddress: text('company_address'),
  website: text('website'),
  lineId: varchar('line_id', { length: 100 }),
  wechatId: varchar('wechat_id', { length: 100 }),
  
  // 匙款資訊
  bankName: varchar('bank_name', { length: 100 }),
  bankAccount: varchar('bank_account', { length: 50 }),
  accountHolder: varchar('account_holder', { length: 100 }),
  
  // 業務資訊
  priceRange: priceRangeEnum('price_range').notNull(),
  tags: text('tags').array().default([]),
  serviceScopes: text('service_scopes').array().default([]).notNull(),
  serviceArea: text('service_area'),
  
  // 狀態與設定
  isBlacklisted: boolean('is_blacklisted').default(false),
  isFavorite: boolean('is_favorite').default(false),
  internalNotes: text('internal_notes'),
  
  // 統計資訊
  missedContactLogCount: integer('missed_contact_log_count').default(0),
  phoneViewCount: integer('phone_view_count').default(0),
  bookingClickCount: integer('booking_click_count').default(0),
  
  // 系統資訊
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// 聯絡窗口 (ContactWindow)
// ============================================

export const contactWindows = pgTable('contact_windows', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 50 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  mobile: varchar('mobile', { length: 20 }),
  email: varchar('email', { length: 100 }),
  lineId: varchar('line_id', { length: 100 }),
  wechatId: varchar('wechat_id', { length: 100 }),
  contactAddress: text('contact_address'),
  
  isMainContact: boolean('is_main_contact').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// 社群群組 (SocialGroup)
// ============================================

export const platformEnum = pgEnum('platform', ['LINE', 'WECHAT']);

export const socialGroups = pgTable('social_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  
  platform: platformEnum('platform').notNull(),
  groupName: varchar('group_name', { length: 100 }).notNull(),
  systemCode: varchar('system_code', { length: 50 }).notNull().unique(),
  inviteLink: text('invite_link'),
  qrCodeUrl: text('qr_code_url'),
  note: text('note'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// 廠商評分 (VendorRating)
// ============================================

export const vendorRatings = pgTable('vendor_ratings', {
  // 識別資訊
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  
  // 評分資訊
  rating: integer('rating').notNull(), // 1-5 星
  
  // 評論內容
  comment: text('comment'),
  
  // 系統資訊
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
