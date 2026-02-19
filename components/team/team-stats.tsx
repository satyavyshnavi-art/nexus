"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Crown, User } from "lucide-react";

type FilterType = "all" | "active" | "admin" | "member";

interface TeamStatsProps {
  stats: {
    totalMembers: number;
    activeMembers: number;
    adminCount: number;
    memberCount: number;
  };
  activeFilter?: FilterType;
  onFilterChange?: (filter: FilterType) => void;
}

export function TeamStats({ stats, activeFilter = "all", onFilterChange }: TeamStatsProps) {
  const statCards: { title: string; value: number; icon: typeof Users; description: string; color: string; bgColor: string; borderColor: string; filter: FilterType }[] = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      description: "All team members",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-l-purple-500 dark:border-l-purple-400",
      filter: "all",
    },
    {
      title: "Active Members",
      value: stats.activeMembers,
      icon: UserCheck,
      description: "With active tasks",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-l-green-500 dark:border-l-green-400",
      filter: "active",
    },
    {
      title: "Admins",
      value: stats.adminCount,
      icon: Crown,
      description: "Administrator access",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-l-amber-500 dark:border-l-amber-400",
      filter: "admin",
    },
    {
      title: "Members",
      value: stats.memberCount,
      icon: User,
      description: "Regular members",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-l-blue-500 dark:border-l-blue-400",
      filter: "member",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const isActive = activeFilter === stat.filter;
        return (
          <Card
            key={stat.title}
            className={`
              border-l-4 ${stat.borderColor}
              cursor-pointer transition-all duration-200
              ${isActive
                ? "ring-2 ring-primary shadow-lg scale-[1.02]"
                : "hover:shadow-md hover:-translate-y-0.5"
              }
            `}
            onClick={() => onFilterChange?.(isActive ? "all" : stat.filter)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2.5 rounded-lg`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {isActive ? "✓ Filtering" : stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
