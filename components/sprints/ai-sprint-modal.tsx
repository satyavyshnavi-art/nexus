"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AiSprintForm } from "./ai-sprint-form";

interface AiSprintModalProps {
  sprintId: string;
  stories: { id: string; title: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiSprintModal({
  sprintId,
  stories,
  open,
  onOpenChange,
}: AiSprintModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "review">("input");

  const handleSuccess = () => {
    onOpenChange(false);
    setStep("input");
    router.refresh();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep("input");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "review" ? "Review Generated Tickets" : "AI Generate Tickets"}
          </DialogTitle>
          <DialogDescription>
            {step === "review"
              ? "Review and edit the AI-generated tickets before adding them to your sprint."
              : "Select a story and describe what you need. AI will generate actionable tickets under that story."}
          </DialogDescription>
        </DialogHeader>
        <AiSprintForm
          sprintId={sprintId}
          stories={stories}
          onSuccess={handleSuccess}
          onCancel={() => handleOpenChange(false)}
          onStepChange={setStep}
        />
      </DialogContent>
    </Dialog>
  );
}
