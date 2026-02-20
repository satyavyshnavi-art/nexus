import { auth } from "@/lib/auth/config";
import { getUserProjects } from "@/server/actions/projects";
import { getVerticalsWithProjects } from "@/server/actions/verticals";
import { getTeamStats } from "@/server/actions/team";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Folders, Users, Timer, Sparkles, Plus, Building2, ChevronRight } from "lucide-react";
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
  const isAdmin = session?.user.role === "admin";

  // Fetch data based on role
  const projects = isAdmin ? [] : await getUserProjects();
  const verticals = isAdmin ? await getVerticalsWithProjects() : [];

  const teamStats = isAdmin ? await getTeamStats() : null;

  // Calculate quick stats
  const totalProjects = isAdmin
    ? verticals.reduce((acc, v) => acc + v._count.projects, 0)
    : projects.length;
  const totalSprints = isAdmin
    ? verticals.reduce((acc, v) => acc + v.projects.reduce((sum, p) => sum + p._count.sprints, 0), 0)
    : projects.reduce((acc, p) => acc + p._count.sprints, 0);
  const totalMembers = isAdmin
    ? teamStats?.totalMembers || 0
    : projects.reduce((acc, p) => acc + p._count.members, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header with greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent pb-1">
            {isAdmin ? "Admin Dashboard" : "Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Welcome back, <span className="font-semibold text-foreground">{session?.user.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {isAdmin ? `${verticals.length} ${verticals.length === 1 ? 'Vertical' : 'Verticals'}` : `${projects.length} Active ${projects.length === 1 ? 'Project' : 'Projects'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {(isAdmin ? verticals.length > 0 : projects.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            href={isAdmin ? "/admin/projects" : "#projects"}
            className="group"
          >
            <Card className="border-l-4 border-l-primary/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-card/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Projects</p>
                    <p className="text-3xl font-bold mt-2">{totalProjects}</p>
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
              <Card className="border-l-4 border-l-blue-500/80 dark:border-l-blue-400/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-card/80 backdrop-blur-sm group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Total Sprints</p>
                      <p className="text-3xl font-bold mt-2">{totalSprints}</p>
                    </div>
                    <div className="h-14 w-14 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-500/20 transition-all duration-300 group-hover:scale-110">
                      <Timer className="h-7 w-7 text-blue-600 dark:text-blue-400" />
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
            <Card className="border-l-4 border-l-green-500/80 dark:border-l-green-400/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-card/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Team Members</p>
                    <p className="text-3xl font-bold mt-2">{totalMembers}</p>
                  </div>
                  <div className="h-14 w-14 bg-green-500/10 rounded-2xl flex items-center justify-center group-hover:bg-green-500/20 transition-all duration-300 group-hover:scale-110">
                    <Users className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Projects/Verticals Section */}
      {isAdmin ? (
        <div id="verticals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Verticals & Projects</h2>
            <Link href="/admin/verticals">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Manage Verticals
              </Button>
            </Link>
          </div>

          {verticals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Building2 className="h-16 w-16 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Verticals Yet</h3>
                <p className="text-muted-foreground mb-4">Create your first vertical to organize projects</p>
                <Link href="/admin/verticals">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Vertical
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {verticals.map((vertical) => (
                <Card key={vertical.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{vertical.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {vertical._count.projects} {vertical._count.projects === 1 ? 'project' : 'projects'} · {vertical._count.users} {vertical._count.users === 1 ? 'member' : 'members'}
                          </CardDescription>
                        </div>
                      </div>
                      <Link href={`/admin/verticals/${vertical.id}`}>
                        <Button variant="ghost" size="sm">
                          Manage
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {vertical.projects.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Folders className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p>No projects in this vertical yet</p>
                        <Link href="/admin/projects">
                          <Button variant="link" size="sm" className="mt-2">
                            Create Project
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vertical.projects.map((project) => (
                          <Link key={project.id} href={`/projects/${project.id}`}>
                            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-l-4 border-l-primary/60">
                              <CardHeader>
                                <CardTitle className="text-base line-clamp-1">{project.name}</CardTitle>
                                <CardDescription className="line-clamp-2 text-sm">
                                  {project.description || "No description"}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Timer className="h-3.5 w-3.5" />
                                      <span>{project._count.sprints}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Users className="h-3.5 w-3.5" />
                                      <span>{project._count.members}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div id="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Your Projects</h2>
          </div>

          <ProjectGrid projects={projects} isAdmin={false} />
        </div>
      )}
    </div>
  );
}
