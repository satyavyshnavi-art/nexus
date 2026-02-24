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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiSprintModal({
  sprintId,
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
            {step === "review" ? "Review Generated Tickets" : "AI Sprint Planning"}
          </DialogTitle>
          <DialogDescription>
            {step === "review"
              ? "Review and edit the AI-generated stories and tasks before adding them to your sprint."
              : "Let AI generate user stories and tasks based on your feature description. Powered by Google Gemini."}
          </DialogDescription>
        </DialogHeader>
        <AiSprintForm
          sprintId={sprintId}
          onSuccess={handleSuccess}
          onCancel={() => handleOpenChange(false)}
          onStepChange={setStep}
        />
      </DialogContent>
    </Dialog>
  );
}
