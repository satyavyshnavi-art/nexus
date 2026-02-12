"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SprintForm } from "./sprint-form";

interface SprintModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SprintModal({ projectId, open, onOpenChange }: SprintModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    // Refresh the page to show the new sprint
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Sprint</DialogTitle>
          <DialogDescription>
            Create a new sprint for this project. You can activate it later.
          </DialogDescription>
        </DialogHeader>
        <SprintForm
          projectId={projectId}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
