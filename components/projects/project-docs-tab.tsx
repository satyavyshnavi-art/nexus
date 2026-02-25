"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Pencil, Trash2, FileText, FileJson, Image as ImageIcon, BookOpen } from "lucide-react";
import { DocumentModal } from "./document-modal";
import { formatDistanceToNow } from "date-fns";
import { deleteProjectDocument } from "@/server/actions/documents";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";

interface ProjectDocument {
    id: string;
    projectId: string;
    title: string;
    url: string;
    description: string | null;
    createdBy: string;
    createdAt: Date;
    creator: {
        id: string;
        name: string | null;
        email: string;
    };
}

interface ProjectDocsTabProps {
    projectId: string;
    documents: ProjectDocument[];
    currentUserId: string;
    isAdmin: boolean;
}

// Helper to determine icon based on title/url keywords
function getDocIcon(title: string, url: string) {
    const text = `${title} ${url}`.toLowerCase();
    if (text.includes("figma") || text.includes("design") || text.includes("prototype")) return <ImageIcon className="h-5 w-5 text-purple-500" />;
    if (text.includes("api") || text.includes("swagger") || text.includes("postman")) return <FileJson className="h-5 w-5 text-emerald-500" />;
    if (text.includes("wiki") || text.includes("confluence") || text.includes("notion")) return <BookOpen className="h-5 w-5 text-blue-500" />;
    return <FileText className="h-5 w-5 text-slate-500" />;
}

export function ProjectDocsTab({ projectId, documents, currentUserId, isAdmin }: ProjectDocsTabProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<ProjectDocument | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleEdit = (doc: ProjectDocument) => {
        setSelectedDoc(doc);
        setModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedDoc(null);
        setModalOpen(true);
    };

    const handleDelete = async (docId: string) => {
        setIsDeleting(docId);
        try {
            await deleteProjectDocument(docId);
            toast.success("Document deleted successfully");
        } catch (error) {
            toast.error("Failed to delete document", {
                description: error instanceof Error ? error.message : "An error occurred",
            });
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Reference Documents</h2>
                    <p className="text-sm text-muted-foreground">Important links, designs, and specifications for this project.</p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                </Button>
            </div>

            {documents.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No reference documents"
                    description="Add links to PRDs, Figma designs, API specs, or any other resources."
                    action={{
                        label: "Add First Document",
                        onClick: handleAdd
                    }}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => {
                        const canModify = isAdmin || doc.createdBy === currentUserId;

                        return (
                            <Card key={doc.id} className="flex flex-col hover:shadow-md transition-shadow">
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                {getDocIcon(doc.title, doc.url)}
                                            </div>
                                            <h3 className="font-semibold line-clamp-1" title={doc.title}>
                                                {doc.title}
                                            </h3>
                                        </div>
                                    </div>

                                    {doc.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 mt-3">
                                            {doc.description}
                                        </p>
                                    )}

                                    <div className="mt-4 text-xs text-muted-foreground">
                                        Added by {doc.creator.name || doc.creator.email} • {formatDistanceToNow(new Date(doc.createdAt))} ago
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t flex items-center justify-between gap-2 mt-auto">
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center p-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                    >
                                        Open Link
                                        <ExternalLink className="h-3 w-3 ml-1.5" />
                                    </a>

                                    {canModify && (
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(doc)} title="Edit">
                                                <Pencil className="h-4 w-4 text-slate-500" />
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" title="Delete">
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="sm:max-w-[425px]">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to remove "{doc.title}"? This cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                                            onClick={() => handleDelete(doc.id)}
                                                            disabled={isDeleting === doc.id}
                                                        >
                                                            {isDeleting === doc.id ? "Deleting..." : "Delete"}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <DocumentModal
                projectId={projectId}
                open={modalOpen}
                onOpenChange={setModalOpen}
                document={selectedDoc}
            />
        </div>
    );
}
