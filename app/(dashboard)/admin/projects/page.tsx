import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getAllProjects } from "@/server/actions/projects";
import { getAllVerticals } from "@/server/actions/verticals";
import { getAllUsers } from "@/server/actions/users";
import { ProjectList } from "@/components/admin/project-list";
import { CreateProjectButton } from "@/components/admin/create-project-button";

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const [projects, verticals, users] = await Promise.all([
    getAllProjects(),
    getAllVerticals(),
    getAllUsers(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage all projects across verticals
          </p>
        </div>
        <CreateProjectButton verticals={verticals} users={users} />
      </div>

      <ProjectList projects={projects} />
    </div>
  );
}
