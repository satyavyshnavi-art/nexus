import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/server/actions/users";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";
import {
  Mail,
  Calendar,
  Shield,
  User,
  Briefcase,
  CheckCircle2,
  MessageSquare,
  FolderOpen,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getCurrentUserProfile();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your personal information
          </p>
        </div>
        <Link href="/settings">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Edit Settings
          </Button>
        </Link>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <Avatar
              src={profile.avatar || undefined}
              name={profile.name || "User"}
              size="xl"
              isAdmin={profile.role === "admin"}
            />

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Name + Role */}
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold truncate">
                    {profile.name || "Unnamed User"}
                  </h2>
                  <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                    {profile.role === "admin" ? (
                      <Shield className="h-3 w-3 mr-1" />
                    ) : (
                      <User className="h-3 w-3 mr-1" />
                    )}
                    {profile.role}
                  </Badge>
                </div>

                {profile.designation && (
                  <p className="text-sm text-primary font-medium mt-1">
                    {profile.designation}
                  </p>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Contact + Meta */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Joined {format(new Date(profile.createdAt), "MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-muted-foreground">ID: {profile.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <Briefcase className="h-5 w-5 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
            <div className="text-2xl font-bold">{profile.stats.activeProjects}</div>
            <div className="text-xs text-muted-foreground mt-1">Projects</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-green-600 dark:text-green-400 mb-2" />
            <div className="text-2xl font-bold">{profile.stats.completedTasks}</div>
            <div className="text-xs text-muted-foreground mt-1">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <FolderOpen className="h-5 w-5 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">{profile.stats.totalTasks}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <MessageSquare className="h-5 w-5 mx-auto text-amber-600 dark:text-amber-400 mb-2" />
            <div className="text-2xl font-bold">
              {profile.stats.totalTasks > 0
                ? Math.round((profile.stats.completedTasks / profile.stats.totalTasks) * 100)
                : 0}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Completion</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {profile.assignedTasks.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {profile.assignedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/50"
                >
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {task.status}
                  </Badge>
                  <span className="flex-1 truncate">{task.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {task.sprint?.project.name ?? task.feature?.project.name ?? "Unassigned"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      {profile.projectMemberships.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3">Projects</h3>
            <div className="flex flex-wrap gap-2">
              {profile.projectMemberships.map((pm) => (
                <Link
                  key={pm.project.id}
                  href={`/projects/${pm.project.id}`}
                  className="text-sm px-3 py-1.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {pm.project.name}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
