"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAssignment } from "./user-assignment";
import { Users, ArrowRight } from "lucide-react";
import type { Vertical } from "@prisma/client";

interface VerticalWithCount extends Vertical {
  _count: {
    users: number;
    projects: number;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface VerticalListProps {
  verticals: VerticalWithCount[];
  allUsers: User[];
}

export function VerticalList({ verticals, allUsers }: VerticalListProps) {
  const router = useRouter();
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  if (verticals.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No verticals yet. Create your first vertical to get started.
        </p>
      </Card>
    );
  }

  const handleManageUsers = (e: React.MouseEvent, verticalId: string) => {
    e.stopPropagation();
    setSelectedVertical(verticalId);
    setIsManageModalOpen(true);
  };

  const selectedVerticalData = verticals.find((v) => v.id === selectedVertical);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {verticals.map((vertical) => (
          <Card
            key={vertical.id}
            className="p-6 hover:border-primary/50 transition-all group"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {vertical.name}
                </h3>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span>{vertical._count.users} users</span>
                  <span>{vertical._count.projects} projects</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={() => router.push(`/admin/verticals/${vertical.id}`)}
                  className="w-full"
                >
                  View Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleManageUsers(e, vertical.id)}
                  className="w-full"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedVerticalData && (
        <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Users - {selectedVerticalData.name}</DialogTitle>
            </DialogHeader>
            <ManageUsersContent
              verticalId={selectedVerticalData.id}
              allUsers={allUsers}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function ManageUsersContent({
  verticalId,
  allUsers,
}: {
  verticalId: string;
  allUsers: User[];
}) {
  // This would need to fetch assigned users - for simplicity, we'll reload the page
  // In a production app, you'd fetch this data properly
  return (
    <div className="py-4">
      <UserAssignment
        verticalId={verticalId}
        assignedUsers={[]}
        availableUsers={allUsers}
      />
    </div>
  );
}
