"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import type { UserRole } from "@prisma/client";
import { Shield, Code, Eye, Trash2, Loader2, Search, Users } from "lucide-react";
import { updateUserRole } from "@/server/actions/users";
import { deleteUser } from "@/server/actions/team";
import { useToast } from "@/lib/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  designation: string | null;
  role: UserRole;
  createdAt: Date;
}

interface UserListProps {
  users: UserData[];
}

export function UserList({ users }: UserListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        (user.name?.toLowerCase() || "").includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.designation?.toLowerCase() || "").includes(query)
    );
  }, [users, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name, email, or designation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          Showing {filteredUsers.length} of {users.length} users
        </span>
      </div>

      {/* User list */}
      {filteredUsers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {searchQuery ? "No users match your search." : "No users found."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-2">Actions</div>
          </div>

          {filteredUsers.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({ user }: { user: UserData }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleRoleChange = async (newRole: string) => {
    if (newRole === user.role) return;
    setIsUpdating(true);
    try {
      await updateUserRole(user.id, newRole as UserRole);
      toast({
        title: "Role updated",
        description: `${user.name || user.email} is now a ${newRole}`,
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteUser(user.id);
      toast({
        title: "User removed",
        description: `${result.name} has been removed from the system`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-3">
          <p className="font-medium text-sm">{user.name || "Unnamed"}</p>
          {user.designation && (
            <p className="text-xs text-muted-foreground">{user.designation}</p>
          )}
        </div>
        <div className="col-span-3">
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
        <div className="col-span-2">
          <Badge
            variant={user.role === "admin" ? "default" : user.role === "developer" ? "secondary" : "outline"}
            className="text-xs"
          >
            {user.role === "admin" ? (
              <Shield className="h-3 w-3 mr-1" />
            ) : user.role === "developer" ? (
              <Code className="h-3 w-3 mr-1" />
            ) : (
              <Eye className="h-3 w-3 mr-1" />
            )}
            {user.role}
          </Badge>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-muted-foreground">
            {format(new Date(user.createdAt), "MMM d, yyyy")}
          </p>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <Select
            value={user.role}
            onValueChange={handleRoleChange}
            disabled={isUpdating || isDeleting}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              </SelectItem>
              <SelectItem value="developer">
                <span className="flex items-center gap-1.5">
                  <Code className="h-3 w-3" /> Developer
                </span>
              </SelectItem>
              <SelectItem value="reviewer">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3 w-3" /> Reviewer
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove user?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove{" "}
                  <span className="font-semibold text-foreground">
                    {user.name || user.email}
                  </span>{" "}
                  from the system. Their assigned tasks will be unassigned, and
                  items they created will be reassigned to you. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}
