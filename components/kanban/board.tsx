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

const TaskDetailModal = dynamic(
  () => import("@/components/tasks/task-detail-modal").then((mod) => mod.TaskDetailModal),
  { ssr: false }
);

type TaskWithRelations = Omit<Task, 'githubIssueId'> & {
  githubIssueId: string | null;
  assignee: Pick<User, "id" | "name" | "email"> | null;
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

export function KanbanBoard({ initialTasks, projectMembers = [], projectLinked = false, userHasGitHub = false }: KanbanBoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
      const statusLabel = newStatus === "progress" ? "In Progress" :
        newStatus === "todo" ? "To Do" :
          newStatus === "review" ? "Review" : "Done";
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
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className={`flex gap-4 overflow-x-auto pb-4 ${isDragging ? "is-dragging" : ""}`}>
          {columns.map((column) => {
            const columnTasks = tasks.filter((t) => t.status === column.status);
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

        {/* Drag overlay — the floating ghost card */}
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

      {selectedTask && (
        <TaskDetailModal
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
