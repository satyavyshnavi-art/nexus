"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { generateWeeklySummary } from "@/server/actions/weekly-summary";
import { useRouter } from "next/navigation";

interface WeeklySummaryData {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  summary: string;
  highlights: string[];
  blockers: string[];
  createdAt: Date;
}

interface WeeklySummarySectionProps {
  projectId: string;
  summaries: WeeklySummaryData[];
  isAdmin: boolean;
}

export function WeeklySummarySection({ projectId, summaries, isAdmin }: WeeklySummarySectionProps) {
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(
    summaries.length > 0 ? summaries[0].id : null
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await generateWeeklySummary(projectId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  };

  const formatWeekRange = (start: Date, end: Date) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Weekly Summaries
            </CardTitle>
            <CardDescription>AI-generated weekly progress summaries</CardDescription>
          </div>
          {isAdmin && (
            <Button
              onClick={handleGenerate}
              disabled={generating}
              size="sm"
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? "Generating..." : "Generate Summary"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {summaries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No summaries generated yet. {isAdmin ? "Click Generate Summary to create one." : ""}
          </p>
        ) : (
          <div className="space-y-3">
            {summaries.map((s) => {
              const isExpanded = expandedId === s.id;
              return (
                <div key={s.id} className="border rounded-lg">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="flex items-center justify-between w-full p-3 text-left hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">
                        {formatWeekRange(s.weekStart, s.weekEnd)}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </Badge>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-sm text-muted-foreground">{s.summary}</p>

                      {s.highlights.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Highlights</h4>
                          <ul className="space-y-1">
                            {s.highlights.map((h, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {s.blockers.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Blockers</h4>
                          <ul className="space-y-1">
                            {s.blockers.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
