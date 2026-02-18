"use client";

import { Briefcase, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileStatsProps {
    stats: {
        projectsCount: number;
        activeTasksCount: number;
        completedTasksCount: number;
    };
    activeTab: "projects" | "active" | "completed" | null;
    onTabToggle: (tab: "projects" | "active" | "completed") => void;
}

export function ProfileStats({ stats, activeTab, onTabToggle }: ProfileStatsProps) {
    return (
        <div className="grid grid-cols-3 gap-4 mb-6">
            <button
                onClick={() => onTabToggle("projects")}
                className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border",
                    activeTab === "projects"
                        ? "bg-primary/5 border-primary shadow-sm ring-2 ring-primary/20"
                        : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border"
                )}
            >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mb-2">
                    <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold">{stats.projectsCount}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projects</span>
            </button>

            <button
                onClick={() => onTabToggle("active")}
                className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border",
                    activeTab === "active"
                        ? "bg-primary/5 border-primary shadow-sm ring-2 ring-primary/20"
                        : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border"
                )}
            >
                <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full mb-2">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-2xl font-bold">{stats.activeTasksCount}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</span>
            </button>

            <button
                onClick={() => onTabToggle("completed")}
                className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border",
                    activeTab === "completed"
                        ? "bg-primary/5 border-primary shadow-sm ring-2 ring-primary/20"
                        : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border"
                )}
            >
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold">{stats.completedTasksCount}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed</span>
            </button>
        </div>
    );
}
