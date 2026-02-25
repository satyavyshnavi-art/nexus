"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, AlertTriangle, Users, Lightbulb, Loader2 } from "lucide-react";
import { generateProjectReport } from "@/server/actions/project-report";
import type { ProjectReportOutput } from "@/lib/ai/project-report";

interface ProjectReportSectionProps {
  projectId: string;
  canGenerate: boolean;
}

export function ProjectReportSection({ projectId, canGenerate }: ProjectReportSectionProps) {
  const [report, setReport] = useState<ProjectReportOutput | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateProjectReport(projectId);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Project Progress Report
            </CardTitle>
            <CardDescription>AI-generated comprehensive project analysis</CardDescription>
          </div>
          {canGenerate && (
            <Button
              onClick={handleGenerate}
              disabled={generating}
              size="sm"
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              {generating ? "Generating..." : "Generate Report"}
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

        {!report ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {canGenerate
              ? "Click Generate Report to create a comprehensive project analysis."
              : "Only admins and developers can generate reports."}
          </p>
        ) : (
          <div className="space-y-5">
            {/* Completion Rate */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Overall Completion</span>
              <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${report.completion_rate}%` }}
                />
              </div>
              <Badge variant="secondary" className="font-mono">{report.completion_rate}%</Badge>
            </div>

            {/* Executive Summary */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Executive Summary</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.executive_summary}</p>
            </div>

            {/* Risk Areas */}
            {report.risk_areas.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Risk Areas
                </h4>
                <ul className="space-y-1.5">
                  {report.risk_areas.map((risk, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-amber-500 mt-1">-</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Team Performance */}
            {report.team_performance.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Team Performance
                </h4>
                <div className="space-y-2">
                  {report.team_performance.map((tp, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="flex-shrink-0">{tp.member}</Badge>
                      <span className="text-muted-foreground">{tp.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Recommendations
                </h4>
                <ul className="space-y-1.5">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="font-medium text-foreground">{i + 1}.</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
