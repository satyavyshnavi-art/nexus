import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getProjectSprints } from "@/server/actions/sprints";
import { getProject } from "@/server/actions/projects";
import { Button } from "@/components/ui/button";
import { SprintList } from "@/components/sprints/sprint-list";
import { CreateSprintButton } from "@/components/sprints/create-sprint-button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SprintsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { projectId } = await params;
  const [project, sprints] = await Promise.all([
    getProject(projectId),
    getProjectSprints(projectId),
  ]);

  if (!project) {
    redirect("/");
  }

  const isAdmin = session.user.role === "admin";

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
        {isAdmin && <CreateSprintButton projectId={projectId} />}
      </div>

      <SprintList sprints={sprints} userRole={session.user.role} />
    </div>
  );
}
