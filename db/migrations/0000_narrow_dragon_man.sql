CREATE TYPE "public"."entity_type" AS ENUM('COMPANY', 'INDIVIDUAL');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('LINE', 'WECHAT');--> statement-breakpoint
CREATE TYPE "public"."price_range" AS ENUM('$', '$$', '$$$', '$$$$');--> statement-breakpoint
CREATE TYPE "public"."region" AS ENUM('TAIWAN', 'CHINA');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('LABOR', 'PRODUCT', 'MANUFACTURING');--> statement-breakpoint
CREATE TYPE "public"."vendor_category" AS ENUM('PLUMBING', 'GLASS', 'HVAC', 'PACKAGING', 'IRONWORK', 'WOODWORK', 'HYDRAULIC', 'SCOOTER_REPAIR', 'PLATFORM', 'INTL_LOGISTICS', 'DOMESTIC_LOGISTICS', 'DESIGN', 'APPLIANCE', 'BATTERY', 'STATIONERY', 'LIGHTING', 'HARDWARE', 'LEGAL', 'INSPECTION', 'ENGINEER', 'BANKING', 'RENOVATION', 'LALAMOVE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."contact_status" AS ENUM('SUCCESS', 'BUSY', 'TOO_HIGH', 'NO_TIME', 'BAD_ATTITUDE', 'RESERVED');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('COMPLETED', 'IN_PROGRESS', 'ARCHIVED', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."labor_form_status" AS ENUM('N/A', 'PENDING', 'SUBMITTED', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'BILLED', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('HIGH', 'NORMAL');--> statement-breakpoint
CREATE TYPE "public"."system_log_status" AS ENUM('UPDATE', 'CREATE', 'DELETE', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('System Admin', 'Manager', 'Editor', 'Viewer');--> statement-breakpoint
CREATE TABLE "contact_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"role" varchar(50) NOT NULL,
	"mobile" varchar(20),
	"email" varchar(100),
	"line_id" varchar(100),
	"wechat_id" varchar(100),
	"is_main_contact" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"group_name" varchar(100) NOT NULL,
	"system_code" varchar(50) NOT NULL,
	"invite_link" text,
	"qr_code_url" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "social_groups_system_code_unique" UNIQUE("system_code")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"tax_id" varchar(8),
	"avatar_url" text NOT NULL,
	"region" "region" NOT NULL,
	"province" varchar(50),
	"entity_type" "entity_type" NOT NULL,
	"service_types" text[] NOT NULL,
	"categories" text[] NOT NULL,
	"rating" numeric(2, 1) DEFAULT '0.0',
	"rating_count" integer DEFAULT 0,
	"main_phone" varchar(20),
	"address" text,
	"website" text,
	"line_id" varchar(100),
	"wechat_id" varchar(100),
	"price_range" "price_range" NOT NULL,
	"tags" text[] DEFAULT '{}',
	"service_area" text,
	"is_blacklisted" boolean DEFAULT false,
	"is_favorite" boolean DEFAULT false,
	"internal_notes" text,
	"missed_contact_log_count" integer DEFAULT 0,
	"phone_view_count" integer DEFAULT 0,
	"booking_click_count" integer DEFAULT 0,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"status" "contact_status" NOT NULL,
	"note" text NOT NULL,
	"ai_summary" text,
	"next_follow_up" timestamp,
	"is_reservation" boolean DEFAULT false,
	"reservation_time" timestamp,
	"quote_amount" numeric(10, 2),
	"related_product_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" varchar(50) NOT NULL,
	"date" timestamp NOT NULL,
	"device_name" varchar(100) NOT NULL,
	"device_no" varchar(50) NOT NULL,
	"vendor_name" varchar(100) NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "maintenance_status" NOT NULL,
	"description" text NOT NULL,
	"product_tags" text[] NOT NULL,
	"before_photos" jsonb NOT NULL,
	"after_photos" jsonb NOT NULL,
	"ai_report" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "maintenance_records_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
CREATE TABLE "invoice_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_name" varchar(100) NOT NULL,
	"maintenance_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"date" timestamp NOT NULL,
	"invoice_no" varchar(50) NOT NULL,
	"status" "payment_status" NOT NULL,
	"attachment_url" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_records_invoice_no_unique" UNIQUE("invoice_no")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"completion_date" timestamp,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"initial_quote" numeric(10, 2) NOT NULL,
	"status" "transaction_status" NOT NULL,
	"labor_form_status" "labor_form_status" DEFAULT 'N/A' NOT NULL,
	"photos_before" jsonb NOT NULL,
	"photos_after" jsonb NOT NULL,
	"time_spent_hours" numeric(5, 2) NOT NULL,
	"manager_feedback" text,
	"quality_rating" integer,
	"approver_id" uuid,
	"approval_date" timestamp,
	"acceptance_report" text,
	"generated_qa" jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"email" varchar(100) NOT NULL,
	"avatar_url" text,
	"department" varchar(100) NOT NULL,
	"role" "user_role" NOT NULL,
	"is_active" boolean DEFAULT true,
	"accumulated_bonus" numeric(10, 2) DEFAULT '0.00',
	"google_linked" boolean DEFAULT false,
	"google_email" varchar(100),
	"permissions" jsonb NOT NULL,
	"security_settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"date" timestamp NOT NULL,
	"priority" "priority" NOT NULL,
	"author" uuid,
	"tags" text[] DEFAULT '{}',
	"target_identity" text[],
	"target_region" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" varchar(500) NOT NULL,
	"answer" text NOT NULL,
	"source_transaction_id" uuid,
	"tags" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"target" varchar(200) NOT NULL,
	"details" text NOT NULL,
	"ip" varchar(45) NOT NULL,
	"user_agent" text NOT NULL,
	"status" "system_log_status" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_windows" ADD CONSTRAINT "contact_windows_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_groups" ADD CONSTRAINT "social_groups_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_logs" ADD CONSTRAINT "contact_logs_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_records" ADD CONSTRAINT "invoice_records_maintenance_id_maintenance_records_id_fk" FOREIGN KEY ("maintenance_id") REFERENCES "public"."maintenance_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;