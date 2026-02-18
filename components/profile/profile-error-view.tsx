
"use client";

import { signOut } from "next-auth/react";
import { AlertCircle, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileErrorViewProps {
    error: string;
    userId?: string;
}

export function ProfileErrorView({ error, userId }: ProfileErrorViewProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
            <Card className="w-full max-w-md border-red-200 shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-2">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-xl text-red-700">Unable to Load Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-muted-foreground text-sm">
                        We encountered an issue fetching your profile data.
                    </p>

                    <div className="bg-red-50 p-3 rounded border border-red-100 font-mono text-xs text-red-800 break-all">
                        {error}
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                        Session ID: <span className="font-mono bg-slate-100 px-1 rounded">{userId || "Unknown"}</span>
                    </div>

                    <div className="bg-amber-50 p-3 rounded border border-amber-100 text-xs text-amber-800">
                        <strong>Troubleshooting:</strong> If you see "User not found", your session may be stale. Please try signing out and logging in again.
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button
                        variant="destructive"
                        className="w-full gap-2"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                        <LogOut className="h-4 w-4" />
                        Force Sign Out
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="h-4 w-4" />
                        Retry
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
