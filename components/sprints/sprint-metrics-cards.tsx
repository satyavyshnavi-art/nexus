import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  ListTodo,
  Star,
  TrendingUp,
  Clock,
} from "lucide-react";

interface SprintMetricsCardsProps {
  completionPercentage: number;
  totalTasks: number;
  storyPoints: { completed: number; total: number };
  velocity: number;
  durationDays: number;
}

export function SprintMetricsCards({
  completionPercentage,
  totalTasks,
  storyPoints,
  velocity,
  durationDays,
}: SprintMetricsCardsProps) {
  const metrics = [
    {
      label: "Completion",
      value: `${completionPercentage}%`,
      icon: CheckCircle2,
      color: "border-l-green-500",
      iconColor: "text-green-500",
    },
    {
      label: "Total Tasks",
      value: totalTasks.toString(),
      icon: ListTodo,
      color: "border-l-slate-500",
      iconColor: "text-slate-500",
    },
    {
      label: "Story Points",
      value: `${storyPoints.completed}/${storyPoints.total}`,
      icon: Star,
      color: "border-l-purple-500",
      iconColor: "text-purple-500",
    },
    {
      label: "Velocity",
      value: `${velocity} SP`,
      icon: TrendingUp,
      color: "border-l-blue-500",
      iconColor: "text-blue-500",
    },
    {
      label: "Duration",
      value: `${durationDays}d`,
      icon: Clock,
      color: "border-l-amber-500",
      iconColor: "text-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <Card key={m.label} className={`p-4 border-l-4 ${m.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-4 w-4 ${m.iconColor}`} />
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </div>
            <p className="text-2xl font-bold">{m.value}</p>
          </Card>
        );
      })}
    </div>
  );
}
