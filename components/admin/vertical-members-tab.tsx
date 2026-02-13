"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import { AddMemberModal } from "./add-member-modal";
import { removeUserFromVertical } from "@/server/actions/verticals";
import { Users, X, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  userId: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    designation: string | null;
    role: string;
  };
}

interface VerticalMembersTabProps {
  verticalId: string;
  members: Member[];
}

export function VerticalMembersTab({ verticalId, members }: VerticalMembersTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleRemoveMember = async (userId: string) => {
    try {
      setRemovingUserId(userId);
      await removeUserFromVertical(userId, verticalId);
      toast({
        title: "Success",
        description: "Member removed from vertical",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      });
    } finally {
      setRemovingUserId(null);
    }
  };

  if (members.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">
          No members yet. Add members to get started.
        </p>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
        <AddMemberModal
          verticalId={verticalId}
          assignedUserIds={[]}
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Member Button */}
      <div className="flex justify-end">
        <Button onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Members Grid Table */}
      <Card>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-12 gap-4 p-4 border-b font-medium text-sm">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Designation</div>
            <div className="col-span-1">Added</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {members.map((member) => (
            <div
              key={member.id}
              className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 items-center hover:bg-muted/50 transition-colors"
            >
              <div className="col-span-3 font-medium">
                {member.user.name || "No name"}
              </div>
              <div className="col-span-3 text-sm text-muted-foreground">
                {member.user.email}
              </div>
              <div className="col-span-2">
                <Badge variant={member.user.role === "admin" ? "default" : "secondary"}>
                  {member.user.role}
                </Badge>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">
                {member.user.designation || "—"}
              </div>
              <div className="col-span-1 text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.userId)}
                  disabled={removingUserId === member.userId}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <AddMemberModal
        verticalId={verticalId}
        assignedUserIds={members.map(m => m.userId)}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
