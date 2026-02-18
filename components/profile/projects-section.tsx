"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface ProjectsSectionProps {
    projects: {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
    }[];
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
    return (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Assigned Projects
            </h3>
            {projects.length > 0 ? (
                <div className="grid gap-3">
                    {projects.map((p) => (
                        <Link key={p.id} href={`/projects/${p.id}`}>
                            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium group-hover:text-primary transition-colors truncate">
                                        {p.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {p.description || "No description"}
                                    </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-center text-sm text-muted-foreground py-8 italic">
                    No projects assigned.
                </p>
            )}
        </div>
    );
}
