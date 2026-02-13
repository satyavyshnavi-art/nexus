"use client";

import { useEffect, useState, memo } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
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
}

const columns = [
  { status: "todo" as TaskStatus, title: "To Do" },
  { status: "progress" as TaskStatus, title: "In Progress" },
  { status: "review" as TaskStatus, title: "Review" },
  { status: "done" as TaskStatus, title: "Done" },
];

export function KanbanBoard({ initialTasks, projectMembers = [] }: KanbanBoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || isUpdating) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

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

      // Success feedback
      const statusLabel = newStatus === "progress" ? "In Progress" :
                         newStatus === "todo" ? "To Do" :
                         newStatus === "review" ? "Review" : "Done";
      toast.success(`Ticket moved to ${statusLabel}`);

      // Force refresh to get latest data from server
      router.refresh();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error(error instanceof Error ? error.message : "Failed to move ticket");

      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: oldStatus } : t))
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTaskClick = (task: TaskWithRelations) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <Column
              key={column.status}
              status={column.status}
              title={column.title}
              tasks={tasks.filter((t) => t.status === column.status)}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
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
    </>
  );
}
