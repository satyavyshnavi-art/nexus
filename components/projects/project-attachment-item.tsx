"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getProjectAttachmentDownloadUrl,
  getProjectAttachmentViewUrl,
  deleteProjectAttachment,
} from "@/server/actions/project-attachments";
import { toast } from "sonner";
import { format } from "date-fns";
import { Download, Trash2, FileText, Image, FileSpreadsheet, File, Eye } from "lucide-react";
import type { User } from "@prisma/client";

interface ProjectAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  uploader: Pick<User, "id" | "name" | "email">;
}

interface ProjectAttachmentItemProps {
  attachment: ProjectAttachment;
  canDelete: boolean;
  onDelete?: () => void;
}

export function ProjectAttachmentItem({
  attachment,
  canDelete,
  onDelete,
}: ProjectAttachmentItemProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleView = async () => {
    setIsViewing(true);
    try {
      const viewUrl = await getProjectAttachmentViewUrl(attachment.id);
      window.open(viewUrl, "_blank");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to open file"
      );
    } finally {
      setIsViewing(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const downloadUrl = await getProjectAttachmentDownloadUrl(attachment.id);
      window.open(downloadUrl, "_blank");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to download file"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProjectAttachment(attachment.id);
      toast.success("File deleted");
      onDelete?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete file"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = () => {
    if (attachment.mimeType.startsWith("image/")) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    if (attachment.mimeType === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (
      attachment.mimeType.includes("spreadsheet") ||
      attachment.mimeType === "text/csv"
    ) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    }
    if (
      attachment.mimeType.includes("word") ||
      attachment.mimeType === "application/msword"
    ) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
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
          <span>&middot;</span>
          <span>
            {attachment.uploader.name || attachment.uploader.email}
          </span>
          <span>&middot;</span>
          <span>{format(new Date(attachment.createdAt), "MMM d, yyyy")}</span>
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleView}
          disabled={isViewing}
          title="View"
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
          title="Download"
        >
          <Download className="h-4 w-4" />
        </Button>
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isDeleting}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{attachment.fileName}&quot;. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
