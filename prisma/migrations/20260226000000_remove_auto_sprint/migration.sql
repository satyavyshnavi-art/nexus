-- DropColumn: Remove auto_sprint_enabled from projects
ALTER TABLE "projects" DROP COLUMN IF EXISTS "auto_sprint_enabled";

-- DropColumn: Remove auto_created from sprints
ALTER TABLE "sprints" DROP COLUMN IF EXISTS "auto_created";
