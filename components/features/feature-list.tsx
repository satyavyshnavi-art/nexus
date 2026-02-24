"use client";

import { useState } from "react";
import { type FeatureWithStats } from "@/server/actions/features";
import { FeatureCard } from "./feature-card";

interface FeatureListProps {
  features: FeatureWithStats[];
  projectMembers: { id: string; name: string | null; email: string }[];
  isAdmin: boolean;
  projectId: string;
}

type StatusFilter = "all" | "backlog" | "planning" | "in_progress" | "completed";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "backlog", label: "Backlog" },
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function FeatureList({
  features,
  projectMembers,
  isAdmin,
  projectId,
}: FeatureListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredFeatures =
    statusFilter === "all"
      ? features
      : features.filter((f) => f.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((filter) => {
          const count =
            filter.value === "all"
              ? features.length
              : features.filter((f) => f.status === filter.value).length;

          return (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${
                  statusFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }
              `}
            >
              {filter.label}
              {count > 0 && (
                <span className="ml-1.5 opacity-75">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feature Cards */}
      <div className="space-y-3">
        {filteredFeatures.length > 0 ? (
          filteredFeatures.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              isAdmin={isAdmin}
              projectMembers={projectMembers}
              projectId={projectId}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">
              No features match the selected filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
