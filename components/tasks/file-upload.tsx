"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { uploadAttachment } from "@/server/actions/attachments";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface FileUploadProps {
  taskId: string;
  onSuccess?: () => void;
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

const ALLOWED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff",
  ".pdf", ".doc", ".docx", ".xlsx", ".txt", ".csv",
];

const MAX_SIZE = 4 * 1024 * 1024; // 4MB

export function FileUpload({ taskId, onSuccess }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = useCallback((file: File): boolean => {
    if (file.size > MAX_SIZE) {
      toast.error("File too large", { description: "Maximum file size is 4MB" });
      return false;
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error("Invalid file type", { description: "Only images, PDFs, and documents are allowed" });
      return false;
    }

    return true;
  }, []);

  const doUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(25);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId);

      setUploadProgress(50);

      const result = await uploadAttachment(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setUploadProgress(100);
      toast.success("File uploaded", {
        description: `${file.name} has been uploaded successfully`,
      });

      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [taskId, onSuccess]);

  const processFile = useCallback((file: File, autoUpload: boolean) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }

    if (autoUpload) {
      doUpload(file);
    }
  }, [validateFile, doUpload]);

  // File input change (click to select)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file, false);
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragOver(true);
  }, [isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the drop zone (not entering a child)
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file, true); // auto-upload on drop
    }
  }, [isUploading, processFile]);

  // Paste handler — listen on the document so paste works anywhere in the modal
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isUploading) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            // For pasted screenshots with no name, give a meaningful name
            let pasteFile = file;
            if (file.name === "image.png" || !file.name) {
              const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
              pasteFile = new File([file], `screenshot-${timestamp}.png`, { type: file.type });
            }
            processFile(pasteFile, true); // auto-upload on paste
            return;
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [isUploading, processFile]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="space-y-3">
      <div
        ref={dropZoneRef}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          isDragOver
            ? "border-primary bg-primary/5"
            : isUploading
              ? "border-muted cursor-not-allowed"
              : "hover:border-primary"
        }`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        <div className="flex flex-col items-center">
          {isDragOver ? (
            <>
              <ImageIcon className="h-10 w-10 text-primary mb-3" />
              <p className="text-sm font-medium text-primary">
                Drop file here
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Click, drag & drop, or paste an image
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Images, PDFs, or documents (max 4MB)
              </p>
            </>
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-secondary">
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="h-12 w-12 rounded object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <div className="flex gap-2">
            {isUploading ? (
              <span className="text-sm text-muted-foreground">
                Uploading {uploadProgress}%
              </span>
            ) : (
              <Button
                size="sm"
                onClick={() => doUpload(selectedFile)}
              >
                Upload
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFile(null);
                setPreview(null);
              }}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
