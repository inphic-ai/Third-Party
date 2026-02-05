CREATE TYPE "public"."login_status" AS ENUM('SUCCESS', 'FAILED');--> statement-breakpoint
CREATE TABLE "login_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" varchar(100) NOT NULL,
	"user_name" varchar(100),
	"ip" varchar(45) NOT NULL,
	"user_agent" text NOT NULL,
	"browser" varchar(50),
	"os" varchar(50),
	"device" varchar(100),
	"status" "login_status" NOT NULL,
	"failure_reason" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
