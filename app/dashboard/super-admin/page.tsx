import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Super Admin</h1>
        <p className="text-sm text-muted-foreground">
          Full platform control — roles, permissions, and system settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total admins", value: 1 },
          { label: "Total users", value: 1 },
          { label: "Feature flags active", value: 0 },
          { label: "System health", value: "OK" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="font-display text-3xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 6</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Admin creation, role &amp; permission management, feature toggles,
          CMS, payment/AI settings, and security/audit logs land in Phase 6.
          The <code>admin_update_profile_role()</code> RPC and{" "}
          <code>permissions</code> jsonb column on <code>profiles</code> are
          already in place from Phase 1 to support this.
        </CardContent>
      </Card>
    </div>
  );
}
