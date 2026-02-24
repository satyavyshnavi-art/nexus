"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Briefcase,
  CheckCircle2,
  Clock,
  Mail,
  Trash2,
  Loader2,
} from "lucide-react";
import { UserRole } from "@prisma/client";
import { updateUserRole, deleteUser } from "@/server/actions/team";
import { useToast } from "@/lib/hooks/use-toast";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TeamMemberCardProps {
  member: {
    id: string;
    name: string | null;
    email: string;
    designation: string | null;
    avatar: string | null;
    role: UserRole;
    createdAt: Date;
    stats: {
      projects: number;
      activeTasks: number;
      completedTasks: number;
    };
    projectMemberships: Array<{
      project: {
        id: string;
        name: string;
      };
    }>;
    assignedTasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      type: string;
      sprint: {
        name: string;
        status: string;
        project: {
          name: string;
        };
      } | null;
    }>;
  };
  isAdmin: boolean;
  currentUserId: string;
}

export function TeamMemberCard({
  member,
  isAdmin,
  currentUserId,
}: TeamMemberCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleRoleChange = async () => {
    if (member.id === currentUserId) {
      toast({
        title: "Error",
        description: "You cannot change your own role",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const newRole =
        member.role === UserRole.admin ? UserRole.member : UserRole.admin;
      await updateUserRole(member.id, newRole);
      toast({
        title: "Success",
        description: `Role updated to ${newRole}`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteUser(member.id);
      toast({
        title: "User removed",
        description: `${result.name} has been removed`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const displayName = member.name || "Unnamed User";

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20">
      <div className="p-4">
        {/* Top row: Avatar + Info + Role */}
        <div className="flex items-center gap-3">
          <Avatar
            src={member.avatar || undefined}
            name={displayName}
            size="md"
            isAdmin={member.role === UserRole.admin}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="font-semibold text-sm truncate"
                title={displayName}
              >
                {displayName}
              </h3>
              <Badge
                variant={member.role === UserRole.admin ? "default" : "secondary"}
                className="text-[10px] px-1.5 py-0 h-5 shrink-0"
              >
                {member.role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate" title={member.designation || member.email}>
              {member.designation || member.email}
            </p>
          </div>
        </div>

        {/* Inline stats row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">{member.stats.projects}</span>
            <span>projects</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">{member.stats.activeTasks}</span>
            <span>active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">{member.stats.completedTasks}</span>
            <span>done</span>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-1 w-full mt-3 pt-2 border-t text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Details
            </>
          )}
        </button>

        {/* Expanded section */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Email */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>

            {/* Projects */}
            {member.projectMemberships.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Projects
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {member.projectMemberships.map((pm) => (
                    <Link
                      key={pm.project.id}
                      href={`/projects/${pm.project.id}`}
                      className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-primary/10 hover:text-primary transition-colors truncate max-w-[160px]"
                    >
                      {pm.project.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            {member.assignedTasks.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Recent Tasks
                </p>
                <div className="space-y-1">
                  {member.assignedTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/50"
                    >
                      <span className="flex-1 truncate">{task.title}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin actions */}
            {isAdmin && member.id !== currentUserId && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRoleChange}
                  disabled={isUpdating || isDeleting}
                  className="flex-1 h-7 text-xs"
                >
                  {isUpdating
                    ? "Updating..."
                    : member.role === UserRole.admin
                      ? "Change to Member"
                      : "Make Admin"}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isDeleting}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                      title="Remove user"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove user?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove{" "}
                        <span className="font-semibold text-foreground">
                          {displayName}
                        </span>{" "}
                        from the system. Their assigned tasks will be unassigned,
                        and items they created will be reassigned to you. This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove User
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
