"use client";

import { useState, useMemo } from "react";
import { TeamStats } from "@/components/team/team-stats";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

interface TeamPageClientProps {
  members: Array<{
    id: string;
    name: string | null;
    email: string;
    designation: string | null;
    avatar: string | null;
    role: "admin" | "developer" | "reviewer";
    createdAt: Date;
    stats: {
      projects: number;
      activeTasks: number;
      completedTasks: number;
    };
    projectMemberships: Array<{
      project: {
        id: string;
        name: string;
      };
    }>;
    assignedTasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      type: string;
      sprint: {
        name: string;
        status: string;
        project: {
          name: string;
        };
      } | null;
    }>;
  }>;
  stats: {
    totalMembers: number;
    activeMembers: number;
    adminCount: number;
    developerCount: number;
    reviewerCount: number;
  };
  currentUserId: string;
  isAdmin: boolean;
}

type FilterType = "all" | "active" | "admin" | "developer" | "reviewer";

export function TeamPageClient({
  members,
  stats,
  currentUserId,
  isAdmin,
}: TeamPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Filter and search members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Stat card filter
      if (activeFilter === "admin" && member.role !== "admin") return false;
      if (activeFilter === "developer" && member.role !== "developer") return false;
      if (activeFilter === "reviewer" && member.role !== "reviewer") return false;
      if (activeFilter === "active" && member.stats.activeTasks === 0) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = member.name?.toLowerCase() || "";
        const email = member.email.toLowerCase();
        const designation = member.designation?.toLowerCase() || "";

        return (
          name.includes(query) ||
          email.includes(query) ||
          designation.includes(query)
        );
      }

      return true;
    });
  }, [members, searchQuery, activeFilter]);

  const filterLabel = activeFilter;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground mt-2">
            View and manage team members
          </p>
        </div>
      </div>

      {/* Statistics — clickable to filter */}
      <TeamStats
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, email, or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          Showing {filteredMembers.length} of {members.length} team members
          {activeFilter !== "all" && (
            <span className="ml-1 text-primary font-medium">
              ({filterLabel})
            </span>
          )}
        </span>
      </div>

      {/* Team Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/10">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No members found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search filters to find team members"
              : activeFilter !== "all"
                ? `No ${filterLabel} members found. Click the card again to clear the filter.`
                : "No team members to display"}
          </p>
        </div>
      )}
    </div>
  );
}
