"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateResumeAnalysisAction } from "@/app/dashboard/applicant/resume/actions";

interface Props {
  unlocked: boolean;
  aiSummary: string | null;
  resumeScore: number | null;
  feedback: string[];
  missingSkillSuggestions: string[];
}

export function AiResumeInsights({ unlocked, aiSummary, resumeScore, feedback, missingSkillSuggestions }: Props) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [aiUnavailable, setAiUnavailable] = React.useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    const result = await generateResumeAnalysisAction();
    setIsGenerating(false);
    if (result.aiUnavailable) {
      setAiUnavailable(true);
      return;
    }
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("AI insights generated");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" /> AI writing & ATS scoring
        </CardTitle>
        {unlocked && (
          <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isGenerating}>
            <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            {aiSummary ? "Regenerate" : "Generate insights"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!unlocked ? (
          <p className="text-sm text-muted-foreground">
            Reach 100% profile completion to generate AI insights.
          </p>
        ) : aiUnavailable ? (
          <p className="text-sm text-muted-foreground">
            AI features aren&apos;t set up yet on this deployment — add an{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">OPENAI_API_KEY</code> in your
            environment variables to enable resume analysis, then try again.
          </p>
        ) : !aiSummary ? (
          <p className="text-sm text-muted-foreground">
            Generate a professional summary, an ATS score, and specific suggestions —
            based on your actual profile data.
          </p>
        ) : (
          <div className="space-y-4">
            {resumeScore !== null && (
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Resume score</span>
                  <span className="font-display text-lg font-semibold text-accent">{resumeScore}/100</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-accent transition-all" style={{ width: `${resumeScore}%` }} />
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Professional summary</p>
              <p className="mt-1.5 rounded-md bg-secondary/50 p-3 text-sm leading-relaxed">{aiSummary}</p>
            </div>
            {feedback.length > 0 && (
              <div>
                <p className="text-sm font-medium">Suggestions</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {feedback.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
            {missingSkillSuggestions.length > 0 && (
              <div>
                <p className="text-sm font-medium">Consider adding these skills</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {missingSkillSuggestions.map((s) => (
                    <span key={s} className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
