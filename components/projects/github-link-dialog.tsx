"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  linkGitHubRepository,
  getOrgRepos,
  type OrgRepo,
} from "@/server/actions/github-link";
import { toast } from "sonner";
import { GitBranch, Loader2, Lock, Globe, Check } from "lucide-react";

interface GitHubLinkDialogProps {
  projectId: string;
}

export function GitHubLinkDialog({ projectId }: GitHubLinkDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [repos, setRepos] = useState<OrgRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<OrgRepo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelectedRepo(null);

    getOrgRepos().then((result) => {
      if ("error" in result) {
        setError(result.error);
      } else {
        setRepos(result.repos);
      }
      setLoading(false);
    });
  }, [open]);

  async function handleLink() {
    if (!selectedRepo) return;
    setLinking(true);

    try {
      const result = await linkGitHubRepository(
        projectId,
        selectedRepo.owner,
        selectedRepo.name
      );

      toast.success("Repository linked", {
        description: `Successfully linked to ${result.repository}`,
      });

      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error("Failed to link repository", {
        description: error.message,
      });
    } finally {
      setLinking(false);
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
            Select a repository from your organization to enable task syncing as issues.
          </DialogDescription>
        </DialogHeader>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading repositories...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <p className="text-sm text-destructive text-center">{error}</p>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        )}

        {/* Repo selector */}
        {!loading && !error && (
          <div className="space-y-4 py-2">
            <Command className="rounded-lg border">
              <CommandInput placeholder="Search repositories..." />
              <CommandList className="max-h-[250px]">
                <CommandEmpty>No repositories found.</CommandEmpty>
                <CommandGroup>
                  {repos.map((repo) => (
                    <CommandItem
                      key={repo.fullName}
                      value={repo.name}
                      onSelect={() => setSelectedRepo(repo)}
                      className="flex items-start gap-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{repo.name}</span>
                          {repo.isPrivate ? (
                            <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                          ) : (
                            <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                          {selectedRepo?.fullName === repo.fullName && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {repo.description}
                          </p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>

            {selectedRepo && (
              <div className="rounded-md bg-muted p-3 text-sm">
                Selected: <strong>{selectedRepo.fullName}</strong>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={linking}
              >
                Cancel
              </Button>
              <Button
                onClick={handleLink}
                disabled={!selectedRepo || linking}
              >
                {linking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {linking ? "Linking..." : "Link Repository"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
