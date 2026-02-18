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

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface ProjectModalProps {
  verticals: Vertical[];
  users: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectModal({
  verticals,
  users,
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
          users={users}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
