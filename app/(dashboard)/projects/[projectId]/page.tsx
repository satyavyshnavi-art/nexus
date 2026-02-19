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
import { GitHubLinkDialog } from "@/components/projects/github-link-dialog";
import { GitHubLinkedStatus } from "@/components/projects/github-linked-status";
import { getLinkedRepository } from "@/server/actions/github-link";
import { TeamTabContent } from "@/components/projects/team-tab-content";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/server/db";

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
  const linkedRepo = await getLinkedRepository(projectId);

  const isAdmin = session?.user.role === "admin";

  // Check if current user has GitHub connected
  const currentUser = session?.user?.id
    ? await db.user.findUnique({
      where: { id: session.user.id },
      select: { githubAccessToken: true },
    })
    : null;
  const userHasGitHub = !!currentUser?.githubAccessToken;

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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent pb-1">{project.name}</h1>
          <p className="text-muted-foreground text-lg mt-1">{project.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
              {project.vertical.name}
            </span>
          </div>
        </div>
        {isAdmin && (
          <Link href={`/projects/${projectId}/sprints`}>
            <Button variant="outline" className="glass hover:bg-muted/50">
              <Calendar className="h-4 w-4 mr-2" />
              Manage Sprints
            </Button>
          </Link>
        )}
      </div>

      {/* Statistics Cards */}
      {taskStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-primary bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                  <p className="text-3xl font-bold mt-1">{taskStats.total}</p>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ListTodo className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-slate-400 dark:border-l-slate-500 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-muted-foreground mb-1">To Do</p>
                <p className="text-3xl font-bold text-slate-600 dark:text-slate-300">{taskStats.todo}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-muted-foreground mb-1">In Progress</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{taskStats.progress}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500 dark:border-l-amber-400 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-muted-foreground mb-1">Review</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{taskStats.review}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500 dark:border-l-green-400 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-muted-foreground mb-1">Done</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{taskStats.done}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content with Tabs */}
      <Tabs defaultValue="board" className="space-y-4">
        <TabsList className="bg-muted/50 backdrop-blur-sm border">
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
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{activeSprint.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {new Date(activeSprint.startDate).toLocaleDateString()} -{" "}
                      {new Date(activeSprint.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && <AiSprintButton sprintId={activeSprint.id} />}
                  <CreateTaskButton
                    sprintId={activeSprint.id}
                    projectMembers={project.members.map((m) => m.user)}
                    projectLinked={!!(project.githubRepoOwner && project.githubRepoName)}
                  />
                </div>
              </div>

              <KanbanBoard
                initialTasks={activeSprint.tasks}
                projectMembers={project.members.map((m) => m.user)}
                projectLinked={!!(project.githubRepoOwner && project.githubRepoName)}
                userHasGitHub={userHasGitHub}
              />
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No Active Sprint"
              description={sprints.length === 0
                ? "No sprints created yet. Create a sprint to start organizing tickets and tracking progress."
                : "Select and activate a sprint from your sprint list to begin working on tickets."}
              className="bg-card/50 backdrop-blur-sm"
            />
          )}
          {/* Custom Empty State Action for Link */}
          {!activeSprint && isAdmin && (
            <div className="flex justify-center -mt-20 relative z-10 pointer-events-none">
              {/* This is a hacky way to inject the button, better to just render the button below the empty state or modify EmptyState to accept ReactNode action */}
              {/* Let's just render the link below the EmptyState manually for now */}
            </div>
          )}
          {!activeSprint && isAdmin && (
            <div className="flex justify-center mt-4">
              <Link href={`/projects/${projectId}/sprints`}>
                <Button variant="outline" className="glass">
                  <Calendar className="h-4 w-4 mr-2" />
                  {sprints.length === 0 ? "Create Sprint" : "Manage Sprints"}
                </Button>
              </Link>
            </div>
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
            <EmptyState
              icon={ListTodo}
              title="No Tasks Found"
              description="No tasks yet. Create your first task to get started."
              className="bg-card/50 backdrop-blur-sm"
            />
          )}
        </TabsContent>

        {/* Tab: Team */}
        <TabsContent value="team" className="space-y-4">
          <TeamTabContent
            projectId={projectId}
            members={project.members}
            activeSprint={activeSprint}
            isAdmin={isAdmin}
          />
        </TabsContent>

        {/* Tab: Overview */}
        <TabsContent value="overview" className="space-y-4">
          {/* GitHub Integration Section - visible to all members */}
          <Card>
            <CardHeader>
              <CardTitle>GitHub Integration</CardTitle>
              <CardDescription>
                Link this project to a GitHub repository to sync tasks as issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkedRepo ? (
                <GitHubLinkedStatus
                  projectId={projectId}
                  repository={linkedRepo.repository}
                  repositoryUrl={linkedRepo.repositoryUrl}
                  linkedAt={linkedRepo.linkedAt!}
                  linkedBy={linkedRepo.linkedBy!}
                  isAdmin={isAdmin}
                />
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-lg border-dashed">
                  <div>
                    <p className="font-medium">No repository linked</p>
                    <p className="text-sm text-muted-foreground">
                      Link a GitHub repository to enable task syncing
                    </p>
                  </div>
                  <GitHubLinkDialog projectId={projectId} />
                </div>
              )}
            </CardContent>
          </Card>

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
                        className={`text-xs px-3 py-1 rounded-full font-medium ${sprint.status === "active"
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : sprint.status === "completed"
                            ? "bg-muted text-muted-foreground"
                            : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
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
