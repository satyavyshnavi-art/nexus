import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/server/actions/users";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileEditButton } from "@/components/profile/profile-edit-button";
import { ProfileErrorView } from "@/components/profile/profile-error-view";
import { format } from "date-fns";
import { Mail, Calendar, Briefcase, Activity, CheckCircle2 } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let profile;
  try {
    profile = await getCurrentUserProfile();
  } catch (error) {
    console.error("Error fetching profile:", error);
    return (
      <ProfileErrorView
        error={error instanceof Error ? error.message : "Unknown error"}
        userId={session?.user?.id}
      />
    );
  }

  const completionRate =
    profile.stats.totalTasks > 0
      ? Math.round(
        (profile.stats.completedTasks / profile.stats.totalTasks) * 100
      )
      : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header Section */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-start gap-6">
          <Avatar
            src={profile.avatar || undefined}
            name={profile.name || profile.email}
            size="xl"
            isAdmin={profile.role === "admin"}
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {profile.name || "No name set"}
              </h1>
              <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                {profile.role}
              </Badge>
            </div>
            {profile.designation && (
              <p className="text-lg text-muted-foreground mb-2">
                {profile.designation}
              </p>
            )}
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {profile.email}
            </p>
          </div>
          <ProfileEditButton
            userId={profile.id}
            initialData={{
              name: profile.name,
              designation: profile.designation,
              bio: profile.bio,
            }}
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Profile Information */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  User ID
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted p-1 rounded font-mono select-all">
                    {profile.id}
                  </code>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Email
                </p>
                <p className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </p>
              </div>

              {profile.designation && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Designation
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    {profile.designation}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Role
                </p>
                <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                  {profile.role}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Member Since
                </p>
                <p className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(profile.createdAt), "MMMM d, yyyy")}
                </p>
              </div>

              {profile.bio && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Bio
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Statistics and Activity */}
        <div className="md:col-span-2 space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground mb-2">
                      Total Tickets
                    </span>
                    <span className="text-3xl font-bold">
                      {profile.stats.totalTasks}
                    </span>
                  </div>
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground mb-2">
                      Completed
                    </span>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold">
                        {profile.stats.completedTasks}
                      </span>
                      <Badge variant="secondary" className="mb-1">
                        {completionRate}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground mb-2">
                      Active Projects
                    </span>
                    <span className="text-3xl font-bold">
                      {profile.stats.activeProjects}
                    </span>
                  </div>
                  <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Tickets
              </CardTitle>
              <CardDescription>
                Your latest assigned tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.assignedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tickets assigned yet
                </p>
              ) : (
                <div className="space-y-4">
                  {profile.assignedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border-b last:border-0 pb-4 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">
                            {task.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {task.sprint.project.name} / {task.sprint.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              task.status === "done"
                                ? "default"
                                : task.status === "progress"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {task.status}
                          </Badge>
                          <Badge
                            variant={
                              task.priority === "critical" || task.priority === "high"
                                ? "destructive"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
