import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getAllVerticals } from "@/server/actions/verticals";
import { getAllUsers } from "@/server/actions/users";
import { VerticalList } from "@/components/admin/vertical-list";
import { CreateVerticalButton } from "@/components/admin/create-vertical-button";

export default async function VerticalsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const [verticals, allUsers] = await Promise.all([
    getAllVerticals(),
    getAllUsers(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Verticals</h1>
          <p className="text-muted-foreground mt-2">
            Manage organizational verticals and assign users
          </p>
        </div>
        <CreateVerticalButton />
      </div>

      <VerticalList verticals={verticals} allUsers={allUsers} />
    </div>
  );
}
