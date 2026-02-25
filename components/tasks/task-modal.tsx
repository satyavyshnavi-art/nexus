"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "./task-form";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface TaskModalProps {
  sprintId: string;
  projectMembers: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectLinked?: boolean;
}

export function TaskModal({
  sprintId,
  projectMembers,
  open,
  onOpenChange,
  projectLinked = false,
}: TaskModalProps) {
  const router = useRouter();

  const handleSuccess = () => {
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Add a new ticket to the active sprint. If you create a bug, AI will
            automatically classify its priority.
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          sprintId={sprintId}
          projectMembers={projectMembers}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
          projectLinked={projectLinked}
        />
      </DialogContent>
    </Dialog>
  );
}
