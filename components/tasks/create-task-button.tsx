"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskModal } from "./task-modal";
import { Plus } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface CreateTaskButtonProps {
  sprintId: string;
  projectMembers: User[];
}

export function CreateTaskButton({
  sprintId,
  projectMembers,
}: CreateTaskButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Task
      </Button>
      <TaskModal
        sprintId={sprintId}
        projectMembers={projectMembers}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
