import { Bot, CheckCircle2, XCircle } from "lucide-react";
import { platformSettingsRepository } from "@/lib/repositories/platform-settings-repository";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlatformSettingsManager } from "@/components/super-admin/platform-settings-manager";

const SETTING_META: Record<string, { label: string; description: string }> = {
  maintenance_mode: {
    label: "Maintenance mode",
    description: "When on, non-admin visitors see a maintenance page instead of the site.",
  },
  google_oauth_enabled: {
    label: "Google sign-in",
    description: "Show the \"Continue with Google\" option on login/register.",
  },
  registrations_enabled: {
    label: "New registrations",
    description: "Allow new accounts to be created. Existing accounts can still log in when off.",
  },
};

export default async function PlatformSettingsPage() {
  const allSettings = await platformSettingsRepository.getAll();
  const settings = allSettings.map((s) => ({
    key: s.key,
    value: Boolean(s.value),
    label: SETTING_META[s.key]?.label ?? s.key,
    description: SETTING_META[s.key]?.description ?? "",
  }));

  const aiConfigured = Boolean(getOpenAIClient());

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">Feature toggles and system configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> AI configuration</CardTitle>
          <CardDescription>Status only — the actual key lives in environment variables, never in the database.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            {aiConfigured ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-success" />
                OPENAI_API_KEY is configured — AI features (resume insights, skill suggestions,
                job description improvement, interview questions) are live.
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-destructive" />
                OPENAI_API_KEY is not set — AI features show a &quot;not set up yet&quot; message to users.
                Add it to your environment variables to enable them.
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-display text-lg font-semibold">Feature toggles</h2>
        <div className="mt-3">
          <PlatformSettingsManager settings={settings} />
        </div>
      </div>
    </div>
  );
}
