"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  deleteAttachment,
  renameAttachment,
} from "@/server/actions/attachments";
import { toast } from "@/lib/hooks/use-toast";
import { format } from "date-fns";
import { Download, Trash2, FileText, Image as ImageIcon, FileArchive, Pencil, Check, X, Eye, ZoomIn, ZoomOut } from "lucide-react";
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
  onRename?: () => void;
}

export function AttachmentItem({ attachment, onDelete, onRename }: AttachmentItemProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isSubmittingRename, setIsSubmittingRename] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const isImage = attachment.mimeType.startsWith("image/");
  const imageUrl = isImage ? `/api/attachments/${attachment.id}/image` : null;
  const downloadUrl = `/api/attachments/${attachment.id}/download`;

  // Focus the rename input when editing starts
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      const dotIndex = renameValue.lastIndexOf(".");
      if (dotIndex > 0) {
        renameInputRef.current.setSelectionRange(0, dotIndex);
      } else {
        renameInputRef.current.select();
      }
    }
  }, [isRenaming]);

  // Close viewer on Escape
  useEffect(() => {
    if (!showViewer) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowViewer(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showViewer]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    if (showViewer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showViewer]);

  const startRename = () => {
    setRenameValue(attachment.fileName);
    setIsRenaming(true);
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setRenameValue("");
  };

  const handleRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === attachment.fileName) {
      cancelRename();
      return;
    }

    setIsSubmittingRename(true);
    try {
      await renameAttachment(attachment.id, trimmed);
      toast({
        title: "Renamed",
        description: `File renamed to ${trimmed}`,
        variant: "success",
      });
      setIsRenaming(false);
      onRename?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to rename file",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRename(false);
    }
  };

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
    if (isImage) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
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
    <>
      <div className="rounded-lg border bg-card hover:bg-accent/50 transition-colors overflow-hidden">
        {/* Image thumbnail — clickable to open viewer */}
        {isImage && imageUrl && !imageError && (
          <div
            className="w-full bg-muted/30 cursor-pointer relative group"
            onClick={() => setShowViewer(true)}
          >
            {!imageLoaded && (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                Loading image...
              </div>
            )}
            <img
              src={imageUrl}
              alt={attachment.fileName}
              className={`w-full max-h-64 object-contain ${imageLoaded ? "" : "hidden"}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {/* Hover overlay */}
            {imageLoaded && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-2">
                  <ZoomIn className="h-5 w-5 text-white" />
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-3 p-3">
          <div className="flex-shrink-0">{getFileIcon()}</div>
          <div className="flex-1 min-w-0">
            {isRenaming ? (
              <div className="flex items-center gap-1">
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") cancelRename();
                  }}
                  disabled={isSubmittingRename}
                  className="text-sm font-medium w-full bg-background border rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRename}
                  disabled={isSubmittingRename}
                  className="h-6 w-6 p-0"
                >
                  <Check className="h-3.5 w-3.5 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelRename}
                  disabled={isSubmittingRename}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <p className="text-sm font-medium truncate">{attachment.fileName}</p>
            )}
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
            {/* View button for images */}
            {isImage && !imageError && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowViewer(true)}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {!isRenaming && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startRename}
                title="Rename"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen image viewer / lightbox */}
      {showViewer && imageUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setShowViewer(false)}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
            <p className="text-white text-sm font-medium truncate max-w-[60%]">
              {attachment.fileName}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setShowViewer(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Image */}
          <img
            src={imageUrl}
            alt={attachment.fileName}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
