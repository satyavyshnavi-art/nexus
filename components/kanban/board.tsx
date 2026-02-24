"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from "@dnd-kit/core";
import { Task, TaskStatus, User } from "@prisma/client";
import { Column } from "./column";
import { TaskCard } from "./task-card";
import { updateTaskStatus } from "@/server/actions/tasks";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRoleColor, getRoleDotColor } from "@/lib/utils/role-colors";
import { LayoutGrid, Users, X } from "lucide-react";

const TaskDetailModal = dynamic(
  () => import("@/components/tasks/task-detail-modal").then((mod) => mod.TaskDetailModal),
  { ssr: false }
);

type TaskWithRelations = Omit<Task, 'githubIssueId'> & {
  githubIssueId: string | null;
  assignee: Pick<User, "id" | "name" | "email"> | null;
  feature?: { id: string; title: string } | null;
  childTasks?: Pick<Task, "id" | "title" | "status" | "priority" | "type">[];
  _count?: {
    comments: number;
    attachments: number;
    childTasks?: number;
  };
};

interface KanbanBoardProps {
  initialTasks: TaskWithRelations[];
  projectMembers?: Pick<User, "id" | "name" | "email">[];
  projectLinked?: boolean;
  userHasGitHub?: boolean;
}

const VALID_STATUSES: TaskStatus[] = ["todo", "progress", "review", "done"];

const columns = [
  { status: "todo" as TaskStatus, title: "To Do" },
  { status: "progress" as TaskStatus, title: "In Progress" },
  { status: "review" as TaskStatus, title: "Review" },
  { status: "done" as TaskStatus, title: "Done" },
];

const statusLabels: Record<TaskStatus, string> = {
  todo: "To Do",
  progress: "In Progress",
  review: "Review",
  done: "Done",
};

type ViewMode = "status" | "role";

export function KanbanBoard({ initialTasks, projectMembers = [], projectLinked = false, userHasGitHub = false }: KanbanBoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("status");
  const [roleFilters, setRoleFilters] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Get unique roles from tasks
  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    tasks.forEach((t) => {
      if (t.requiredRole) roles.add(t.requiredRole);
    });
    return Array.from(roles).sort();
  }, [tasks]);

  // Filtered tasks based on role filter
  const filteredTasks = useMemo(() => {
    if (roleFilters.size === 0) return tasks;
    return tasks.filter(
      (t) => t.requiredRole && roleFilters.has(t.requiredRole)
    );
  }, [tasks, roleFilters]);

  const toggleRoleFilter = (role: string) => {
    setRoleFilters((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const clearFilters = () => setRoleFilters(new Set());

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
    setIsDragging(true);
    document.body.style.cursor = "grabbing";
  }, [tasks]);

  function resolveDropStatus(overId: string): TaskStatus | null {
    if (VALID_STATUSES.includes(overId as TaskStatus)) return overId as TaskStatus;
    const targetTask = tasks.find((t) => t.id === overId);
    return targetTask ? targetTask.status : null;
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setIsDragging(false);
    document.body.style.cursor = "";

    if (!over || isUpdating) return;

    const taskId = active.id as string;
    const newStatus = resolveDropStatus(over.id as string);
    if (!newStatus) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const oldStatus = task.status;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    // Celebrate when a task is moved to "done"
    if (newStatus === "done") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7C3AED', '#8B5CF6', '#A78BFA', '#FFD93D', '#6BCB77', '#3B82F6'],
      });
    }

    setIsUpdating(true);
    try {
      await updateTaskStatus(taskId, newStatus);
      const statusLabel = statusLabels[newStatus];
      toast.success(`Ticket moved to ${statusLabel}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error(error instanceof Error ? error.message : "Failed to move ticket");
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: oldStatus } : t))
      );
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, tasks, router]);

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    setIsDragging(false);
    document.body.style.cursor = "";
  }, []);

  const handleTaskClick = useCallback((task: TaskWithRelations) => {
    if (isDragging) return;
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  }, [isDragging]);

  return (
    <>
      {/* Toolbar: View Toggle + Role Filters */}
      {uniqueRoles.length > 0 && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "status" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-8 text-xs"
              onClick={() => setViewMode("status")}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1" />
              Status
            </Button>
            <Button
              variant={viewMode === "role" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-8 text-xs"
              onClick={() => setViewMode("role")}
            >
              <Users className="h-3.5 w-3.5 mr-1" />
              Roles
            </Button>
          </div>

          {/* Role filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {uniqueRoles.map((role) => {
              const colors = getRoleColor(role);
              const isActive = roleFilters.has(role);
              return (
                <button
                  key={role}
                  onClick={() => toggleRoleFilter(role)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all ${
                    isActive
                      ? `${colors.bg} ${colors.text} ${colors.border} ring-1 ring-offset-1`
                      : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                  }`}
                >
                  <div className={`h-2 w-2 rounded-full ${getRoleDotColor(role)}`} />
                  {role}
                </button>
              );
            })}
            {roleFilters.size > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {viewMode === "status" ? (
        /* --- Status View (default Kanban) --- */
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className={`flex gap-4 overflow-x-auto pb-4 ${isDragging ? "is-dragging" : ""}`}>
            {columns.map((column) => {
              const columnTasks = filteredTasks.filter((t) => t.status === column.status);
              return (
                <Column
                  key={column.status}
                  status={column.status}
                  title={column.title}
                  tasks={columnTasks}
                  onTaskClick={handleTaskClick}
                  projectLinked={projectLinked}
                  userHasGitHub={userHasGitHub}
                  isDragging={isDragging}
                />
              );
            })}
          </div>

          <DragOverlay
            dropAnimation={{
              duration: 200,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}
          >
            {activeTask ? (
              <div className="rotate-[2deg] scale-105 opacity-90 pointer-events-none">
                <TaskCard task={activeTask} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* --- Role View (grouped by role, no drag) --- */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {uniqueRoles
            .filter((role) => roleFilters.size === 0 || roleFilters.has(role))
            .map((role) => {
              const roleTasks = filteredTasks.filter(
                (t) => t.requiredRole === role
              );
              const colors = getRoleColor(role);

              return (
                <div key={role} className="flex-1 min-w-[300px] max-w-[400px]">
                  <div className="rounded-lg border-2 border-transparent h-full flex flex-col bg-muted/30 shadow-sm">
                    {/* Role Column Header */}
                    <div className="px-4 py-3 border-b rounded-t-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${getRoleDotColor(role)}`} />
                          <h3 className="font-semibold text-sm">{role}</h3>
                        </div>
                        <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                          {roleTasks.length}
                        </Badge>
                      </div>
                    </div>

                    {/* Tasks sorted by status */}
                    <div className="flex-1 p-3 min-h-[300px]">
                      {roleTasks.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                          No tasks
                        </div>
                      ) : (
                        roleTasks
                          .sort((a, b) => {
                            const order = { todo: 0, progress: 1, review: 2, done: 3 };
                            return order[a.status] - order[b.status];
                          })
                          .map((task) => (
                            <div key={task.id} className="mb-2">
                              <div
                                onClick={() => handleTaskClick(task)}
                                className="p-3 rounded-lg border bg-background hover:shadow-md transition-all cursor-pointer"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="text-sm font-medium line-clamp-2">
                                    {task.title}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`shrink-0 text-[10px] ${
                                      task.status === "done"
                                        ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                        : task.status === "progress"
                                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                        : task.status === "review"
                                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                        : "bg-slate-500/10 text-slate-700 dark:text-slate-400"
                                    }`}
                                  >
                                    {statusLabels[task.status]}
                                  </Badge>
                                </div>
                                {task.assignee && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-[10px] font-medium text-primary">
                                        {(task.assignee.name?.charAt(0) || task.assignee.email.charAt(0)).toUpperCase()}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {task.assignee.name || task.assignee.email}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Unassigned role column */}
          {(() => {
            const unassignedTasks = filteredTasks.filter(
              (t) => !t.requiredRole
            );
            if (unassignedTasks.length === 0 || roleFilters.size > 0) return null;
            return (
              <div className="flex-1 min-w-[300px] max-w-[400px]">
                <div className="rounded-lg border-2 border-transparent h-full flex flex-col bg-muted/30 shadow-sm">
                  <div className="px-4 py-3 border-b rounded-t-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-gray-500" />
                        <h3 className="font-semibold text-sm">Unassigned Role</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                        {unassignedTasks.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 p-3 min-h-[300px]">
                    {unassignedTasks.map((task) => (
                      <div key={task.id} className="mb-2">
                        <div
                          onClick={() => handleTaskClick(task)}
                          className="p-3 rounded-lg border bg-background hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium line-clamp-2">
                              {task.title}
                            </span>
                            <Badge
                              variant="outline"
                              className={`shrink-0 text-[10px] ${
                                task.status === "done"
                                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                  : task.status === "progress"
                                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                  : task.status === "review"
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                  : "bg-slate-500/10 text-slate-700 dark:text-slate-400"
                              }`}
                            >
                              {statusLabels[task.status]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          key={selectedTask.id}
          task={selectedTask}
          projectMembers={projectMembers}
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
        />
      )}

      {/* Global styles for drag state */}
      <style jsx global>{`
        .is-dragging .task-card {
          pointer-events: none;
        }
        .is-dragging .task-card:hover {
          transform: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </>
  );
}
