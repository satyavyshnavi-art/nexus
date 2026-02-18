"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    createComment,
    getTaskComments,
    deleteComment,
} from "@/server/actions/comments";
import { formatDistanceToNow } from "date-fns";
import { Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Comment {
    id: string;
    content: string;
    createdAt: Date;
    userId: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        avatar: string | null;
    };
}

interface CommentSectionProps {
    taskId: string;
}

export function CommentSection({ taskId }: CommentSectionProps) {
    const { data: session } = useSession();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [taskId]);

    const loadComments = async () => {
        try {
            const data = await getTaskComments(taskId);
            setComments(data);
        } catch (error) {
            console.error("Failed to load comments:", error);
            toast.error("Failed to load comments");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const comment = await createComment(taskId, newComment);
            setComments((prev) => [...prev, comment]);
            setNewComment("");
            toast.success("Comment added");
        } catch (error) {
            console.error("Failed to add comment:", error);
            toast.error("Failed to add comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            await deleteComment(commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            toast.success("Comment deleted");
        } catch (error) {
            console.error("Failed to delete comment:", error);
            toast.error("Failed to delete comment");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
                <MessageSquare className="h-5 w-5" />
                <h3>Comments ({comments.length})</h3>
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-muted-foreground text-sm italic">
                            No comments yet. Be the first to start the discussion!
                        </p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3 group">
                                <Avatar
                                    className="h-8 w-8"
                                    name={comment.user.name || "User"}
                                >
                                    <AvatarImage
                                        src={comment.user.avatar || undefined}
                                        alt={comment.user.name || "User"}
                                    />
                                    <AvatarFallback>
                                        {comment.user.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-foreground">
                                                {comment.user.name || comment.user.email}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(comment.createdAt), {
                                                    addSuffix: true,
                                                })}
                                            </span>
                                        </div>
                                        {session?.user &&
                                            (session.user.id === comment.userId ||
                                                session.user.role === "admin") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDelete(comment.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                    </div>
                                    <div className="text-sm text-foreground/90 bg-muted/50 p-3 rounded-md">
                                        <p className="whitespace-pre-wrap">{comment.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="flex gap-3">
                <Avatar
                    className="h-8 w-8"
                    name={session?.user?.name || "Me"}
                >
                    <AvatarImage
                        src={session?.user?.image || undefined}
                        alt={session?.user?.name || "Me"}
                    />
                    <AvatarFallback>
                        {session?.user?.name?.charAt(0) || "Me"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[80px]"
                    />
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !newComment.trim()}
                        >
                            {isSubmitting ? "Posting..." : "Post Comment"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
