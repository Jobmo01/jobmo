import { format } from "date-fns";
import { ScrollText } from "lucide-react";
import { auditLogRepository } from "@/lib/repositories/audit-log-repository";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string }>;
}) {
  const { entityType } = await searchParams;
  const [logs, entityTypes] = await Promise.all([
    auditLogRepository.list({ entityType }),
    auditLogRepository.listEntityTypes(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Every significant action across the platform — role changes, approvals, application
          status changes, account deletions, and more.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href="/dashboard/admin/audit-logs">
          <Badge variant={!entityType ? "default" : "outline"}>All</Badge>
        </a>
        {entityTypes.map((type) => (
          <a key={type} href={`/dashboard/admin/audit-logs?entityType=${type}`}>
            <Badge variant={entityType === type ? "default" : "outline"}>{type}</Badge>
          </a>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <ScrollText className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No audit log entries yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm font-medium">{log.action}</p>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "d MMM yyyy, h:mm:ss a")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {log.actor?.full_name ?? log.actor?.email ?? "System"} — {log.entity_type}
                  {log.entity_id ? ` (${log.entity_id.slice(0, 8)}…)` : ""}
                </p>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <pre className="mt-2 overflow-x-auto rounded bg-secondary/50 p-2 text-xs text-muted-foreground">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
