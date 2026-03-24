"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { bulkCreateTickets } from "@/server/actions/bulk-import";
import type { ExtractedTicket } from "@/lib/ai/ticket-extractor";
import { toast } from "sonner";
import {
  FileUp,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ImportTicketsButtonProps {
  sprintId: string;
}

type Step = "upload" | "review" | "importing";

export function ImportTicketsButton({ sprintId }: ImportTicketsButtonProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [isParsing, setIsParsing] = useState(false);
  const [tickets, setTickets] = useState<ExtractedTicket[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const reset = () => {
    setStep("upload");
    setTickets([]);
    setIsParsing(false);
    setIsImporting(false);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(reset, 200);
  };

  const handleFileSelect = useCallback(async (file: File) => {
    const maxSize = 4 * 1024 * 1024; // 4MB (Vercel serverless limit)
    if (file.size > maxSize) {
      toast.error("File too large", { description: "Maximum file size is 4MB" });
      return;
    }

    setFileName(file.name);
    setIsParsing(true);

    try {
      // Send file to API route for parsing (handles PDF, DOCX, etc.)
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import-tickets", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = `Server error (${response.status})`;
        try {
          const err = JSON.parse(text);
          errorMsg = err.error || errorMsg;
        } catch {
          // Response was not JSON (e.g., "Request Entity Too Large")
          if (text.length < 200) errorMsg = text;
        }
        toast.error("Failed to extract tickets", { description: errorMsg });
        setIsParsing(false);
        return;
      }

      const result = await response.json();

      if (!result.success) {
        toast.error("Failed to extract tickets", { description: result.error });
        setIsParsing(false);
        return;
      }

      setTickets(result.tickets);
      setStep("review");
    } catch (error) {
      toast.error("Failed to process file", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeTicket = (index: number) => {
    setTickets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (tickets.length === 0) return;

    setIsImporting(true);
    setStep("importing");

    try {
      const result = await bulkCreateTickets(sprintId, tickets);

      if (!result.success) {
        toast.error("Import failed", { description: result.error });
        setStep("review");
        setIsImporting(false);
        return;
      }

      toast.success(`${result.count} tickets imported!`);
      router.refresh();
      handleClose();
    } catch (error) {
      toast.error("Import failed");
      setStep("review");
    } finally {
      setIsImporting(false);
    }
  };

  const priorityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  const typeColors: Record<string, string> = {
    bug: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    story: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    task: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <>
      <Button
        variant="outline"
        className="glass hover:bg-muted/50"
        onClick={() => setOpen(true)}
      >
        <FileUp className="h-4 w-4 mr-2" />
        Import Tickets
      </Button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {step === "upload" && "Import Tickets from Document"}
              {step === "review" && `Review Extracted Tickets (${tickets.length})`}
              {step === "importing" && "Importing Tickets..."}
            </DialogTitle>
            <DialogDescription>
              {step === "upload" &&
                "Upload a document containing tickets, bugs, or tasks. AI will extract them automatically."}
              {step === "review" &&
                "Review the tickets below. Remove any you don't want, then confirm import."}
              {step === "importing" && "Creating tickets in the sprint..."}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="space-y-4 py-4">
              <label
                htmlFor="import-tickets-file"
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors block ${
                  isParsing ? "border-muted cursor-wait" : "hover:border-primary cursor-pointer"
                }`}
              >
                <input
                  id="import-tickets-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.md,.pdf,.doc,.docx"
                  onChange={handleInputChange}
                  className="sr-only"
                  disabled={isParsing}
                />
                {isParsing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                    <p className="text-sm font-medium">
                      AI is extracting tickets from {fileName}...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This may take a few seconds
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">
                      Click to upload a document
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      .txt, .csv, .md, .pdf, .doc, .docx (max 4MB)
                    </p>
                  </div>
                )}
              </label>

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">How it works:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Upload a document with your tickets/tasks/bugs listed</li>
                  <li>AI reads the document and extracts each ticket</li>
                  <li>Review and remove any tickets you don't want</li>
                  <li>Confirm to add all tickets to the active sprint</li>
                </ol>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === "review" && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <FileText className="h-4 w-4" />
                <span>From: {fileName}</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {tickets.map((ticket, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{ticket.title}</p>
                        {ticket.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {ticket.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              typeColors[ticket.type] || typeColors.task
                            }`}
                          >
                            {ticket.type}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              priorityColors[ticket.priority] || priorityColors.medium
                            }`}
                          >
                            {ticket.priority}
                          </span>
                          {ticket.requiredRole && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                              {ticket.requiredRole}
                            </span>
                          )}
                          {ticket.labels?.map((label) => (
                            <span
                              key={label}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeTicket(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {tickets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">All tickets removed. Upload a different document?</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t mt-4">
                <Button variant="outline" onClick={reset}>
                  Upload Different File
                </Button>
                <Button onClick={handleImport} disabled={tickets.length === 0}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Import {tickets.length} Ticket{tickets.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-sm font-medium">
                Creating {tickets.length} tickets...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
