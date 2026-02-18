"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProjectModal } from "./project-modal";
import { Plus } from "lucide-react";

interface Vertical {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface CreateProjectButtonProps {
  verticals: Vertical[];
  users: User[];
}

export function CreateProjectButton({ verticals, users }: CreateProjectButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Project
      </Button>
      <ProjectModal verticals={verticals} users={users} open={open} onOpenChange={setOpen} />
    </>
  );
}
