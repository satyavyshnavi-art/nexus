import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getMyTasksAndProjects } from "@/server/actions/users";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRoleColor } from "@/lib/utils/role-colors";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Briefcase,
  FolderOpen,
  BookOpen,
  CheckSquare,
  Bug,
  Clock,
  Circle,
  Eye,
} from "lucide-react";

const typeConfig: Record<string, { icon: typeof CheckSquare; color: string }> = {
  story: { icon: BookOpen, color: "text-purple-600 dark:text-purple-400" },
  task: { icon: CheckSquare, color: "text-blue-600 dark:text-blue-400" },
  bug: { icon: Bug, color: "text-red-600 dark:text-red-400" },
};

const statusConfig: Record<string, { icon: typeof Circle; label: string; badge: string }> = {
  todo: { icon: Circle, label: "To Do", badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800" },
  progress: { icon: Clock, label: "In Progress", badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
  review: { icon: Eye, label: "Review", badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" },
  done: { icon: CheckCircle2, label: "Done", badge: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
};

const priorityConfig: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

export default async function MyTasksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await getMyTasksAndProjects();

  const completionRate =
    data.stats.totalTasks > 0
      ? Math.round((data.stats.completedTasks / data.stats.totalTasks) * 100)
      : 0;

  // Group tasks by project
  const tasksByProject = new Map<
    string,
    {
      projectId: string;
      projectName: string;
      verticalName: string;
      tasks: typeof data.assignedTasks;
    }
  >();

  data.assignedTasks.forEach((task) => {
    const projectId = task.sprint.project.id;
    if (!tasksByProject.has(projectId)) {
      tasksByProject.set(projectId, {
        projectId,
        projectName: task.sprint.project.name,
        verticalName: task.sprint.project.vertical.name,
        tasks: [],
      });
    }
    tasksByProject.get(projectId)!.tasks.push(task);
  });

  const activeTasks = data.assignedTasks.filter((t) => t.status !== "done");
  const completedTasks = data.assignedTasks.filter((t) => t.status === "done");

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your assigned tickets and projects across all verticals
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Total Tickets
                </span>
                <div className="text-3xl font-bold mt-1">
                  {data.stats.totalTasks}
                </div>
              </div>
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Completed
                </span>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-3xl font-bold">
                    {data.stats.completedTasks}
                  </span>
                  <Badge variant="secondary" className="mb-1">
                    {completionRate}%
                  </Badge>
                </div>
              </div>
              <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Active Projects
                </span>
                <div className="text-3xl font-bold mt-1">
                  {data.stats.activeProjects}
                </div>
              </div>
              <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Projects */}
      {data.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="h-5 w-5" />
              Assigned Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-4 rounded-lg border hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <h4 className="font-medium text-sm">{project.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {project.vertical.name}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{project._count.sprints} sprints</span>
                    <span>{project._count.members} members</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5" />
            Active Tickets
            {activeTasks.length > 0 && (
              <Badge variant="secondary">{activeTasks.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active tickets assigned to you
            </p>
          ) : (
            <div className="space-y-2">
              {Array.from(tasksByProject.entries()).map(([projectId, group]) => {
                const activeInProject = group.tasks.filter((t) => t.status !== "done");
                if (activeInProject.length === 0) return null;
                return (
                  <div key={projectId}>
                    <div className="flex items-center gap-2 mb-2 mt-3 first:mt-0">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {group.verticalName} / {group.projectName}
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {activeInProject.map((task) => (
                        <TaskRow key={task.id} task={task} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Tickets */}
      {completedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              Completed Tickets
              <Badge variant="secondary">{completedTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(tasksByProject.entries()).map(([projectId, group]) => {
                const doneInProject = group.tasks.filter((t) => t.status === "done");
                if (doneInProject.length === 0) return null;
                return (
                  <div key={projectId}>
                    <div className="flex items-center gap-2 mb-2 mt-3 first:mt-0">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {group.verticalName} / {group.projectName}
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {doneInProject.map((task) => (
                        <TaskRow key={task.id} task={task} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TaskRow({
  task,
}: {
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    type: string;
    requiredRole: string | null;
    storyPoints: number | null;
    sprint: { id: string; name: string; project: { id: string; name: string } };
  };
}) {
  const TypeIcon = typeConfig[task.type]?.icon || CheckSquare;
  const typeColor = typeConfig[task.type]?.color || "text-muted-foreground";
  const statusStyle = statusConfig[task.status];
  const roleStyle = task.requiredRole ? getRoleColor(task.requiredRole) : null;

  return (
    <Link
      href={`/projects/${task.sprint.project.id}`}
      className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      <TypeIcon className={`h-4 w-4 shrink-0 ${typeColor}`} />
      <span className="text-sm font-medium flex-1 line-clamp-1 group-hover:text-primary transition-colors">
        {task.title}
      </span>

      {task.storyPoints && (
        <span className="text-xs text-muted-foreground shrink-0">
          {task.storyPoints}pt
        </span>
      )}

      {roleStyle && (
        <Badge
          variant="outline"
          className={`shrink-0 text-[10px] border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
        >
          {task.requiredRole}
        </Badge>
      )}

      <Badge
        variant="outline"
        className={`shrink-0 text-[10px] border ${statusStyle?.badge || ""}`}
      >
        {statusStyle?.label || task.status}
      </Badge>

      <Badge
        variant="outline"
        className={`shrink-0 text-[10px] border ${priorityConfig[task.priority] || ""}`}
      >
        {task.priority}
      </Badge>

      <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">
        {task.sprint.name}
      </span>
    </Link>
  );
}
