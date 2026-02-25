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
  hasGitHubAccount,
  getOrgRepos,
  type OrgRepo,
} from "@/server/actions/github-link";
import { loginWithGitHubRedirect } from "@/server/actions/auth";
import { toast } from "sonner";
import { GitBranch, Github, Loader2, Lock, Globe, Check } from "lucide-react";

interface GitHubLinkDialogProps {
  projectId: string;
}

export function GitHubLinkDialog({ projectId }: GitHubLinkDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null);
  const [repos, setRepos] = useState<OrgRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<OrgRepo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelectedRepo(null);

    hasGitHubAccount().then(async (result) => {
      if (!result || !result.hasAccount) {
        setGithubConnected(false);
        setLoading(false);
        return;
      }

      setGithubConnected(true);

      const orgResult = await getOrgRepos();
      if ("error" in orgResult) {
        setError(orgResult.error);
        setLoading(false);
        return;
      }

      setRepos(orgResult.repos);
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
            Connect this project to a GitHub repository to enable task syncing as issues.
          </DialogDescription>
        </DialogHeader>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {githubConnected === null ? "Checking GitHub connection..." : "Loading repositories..."}
            </p>
          </div>
        )}

        {/* Not connected state */}
        {!loading && githubConnected === false && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Github className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium">Connect your GitHub account</p>
              <p className="text-sm text-muted-foreground">
                Link your GitHub account to browse and select a repository from your organization.
              </p>
            </div>
            <Button
              onClick={() => loginWithGitHubRedirect(`/projects/${projectId}`)}
            >
              <Github className="mr-2 h-4 w-4" />
              Connect GitHub
            </Button>
          </div>
        )}

        {/* Error state */}
        {!loading && error && githubConnected && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <p className="text-sm text-destructive text-center">{error}</p>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        )}

        {/* Connected — repo selector */}
        {!loading && !error && githubConnected && (
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
