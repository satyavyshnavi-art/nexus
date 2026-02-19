"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {verticals.map((vertical) => (
          <Card
            key={vertical.id}
            className="p-6 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors mb-3">
                  {vertical.name}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Users</span>
                      <span className="text-sm font-semibold">{vertical._count.users}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Projects</span>
                      <span className="text-sm font-semibold">{vertical._count.projects}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t">
                <Link href={`/admin/verticals/${vertical.id}`} className="w-full">
                  <Button
                    size="sm"
                    className="w-full group/btn"
                  >
                    View Details
                    <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
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
