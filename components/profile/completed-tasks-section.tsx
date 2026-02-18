"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface CompletedTasksSectionProps {
    tasks: {
        id: string;
        title: string;
        status: string;
        project?: { name: string };
    }[];
}

export function CompletedTasksSection({ tasks }: CompletedTasksSectionProps) {
    return (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                Completed Tasks
            </h3>
            {tasks.length > 0 ? (
                <div className="grid gap-2">
                    {tasks.map((t) => (
                        <div key={t.id} className="p-3 rounded-lg border bg-green-50/50 dark:bg-green-900/10 opacity-90 hover:opacity-100 transition-opacity">
                            <div className="flex justify-between items-start mb-1 gap-2">
                                <span className="font-medium text-sm line-through text-muted-foreground flex-1">
                                    {t.title}
                                </span>
                                <Badge variant="secondary" className="text-[10px] h-5 bg-green-100 dark:bg-green-900/30 shrink-0">
                                    done
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
                    No completed tasks yet.
                </p>
            )}
        </div>
    );
}
