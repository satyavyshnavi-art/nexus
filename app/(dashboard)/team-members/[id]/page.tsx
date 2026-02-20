import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProfileCard } from "@/components/profile-card";

export default async function TeamMemberPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { id } = await params;

    const user = await db.user.findUnique({
        where: { id },
        include: {
            verticals: {
                include: {
                    vertical: true,
                },
            },
            projectMemberships: {
                include: {
                    project: true,
                },
            },
            assignedTasks: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                    sprint: {
                        select: {
                            project: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    updatedAt: 'desc',
                },
            },
        },
    });

    if (!user) notFound();

    // Prepare data for Client Component
    const stats = {
        projectsCount: user.projectMemberships.length,
        activeTasksCount: user.assignedTasks.filter(t => t.status !== 'done').length,
        completedTasksCount: user.assignedTasks.filter(t => t.status === 'done').length,
    };

    const projects = user.projectMemberships.map(pm => ({
        id: pm.project.id,
        name: pm.project.name,
        description: pm.project.description,
        createdAt: pm.createdAt,
    }));

    const tasks = user.assignedTasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        project: t.sprint?.project ? { name: t.sprint.project.name } : undefined,
    }));

    const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
        verticals: user.verticals.map(v => ({ name: v.vertical.name })),
        designation: user.designation,
    };

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="flex items-center gap-4">
                <Link href="/team">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Team Member Profile</h1>
            </div>

            <div className="flex justify-center pt-8">
                <ProfileCard
                    user={userData}
                    stats={stats}
                    projects={projects}
                    tasks={tasks}
                />
            </div>
        </div>
    );
}
