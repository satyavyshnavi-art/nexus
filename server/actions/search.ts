"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";

export type SearchResult = {
    type: "project" | "task" | "user" | "sprint";
    id: string;
    title: string;
    subtitle?: string;
    url: string;
    avatar?: string | null;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
    const session = await auth();
    if (!session?.user) return [];

    // Minimum 2 chars
    if (!query || query.length < 2) return [];

    const isAdmin = session.user.role === "admin";
    const userId = session.user.id;

    // 1. Search Projects
    // Admin sees all, members see assigned + vertical
    const projectWhere: any = {
        AND: [
            {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                ],
            },
        ],
    };

    if (!isAdmin) {
        projectWhere.AND.push({
            members: { some: { userId } },
        });
    }

    const projects = await db.project.findMany({
        where: projectWhere,
        take: 5,
        select: { id: true, name: true, description: true },
    });

    // 2. Search Tasks
    const taskWhere: any = {
        AND: [
            {
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                ],
            },
        ],
    };

    if (!isAdmin) {
        taskWhere.AND.push({
            sprint: {
                project: {
                    members: { some: { userId } },
                },
            },
        });
    }

    const tasks = await db.task.findMany({
        where: taskWhere,
        take: 5,
        select: {
            id: true,
            title: true,
            status: true,
            sprint: {
                select: {
                    projectId: true,
                    project: { select: { name: true } },
                },
            },
        },
    });

    // 3. Search Users (Team)
    const users = await db.user.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
            ],
        },
        take: 5,
        select: { id: true, name: true, email: true, role: true, avatar: true },
    });

    // 4. Search Sprints
    const sprintWhere: any = {
        AND: [
            { name: { contains: query, mode: "insensitive" } },
        ],
    };

    if (!isAdmin) {
        sprintWhere.AND.push({
            project: {
                members: { some: { userId } },
            },
        });
    }

    const sprints = await db.sprint.findMany({
        where: sprintWhere,
        take: 5,
        select: {
            id: true,
            name: true,
            status: true,
            projectId: true,
            project: { select: { name: true } },
        },
    });

    // Format results
    const results: SearchResult[] = [];

    projects.forEach((p) => {
        results.push({
            type: "project",
            id: p.id,
            title: p.name,
            subtitle: "Project",
            url: `/projects/${p.id}`,
        });
    });

    tasks.forEach((t) => {
        results.push({
            type: "task",
            id: t.id,
            title: t.title,
            subtitle: `${t.status} • ${t.sprint.project.name}`,
            url: `/projects/${t.sprint.projectId}`,
        });
    });

    users.forEach((u) => {
        results.push({
            type: "user",
            id: u.id,
            title: u.name || u.email,
            subtitle: u.name ? `${u.email} • ${u.role}` : u.role,
            url: `/team-members/${u.id}`,
            avatar: u.avatar,
        });
    });

    sprints.forEach((s) => {
        results.push({
            type: "sprint",
            id: s.id,
            title: s.name,
            subtitle: `${s.status.charAt(0).toUpperCase() + s.status.slice(1)} • ${s.project.name}`,
            url: `/projects/${s.projectId}/sprints/${s.id}`,
        });
    });

    return results;
}
