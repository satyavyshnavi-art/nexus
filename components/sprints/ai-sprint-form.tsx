"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aiGenerateTicketsForStory, aiConfirmTicketsForStory } from "@/server/actions/ai-sprint";
import type { GeneratedFlatTicketsPlan } from "@/server/actions/ai-sprint";
import { SprintPlanReview } from "./sprint-plan-review";
import { toast } from "@/lib/hooks/use-toast";
import { Sparkles, Loader2, ImagePlus, X, BookOpen } from "lucide-react";

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
  stories: { id: string; title: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
  onStepChange?: (step: "input" | "review") => void;
}

const EXAMPLE_PROMPT = `Implement the following:
- API endpoint for CRUD operations
- Frontend form with validation
- Unit tests for the service layer
- Database migration for the new table`;

export function AiSprintForm({
  sprintId,
  stories,
  onSuccess,
  onCancel,
  onStepChange,
}: AiSprintFormProps) {
  const [step, setStep] = useState<"input" | "review">("input");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [inputText, setInputText] = useState("");
  const [selectedStoryId, setSelectedStoryId] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedFlatTicketsPlan | null>(null);
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
    if (!selectedStoryId) {
      toast({
        title: "Validation Error",
        description: "Please select a story",
        variant: "destructive",
      });
      return;
    }

    if (!inputText.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a description",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const imagePayload = images.length > 0
        ? images.map((i) => ({ mimeType: i.mimeType, data: i.data }))
        : undefined;
      const result = await aiGenerateTicketsForStory(sprintId, selectedStoryId, inputText, imagePayload);

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

  const handleConfirmFlatTickets = async (tickets: {
    title: string;
    required_role: string;
    priority: "low" | "medium" | "high" | "critical";
    labels: string[];
    assignee_id?: string;
  }[]) => {
    setIsConfirming(true);
    try {
      const result = await aiConfirmTicketsForStory(sprintId, selectedStoryId, tickets);

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
        description: `Created ${result.taskCount} tickets under the story`,
        variant: "success",
      });

      setInputText("");
      setSelectedStoryId("");
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
    const selectedStory = stories.find((s) => s.id === selectedStoryId);
    return (
      <div className="space-y-3">
        {selectedStory && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border">
            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">Story:</span>
            <span className="text-sm font-medium truncate">{selectedStory.title}</span>
          </div>
        )}
        <SprintPlanReview
          plan={generatedPlan}
          onConfirmFlatTickets={handleConfirmFlatTickets}
          onBack={handleBack}
          isConfirming={isConfirming}
          mode="flat-tickets"
          confirmButtonText="Confirm & Add Tickets"
          confirmingText="Adding..."
        />
      </div>
    );
  }

  const hasStories = stories.length > 0;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              AI-Powered Ticket Generation
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Select a story, describe what you need, and AI will generate
              actionable tickets under that story.
            </p>
          </div>
        </div>
      </div>

      {/* Story Selector */}
      <div className="space-y-2">
        <Label htmlFor="story-select">Select Story</Label>
        {hasStories ? (
          <Select value={selectedStoryId} onValueChange={setSelectedStoryId} disabled={isGenerating}>
            <SelectTrigger id="story-select">
              <SelectValue placeholder="Choose a story..." />
            </SelectTrigger>
            <SelectContent>
              {stories.map((story) => (
                <SelectItem key={story.id} value={story.id}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{story.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="border border-dashed rounded-lg p-4 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No stories in this sprint</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a story first, then use AI to generate tickets under it.
            </p>
          </div>
        )}
      </div>

      {/* Only show the rest if stories exist */}
      {hasStories && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="feature-description">Description</Label>
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
              placeholder="Describe what tickets should be created for this story..."
              disabled={isGenerating}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about requirements and technical details for best results.
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
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Generating tickets...
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    This may take 10-30 seconds. AI is analyzing your requirements
                    and creating tickets for the selected story.
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
              disabled={isGenerating || !inputText.trim() || !selectedStoryId}
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
        </>
      )}

      {/* Cancel button when no stories */}
      {!hasStories && onCancel && (
        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
