"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar
            src={member.avatar || undefined}
            name={displayName}
            size="lg"
            isAdmin={member.role === UserRole.admin}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{displayName}</h3>
              <Badge
                variant={member.role === UserRole.admin ? "default" : "secondary"}
                className={
                  member.role === UserRole.admin
                    ? "bg-purple-500 hover:bg-purple-600"
                    : ""
                }
              >
                {member.role}
              </Badge>
            </div>
            {member.designation && (
              <p className="text-sm text-muted-foreground mb-1">
                {member.designation}
              </p>
            )}
            <p className="text-sm text-muted-foreground truncate">
              {member.email}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{member.stats.projects}</span>
            </div>
            <p className="text-xs text-muted-foreground">Projects</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {member.stats.activeTasks}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {member.stats.completedTasks}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Member Since */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Member since {memberSince}</span>
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
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
          <div className="space-y-4 pt-4 border-t">
            {/* Projects */}
            {member.projectMemberships.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Projects</h4>
                <div className="space-y-1">
                  {member.projectMemberships.map((pm) => (
                    <div
                      key={pm.project.id}
                      className="text-sm p-2 rounded-md bg-muted/50"
                    >
                      {pm.project.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            {member.assignedTasks.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Recent Tasks</h4>
                <div className="space-y-2">
                  {member.assignedTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="text-sm p-2 rounded-md bg-muted/50"
                    >
                      <p className="font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
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
              <div className="pt-2 border-t">
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
