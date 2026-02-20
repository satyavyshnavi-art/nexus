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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  aiGenerateSprintPlan,
  aiConfirmSprintPlan,
  type GeneratedSprintPlan,
  type ConfirmedPlan,
} from "@/server/actions/ai-sprint";
import { SprintPlanReview } from "./sprint-plan-review";
import { toast } from "@/lib/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface AiPlanSprintModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXAMPLE_PROMPT = `Build a user authentication system with:
- Email/password login and registration
- OAuth integration (Google, GitHub)
- Password reset flow with email verification
- Session management with JWT tokens
- Role-based access control (admin, member)
- Profile management page`;

type Step = "input" | "review";

export function AiPlanSprintModal({
  projectId,
  open,
  onOpenChange,
}: AiPlanSprintModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [inputText, setInputText] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedSprintPlan | null>(null);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a feature description",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await aiGenerateSprintPlan(projectId, inputText);

      if (!result.success) {
        toast({
          title: "AI Planning Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      setGeneratedPlan(result.plan);
      setStep("review");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate sprint plan",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = async (editedPlan: ConfirmedPlan) => {
    setIsConfirming(true);
    try {
      const result = await aiConfirmSprintPlan(projectId, editedPlan);

      if (!result.success) {
        toast({
          title: "Failed to Create Sprint",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sprint created!",
        description: `Created "${result.sprintName}" with ${result.taskCount} tickets`,
        variant: "success",
      });

      // Reset and close
      setInputText("");
      setStep("input");
      setGeneratedPlan(null);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create sprint",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleBack = () => {
    setStep("input");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Reset state on close
      setStep("input");
      setGeneratedPlan(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "input" ? "AI Sprint Planning" : "Review Sprint Plan"}
          </DialogTitle>
          <DialogDescription>
            {step === "input"
              ? "Describe a feature and AI will create a complete sprint with role-based task assignments."
              : "Review the AI-generated plan, adjust assignees, then confirm to create the sprint."}
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 dark:bg-purple-950/30 dark:border-purple-800">
              <div className="flex gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                    Intelligent Role-Based Planning
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    AI will classify tasks by role (UI, Backend, QA, etc.),
                    suggest assignees based on team designations, and show a
                    role distribution summary for balanced sprints.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-plan-description">Feature Description</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputText(EXAMPLE_PROMPT)}
                  disabled={isGenerating}
                >
                  Use Example
                </Button>
              </div>
              <Textarea
                id="ai-plan-description"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Describe the feature you want to build..."
                disabled={isGenerating}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about features, requirements, and technical details
                for best results.
              </p>
            </div>

            {isGenerating && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-950/30 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      Analyzing & planning...
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      AI is classifying tasks by role and matching team
                      capabilities. This may take 10-30 seconds.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !inputText.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : generatedPlan ? (
          <SprintPlanReview
            plan={generatedPlan}
            onConfirm={handleConfirm}
            onBack={handleBack}
            isConfirming={isConfirming}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
