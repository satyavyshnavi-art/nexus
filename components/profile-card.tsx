"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProjectsSection } from "@/components/profile/projects-section";
import { ActiveTasksSection } from "@/components/profile/active-tasks-section";
import { CompletedTasksSection } from "@/components/profile/completed-tasks-section";
import { ProfileDetailsSection } from "@/components/profile/profile-details-section";

interface ProfileCardProps {
    user: {
        id: string;
        name: string | null;
        email: string;
        avatar: string | null;
        role: string;
        createdAt: Date;
        verticals: { name: string }[];
        designation: string | null;
    };
    stats: {
        projectsCount: number;
        activeTasksCount: number;
        completedTasksCount: number;
    };
    projects: {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
    }[];
    tasks: {
        id: string;
        title: string;
        status: string;
        project?: { name: string };
    }[];
}

export function ProfileCard({ user, stats, projects, tasks }: ProfileCardProps) {
    const [showDetails, setShowDetails] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<"projects" | "active" | "completed" | null>(null);

    const toggleTab = (tab: "projects" | "active" | "completed") => {
        if (activeTab === tab) {
            setActiveTab(null);
        } else {
            setActiveTab(tab);
            setShowDetails(true); // Auto-expand details if a stat is clicked
        }
    };

    const activeTasks = tasks.filter(t => t.status !== 'done');
    const completedTasks = tasks.filter(t => t.status === 'done');

    return (
        <Card className="w-full max-w-2xl mx-auto overflow-hidden border-none shadow-xl">
            <CardHeader className="p-0">
                <ProfileHeader user={user} />
            </CardHeader>

            <CardContent className="px-8 pb-8 pt-2">
                {/* Stats Grid */}
                <ProfileStats
                    stats={stats}
                    activeTab={activeTab}
                    onTabToggle={toggleTab}
                />

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 pl-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {format(user.createdAt, "MMM d, yyyy")}</span>
                </div>

                {/* Details Section */}
                <div className="border-t pt-4">
                    <Button
                        variant="ghost"
                        className="w-full flex justify-between items-center text-muted-foreground hover:text-foreground group"
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        <span>{showDetails ? "Hide Details" : "Show Details"}</span>
                        {showDetails ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
                        )}
                    </Button>

                    {showDetails && (
                        <div className="mt-6 space-y-6">
                            {/* Dynamic Content based on Active Tab */}
                            {activeTab === "projects" && <ProjectsSection projects={projects} />}

                            {activeTab === "active" && <ActiveTasksSection tasks={activeTasks} />}

                            {activeTab === "completed" && <CompletedTasksSection tasks={completedTasks} />}

                            {/* Default Details if no tab selected */}
                            {!activeTab && <ProfileDetailsSection user={user} />}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
