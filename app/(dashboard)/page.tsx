import { auth } from "@/lib/auth/config";
import { getUserProjects } from "@/server/actions/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Folders, Users, Timer, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  // Optimized: Single query instead of N+1
  const projects = await getUserProjects();

  // Calculate quick stats
  const totalSprints = projects.reduce((acc, p) => acc + p._count.sprints, 0);
  const totalMembers = projects.reduce((acc, p) => acc + p._count.members, 0);

  return (
    <div className="space-y-8">
      {/* Header with greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {session?.user.name}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-lg">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {projects.length} Active {projects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href={session?.user.role === "admin" ? "/admin/projects" : "#projects"}
            className="group"
          >
            <Card className="border-l-4 border-l-primary transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Projects</p>
                    <p className="text-2xl font-bold mt-1">{projects.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Folders className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link
            href={projects[0]?.id ? `/projects/${projects[0].id}/sprints` : "#"}
            className="group"
          >
            <Card className="border-l-4 border-l-blue-500 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-blue-600 transition-colors">Total Sprints</p>
                    <p className="text-2xl font-bold mt-1">{totalSprints}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Timer className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/team" className="group">
            <Card className="border-l-4 border-l-green-500 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-green-600 transition-colors">Team Members</p>
                    <p className="text-2xl font-bold mt-1">{totalMembers}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Projects Grid */}
      <div id="projects">
        <h2 className="text-2xl font-semibold mb-6">Your Projects</h2>
        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Folders className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  You haven&apos;t been assigned to any projects yet. Contact your admin to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group"
              >
                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="group-hover:text-primary transition-colors line-clamp-1">
                        {project.name}
                      </CardTitle>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        Active
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                      {project.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Timer className="h-4 w-4" />
                        <span>{project._count.sprints} {project._count.sprints === 1 ? 'sprint' : 'sprints'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{project._count.members} {project._count.members === 1 ? 'member' : 'members'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
