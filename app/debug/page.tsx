
import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { getUserProjects } from "@/server/actions/projects";
import { notFound, redirect } from "next/navigation";

export default async function DebugPage() {
    const session = await auth();

    // Admin-only: non-admins and unauthenticated users cannot access this page
    if (!session?.user) {
        redirect("/login");
    }
    if (session.user.role !== "admin") {
        notFound();
    }


    const dbUser = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
            projectMemberships: { include: { project: true } },
            verticals: { include: { vertical: true } },
        }
    });

    const projects = await getUserProjects();

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">Diagnose Profile Connection</h1>

            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4 p-4 border rounded bg-slate-50">
                    <h2 className="font-semibold text-lg">Current Session (Who you are logged in as)</h2>
                    <pre className="text-xs overflow-auto bg-white p-2 rounded">
                        {JSON.stringify(session.user, null, 2)}
                    </pre>
                    <div>
                        <strong>User ID:</strong> <code className="bg-yellow-100 px-1">{session.user.id}</code>
                    </div>
                    <div>
                        <strong>Email:</strong> {session.user.email}
                    </div>
                </div>

                <div className="space-y-4 p-4 border rounded bg-slate-50">
                    <h2 className="font-semibold text-lg">Database Record (What the DB has)</h2>
                    <pre className="text-xs overflow-auto bg-white p-2 rounded">
                        {JSON.stringify(dbUser, null, 2)}
                    </pre>
                </div>
            </div>

            <div className="p-4 border rounded bg-blue-50">
                <h2 className="font-semibold text-lg">Visible Projects (via getUserProjects)</h2>
                <pre className="text-xs overflow-auto bg-white p-2 rounded">
                    {JSON.stringify(projects, null, 2)}
                </pre>
                {projects.length === 0 ? (
                    <p className="text-red-500 font-bold mt-2">❌ No projects found for this User ID.</p>
                ) : (
                    <p className="text-green-500 font-bold mt-2">✅ Projects found!</p>
                )}
            </div>

            <div className="p-4 border rounded bg-yellow-50">
                <h2 className="font-semibold text-lg">Troubleshooting Guide</h2>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>IDs Match?</strong> Check if the User ID in this "Session" block matches the User ID the Admin sees in the URL or Database.</li>
                    <li><strong>Email Match?</strong> If you have two accounts (one Email, one GitHub), they might be separate.</li>
                    <li><strong>Projects Missing?</strong> If IDs match but projects are 0, it's a permissions/query issue.</li>
                </ul>
            </div>
        </div>
    );
}
