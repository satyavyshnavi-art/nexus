import { auth } from "@/lib/auth/config";
import { getUserVerticals } from "@/server/actions/verticals";
import { getProjectsByVertical } from "@/server/actions/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const verticals = await getUserVerticals();

  // Get all projects from user's verticals
  const allProjects = await Promise.all(
    verticals.map((v) => getProjectsByVertical(v.id))
  );
  const projects = allProjects.flat();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user.name}
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Projects</h2>
        {projects.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No projects found. Contact your admin to be added to a project.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>
                      {project.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{project._count.sprints} sprints</span>
                      <span>{project._count.members} members</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {verticals.length === 0 && session?.user.role !== "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>No Verticals Assigned</CardTitle>
            <CardDescription>
              You haven&apos;t been assigned to any verticals yet. Please contact
              your administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
