import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getProjectCached } from "@/server/actions/projects";
import { getProjectAttachments } from "@/server/actions/project-attachments";
import { ProjectDocumentsList } from "@/components/projects/project-documents-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ProjectDocumentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { projectId } = await params;

  let project;
  try {
    project = await getProjectCached(projectId, session.user.id, session.user.role);
  } catch {
    redirect("/");
  }

  const attachments = await getProjectAttachments(projectId);
  const isAdmin = session.user.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{project.name} - Documents</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage project files
        </p>
      </div>

      <ProjectDocumentsList
        projectId={projectId}
        initialAttachments={attachments}
        currentUserId={session.user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
