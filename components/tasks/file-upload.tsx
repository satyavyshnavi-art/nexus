"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  requestUploadUrl,
  saveAttachmentMetadata,
} from "@/server/actions/attachments";
import { toast } from "@/lib/hooks/use-toast";
import { Upload, X } from "lucide-react";

interface FileUploadProps {
  taskId: string;
  onSuccess?: () => void;
}

export function FileUpload({ taskId, onSuccess }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only images, PDFs, and documents are allowed",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Request upload URL
      const { uploadUrl, key } = await requestUploadUrl({
        taskId,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
      });

      setUploadProgress(25);

      // Step 2: Upload file to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      setUploadProgress(75);

      // Step 3: Save metadata
      await saveAttachmentMetadata({
        taskId,
        key,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        sizeBytes: selectedFile.size,
      });

      setUploadProgress(100);

      toast({
        title: "File uploaded",
        description: `${selectedFile.name} has been uploaded successfully`,
        variant: "success",
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={isUploading}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Images, PDFs, or documents (max 10MB)
          </p>
        </label>
      </div>

      {selectedFile && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-secondary">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? `Uploading ${uploadProgress}%` : "Upload"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
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
