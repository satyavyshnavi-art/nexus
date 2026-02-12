import { Card } from "@/components/ui/card";
import { UserRoleToggle } from "./user-role-toggle";
import { format } from "date-fns";
import type { UserRole } from "@prisma/client";
import { Shield, User } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: Date;
}

interface UserListProps {
  users: User[];
}

export function UserList({ users }: UserListProps) {
  if (users.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No users found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
        <div className="col-span-3">Name</div>
        <div className="col-span-3">Email</div>
        <div className="col-span-2">Role</div>
        <div className="col-span-2">Joined</div>
        <div className="col-span-2">Actions</div>
      </div>

      {users.map((user) => (
        <Card key={user.id} className="p-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3">
              <p className="font-medium">{user.name || "Unnamed"}</p>
            </div>
            <div className="col-span-3">
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                {user.role === "admin" ? (
                  <>
                    <Shield className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">
                      Admin
                    </span>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                      Member
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">
                {format(new Date(user.createdAt), "MMM d, yyyy")}
              </p>
            </div>
            <div className="col-span-2">
              <UserRoleToggle
                userId={user.id}
                currentRole={user.role}
                userName={user.name || user.email}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
