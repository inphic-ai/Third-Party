ALTER TABLE "vendors" ADD COLUMN "company_address" text;--> statement-breakpoint
UPDATE "vendors"
SET "company_address" = "address"
WHERE "company_address" IS NULL
  AND "address" IS NOT NULL;--> statement-breakpoint
