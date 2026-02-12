import { auth } from "@/lib/auth/config";
import { getProject } from "@/server/actions/projects";
import { getActiveSprint, getProjectSprints } from "@/server/actions/sprints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KanbanBoard } from "@/components/kanban/board";
import { Button } from "@/components/ui/button";
import { CreateTaskButton } from "@/components/tasks/create-task-button";
import { AiSprintButton } from "@/components/sprints/ai-sprint-button";
import Link from "next/link";

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  const session = await auth();
  const project = await getProject(params.projectId);
  const activeSprint = await getActiveSprint(params.projectId);
  const sprints = await getProjectSprints(params.projectId);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vertical: {project.vertical.name}
          </p>
        </div>
        {session?.user.role === "admin" && (
          <div className="flex gap-2">
            <Link href={`/dashboard/projects/${params.projectId}/sprints`}>
              <Button variant="outline">Manage Sprints</Button>
            </Link>
          </div>
        )}
      </div>

      {activeSprint ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{activeSprint.name}</h2>
              <p className="text-sm text-muted-foreground">
                {new Date(activeSprint.startDate).toLocaleDateString()} -{" "}
                {new Date(activeSprint.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {activeSprint.tasks.length} tasks
              </div>
              {session?.user.role === "admin" && (
                <AiSprintButton sprintId={activeSprint.id} />
              )}
              <CreateTaskButton
                sprintId={activeSprint.id}
                projectMembers={project.members.map((m) => m.user)}
              />
            </div>
          </div>

          <KanbanBoard
            initialTasks={activeSprint.tasks}
            projectMembers={project.members.map((m) => m.user)}
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Sprint</CardTitle>
            <CardDescription>
              {sprints.length === 0
                ? "No sprints created yet."
                : "Activate a sprint to start working on tasks."}
            </CardDescription>
          </CardHeader>
          {session?.user.role === "admin" && (
            <CardContent>
              <Link href={`/dashboard/projects/${params.projectId}/sprints`}>
                <Button>
                  {sprints.length === 0 ? "Create Sprint" : "Manage Sprints"}
                </Button>
              </Link>
            </CardContent>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Project Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 bg-secondary rounded"
                >
                  <div>
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sprint History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className="flex items-center justify-between p-2 bg-secondary rounded"
                >
                  <div>
                    <p className="font-medium">{sprint.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {sprint._count.tasks} tasks
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      sprint.status === "active"
                        ? "bg-green-100 text-green-800"
                        : sprint.status === "completed"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {sprint.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
