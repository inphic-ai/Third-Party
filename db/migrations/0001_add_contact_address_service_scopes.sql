ALTER TABLE "contact_windows" ADD COLUMN "contact_address" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "service_scopes" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
