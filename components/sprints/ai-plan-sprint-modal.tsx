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
import { aiPlanSprint } from "@/server/actions/ai-sprint";
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

export function AiPlanSprintModal({
  projectId,
  open,
  onOpenChange,
}: AiPlanSprintModalProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputText, setInputText] = useState("");

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
      const result = await aiPlanSprint(projectId, inputText);

      toast({
        title: "Sprint planned!",
        description: `Created "${result.sprint.name}" with ${result.taskCount} tickets`,
        variant: "success",
      });

      setInputText("");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to plan sprint",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Sprint Planning</DialogTitle>
          <DialogDescription>
            Describe a feature and AI will create a complete sprint with name,
            timeline, user stories, and tasks — all in one step.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 dark:bg-purple-950/30 dark:border-purple-800">
            <div className="flex gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                  All-in-One Sprint Creation
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  AI will generate a sprint name, suggest a duration, and create
                  all user stories with sub-tasks. The sprint will appear in your
                  Future tab ready to activate.
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
                    Planning sprint...
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    AI is analyzing your requirements, naming the sprint, and
                    creating structured tickets. This may take 10-30 seconds.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
                  Planning...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Plan Sprint with AI
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
