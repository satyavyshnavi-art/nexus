"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VerticalForm } from "./vertical-form";

interface VerticalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VerticalModal({ open, onOpenChange }: VerticalModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Vertical</DialogTitle>
          <DialogDescription>
            Create a new vertical to organize projects and teams.
          </DialogDescription>
        </DialogHeader>
        <VerticalForm
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
