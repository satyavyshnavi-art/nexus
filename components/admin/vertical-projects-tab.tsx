import { Card } from "@/components/ui/card";
import { FolderKanban, Users, CalendarDays } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  _count: {
    members: number;
    sprints: number;
  };
}

interface VerticalProjectsTabProps {
  projects: Project[];
}

export function VerticalProjectsTab({ projects }: VerticalProjectsTabProps) {
  if (projects.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          No projects in this vertical yet.
        </p>
      </Card>
    );
  }

  return (
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
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{project._count.members} members</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FolderKanban className="h-4 w-4" />
                <span>{project._count.sprints} sprints</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>
                  Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
