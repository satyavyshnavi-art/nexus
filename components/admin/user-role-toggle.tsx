"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateUserRole } from "@/server/actions/users";
import { toast } from "@/lib/hooks/use-toast";
import { UserRole } from "@prisma/client";
import { Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserRoleToggleProps {
  userId: string;
  currentRole: UserRole;
  userName: string;
}

export function UserRoleToggle({
  userId,
  currentRole,
  userName,
}: UserRoleToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    const newRole = currentRole === "admin" ? UserRole.member : UserRole.admin;

    if (
      !confirm(
        `Are you sure you want to ${newRole === "admin" ? "promote" : "demote"
        } ${userName} to ${newRole}?`
      )
    ) {
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserRole(userId, newRole);
      toast({
        title: "Role updated",
        description: `${userName} is now a ${newRole}`,
        variant: "success",
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

  return (
    <Button
      variant={currentRole === "admin" ? "destructive" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={isUpdating}
    >
      {currentRole === "admin" ? (
        <>
          <User className="h-4 w-4 mr-2" />
          {isUpdating ? "Updating..." : "Make Member"}
        </>
      ) : (
        <>
          <Shield className="h-4 w-4 mr-2" />
          {isUpdating ? "Updating..." : "Make Admin"}
        </>
      )}
    </Button>
  );
}
