"use client";

import { getRoleColor, getRoleDotColor } from "@/lib/utils/role-colors";

interface RoleDistribution {
  role: string;
  task_count: number;
}

interface RoleDistributionChartProps {
  distribution: RoleDistribution[];
}

export function RoleDistributionChart({ distribution }: RoleDistributionChartProps) {
  if (!distribution.length) return null;

  const totalTasks = distribution.reduce((sum, d) => sum + d.task_count, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Role Distribution</h4>
        <span className="text-xs text-muted-foreground">{totalTasks} total tasks</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
        {distribution.map((d) => {
          const percentage = totalTasks > 0 ? (d.task_count / totalTasks) * 100 : 0;
          if (percentage === 0) return null;
          return (
            <div
              key={d.role}
              className={`${getRoleDotColor(d.role)} transition-all`}
              style={{ width: `${percentage}%` }}
              title={`${d.role}: ${d.task_count} tasks (${Math.round(percentage)}%)`}
            />
          );
        })}
      </div>

      {/* Legend pills */}
      <div className="flex flex-wrap gap-2">
        {distribution.map((d) => {
          const colors = getRoleColor(d.role);
          return (
            <div
              key={d.role}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
            >
              <div className={`h-2 w-2 rounded-full ${getRoleDotColor(d.role)}`} />
              {d.role}: {d.task_count} tasks
            </div>
          );
        })}
      </div>
    </div>
  );
}
