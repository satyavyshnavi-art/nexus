import { create } from "zustand";
import { Task, TaskStatus } from "@prisma/client";

interface KanbanStore {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  optimisticMove: (taskId: string, newStatus: TaskStatus) => void;
  revertMove: (taskId: string, oldStatus: TaskStatus) => void;
}

export const useKanbanStore = create<KanbanStore>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  optimisticMove: (taskId, newStatus) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ),
    })),
  revertMove: (taskId, oldStatus) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: oldStatus } : t
      ),
    })),
}));
