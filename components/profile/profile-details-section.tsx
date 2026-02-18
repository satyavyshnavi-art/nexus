"use client";

import { Badge } from "@/components/ui/badge";

interface ProfileDetailsSectionProps {
    user: {
        verticals: { name: string }[];
        designation: string | null;
    };
}

export function ProfileDetailsSection({ user }: ProfileDetailsSectionProps) {
    return (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div>
                <h3 className="text-sm font-medium mb-3 uppercase tracking-wider text-muted-foreground">
                    Verticals
                </h3>
                <div className="flex flex-wrap gap-2">
                    {user.verticals.length > 0 ? (
                        user.verticals.map((v, i) => (
                            <Badge key={i} variant="outline" className="px-3 py-1">
                                {v.name}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-sm text-muted-foreground italic">
                            No verticals assigned
                        </span>
                    )}
                </div>
            </div>
            {user.designation && (
                <div>
                    <h3 className="text-sm font-medium mb-2 uppercase tracking-wider text-muted-foreground">
                        Designation
                    </h3>
                    <p className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
                        {user.designation}
                    </p>
                </div>
            )}
        </div>
    );
}
