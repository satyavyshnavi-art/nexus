"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProjectDocument, updateProjectDocument } from "@/server/actions/documents";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProjectDocument {
    id: string;
    projectId: string;
    title: string;
    url: string;
    description: string | null;
    createdBy: string;
}

interface DocumentModalProps {
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document?: ProjectDocument | null; // If provided, we're in edit mode
}

export function DocumentModal({ projectId, open, onOpenChange, document }: DocumentModalProps) {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form when document changes
    useEffect(() => {
        if (document) {
            setTitle(document.title);
            setUrl(document.url);
            setDescription(document.description || "");
        } else {
            setTitle("");
            setUrl("");
            setDescription("");
        }
    }, [document, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !url.trim()) return;

        // Basic URL validation
        let validUrl = url.trim();
        if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
            validUrl = `https://${validUrl}`;
        }

        try {
            new URL(validUrl); // Test if it's a valid URL
        } catch {
            toast.error("Please enter a valid URL.");
            return;
        }

        setIsSaving(true);
        try {
            if (document) {
                await updateProjectDocument(document.id, {
                    title: title.trim(),
                    url: validUrl,
                    description: description.trim() || null,
                });
                toast.success("Document updated successfully");
            } else {
                await createProjectDocument({
                    projectId,
                    title: title.trim(),
                    url: validUrl,
                    description: description.trim() || undefined,
                });
                toast.success("Document added successfully");
            }
            onOpenChange(false);
        } catch (error) {
            toast.error(document ? "Failed to update document" : "Failed to add document", {
                description: error instanceof Error ? error.message : "An error occurred",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{document ? "Edit Document" : "Add Reference Document"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            placeholder="e.g., Figma Design, PRD, API Docs"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            disabled={isSaving}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="url">URL <span className="text-red-500">*</span></Label>
                        <Input
                            id="url"
                            placeholder="https://..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            disabled={isSaving}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Briefly describe what this document contains..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            disabled={isSaving}
                            className="resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving || !title.trim() || !url.trim()}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {document ? "Updating..." : "Adding..."}
                                </>
                            ) : document ? (
                                "Save Changes"
                            ) : (
                                "Add Document"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
