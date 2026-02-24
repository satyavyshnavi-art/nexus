"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type FeatureWithStats, type FeatureTask } from "@/server/actions/features";
import {
  updateFeature,
  deleteFeature,
  getFeatureWithTasks,
  moveTaskToSprint,
  removeTaskFromSprint,
} from "@/server/actions/features";
import { getProjectSprints } from "@/server/actions/sprints";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddTaskToFeatureDialog } from "./add-task-to-feature-dialog";
import { toast } from "@/lib/hooks/use-toast";
import { getRoleColor } from "@/lib/utils/role-colors";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  MessageSquare,
  ArrowRightCircle,
} from "lucide-react";

interface FeatureCardProps {
  feature: FeatureWithStats;
  isAdmin: boolean;
  projectMembers: { id: string; name: string | null; email: string }[];
  projectId: string;
}

const priorityConfig: Record<
  string,
  { color: string; dot: string; label: string }
> = {
  low: {
    color: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
    label: "Low",
  },
  medium: {
    color: "text-yellow-700 dark:text-yellow-400",
    dot: "bg-yellow-500",
    label: "Medium",
  },
  high: {
    color: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
    label: "High",
  },
  critical: {
    color: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
    label: "Critical",
  },
};

const statusConfig: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  backlog: {
    bg: "bg-slate-500/10",
    text: "text-slate-700 dark:text-slate-400",
    label: "Backlog",
  },
  planning: {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    label: "Planning",
  },
  in_progress: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    label: "In Progress",
  },
  completed: {
    bg: "bg-green-500/10",
    text: "text-green-700 dark:text-green-400",
    label: "Completed",
  },
};

const taskStatusIcons: Record<string, React.ReactNode> = {
  todo: <Circle className="h-3.5 w-3.5 text-slate-400" />,
  progress: <Clock className="h-3.5 w-3.5 text-blue-500" />,
  review: <Eye className="h-3.5 w-3.5 text-amber-500" />,
  done: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
};

export function FeatureCard({
  feature,
  isAdmin,
  projectMembers,
  projectId,
}: FeatureCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [tasks, setTasks] = useState<FeatureTask[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sprints, setSprints] = useState<{ id: string; name: string; status: string }[] | null>(null);
  const [isMovingTask, setIsMovingTask] = useState<string | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState(feature.title);
  const [editDescription, setEditDescription] = useState(
    feature.description || ""
  );
  const [editStatus, setEditStatus] = useState(feature.status);
  const [editPriority, setEditPriority] = useState(feature.priority);

  const priority = priorityConfig[feature.priority] || priorityConfig.medium;
  const status = statusConfig[feature.status] || statusConfig.backlog;
  const completionPct = feature.completionPercentage;

  const handleToggleExpand = async () => {
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);

    // Fetch tasks and sprints on first expand
    if (nextExpanded && tasks === null) {
      setIsLoadingTasks(true);
      try {
        const [featureWithTasks, projectSprints] = await Promise.all([
          getFeatureWithTasks(feature.id),
          sprints === null ? getProjectSprints(projectId) : Promise.resolve(null),
        ]);
        if (featureWithTasks) {
          setTasks(featureWithTasks.tasks);
        }
        if (projectSprints) {
          setSprints(projectSprints.map((s) => ({ id: s.id, name: s.name, status: s.status })));
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load tasks for this feature",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTasks(false);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast({
        title: "Validation Error",
        description: "Feature title is required",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        await updateFeature(feature.id, {
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          status: editStatus,
          priority: editPriority,
        });

        toast({
          title: "Feature updated",
          description: `"${editTitle.trim()}" has been updated`,
          variant: "success",
        });

        setIsEditing(false);
        router.refresh();
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to update feature",
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        await deleteFeature(feature.id);

        toast({
          title: "Feature deleted",
          description: `"${feature.title}" has been deleted`,
          variant: "success",
        });

        router.refresh();
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to delete feature",
          variant: "destructive",
        });
      }
    });
  };

  const handleCancelEdit = () => {
    setEditTitle(feature.title);
    setEditDescription(feature.description || "");
    setEditStatus(feature.status);
    setEditPriority(feature.priority);
    setIsEditing(false);
  };

  // Refresh tasks after adding a new one
  const handleTaskAdded = async () => {
    try {
      const featureWithTasks = await getFeatureWithTasks(feature.id);
      if (featureWithTasks) {
        setTasks(featureWithTasks.tasks);
      }
    } catch {
      // Silently fail, user can re-expand
    }
    router.refresh();
  };

  const handleMoveToSprint = async (taskId: string, sprintId: string | null) => {
    setIsMovingTask(taskId);
    try {
      if (sprintId) {
        await moveTaskToSprint(taskId, sprintId);
        const sprintName = sprints?.find((s) => s.id === sprintId)?.name || "sprint";
        toast({
          title: "Task moved",
          description: `Task moved to ${sprintName}`,
          variant: "success",
        });
      } else {
        await removeTaskFromSprint(taskId);
        toast({
          title: "Task removed",
          description: "Task removed from sprint",
          variant: "success",
        });
      }
      // Refresh tasks to update sprint badges
      const featureWithTasks = await getFeatureWithTasks(feature.id);
      if (featureWithTasks) {
        setTasks(featureWithTasks.tasks);
      }
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to move task",
        variant: "destructive",
      });
    } finally {
      setIsMovingTask(null);
    }
  };

  return (
    <div className="border rounded-lg bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
      {/* Feature Header (always visible) */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={handleToggleExpand}
      >
        {/* Expand/Collapse Chevron */}
        <div className="flex-shrink-0 text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>

        {/* Priority Dot */}
        <div
          className={`h-3 w-3 rounded-full flex-shrink-0 ${priority.dot}`}
          title={`Priority: ${priority.label}`}
        />

        {/* Title & Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{feature.title}</h3>
          </div>
          {feature.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[500px]">
              {feature.description}
            </p>
          )}
        </div>

        {/* Progress Section */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Task Count */}
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {feature.tasksByStatus.done}/{feature.taskCount} tasks
          </div>

          {/* Progress Bar */}
          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>

          {/* Percentage */}
          <span className="text-xs font-medium text-muted-foreground w-10 text-right">
            {completionPct}%
          </span>

          {/* Status Badge */}
          <Badge
            variant="secondary"
            className={`${status.bg} ${status.text} border-0 text-[11px]`}
          >
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Admin Actions Row */}
          {isAdmin && !isEditing && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Feature</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{feature.title}
                      &quot;? Tasks under this feature will be unlinked but not
                      deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isPending}
                    >
                      {isPending ? "Deleting..." : "Delete Feature"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="ml-auto">
                <AddTaskToFeatureDialog
                  featureId={feature.id}
                  projectMembers={projectMembers}
                  onSuccess={handleTaskAdded}
                  trigger={
                    <Button size="sm">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add Task
                    </Button>
                  }
                />
              </div>
            </div>
          )}

          {/* Inline Edit Form */}
          {isEditing && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Title
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Feature title"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Description
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Feature description (optional)"
                  disabled={isPending}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  <Select
                    value={editStatus}
                    onValueChange={(val) => setEditStatus(val as typeof editStatus)}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Priority
                  </label>
                  <Select
                    value={editPriority}
                    onValueChange={(val) => setEditPriority(val as typeof editPriority)}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Tasks List */}
          {isLoadingTasks ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading tasks...
              </span>
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tasks ({tasks.length})
              </h4>
              <div className="space-y-1.5">
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    sprints={sprints}
                    isMoving={isMovingTask === task.id}
                    onMoveToSprint={handleMoveToSprint}
                  />
                ))}
              </div>
            </div>
          ) : tasks !== null && tasks.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No tasks yet.{" "}
                {isAdmin && "Add a task to start breaking down this feature."}
              </p>
            </div>
          ) : null}

          {/* Story Points Summary */}
          {feature.totalStoryPoints > 0 && (
            <div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
              <span>
                Total Story Points:{" "}
                <span className="font-semibold text-foreground">
                  {feature.totalStoryPoints}
                </span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Task Item Sub-component ─────────────────────────────────────────────────

function TaskItem({
  task,
  sprints,
  isMoving,
  onMoveToSprint,
}: {
  task: FeatureTask;
  sprints: { id: string; name: string; status: string }[] | null;
  isMoving: boolean;
  onMoveToSprint: (taskId: string, sprintId: string | null) => void;
}) {
  const statusIcon = taskStatusIcons[task.status] || taskStatusIcons.todo;
  const roleStyle = task.requiredRole ? getRoleColor(task.requiredRole) : null;

  const taskPriority = priorityConfig[task.priority] || priorityConfig.medium;
  const availableSprints = sprints?.filter((s) => s.status === "active" || s.status === "planned") || [];

  return (
    <div className="group">
      <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-secondary/40 hover:bg-secondary/70 transition-colors">
        {/* Status Icon */}
        <div className="flex-shrink-0">{statusIcon}</div>

        {/* Title */}
        <span className="flex-1 text-sm truncate">{task.title}</span>

        {/* Move to Sprint Button */}
        {availableSprints.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary"
                onClick={(e) => e.stopPropagation()}
                disabled={isMoving}
              >
                {isMoving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <ArrowRightCircle className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Move to Sprint</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableSprints.map((sprint) => (
                <DropdownMenuItem
                  key={sprint.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveToSprint(task.id, sprint.id);
                  }}
                  disabled={task.sprint?.id === sprint.id}
                  className="text-xs"
                >
                  <span className="flex-1">{sprint.name}</span>
                  {sprint.status === "active" && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1">Active</Badge>
                  )}
                  {task.sprint?.id === sprint.id && (
                    <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />
                  )}
                </DropdownMenuItem>
              ))}
              {task.sprint && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveToSprint(task.id, null);
                    }}
                    className="text-xs text-destructive"
                  >
                    Remove from Sprint
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Role Badge */}
        {task.requiredRole && roleStyle && (
          <Badge
            variant="outline"
            className={`${roleStyle.bg} ${roleStyle.text} ${roleStyle.border} text-[10px] px-1.5 py-0`}
          >
            {task.requiredRole}
          </Badge>
        )}

        {/* Priority Dot */}
        <div
          className={`h-2 w-2 rounded-full flex-shrink-0 ${taskPriority.dot}`}
          title={`Priority: ${taskPriority.label}`}
        />

        {/* Assignee Avatar */}
        {task.assignee && (
          <div
            className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary flex-shrink-0"
            title={task.assignee.name || task.assignee.email}
          >
            {(task.assignee.name || task.assignee.email)
              .charAt(0)
              .toUpperCase()}
          </div>
        )}

        {/* Story Points */}
        {task.storyPoints !== null && task.storyPoints > 0 && (
          <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
            {task.storyPoints} SP
          </span>
        )}

        {/* Sprint Badge */}
        {task.sprint && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-primary/20 text-primary"
          >
            {task.sprint.name}
          </Badge>
        )}

        {/* Comment Count */}
        {task._count.comments > 0 && (
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            <span className="text-[10px]">{task._count.comments}</span>
          </div>
        )}
      </div>

      {/* Subtasks */}
      {task.childTasks && task.childTasks.length > 0 && (
        <div className="ml-8 mt-1 space-y-1">
          {task.childTasks.map((subtask) => {
            const subStatusIcon =
              taskStatusIcons[subtask.status] || taskStatusIcons.todo;
            return (
              <div
                key={subtask.id}
                className="flex items-center gap-2 px-2 py-1 rounded text-xs text-muted-foreground hover:bg-secondary/40 transition-colors"
              >
                <div className="flex-shrink-0">{subStatusIcon}</div>
                <span className="truncate">{subtask.title}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
