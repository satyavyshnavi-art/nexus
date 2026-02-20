"use client";

import { getRoleColor, getRoleDotColor } from "@/lib/utils/role-colors";

interface RoleDistribution {
  role: string;
  story_points: number;
  task_count: number;
}

interface RoleDistributionChartProps {
  distribution: RoleDistribution[];
}

export function RoleDistributionChart({ distribution }: RoleDistributionChartProps) {
  if (!distribution.length) return null;

  const totalPoints = distribution.reduce((sum, d) => sum + d.story_points, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Role Distribution</h4>
        <span className="text-xs text-muted-foreground">{totalPoints} total points</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
        {distribution.map((d) => {
          const percentage = totalPoints > 0 ? (d.story_points / totalPoints) * 100 : 0;
          if (percentage === 0) return null;
          return (
            <div
              key={d.role}
              className={`${getRoleDotColor(d.role)} transition-all`}
              style={{ width: `${percentage}%` }}
              title={`${d.role}: ${d.story_points}pt (${Math.round(percentage)}%)`}
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
              {d.role}: {d.story_points}pt
              <span className="text-muted-foreground">({d.task_count})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
