"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { updatePlatformSettingAction } from "@/app/dashboard/super-admin/actions";

interface SettingToggle {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

export function PlatformSettingsManager({ settings }: { settings: SettingToggle[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function handleToggle(key: string, next: boolean) {
    setPending(key);
    const result = await updatePlatformSettingAction(key, next);
    setPending(null);
    if (result.error) return toast.error(result.error);
    toast.success("Setting updated");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {settings.map((s) => (
        <Card key={s.key} className={s.key === "maintenance_mode" && s.value ? "border-destructive/40" : ""}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <div className="flex items-center gap-2">
                <Label className="font-medium">{s.label}</Label>
                {s.key === "maintenance_mode" && s.value && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" /> Site is in maintenance mode
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
            <button
              role="switch"
              aria-checked={s.value}
              disabled={pending === s.key}
              onClick={() => handleToggle(s.key, !s.value)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${s.value ? "bg-primary" : "bg-secondary"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  s.value ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
