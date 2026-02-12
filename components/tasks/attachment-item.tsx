"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getAttachmentDownloadUrl,
  deleteAttachment,
} from "@/server/actions/attachments";
import { toast } from "@/lib/hooks/use-toast";
import { format } from "date-fns";
import { Download, Trash2, FileText, Image, FileArchive } from "lucide-react";
import type { User } from "@prisma/client";

interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  uploader: Pick<User, "id" | "name" | "email">;
}

interface AttachmentItemProps {
  attachment: Attachment;
  onDelete?: () => void;
}

export function AttachmentItem({ attachment, onDelete }: AttachmentItemProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const downloadUrl = await getAttachmentDownloadUrl(attachment.id);
      window.open(downloadUrl, "_blank");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAttachment(attachment.id);
      toast({
        title: "Attachment deleted",
        description: "The file has been deleted",
        variant: "success",
      });
      onDelete?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = () => {
    if (attachment.mimeType.startsWith("image/")) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (
      attachment.mimeType.includes("zip") ||
      attachment.mimeType.includes("archive")
    ) {
      return <FileArchive className="h-5 w-5 text-orange-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-shrink-0">{getFileIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.fileName}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(attachment.sizeBytes)}</span>
          <span>•</span>
          <span>
            {attachment.uploader.name || attachment.uploader.email}
          </span>
          <span>•</span>
          <span>{format(new Date(attachment.createdAt), "MMM d, yyyy")}</span>
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
