"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment } from "@/server/actions/tasks";
import { toast } from "@/lib/hooks/use-toast";
import { Send } from "lucide-react";

interface CommentFormProps {
  taskId: string;
  onSuccess?: () => void;
}

export function CommentForm({ taskId, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({
        title: "Validation Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addComment(taskId, content);
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
        variant: "success",
      });
      setContent("");
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = 1000 - content.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 1000))}
        placeholder="Add a comment..."
        disabled={isSubmitting}
        rows={3}
        className="resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {remainingChars} characters remaining
        </span>
        <Button type="submit" disabled={isSubmitting || !content.trim()} size="sm">
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  );
}
