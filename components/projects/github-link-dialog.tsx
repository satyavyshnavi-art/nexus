"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  linkGitHubRepository,
  getOrgRepos,
  type OrgRepo,
} from "@/server/actions/github-link";
import { toast } from "sonner";
import { GitBranch, Loader2, Lock, Globe, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [search, setSearch] = useState("");

  const filteredRepos = useMemo(() => {
    if (!search.trim()) return repos;
    const q = search.toLowerCase();
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [repos, search]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelectedRepo(null);
    setSearch("");

    getOrgRepos()
      .then((result) => {
        if ("error" in result) {
          setError(result.error);
        } else {
          setRepos(result.repos);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load repositories");
      })
      .finally(() => {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link GitHub Repository</DialogTitle>
          <DialogDescription>
            Select a repository from your organization to enable task syncing as
            issues.
          </DialogDescription>
        </DialogHeader>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Loading repositories...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <p className="text-sm text-destructive text-center">{error}</p>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        )}

        {/* Repo selector */}
        {!loading && !error && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Repo list */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[260px] overflow-y-auto divide-y">
                {filteredRepos.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No repositories found.
                  </div>
                ) : (
                  filteredRepos.map((repo) => {
                    const isSelected =
                      selectedRepo?.fullName === repo.fullName;
                    return (
                      <button
                        key={repo.fullName}
                        type="button"
                        onClick={() => setSelectedRepo(repo)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50",
                          isSelected && "bg-primary/10"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-medium text-sm truncate",
                                isSelected && "text-primary"
                              )}
                            >
                              {repo.name}
                            </span>
                            {repo.isPrivate ? (
                              <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                            ) : (
                              <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {repo.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="gap-2 sm:gap-0">
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
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
