-- Add GitHub OAuth fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_access_token" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_refresh_token" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_token_expiry" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_username" TEXT;

-- Add notification preferences to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "commentNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dailyDigest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sprintNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "taskNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "viewDensity" TEXT NOT NULL DEFAULT 'comfortable';

-- Add unique constraint on github_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_github_id_key'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_github_id_key" UNIQUE ("github_id");
    END IF;
END $$;

-- Add GitHub fields to projects table
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "github_linked_at" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "github_linked_by" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "github_repo_id" BIGINT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "github_repo_name" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "github_repo_owner" TEXT;

-- Add GitHub fields to tasks table
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "github_issue_id" BIGINT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "github_issue_number" INTEGER;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "github_synced_at" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "github_url" TEXT;

-- Create github_sync_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS "github_sync_logs" (
    "id" TEXT NOT NULL,
    "task_id" TEXT,
    "project_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "github_issue_number" INTEGER,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "github_sync_logs_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on github_issue_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tasks_github_issue_id_key'
    ) THEN
        ALTER TABLE "tasks" ADD CONSTRAINT "tasks_github_issue_id_key" UNIQUE ("github_issue_id");
    END IF;
END $$;

-- Create indexes on GitHub fields if they don't exist
CREATE INDEX IF NOT EXISTS "tasks_github_issue_id_idx" ON "tasks"("github_issue_id");
CREATE INDEX IF NOT EXISTS "tasks_sprint_id_github_issue_number_idx" ON "tasks"("sprint_id", "github_issue_number");
CREATE INDEX IF NOT EXISTS "projects_github_repo_owner_github_repo_name_idx" ON "projects"("github_repo_owner", "github_repo_name");
CREATE INDEX IF NOT EXISTS "github_sync_logs_project_id_created_at_idx" ON "github_sync_logs"("project_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "github_sync_logs_task_id_idx" ON "github_sync_logs"("task_id");

-- Add foreign keys for github_sync_logs if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'github_sync_logs_project_id_fkey'
    ) THEN
        ALTER TABLE "github_sync_logs" ADD CONSTRAINT "github_sync_logs_project_id_fkey"
        FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'github_sync_logs_task_id_fkey'
    ) THEN
        ALTER TABLE "github_sync_logs" ADD CONSTRAINT "github_sync_logs_task_id_fkey"
        FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'projects_github_linked_by_fkey'
    ) THEN
        ALTER TABLE "projects" ADD CONSTRAINT "projects_github_linked_by_fkey"
        FOREIGN KEY ("github_linked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Make password_hash nullable for GitHub OAuth users
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
