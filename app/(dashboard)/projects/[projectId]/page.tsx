import { auth } from "@/lib/auth/config";
import { getProject } from "@/server/actions/projects";
import { getActiveSprint, getProjectSprints } from "@/server/actions/sprints";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KanbanBoard } from "@/components/kanban/board";
import { Button } from "@/components/ui/button";
import { CreateTaskButton } from "@/components/tasks/create-task-button";
import { AiSprintButton } from "@/components/sprints/ai-sprint-button";
import { Calendar, Users, LayoutDashboard, ListTodo, Settings } from "lucide-react";
import Link from "next/link";
import { TaskListView } from "@/components/tasks/task-list-view";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  const { projectId } = await params; // FIX: Await params

  const project = await getProject(projectId);
  const activeSprint = await getActiveSprint(projectId);
  const sprints = await getProjectSprints(projectId);

  const isAdmin = session?.user.role === "admin";

  // Calculate statistics
  const taskStats = activeSprint
    ? {
        todo: activeSprint.tasks.filter((t) => t.status === "todo").length,
        progress: activeSprint.tasks.filter((t) => t.status === "progress").length,
        review: activeSprint.tasks.filter((t) => t.status === "review").length,
        done: activeSprint.tasks.filter((t) => t.status === "done").length,
        total: activeSprint.tasks.length,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vertical: {project.vertical.name}
          </p>
        </div>
        {isAdmin && (
          <Link href={`/projects/${projectId}/sprints`}>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Manage Sprints
            </Button>
          </Link>
        )}
      </div>

      {/* Statistics Cards */}
      {taskStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                  <p className="text-3xl font-bold mt-1">{taskStats.total}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ListTodo className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-slate-400">
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-muted-foreground mb-1">To Do</p>
                <p className="text-3xl font-bold text-slate-600">{taskStats.todo}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-muted-foreground mb-1">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{taskStats.progress}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-muted-foreground mb-1">Review</p>
                <p className="text-3xl font-bold text-amber-600">{taskStats.review}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-muted-foreground mb-1">Done</p>
                <p className="text-3xl font-bold text-green-600">{taskStats.done}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content with Tabs */}
      <Tabs defaultValue="board" className="space-y-4">
        <TabsList>
          <TabsTrigger value="board">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Kanban Board
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListTodo className="h-4 w-4 mr-2" />
            Task List
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="overview">
            <Settings className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
        </TabsList>

        {/* Tab: Kanban Board */}
        <TabsContent value="board" className="space-y-4">
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
                <div className="flex items-center gap-2">
                  {isAdmin && <AiSprintButton sprintId={activeSprint.id} />}
                  <CreateTaskButton
                    sprintId={activeSprint.id}
                    projectMembers={project.members.map((m) => m.user)}
                  />
                </div>
              </div>

              <KanbanBoard
                initialTasks={activeSprint.tasks}
                projectMembers={project.members.map((m) => m.user)}
                projectLinked={!!(project.githubRepoOwner && project.githubRepoName)}
              />
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Calendar className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Active Sprint</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mb-6">
                    {sprints.length === 0
                      ? "No sprints created yet. Create a sprint to start organizing tickets and tracking progress."
                      : "Select and activate a sprint from your sprint list to begin working on tickets."}
                  </p>
                  {isAdmin && (
                    <Link href={`/projects/${projectId}/sprints`}>
                      <Button size="lg">
                        <Calendar className="h-4 w-4 mr-2" />
                        {sprints.length === 0 ? "Create Sprint" : "Manage Sprints"}
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Task List */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Tasks</h2>
            {activeSprint && (
              <CreateTaskButton
                sprintId={activeSprint.id}
                projectMembers={project.members.map((m) => m.user)}
              />
            )}
          </div>

          {activeSprint && activeSprint.tasks.length > 0 ? (
            <TaskListView
              tasks={activeSprint.tasks}
              projectMembers={project.members.map((m) => m.user)}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No tasks yet. Create your first task to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Team */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Team Members ({project.members.length})</h2>
            {isAdmin && (
              <Link href={`/admin/projects`}>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Members
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.members.map((member) => {
              const memberTasks = activeSprint?.tasks.filter(
                (t) => t.assigneeId === member.userId
              );
              return (
                <Card key={member.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{member.user.name}</CardTitle>
                    <CardDescription>{member.user.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {memberTasks && memberTasks.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Assigned Tasks: {memberTasks.length}
                        </p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>
                            Todo: {memberTasks.filter((t) => t.status === "todo").length}
                          </span>
                          <span>
                            In Progress:{" "}
                            {memberTasks.filter((t) => t.status === "progress").length}
                          </span>
                          <span>
                            Done: {memberTasks.filter((t) => t.status === "done").length}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tasks assigned</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab: Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{project.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {project.description || "No description"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Vertical</p>
                  <p className="text-sm text-muted-foreground">{project.vertical.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Sprints</p>
                  <p className="text-sm text-muted-foreground">{sprints.length}</p>
                </div>
              </CardContent>
            </Card>

            {/* Sprint History */}
            <Card>
              <CardHeader>
                <CardTitle>Sprint History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sprints.map((sprint) => (
                    <div
                      key={sprint.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded"
                    >
                      <div>
                        <p className="font-medium text-sm">{sprint.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sprint._count.tasks} tasks
                        </p>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
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
                  {sprints.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No sprints created yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
