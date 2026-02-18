import { auth } from "@/lib/auth/config";
import { getUserProjects } from "@/server/actions/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Folders, Users, Timer, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectGrid } from "@/components/dashboard/project-grid";

export default async function DashboardPage() {
  const session = await auth();

  // Optimized: Single query instead of N+1
  const projects = await getUserProjects();

  // Calculate quick stats
  const totalSprints = projects.reduce((acc, p) => acc + p._count.sprints, 0);
  const totalMembers = projects.reduce((acc, p) => acc + p._count.members, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header with greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent pb-1">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Welcome back, <span className="font-semibold text-foreground">{session?.user.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-50/50 border border-purple-100 rounded-full backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">
              {projects.length} Active {projects.length === 1 ? 'Project' : 'Projects'}
            </span>
          </div>
          {/* Add Create Project button if needed, but it's in nav usually */}
        </div>
      </div>

      {/* Quick Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            href={session?.user.role === "admin" ? "/admin/projects" : "#projects"}
            className="group"
          >
            <Card className="border-l-4 border-l-primary/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-white/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Projects</p>
                    <p className="text-3xl font-bold mt-2">{projects.length}</p>
                  </div>
                  <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                    <Folders className="h-7 w-7 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Card className="border-l-4 border-l-blue-500/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-white/50 backdrop-blur-sm group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-blue-600 transition-colors">Total Sprints</p>
                      <p className="text-3xl font-bold mt-2">{totalSprints}</p>
                    </div>
                    <div className="h-14 w-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-all duration-300 group-hover:scale-110">
                      <Timer className="h-7 w-7 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Sprints by Project</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {projects.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No projects found</div>
              ) : (
                projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}/sprints`} className="w-full">
                    <DropdownMenuItem className="cursor-pointer justify-between">
                      <span className="truncate max-w-[140px]">{project.name}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {project._count.sprints}
                      </Badge>
                    </DropdownMenuItem>
                  </Link>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/team" className="group">
            <Card className="border-l-4 border-l-green-500/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-white/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-green-600 transition-colors">Team Members</p>
                    <p className="text-3xl font-bold mt-2">{totalMembers}</p>
                  </div>
                  <div className="h-14 w-14 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-200 transition-all duration-300 group-hover:scale-110">
                    <Users className="h-7 w-7 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Projects Grid */}
      <div id="projects" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Your Projects</h2>
        </div>

        <ProjectGrid projects={projects} isAdmin={session?.user.role === "admin"} />
      </div>
    </div>
  );
}
