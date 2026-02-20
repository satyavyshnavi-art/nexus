import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getSprintDetail } from "@/server/actions/sprints";
import { getProject } from "@/server/actions/projects";
import { SprintDetailHeader } from "@/components/sprints/sprint-detail-header";
import { SprintMetricsCards } from "@/components/sprints/sprint-metrics-cards";
import { SprintDetailTabs } from "@/components/sprints/sprint-detail-tabs";

export default async function SprintDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; sprintId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { projectId, sprintId } = await params;

  const [project, sprint] = await Promise.all([
    getProject(projectId),
    getSprintDetail(sprintId),
  ]);

  if (!project || !sprint) {
    redirect(`/projects/${projectId}/sprints`);
  }

  return (
    <div className="space-y-6">
      <SprintDetailHeader
        sprintName={sprint.name}
        status={sprint.status}
        startDate={sprint.startDate}
        endDate={sprint.endDate}
        completedAt={sprint.completedAt}
        createdAt={sprint.createdAt}
        creatorName={sprint.creator.name}
        durationDays={sprint.durationDays}
        projectId={projectId}
        projectName={project.name}
      />

      <SprintMetricsCards
        completionPercentage={sprint.completionPercentage}
        totalTasks={sprint.totalTasks}
        storyPoints={sprint.storyPoints}
        velocity={sprint.velocity}
        durationDays={sprint.durationDays}
      />

      <SprintDetailTabs
        completedTasks={sprint.completedTasks}
        incompleteTasks={sprint.incompleteTasks}
        teamMembers={sprint.teamMembers}
      />
    </div>
  );
}
