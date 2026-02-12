"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SprintModal } from "./sprint-modal";
import { Plus } from "lucide-react";

interface CreateSprintButtonProps {
  projectId: string;
}

export function CreateSprintButton({ projectId }: CreateSprintButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Sprint
      </Button>
      <SprintModal projectId={projectId} open={open} onOpenChange={setOpen} />
    </>
  );
}
