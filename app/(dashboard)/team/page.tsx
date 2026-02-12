import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getTeamMembers, getTeamStats } from "@/server/actions/team";
import { TeamPageClient } from "@/components/team/team-page-client";

export default async function TeamPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [members, stats] = await Promise.all([
    getTeamMembers(),
    getTeamStats(),
  ]);

  return (
    <TeamPageClient
      members={members}
      stats={stats}
      currentUserId={session.user.id}
      isAdmin={session.user.role === "admin"}
    />
  );
}
