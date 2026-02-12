import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Crown, User } from "lucide-react";

interface TeamStatsProps {
  stats: {
    totalMembers: number;
    activeMembers: number;
    adminCount: number;
    memberCount: number;
  };
}

export function TeamStats({ stats }: TeamStatsProps) {
  const statCards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      description: "All team members",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Active Members",
      value: stats.activeMembers,
      icon: UserCheck,
      description: "With active tasks",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Admins",
      value: stats.adminCount,
      icon: Crown,
      description: "Administrator access",
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Members",
      value: stats.memberCount,
      icon: User,
      description: "Regular members",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
