"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";

interface ProfileHeaderProps {
    user: {
        name: string | null;
        email: string;
        avatar: string | null;
        role: string;
    };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
    return (
        <div className="flex flex-row items-start gap-6 pb-6 pt-8 px-8 bg-gradient-to-b from-muted/30 to-background/10">
            <Avatar
                src={user.avatar || undefined}
                name={user.name || "User"}
                size="xl"
                className="border-4 border-background shadow-md"
            />
            <div className="space-y-2 flex-1 pt-1">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{user.name || "User"}</h2>
                        <p className="text-muted-foreground text-sm font-medium">Team Member</p>
                    </div>
                    <Badge variant="secondary" className="capitalize px-3 py-1">
                        {user.role}
                    </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${user.email}`} className="hover:text-primary hover:underline transition-colors">
                        {user.email}
                    </a>
                </div>
            </div>
        </div>
    );
}
