"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProjectModal } from "./project-modal";
import { Plus } from "lucide-react";

interface Vertical {
  id: string;
  name: string;
}

interface CreateProjectButtonProps {
  verticals: Vertical[];
}

export function CreateProjectButton({ verticals }: CreateProjectButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Project
      </Button>
      <ProjectModal verticals={verticals} open={open} onOpenChange={setOpen} />
    </>
  );
}
