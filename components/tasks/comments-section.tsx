"use client";

import { useEffect, useState } from "react";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";
import { getTaskComments } from "@/server/actions/tasks";
import { MessageSquare } from "lucide-react";
import type { User } from "@prisma/client";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: Pick<User, "id" | "name" | "email">;
}

interface CommentsSectionProps {
  taskId: string;
}

export function CommentsSection({ taskId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadComments = async () => {
    try {
      const data = await getTaskComments(taskId);
      setComments(data);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const handleCommentAdded = () => {
    loadComments();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comments</h3>
        <span className="text-sm text-muted-foreground">
          ({comments.length})
        </span>
      </div>

      <CommentForm taskId={taskId} onSuccess={handleCommentAdded} />

      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
