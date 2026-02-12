"use client";

import { useEffect, useState } from "react";
import { AttachmentItem } from "./attachment-item";
import { FileUpload } from "./file-upload";
import { getTaskAttachments } from "@/server/actions/attachments";
import { Paperclip } from "lucide-react";
import type { User } from "@prisma/client";

interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  uploader: Pick<User, "id" | "name" | "email">;
}

interface AttachmentsListProps {
  taskId: string;
}

export function AttachmentsList({ taskId }: AttachmentsListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAttachments = async () => {
    try {
      const data = await getTaskAttachments(taskId);
      setAttachments(data);
    } catch (error) {
      console.error("Failed to load attachments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [taskId]);

  const handleAttachmentChanged = () => {
    loadAttachments();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Paperclip className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Attachments</h3>
        <span className="text-sm text-muted-foreground">
          ({attachments.length})
        </span>
      </div>

      <FileUpload taskId={taskId} onSuccess={handleAttachmentChanged} />

      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          Loading attachments...
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg">
          No attachments yet
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              onDelete={handleAttachmentChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}
