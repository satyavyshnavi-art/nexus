"use client";

import { Badge } from "@/components/ui/badge";

interface ActiveTasksSectionProps {
    tasks: {
        id: string;
        title: string;
        status: string;
        project?: { name: string };
    }[];
}

export function ActiveTasksSection({ tasks }: ActiveTasksSectionProps) {
    return (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Active Tasks
            </h3>
            {tasks.length > 0 ? (
                <div className="grid gap-2">
                    {tasks.map((t) => (
                        <div key={t.id} className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                            <div className="flex justify-between items-start mb-1 gap-2">
                                <span className="font-medium text-sm flex-1">{t.title}</span>
                                <Badge variant="outline" className="text-[10px] h-5 capitalize shrink-0">
                                    {t.status}
                                </Badge>
                            </div>
                            {t.project && (
                                <p className="text-xs text-muted-foreground truncate">
                                    {t.project.name}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-sm text-muted-foreground py-8 italic">
                    No active tasks.
                </p>
            )}
        </div>
    );
}
