"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MemberAssignment } from "@/components/admin/member-assignment";
import { Users, Loader2 } from "lucide-react";
import { getProjectMemberData } from "@/server/actions/projects";
import type { Sprint, Task } from "@prisma/client";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Member {
  id: string;
  userId: string;
  user: User;
}

interface SprintWithTasks extends Sprint {
  tasks: Task[];
}

interface ProjectMemberData {
  project: {
    id: string;
    name: string;
    verticalId: string;
  };
  verticalName: string;
  currentMembers: User[];
  availableUsers: User[];
}

interface TeamTabContentProps {
  projectId: string;
  members: Member[];
  activeSprint: SprintWithTasks | null;
  isAdmin: boolean;
}

export function TeamTabContent({
  projectId,
  members,
  activeSprint,
  isAdmin,
}: TeamTabContentProps) {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [memberData, setMemberData] = useState<ProjectMemberData | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const handleManageMembers = async () => {
    setIsManageModalOpen(true);
    setIsLoadingMembers(true);
    setMemberData(null);

    try {
      const data = await getProjectMemberData(projectId);
      setMemberData(data);
    } catch (error) {
      console.error("Failed to load member data:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleCloseDialog = () => {
    setIsManageModalOpen(false);
    setMemberData(null);
    setIsLoadingMembers(false);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Team Members ({members.length})</h2>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={handleManageMembers}>
            <Users className="h-4 w-4 mr-2" />
            Manage Members
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member) => {
          const memberTasks = activeSprint?.tasks.filter(
            (t) => t.assigneeId === member.userId
          );
          return (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle className="text-lg">{member.user.name}</CardTitle>
                <CardDescription>{member.user.email}</CardDescription>
              </CardHeader>
              <CardContent>
                {memberTasks && memberTasks.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Assigned Tasks: {memberTasks.length}
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>
                        Todo: {memberTasks.filter((t) => t.status === "todo").length}
                      </span>
                      <span>
                        In Progress:{" "}
                        {memberTasks.filter((t) => t.status === "progress").length}
                      </span>
                      <span>
                        Done: {memberTasks.filter((t) => t.status === "done").length}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tasks assigned</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isManageModalOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Members
              {memberData && ` - ${memberData.project.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : memberData ? (
              <>
                <p className="text-sm text-muted-foreground mb-6">
                  Members must belong to the {memberData.verticalName} vertical
                </p>
                <MemberAssignment
                  projectId={memberData.project.id}
                  verticalId={memberData.project.verticalId}
                  currentMembers={memberData.currentMembers.map((user) => ({
                    user,
                  }))}
                  verticalUsers={[
                    ...memberData.currentMembers,
                    ...memberData.availableUsers,
                  ]}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Failed to load member data. Please try again.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
