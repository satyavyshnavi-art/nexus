import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/server/actions/users";
import { UserList } from "@/components/admin/user-list";
import { Input } from "@/components/ui/input";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and permissions
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Input
          type="search"
          placeholder="Search users..."
          className="max-w-sm"
        />
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Total users: {users.length}
        </p>
        <UserList users={users} />
      </div>
    </div>
  );
}
