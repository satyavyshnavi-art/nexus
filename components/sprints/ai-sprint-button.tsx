"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AiSprintModal } from "./ai-sprint-modal";
import { Sparkles } from "lucide-react";

interface AiSprintButtonProps {
  sprintId: string;
}

export function AiSprintButton({ sprintId }: AiSprintButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        <Sparkles className="h-4 w-4 mr-2" />
        AI Generate Tasks
      </Button>
      <AiSprintModal sprintId={sprintId} open={open} onOpenChange={setOpen} />
    </>
  );
}
