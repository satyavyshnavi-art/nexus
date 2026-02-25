import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  ListTodo,
  Clock,
} from "lucide-react";

interface SprintMetricsCardsProps {
  completionPercentage: number;
  totalTasks: number;
  durationDays: number;
}

export function SprintMetricsCards({
  completionPercentage,
  totalTasks,
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
      label: "Duration",
      value: `${durationDays}d`,
      icon: Clock,
      color: "border-l-amber-500",
      iconColor: "text-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
