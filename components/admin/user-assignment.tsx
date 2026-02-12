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
import { assignUserToVertical, removeUserFromVertical } from "@/server/actions/verticals";
import { toast } from "@/lib/hooks/use-toast";
import { UserPlus, X } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface UserAssignmentProps {
  verticalId: string;
  assignedUsers: User[];
  availableUsers: User[];
}

export function UserAssignment({
  verticalId,
  assignedUsers,
  availableUsers,
}: UserAssignmentProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddUser = async () => {
    if (!selectedUserId) return;

    setIsAdding(true);
    try {
      await assignUserToVertical(selectedUserId, verticalId);
      toast({
        title: "User added",
        description: "User has been added to the vertical",
        variant: "success",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add user",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeUserFromVertical(userId, verticalId);
      toast({
        title: "User removed",
        description: "User has been removed from the vertical",
        variant: "success",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove user",
        variant: "destructive",
      });
    }
  };

  const unassignedUsers = availableUsers.filter(
    (u) => !assignedUsers.some((au) => au.id === u.id)
  );

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-3">Assigned Users</h4>
        <div className="space-y-2">
          {assignedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users assigned yet</p>
          ) : (
            assignedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 bg-secondary rounded"
              >
                <div>
                  <p className="text-sm font-medium">{user.name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveUser(user.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {unassignedUsers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Add User</h4>
          <div className="flex gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {unassignedUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddUser}
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
