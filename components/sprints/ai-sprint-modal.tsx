"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AiSprintForm } from "./ai-sprint-form";

interface AiSprintModalProps {
  sprintId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiSprintModal({
  sprintId,
  open,
  onOpenChange,
}: AiSprintModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Sprint Planning</DialogTitle>
          <DialogDescription>
            Let AI generate user stories and tasks based on your feature
            description. Powered by Anthropic Claude.
          </DialogDescription>
        </DialogHeader>
        <AiSprintForm
          sprintId={sprintId}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
