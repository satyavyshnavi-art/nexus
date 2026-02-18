"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, Users, Timer, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { deleteProject } from "@/server/actions/projects";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";

import type { Project } from "@prisma/client";

interface ProjectWithCount extends Omit<Project, 'githubRepoId'> {
    githubRepoId: string | null;
    _count: {
        sprints: number;
        members: number;
    };
}

interface ProjectGridProps {
    projects: ProjectWithCount[];
    isAdmin: boolean;
}

export function ProjectGrid({ projects, isAdmin }: ProjectGridProps) {
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();
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

    if (projects.length === 0) {
        return (
            <EmptyState
                icon={FolderKanban}
                title="No Projects Yet"
                description="You haven't been assigned to any projects yet. Contact your admin to get started."
            />
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="group"
                    >
                        <Card className="h-full transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 bg-white/50 backdrop-blur-sm relative">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <CardTitle className="group-hover:text-primary transition-colors line-clamp-1 text-lg pr-8">
                                        {project.name}
                                    </CardTitle>
                                    <div className="flex gap-2 shrink-0">
                                        <Badge variant="secondary" className="text-xs font-normal bg-purple-50 text-purple-700 border-purple-100">
                                            Active
                                        </Badge>
                                    </div>

                                    {isAdmin && (
                                        <div className="absolute top-4 right-4 z-10">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => handleDeleteClick(e, project.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete project</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <CardDescription className="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed">
                                    {project.description || "No description provided for this project."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm pt-2">
                                    <div className="flex items-center gap-1.5 text-muted-foreground bg-gray-50 px-2 py-1 rounded">
                                        <Timer className="h-3.5 w-3.5" />
                                        <span>{project._count.sprints} {project._count.sprints === 1 ? 'sprint' : 'sprints'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground bg-gray-50 px-2 py-1 rounded">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>{project._count.members} {project._count.members === 1 ? 'member' : 'members'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

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
