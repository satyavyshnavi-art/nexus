"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Task, User, TaskStatus, TaskPriority, TaskType } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskDetailModal } from "./task-detail-modal";
import { CheckSquare, Bug, BookOpen, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { updateTaskStatus, createSubtask } from "@/server/actions/tasks";
import { toast } from "sonner";
import type { SubtaskToggleFn, SubtaskAddFn } from "@/components/kanban/task-card";

type TaskItem = Omit<Task, "githubIssueId"> & {
  githubIssueId: string | null;
  assignee: Pick<User, "id" | "name" | "email"> | null;
  _count?: {
    comments: number;
    attachments: number;
    childTasks?: number;
  };
  childTasks?: Pick<Task, "id" | "title" | "status" | "priority" | "type">[];
};

interface TaskListViewProps {
  tasks: TaskItem[];
  projectMembers: Pick<User, "id" | "name" | "email">[];
}

const priorityColors = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const statusColors = {
  todo: "bg-muted text-muted-foreground",
  progress: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  review: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  done: "bg-green-500/10 text-green-700 dark:text-green-400",
};

const typeIcons: Record<string, typeof CheckSquare> = {
  task: CheckSquare,
  bug: Bug,
  story: BookOpen,
  subtask: CheckSquare,
};

export function TaskListView({ tasks: initialTasks, projectMembers }: TaskListViewProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Sync from server when initialTasks changes (e.g. after revalidation)
  // We compare by reference — Next.js provides a new array after revalidation
  const [prevInitial, setPrevInitial] = useState(initialTasks);
  if (initialTasks !== prevInitial) {
    setPrevInitial(initialTasks);
    setTasks(initialTasks);
    // Also update selectedTask if open
    if (selectedTask) {
      const updated = initialTasks.find((t) => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }

  const handleTaskClick = (task: TaskItem) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedTask(null), 200);
    router.refresh();
  };

  // ── Subtask toggle (optimistic) ──
  const handleSubtaskToggle: SubtaskToggleFn = useCallback(async (
    parentTaskId: string,
    subtaskId: string,
    currentStatus: TaskStatus
  ) => {
    const newStatus: TaskStatus = currentStatus === "done" ? "todo" : "done";

    const updateChild = (t: TaskItem) =>
      t.id === parentTaskId && t.childTasks
        ? {
          ...t, childTasks: t.childTasks.map((st) =>
            st.id === subtaskId ? { ...st, status: newStatus } : st
          )
        }
        : t;

    setTasks((prev) => prev.map(updateChild));
    setSelectedTask((prev) => prev ? updateChild(prev) : prev);

    try {
      await updateTaskStatus(subtaskId, newStatus);
      toast.success(newStatus === "done" ? "Subtask completed" : "Subtask reopened");
    } catch {
      const rollback = (t: TaskItem) =>
        t.id === parentTaskId && t.childTasks
          ? {
            ...t, childTasks: t.childTasks.map((st) =>
              st.id === subtaskId ? { ...st, status: currentStatus } : st
            )
          }
          : t;
      setTasks((prev) => prev.map(rollback));
      setSelectedTask((prev) => prev ? rollback(prev) : prev);
      toast.error("Failed to update subtask");
    }
  }, []);

  // ── Subtask add (optimistic with temp ID) ──
  const handleSubtaskAdd: SubtaskAddFn = useCallback(async (
    parentTaskId: string,
    title: string
  ) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      title,
      status: "todo" as TaskStatus,
      priority: "medium" as TaskPriority,
      type: "subtask" as TaskType,
    };

    const addChild = (t: TaskItem) =>
      t.id === parentTaskId
        ? { ...t, childTasks: [...(t.childTasks || []), optimistic] }
        : t;

    setTasks((prev) => prev.map(addChild));
    setSelectedTask((prev) => prev ? addChild(prev) : prev);

    try {
      const created = await createSubtask(parentTaskId, { title });
      const real = {
        id: created.id,
        title: created.title,
        status: created.status,
        priority: created.priority,
        type: created.type,
      };

      const swap = (t: TaskItem) =>
        t.id === parentTaskId && t.childTasks
          ? { ...t, childTasks: t.childTasks.map((st) => st.id === tempId ? real : st) }
          : t;

      setTasks((prev) => prev.map(swap));
      setSelectedTask((prev) => prev ? swap(prev) : prev);
      toast.success(`Subtask "${title}" created`);
      return real;
    } catch (error) {
      const remove = (t: TaskItem) =>
        t.id === parentTaskId && t.childTasks
          ? { ...t, childTasks: t.childTasks.filter((st) => st.id !== tempId) }
          : t;
      setTasks((prev) => prev.map(remove));
      setSelectedTask((prev) => prev ? remove(prev) : prev);
      toast.error("Failed to create subtask");
      throw error;
    }
  }, []);

  // ── Task field update (optimistic from modal save) ──
  const handleTaskUpdate = useCallback((
    taskId: string,
    fields: Record<string, unknown>
  ) => {
    const merge = (t: TaskItem) =>
      t.id === taskId ? { ...t, ...fields } : t;
    setTasks((prev) => prev.map(merge));
    setSelectedTask((prev) => prev ? merge(prev) : prev);
  }, []);

  // Calculate progress percentage for tasks with subtasks
  const getProgressPercentage = (task: TaskItem) => {
    if (!task.childTasks || task.childTasks.length === 0) return null;
    const completed = task.childTasks.filter((t) => t.status === "done").length;
    return Math.round((completed / task.childTasks.length) * 100);
  };

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No Tasks Found"
        description="There are no tasks in this view. Create a new task to get started."
        className="bg-card/50 backdrop-blur-sm"
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        {tasks.map((task) => {
          const TypeIcon = typeIcons[task.type];
          const progressPercentage = getProgressPercentage(task);

          return (
            <Card
              key={task.id}
              className="cursor-pointer hover:shadow-md hover:border-purple-300 transition-all duration-200"
              onClick={() => handleTaskClick(task)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Left side - Task info */}
                  <div className="flex-1 space-y-3">
                    {/* Header with badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Badge variant="outline" className="capitalize text-xs">
                        {task.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${priorityColors[task.priority]}`}
                      >
                        {task.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusColors[task.status]}`}
                      >
                        {task.status === "progress" ? "In Progress" : task.status === "todo" ? "To Do" : task.status === "review" ? "Review" : "Done"}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-base">{task.title}</h3>

                    {/* Progress bar for parent tasks */}
                    {progressPercentage !== null && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {progressPercentage}%
                        </span>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {task.assignee && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Assigned to:</span>
                          <span className="bg-secondary px-2 py-0.5 rounded">
                            {task.assignee.name || task.assignee.email}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side - Counts */}
                  <div className="flex flex-col items-end gap-2 text-sm">
                    {task._count && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {task._count.childTasks && task._count.childTasks > 0 && (
                          <span className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded">
                            <CheckSquare className="h-3.5 w-3.5 text-purple-600" />
                            <span className="font-medium">{task._count.childTasks}</span>
                          </span>
                        )}
                        {task._count.comments > 0 && (
                          <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                            💬 <span className="font-medium">{task._count.comments}</span>
                          </span>
                        )}
                        {task._count.attachments > 0 && (
                          <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                            📎 <span className="font-medium">{task._count.attachments}</span>
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Click to view details
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectMembers={projectMembers}
          open={modalOpen}
          onOpenChange={handleModalClose}
          onSubtaskToggle={handleSubtaskToggle}
          onSubtaskAdd={handleSubtaskAdd}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </>
  );
}
