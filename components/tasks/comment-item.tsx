import { format } from "date-fns";
import type { User } from "@prisma/client";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: Pick<User, "id" | "name" | "email">;
}

interface CommentItemProps {
  comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-secondary/50">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          {(comment.user.name?.[0] || comment.user.email[0]).toUpperCase()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {comment.user.name || comment.user.email}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}
