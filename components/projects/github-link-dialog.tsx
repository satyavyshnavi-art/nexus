"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { linkGitHubRepository } from "@/server/actions/github-link";
import { toast } from "sonner";
import { GitBranch, Loader2 } from "lucide-react";

interface GitHubLinkDialogProps {
  projectId: string;
}

export function GitHubLinkDialog({ projectId }: GitHubLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLink() {
    if (!repoOwner.trim() || !repoName.trim()) {
      toast.error("Missing fields", {
        description: "Please enter both repository owner and name",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await linkGitHubRepository(
        projectId,
        repoOwner.trim(),
        repoName.trim()
      );

      toast.success("Repository linked", {
        description: `Successfully linked to ${result.repository}`,
      });

      setOpen(false);
      setRepoOwner("");
      setRepoName("");

      // Refresh the page to show updated link status
      window.location.reload();
    } catch (error: any) {
      toast.error("Failed to link repository", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitBranch className="mr-2 h-4 w-4" />
          Link GitHub Repository
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link GitHub Repository</DialogTitle>
          <DialogDescription>
            Connect this project to a GitHub repository to enable task syncing as issues.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="owner">Repository Owner</Label>
            <Input
              id="owner"
              placeholder="octocat"
              value={repoOwner}
              onChange={(e) => setRepoOwner(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              The GitHub username or organization name
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="repo">Repository Name</Label>
            <Input
              id="repo"
              placeholder="hello-world"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              The repository name (without .git extension)
            </p>
          </div>
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium mb-1">Example:</p>
            <p className="text-muted-foreground">
              For <code className="bg-background px-1 py-0.5 rounded">github.com/octocat/hello-world</code>
            </p>
            <p className="text-muted-foreground mt-1">
              Enter <strong>octocat</strong> as owner and <strong>hello-world</strong> as name
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleLink} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Linking..." : "Link Repository"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
