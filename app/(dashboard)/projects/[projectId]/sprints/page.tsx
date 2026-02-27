import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getProjectSprintsCached } from "@/server/actions/sprints";
import { getProjectCached } from "@/server/actions/projects";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { SprintList } from "@/components/sprints/sprint-list";
import { CreateSprintButton } from "@/components/sprints/create-sprint-button";
import { AiPlanSprintButton } from "@/components/sprints/ai-plan-sprint-button";
import Link from "next/link";
import { ArrowLeft, Zap, Calendar, CheckCircle2 } from "lucide-react";

export default async function SprintsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { projectId } = await params;
  const [project, sprints] = await Promise.all([
    getProjectCached(projectId, session.user.id, session.user.role),
    getProjectSprintsCached(projectId),
  ]);

  if (!project) {
    redirect("/");
  }

  const isAdmin = session.user.role === "admin";

  // Split sprints by status
  const activeSprints = sprints.filter((s) => s.status === "active");
  const plannedSprints = sprints.filter((s) => s.status === "planned");
  const completedSprints = sprints.filter((s) => s.status === "completed");

  // Fetch task counts for each sprint (completed vs incomplete)
  const sprintIds = sprints.map((s) => s.id);
  const taskCountsRaw =
    sprintIds.length > 0
      ? await db.task.groupBy({
        by: ["sprintId", "status"],
        where: { sprintId: { in: sprintIds } },
        _count: { id: true },
      })
      : [];

  const taskCounts: Record<string, { completed: number; incomplete: number }> =
    {};
  for (const row of taskCountsRaw) {
    const sid = row.sprintId;
    if (!sid) continue;
    if (!taskCounts[sid]) {
      taskCounts[sid] = { completed: 0, incomplete: 0 };
    }
    if (row.status === "done") {
      taskCounts[sid].completed += row._count.id;
    } else {
      taskCounts[sid].incomplete += row._count.id;
    }
  }

  // Default to first tab that has content
  const defaultTab = activeSprints.length > 0
    ? "active"
    : plannedSprints.length > 0
      ? "planned"
      : "completed";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name} - Sprints</h1>
          <p className="text-muted-foreground mt-2">
            Manage sprints for this project
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AiPlanSprintButton projectId={projectId} />
          <CreateSprintButton projectId={projectId} />
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-1.5">
            <Zap className="h-4 w-4" />
            Active
            {activeSprints.length > 0 && (
              <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {activeSprints.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="planned" className="gap-1.5">
            <Calendar className="h-4 w-4" />
            Future
            {plannedSprints.length > 0 && (
              <span className="ml-1 rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                {plannedSprints.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Completed
            {completedSprints.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {completedSprints.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeSprints.length > 0 ? (
            <SprintList
              sprints={activeSprints}
              userRole={session.user.role}
              projectId={projectId}
              taskCounts={taskCounts}
            />
          ) : (
            <Card className="p-8 text-center">
              <Zap className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No active sprint. Activate a planned sprint to get started.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="planned">
          {plannedSprints.length > 0 ? (
            <SprintList
              sprints={plannedSprints}
              userRole={session.user.role}
              projectId={projectId}
              taskCounts={taskCounts}
            />
          ) : (
            <Card className="p-8 text-center">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No future sprints planned.{" "}
                {isAdmin && "Create one to start planning ahead."}
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedSprints.length > 0 ? (
            <SprintList
              sprints={completedSprints}
              userRole={session.user.role}
              projectId={projectId}
              showMetrics
              taskCounts={taskCounts}
            />
          ) : (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No completed sprints yet.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
