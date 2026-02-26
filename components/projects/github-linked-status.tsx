"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { unlinkGitHubRepository } from "@/server/actions/github-link";
import { toast } from "sonner";
import { GitBranch, ExternalLink, Unlink, Loader2 } from "lucide-react";

interface GitHubLinkedStatusProps {
  projectId: string;
  repository: string;
  repositoryUrl: string;
  linkedAt: Date;
  linkedBy: string;
  isAdmin: boolean;
  canUnlink?: boolean;
}

export function GitHubLinkedStatus({
  projectId,
  repository,
  repositoryUrl,
  linkedAt,
  linkedBy,
  isAdmin,
  canUnlink,
}: GitHubLinkedStatusProps) {
  const showUnlink = canUnlink ?? isAdmin;
  const router = useRouter();
  const [unlinking, setUnlinking] = useState(false);

  async function handleUnlink() {
    const confirmed = window.confirm(
      `Are you sure you want to unlink ${repository}?\n\n` +
      `Existing synced issues will remain on GitHub, but new tasks won't be able to sync ` +
      `until you link another repository.\n\nSync history will be preserved for audit purposes.`
    );

    if (!confirmed) return;

    setUnlinking(true);

    try {
      await unlinkGitHubRepository(projectId);

      toast.success("Repository unlinked", {
        description: "GitHub repository has been unlinked from this project",
      });

      router.refresh();
    } catch (error: any) {
      toast.error("Failed to unlink repository", {
        description: error.message,
      });
    } finally {
      setUnlinking(false);
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <GitBranch className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{repository}</span>
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            Linked {new Date(linkedAt).toLocaleDateString()} by {linkedBy}
          </p>
        </div>
      </div>

      {showUnlink && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleUnlink}
          disabled={unlinking}
        >
          {unlinking ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Unlink className="mr-2 h-4 w-4" />
          )}
          {unlinking ? "Unlinking..." : "Unlink"}
        </Button>
      )}
    </div>
  );
}
