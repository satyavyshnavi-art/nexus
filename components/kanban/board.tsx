"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { updateTaskStatus } from "@/server/actions/tasks";
import { toast } from "sonner";

type TaskWithRelations = Task & {
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
          {columns.map((column) => (
            <Column
              key={column.status}
              status={column.status}
              title={column.title}
              tasks={tasks.filter((t) => t.status === column.status)}
              onTaskClick={handleTaskClick}
              projectLinked={projectLinked}
              userHasGitHub={userHasGitHub}
              isDragging={isDragging}
            />
          ))}
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
