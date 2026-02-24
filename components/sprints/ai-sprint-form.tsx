"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { aiGenerateTickets, aiConfirmTickets } from "@/server/actions/ai-sprint";
import type { GeneratedTicketsPlan } from "@/server/actions/ai-sprint";
import { SprintPlanReview } from "./sprint-plan-review";
import { toast } from "@/lib/hooks/use-toast";
import { Sparkles, Loader2, ImagePlus, X } from "lucide-react";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type ImageState = {
  file: File;
  mimeType: string;
  data: string; // base64 without prefix
  preview: string; // object URL
};

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
  const [images, setImages] = useState<ImageState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const changeStep = (newStep: "input" | "review") => {
    setStep(newStep);
    onStepChange?.(newStep);
  };

  const clearImages = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast({ title: "Limit reached", description: `Maximum ${MAX_IMAGES} images allowed`, variant: "destructive" });
      return;
    }

    const toProcess = files.slice(0, remaining);
    if (files.length > remaining) {
      toast({ title: "Some images skipped", description: `Only ${remaining} more image(s) allowed`, variant: "destructive" });
    }

    const newImages: ImageState[] = [];
    for (const file of toProcess) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({ title: "Invalid file type", description: `${file.name} is not a supported image format`, variant: "destructive" });
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast({ title: "File too large", description: `${file.name} exceeds 5MB limit`, variant: "destructive" });
        continue;
      }
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(file);
      });
      newImages.push({
        file,
        mimeType: file.type,
        data: base64,
        preview: URL.createObjectURL(file),
      });
    }
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
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
      const imagePayload = images.length > 0
        ? images.map((i) => ({ mimeType: i.mimeType, data: i.data }))
        : undefined;
      const result = await aiGenerateTickets(sprintId, inputText, imagePayload);

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
    sprint_name: string;
    duration_days: number;
    tasks: {
      title: string;
      category: string;
      required_role: string;
      labels: string[];
      priority: "low" | "medium" | "high" | "critical";
      story_points: number;
      assignee_id?: string;
      subtasks: {
        title: string;
        required_role: string;
        priority: "low" | "medium" | "high" | "critical";
        assignee_id?: string;
      }[];
    }[];
  }) => {
    setIsConfirming(true);
    try {
      const confirmedTasks = editedPlan.tasks.map((t) => ({
        title: t.title,
        category: t.category,
        required_role: t.required_role,
        labels: t.labels,
        priority: t.priority,
        story_points: t.story_points,
        assignee_id: t.assignee_id,
        subtasks: t.subtasks.map((s) => ({
          title: s.title,
          required_role: s.required_role,
          priority: s.priority,
          assignee_id: s.assignee_id,
        })),
      }));
      const result = await aiConfirmTickets(sprintId, confirmedTasks);

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
      clearImages();
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Reference Images (optional)</Label>
          <span className="text-xs text-muted-foreground">{images.length}/{MAX_IMAGES}</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={handleImageSelect}
          disabled={isGenerating}
        />
        {images.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative group w-20 h-20 rounded-md overflow-hidden border">
                <img src={img.preview} alt={img.file.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {images.length < MAX_IMAGES && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            Add Images
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Attach wireframes, screenshots, or diagrams for AI to analyze. Max 3 images, 5MB each.
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
