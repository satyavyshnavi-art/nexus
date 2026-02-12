"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectForm } from "./project-form";

interface Vertical {
  id: string;
  name: string;
}

interface ProjectModalProps {
  verticals: Vertical[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectModal({
  verticals,
  open,
  onOpenChange,
}: ProjectModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project within a vertical.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm
          verticals={verticals}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
