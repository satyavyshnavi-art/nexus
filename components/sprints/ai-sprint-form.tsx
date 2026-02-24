"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { aiGenerateTickets, aiConfirmTickets } from "@/server/actions/ai-sprint";
import type { GeneratedTicketsPlan } from "@/server/actions/ai-sprint";
import { SprintPlanReview } from "./sprint-plan-review";
import { toast } from "@/lib/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface AiSprintFormProps {
  sprintId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onStepChange?: (step: "input" | "review") => void;
}

const EXAMPLE_PROMPT = `Build a user authentication system with:
- Email/password login
- OAuth integration (Google, GitHub)
- Password reset flow
- Session management
- Role-based access control`;

export function AiSprintForm({
  sprintId,
  onSuccess,
  onCancel,
  onStepChange,
}: AiSprintFormProps) {
  const [step, setStep] = useState<"input" | "review">("input");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [inputText, setInputText] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedTicketsPlan | null>(null);

  const changeStep = (newStep: "input" | "review") => {
    setStep(newStep);
    onStepChange?.(newStep);
  };

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
      const result = await aiGenerateTickets(sprintId, inputText);

      if (!result.success) {
        toast({
          title: "AI Generation Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      setGeneratedPlan(result.plan);
      changeStep("review");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate tickets",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = async (editedPlan: {
    stories: {
      title: string;
      story_points: number;
      required_role: string;
      labels: string[];
      priority: "low" | "medium" | "high" | "critical";
      tasks: {
        title: string;
        required_role: string;
        labels: string[];
        priority: "low" | "medium" | "high" | "critical";
        assignee_id?: string;
      }[];
    }[];
  }) => {
    setIsConfirming(true);
    try {
      const result = await aiConfirmTickets(sprintId, editedPlan.stories);

      if (!result.success) {
        toast({
          title: "Failed to add tickets",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Tickets added!",
        description: `Created ${result.taskCount} tickets with AI`,
        variant: "success",
      });

      setInputText("");
      setGeneratedPlan(null);
      changeStep("input");
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save tickets",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleBack = () => {
    changeStep("input");
  };

  const handleUseExample = () => {
    setInputText(EXAMPLE_PROMPT);
  };

  if (step === "review" && generatedPlan) {
    return (
      <SprintPlanReview
        plan={generatedPlan}
        onConfirm={handleConfirm}
        onBack={handleBack}
        isConfirming={isConfirming}
        mode="tickets"
        confirmButtonText="Confirm & Add Tickets"
        confirmingText="Adding..."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">
              AI-Powered Sprint Planning
            </p>
            <p className="text-sm text-blue-700">
              Describe your feature or project, and AI will automatically
              generate user stories and tickets for your sprint.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="feature-description">Feature Description</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUseExample}
            disabled={isGenerating}
          >
            Use Example
          </Button>
        </div>
        <Textarea
          id="feature-description"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe the feature you want to build..."
          disabled={isGenerating}
          rows={10}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Be specific about features, requirements, and technical details for
          best results.
        </p>
      </div>

      {isGenerating && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Generating tickets...
              </p>
              <p className="text-sm text-amber-700">
                This may take 10-30 seconds. AI is analyzing your requirements
                and creating structured tickets.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isGenerating}
          >
            Cancel
          </Button>
        )}
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
              Generate Tickets
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
