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
import { MemberAssignment } from "./member-assignment";
import { Users, FolderKanban, Timer, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Project, Vertical } from "@prisma/client";
import { getProjectMemberData } from "@/server/actions/projects";

interface ProjectWithCount extends Project {
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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="p-6 transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 group">
            <div className="space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <FolderKanban className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Members</span>
                      <span className="text-sm font-semibold">{project._count.members}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                    <Timer className="h-4 w-4 text-purple-600" />
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
    </>
  );
}
