-- 創建功能建議相關的列舉類型
CREATE TYPE "suggestion_status" AS ENUM ('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE "suggestion_page" AS ENUM ('客戶管理', '設備管理', '工單系統', '統計報表', '訂單中心', '其他');
CREATE TYPE "suggestion_impact" AS ENUM ('幾乎不影響', '偶爾會卡住', '幾乎每天都會遇到', '會直接影響成交/作業效率');
CREATE TYPE "suggestion_urgency" AS ENUM ('可慢慢來', '近期希望改善', '很急，已影響工作');

-- 創建功能建議表
CREATE TABLE IF NOT EXISTS "suggestions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "submitter_id" uuid NOT NULL,
  "submitter_name" varchar(50) NOT NULL,
  "submitter_email" varchar(100) NOT NULL,
  "problem" text,
  "improvement" text NOT NULL,
  "page" "suggestion_page" NOT NULL,
  "impact" "suggestion_impact" NOT NULL,
  "consequence" text,
  "urgency" "suggestion_urgency" NOT NULL,
  "attachments" text[] DEFAULT '{}',
  "status" "suggestion_status" DEFAULT 'PENDING' NOT NULL,
  "reviewer_id" uuid,
  "reviewer_name" varchar(50),
  "review_note" text,
  "reviewed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
