"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { EditProjectModal } from "./edit-project-modal";

interface EditProjectButtonProps {
  project: {
    id: string;
    name: string;
    description: string | null;
  };
}

export function EditProjectButton({ project }: EditProjectButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        title="Edit project"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <EditProjectModal project={project} open={open} onOpenChange={setOpen} />
    </>
  );
}
