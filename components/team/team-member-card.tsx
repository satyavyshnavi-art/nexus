"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Briefcase,
  CheckCircle2,
  Clock,
  Calendar,
  Mail,
} from "lucide-react";
import { UserRole } from "@prisma/client";
import { updateUserRole } from "@/server/actions/team";
import { useToast } from "@/lib/hooks/use-toast";
import { format } from "date-fns";

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
      };
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
  const { toast } = useToast();

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

  const memberSince = format(new Date(member.createdAt), "MMM d, yyyy");
  const displayName = member.name || "Unnamed User";

  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/30 group">
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar
            src={member.avatar || undefined}
            name={displayName}
            size="xl"
            isAdmin={member.role === UserRole.admin}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-xl group-hover:text-primary transition-colors">
                {displayName}
              </h3>
              <Badge
                variant={member.role === UserRole.admin ? "default" : "secondary"}
                className={
                  member.role === UserRole.admin
                    ? "bg-purple-500 hover:bg-purple-600 shrink-0"
                    : "shrink-0"
                }
              >
                {member.role}
              </Badge>
            </div>
            {member.designation && (
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {member.designation}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 bg-purple-100 rounded-md flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-2xl font-bold">{member.stats.projects}</span>
            </div>
            <p className="text-xs font-medium text-muted-foreground">Projects</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-2xl font-bold">{member.stats.activeTasks}</span>
            </div>
            <p className="text-xs font-medium text-muted-foreground">Active</p>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 bg-green-100 rounded-md flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-2xl font-bold">{member.stats.completedTasks}</span>
            </div>
            <p className="text-xs font-medium text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Member Since */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 pb-4 border-b">
          <Calendar className="h-4 w-4" />
          <span>Joined {memberSince}</span>
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show Details
            </>
          )}
        </Button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4 pt-4 mt-4 border-t">
            {/* Projects */}
            {member.projectMemberships.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Projects ({member.projectMemberships.length})
                </h4>
                <div className="space-y-2">
                  {member.projectMemberships.map((pm) => (
                    <div
                      key={pm.project.id}
                      className="text-sm p-3 rounded-lg bg-muted/50 border border-muted hover:bg-muted transition-colors"
                    >
                      <span className="font-medium">{pm.project.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            {member.assignedTasks.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Recent Tasks
                </h4>
                <div className="space-y-2">
                  {member.assignedTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="text-sm p-3 rounded-lg bg-muted/50 border border-muted hover:bg-muted transition-colors"
                    >
                      <p className="font-medium truncate mb-2">{task.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {task.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {task.sprint.project.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Actions */}
            {isAdmin && member.id !== currentUserId && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRoleChange}
                  disabled={isUpdating}
                  className="w-full"
                >
                  {isUpdating
                    ? "Updating..."
                    : member.role === UserRole.admin
                    ? "Change to Member"
                    : "Make Admin"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
