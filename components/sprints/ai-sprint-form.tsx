"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { aiGenerateSprintTasks } from "@/server/actions/ai-sprint";
import { toast } from "@/lib/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface AiSprintFormProps {
  sprintId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
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
}: AiSprintFormProps) {
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
      const result = await aiGenerateSprintTasks(sprintId, inputText);

      toast({
        title: "Tasks generated!",
        description: `Created ${result.taskCount} tasks with AI`,
        variant: "success",
      });

      setInputText("");
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate tasks",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseExample = () => {
    setInputText(EXAMPLE_PROMPT);
  };

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
              generate user stories and tasks for your sprint.
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
                Generating tasks...
              </p>
              <p className="text-sm text-amber-700">
                This may take 10-30 seconds. AI is analyzing your requirements
                and creating structured tasks.
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
              Generate Tasks
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
