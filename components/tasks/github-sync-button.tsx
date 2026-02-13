"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { syncTaskToGitHub } from "@/server/actions/github-sync";
import { toast } from "sonner";
import { GitBranch, Check, ExternalLink, Loader2, RefreshCw } from "lucide-react";

interface GitHubSyncButtonProps {
  taskId: string;
  isSynced: boolean;
  issueNumber?: number | null;
  issueUrl?: string | null;
  projectLinked: boolean;
}

export function GitHubSyncButton({
  taskId,
  isSynced,
  issueNumber,
  issueUrl,
  projectLinked,
}: GitHubSyncButtonProps) {
  const [loading, setLoading] = useState(false);

  if (!projectLinked) {
    return null; // Don't show button if project not linked
  }

  async function handleSync() {
    setLoading(true);

    try {
      const result = await syncTaskToGitHub(taskId);

      toast.success(
        `${isSynced ? "Updated" : "Created"} issue #${result.issueNumber}`,
        {
          description: `View on GitHub: ${result.issueUrl}`,
        }
      );

      // Refresh the page to show updated sync status
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error("Sync failed", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  if (isSynced && issueUrl) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-green-600" />
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary flex items-center gap-1"
          >
            Issue #{issueNumber}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSync}
          disabled={loading}
          title="Update GitHub issue with latest task data"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleSync}
      disabled={loading}
      className="text-xs"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <GitBranch className="mr-2 h-3 w-3" />
          Push to GitHub
        </>
      )}
    </Button>
  );
}
