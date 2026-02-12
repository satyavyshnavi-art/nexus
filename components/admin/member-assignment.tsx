"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addMemberToProject,
  removeMemberFromProject,
} from "@/server/actions/projects";
import { toast } from "@/lib/hooks/use-toast";
import { UserPlus, X } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Member {
  user: User;
}

interface MemberAssignmentProps {
  projectId: string;
  verticalId: string;
  currentMembers: Member[];
  verticalUsers: User[];
}

export function MemberAssignment({
  projectId,
  verticalId,
  currentMembers,
  verticalUsers,
}: MemberAssignmentProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    setIsAdding(true);
    try {
      await addMemberToProject(projectId, selectedUserId);
      toast({
        title: "Member added",
        description: "Member has been added to the project",
        variant: "success",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add member",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMemberFromProject(projectId, userId);
      toast({
        title: "Member removed",
        description: "Member has been removed from the project",
        variant: "success",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const availableUsers = verticalUsers.filter(
    (u) => !currentMembers.some((m) => m.user.id === u.id)
  );

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-3">Project Members</h4>
        <div className="space-y-2">
          {currentMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet</p>
          ) : (
            currentMembers.map((member) => (
              <div
                key={member.user.id}
                className="flex items-center justify-between p-2 bg-secondary rounded"
              >
                <div>
                  <p className="text-sm font-medium">
                    {member.user.name || "Unnamed"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.user.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {availableUsers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Add Member</h4>
          <div className="flex gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a user from vertical" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUserId || isAdding}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isAdding ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
