"use client";

import { useState, useRef } from "react";
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
  const [images, setImages] = useState<ImageState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const result = await aiGenerateSprintPlan(projectId, inputText, imagePayload);

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
      clearImages();
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
      clearImages();
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
                    AI will generate Features with Tasks and Subtasks, classify
                    by role (UI, Backend, QA, etc.), suggest assignees based on
                    team designations, and show role distribution for balanced sprints.
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
