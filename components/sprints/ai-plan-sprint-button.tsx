"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AiPlanSprintModal } from "./ai-plan-sprint-modal";
import { Sparkles } from "lucide-react";

interface AiPlanSprintButtonProps {
  projectId: string;
}

export function AiPlanSprintButton({ projectId }: AiPlanSprintButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4 mr-2" />
        AI Plan Sprint
      </Button>
      <AiPlanSprintModal
        projectId={projectId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
