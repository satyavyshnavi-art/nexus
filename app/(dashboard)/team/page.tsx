import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getTeamMembers, getTeamStats } from "@/server/actions/team";
import { TeamPageClient } from "@/components/team/team-page-client";

export default async function TeamPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch team data with error handling
  let members: Awaited<ReturnType<typeof getTeamMembers>> = [];
  let stats: Awaited<ReturnType<typeof getTeamStats>> = {
    totalMembers: 0,
    activeMembers: 0,
    adminCount: 0,
    developerCount: 0,
    reviewerCount: 0,
  };

  try {
    [members, stats] = await Promise.all([
      getTeamMembers(),
      getTeamStats(),
    ]);
  } catch (error) {
    console.error("Error fetching team data:", error);
    // Continue with default values if fetch fails
  }

  return (
    <TeamPageClient
      members={members}
      stats={stats}
      currentUserId={session.user.id}
      isAdmin={session.user.role === "admin"}
    />
  );
}
