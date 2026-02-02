ALTER TABLE "vendors" ALTER COLUMN "service_scopes" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "contact_logs" ADD COLUMN "contact_id" uuid;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "company_address" text;