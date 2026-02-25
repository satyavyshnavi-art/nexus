"use client";

import { useState } from "react";
import { ProjectFileUpload } from "@/components/projects/project-file-upload";
import { ProjectAttachmentItem } from "@/components/projects/project-attachment-item";
import { getProjectAttachments } from "@/server/actions/project-attachments";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";
import type { User } from "@prisma/client";

interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  uploader: Pick<User, "id" | "name" | "email">;
}

interface ProjectDocumentsListProps {
  projectId: string;
  initialAttachments: Attachment[];
  currentUserId: string;
  isAdmin: boolean;
}

export function ProjectDocumentsList({
  projectId,
  initialAttachments,
  currentUserId,
  isAdmin,
}: ProjectDocumentsListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);

  const refresh = async () => {
    try {
      const updated = await getProjectAttachments(projectId);
      setAttachments(updated);
    } catch {
      // Keep current state on error
    }
  };

  return (
    <div className="space-y-6">
      <ProjectFileUpload projectId={projectId} onSuccess={refresh} />

      {attachments.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {attachments.length} file{attachments.length !== 1 ? "s" : ""}
          </h3>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <ProjectAttachmentItem
                key={attachment.id}
                attachment={attachment}
                canDelete={isAdmin || attachment.uploader.id === currentUserId}
                onDelete={refresh}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No Documents"
          description="Upload project files like specs, designs, or reference documents to share with your team."
          className="bg-card/50 backdrop-blur-sm"
        />
      )}
    </div>
  );
}
