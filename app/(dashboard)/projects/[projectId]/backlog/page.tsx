import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getProject } from "@/server/actions/projects";
import { getProjectFeatures } from "@/server/actions/features";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureList } from "@/components/features/feature-list";
import { CreateFeatureDialog } from "@/components/features/create-feature-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  ListTodo,
  PackageOpen,
  Sparkles,
} from "lucide-react";

export default async function BacklogPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { projectId } = await params;
  const [project, features] = await Promise.all([
    getProject(projectId),
    getProjectFeatures(projectId),
  ]);

  if (!project) {
    redirect("/");
  }

  const isAdmin = session.user.role === "admin";

  // Compute stats
  const totalFeatures = features.length;
  const totalTasks = features.reduce((sum, f) => sum + f.taskCount, 0);
  const backlogCount = features.filter((f) => f.status === "backlog").length;
  const inProgressCount = features.filter(
    (f) => f.status === "in_progress" || f.status === "planning"
  ).length;
  const completedCount = features.filter(
    (f) => f.status === "completed"
  ).length;

  const projectMembers = project.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
  }));

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent pb-1">
            Product Backlog
          </h1>
          <p className="text-muted-foreground mt-1">
            {project.name} — Features and task breakdown
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="glass hover:bg-muted/50" disabled>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Plan Features
            </Button>
            <CreateFeatureDialog projectId={projectId} />
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-primary bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Features
                </p>
                <p className="text-3xl font-bold mt-1">{totalFeatures}</p>
              </div>
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 dark:border-l-indigo-400 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Tasks
                </p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {totalTasks}
                </p>
              </div>
              <div className="h-10 w-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-400 dark:border-l-slate-500 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Backlog
              </p>
              <p className="text-3xl font-bold text-slate-600 dark:text-slate-300">
                {backlogCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 dark:border-l-amber-400 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                In Progress
              </p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {inProgressCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 dark:border-l-green-400 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Completed
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {completedCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature List */}
      {features.length > 0 ? (
        <FeatureList
          features={features}
          projectMembers={projectMembers}
          isAdmin={isAdmin}
          projectId={projectId}
        />
      ) : (
        <EmptyState
          icon={PackageOpen}
          title="No Features Yet"
          description={
            isAdmin
              ? "Create your first feature to start building the product backlog. Features break down into tasks that can be assigned to sprints."
              : "No features have been created for this project yet. Check back later or ask an admin to set up the backlog."
          }
          className="bg-card/50 backdrop-blur-sm"
        />
      )}
    </div>
  );
}
