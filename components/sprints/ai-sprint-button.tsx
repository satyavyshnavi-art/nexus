"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AiSprintModal } from "./ai-sprint-modal";
import { Sparkles } from "lucide-react";

interface AiSprintButtonProps {
  sprintId: string;
  stories: { id: string; title: string }[];
}

export function AiSprintButton({ sprintId, stories }: AiSprintButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        <Sparkles className="h-4 w-4 mr-2" />
        AI Generate Tickets
      </Button>
      <AiSprintModal sprintId={sprintId} stories={stories} open={open} onOpenChange={setOpen} />
    </>
  );
}
