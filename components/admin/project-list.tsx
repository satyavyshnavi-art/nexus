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
import { Users, FolderKanban } from "lucide-react";
import Link from "next/link";
import type { Project, Vertical } from "@prisma/client";

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

interface ProjectListProps {
  projects: ProjectWithCount[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  if (projects.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No projects yet. Create your first project to get started.
        </p>
      </Card>
    );
  }

  const handleManageMembers = (projectId: string) => {
    setSelectedProject(projectId);
    setIsManageModalOpen(true);
  };

  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Vertical: {project.vertical.name}
                </p>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span>{project._count.members} members</span>
                  <span>{project._count.sprints} sprints</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManageMembers(project.id)}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Members
                </Button>
                <Link href={`/dashboard/projects/${project.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <FolderKanban className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedProjectData && (
        <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Manage Members - {selectedProjectData.name}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Members must belong to the {selectedProjectData.vertical.name}{" "}
                vertical
              </p>
              {/* Note: We would need to fetch project details with members and vertical users */}
              <p className="text-sm text-muted-foreground">
                Refresh the page to manage members (requires server data)
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
