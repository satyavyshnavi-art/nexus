"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MemberAssignment } from "./member-assignment";
import { Users, FolderKanban, Timer, ArrowRight, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Project, Vertical } from "@prisma/client";
import { getProjectMemberData, deleteProject } from "@/server/actions/projects";
import { toast } from "sonner";

interface ProjectWithCount extends Omit<Project, 'githubRepoId'> {
  githubRepoId: string | null;
  vertical: Pick<Vertical, "id" | "name">;
  _count: {
    sprints: number;
    members: number;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Member {
  user: User;
}

interface ProjectMemberData {
  project: {
    id: string;
    name: string;
    verticalId: string;
  };
  verticalName: string;
  currentMembers: User[];
  availableUsers: User[];
}

interface ProjectListProps {
  projects: ProjectWithCount[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [memberData, setMemberData] = useState<ProjectMemberData | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Delete state
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (projects.length === 0) {
    return (
      <Card className="border-dashed">
        <div className="p-12 text-center">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Create your first project to start organizing work and managing sprints.
          </p>
        </div>
      </Card>
    );
  }

  const handleManageMembers = async (projectId: string) => {
    setSelectedProject(projectId);
    setIsManageModalOpen(true);
    setIsLoadingMembers(true);
    setMemberData(null);

    try {
      const data = await getProjectMemberData(projectId);
      setMemberData(data);
    } catch (error) {
      console.error("Failed to load member data:", error);
      toast.error("Failed to load member data");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleCloseDialog = () => {
    setIsManageModalOpen(false);
    setSelectedProject(null);
    setMemberData(null);
    setIsLoadingMembers(false);
  };

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete);
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="p-6 transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 group relative">
            <div className="space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors pr-8">
                    {project.name}
                  </h3>
                  <div className="absolute top-6 right-6 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteClick(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete project</span>
                    </Button>
                  </div>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[2.5rem]">
                    {project.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-3 px-2 py-1 bg-muted/50 rounded inline-block">
                  {project.vertical.name}
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Members</span>
                      <span className="text-sm font-semibold">{project._count.members}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <Timer className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Sprints</span>
                      <span className="text-sm font-semibold">{project._count.sprints}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Link href={`/projects/${project.id}`} className="w-full" prefetch={true}>
                  <Button size="sm" className="w-full group/btn">
                    View Project
                    <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManageMembers(project.id)}
                  className="w-full"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Members
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isManageModalOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Members
              {memberData && ` - ${memberData.project.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : memberData ? (
              <>
                <p className="text-sm text-muted-foreground mb-6">
                  Members must belong to the {memberData.verticalName} vertical
                </p>
                <MemberAssignment
                  projectId={memberData.project.id}
                  verticalId={memberData.project.verticalId}
                  currentMembers={memberData.currentMembers.map((user) => ({
                    user,
                  }))}
                  verticalUsers={[
                    ...memberData.currentMembers,
                    ...memberData.availableUsers,
                  ]}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Failed to load member data. Please try again.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all of its data, including tasks, sprints, and comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
