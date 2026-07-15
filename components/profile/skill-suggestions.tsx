"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { extractSkillSuggestionsAction, addSuggestedSkillAction } from "@/app/dashboard/applicant/profile/skills-ai-actions";

export function SkillSuggestions() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[] | null>(null);
  const [addedSkills, setAddedSkills] = React.useState<Set<string>>(new Set());
  const [aiUnavailableNotice, setAiUnavailableNotice] = React.useState<string | null>(null);

  async function handleSuggest() {
    setIsLoading(true);
    setAiUnavailableNotice(null);
    const result = await extractSkillSuggestionsAction();
    setIsLoading(false);
    if (result.aiUnavailable) {
      setAiUnavailableNotice(result.error ?? "AI features aren't set up yet.");
      return;
    }
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setSuggestions(result.suggestions ?? []);
  }

  async function handleAdd(name: string) {
    const result = await addSuggestedSkillAction(name);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setAddedSkills((prev) => new Set(prev).add(name));
    router.refresh();
  }

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-accent" /> AI skill suggestions
          </p>
          <Button size="sm" variant="outline" onClick={handleSuggest} disabled={isLoading}>
            {isLoading ? "Analyzing…" : "Suggest from my experience"}
          </Button>
        </div>

        {aiUnavailableNotice && (
          <p className="mt-2 text-xs text-muted-foreground">{aiUnavailableNotice}</p>
        )}

        {suggestions && suggestions.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            No new suggestions — your listed skills already look complete based on your experience.
          </p>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => {
              const added = addedSkills.has(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={added}
                  onClick={() => handleAdd(s)}
                  className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-card px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
                >
                  {added ? "Added ✓" : <><Plus className="h-3 w-3" /> {s}</>}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
