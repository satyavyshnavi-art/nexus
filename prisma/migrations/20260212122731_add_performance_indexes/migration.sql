-- CreateIndex
CREATE INDEX "projects_created_at_idx" ON "projects"("created_at" DESC);

-- CreateIndex
CREATE INDEX "task_comments_task_id_created_at_idx" ON "task_comments"("task_id", "created_at");

-- CreateIndex
CREATE INDEX "tasks_created_by_idx" ON "tasks"("created_by");

-- CreateIndex
CREATE INDEX "tasks_created_at_idx" ON "tasks"("created_at" DESC);

-- CreateIndex
CREATE INDEX "tasks_sprint_id_created_at_idx" ON "tasks"("sprint_id", "created_at" DESC);
