-- AlterEnum: member -> developer/reviewer
CREATE TYPE "UserRole_new" AS ENUM ('admin', 'developer', 'reviewer');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT;
UPDATE "users" SET "role" = 'developer' WHERE "role" = 'member';
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'reviewer';

-- AlterTable: Add auto_sprint_enabled to projects
ALTER TABLE "projects" ADD COLUMN "auto_sprint_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add auto_created to sprints
ALTER TABLE "sprints" ADD COLUMN "auto_created" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Remove story_points from tasks
ALTER TABLE "tasks" DROP COLUMN "story_points";

-- CreateTable: weekly_summaries
CREATE TABLE "weekly_summaries" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "week_end" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blockers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_summaries_project_id_week_start_key" ON "weekly_summaries"("project_id", "week_start");

-- AddForeignKey
ALTER TABLE "weekly_summaries" ADD CONSTRAINT "weekly_summaries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
