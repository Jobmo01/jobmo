import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Admin overview</h1>
        <p className="text-sm text-muted-foreground">Platform health and pending actions.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Pending DOB requests", value: 0 },
          { label: "Employer approvals", value: 0 },
          { label: "Open support tickets", value: 0 },
          { label: "Flagged content", value: 0 },
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
          User management, employer approvals, DOB-change approvals with
          audit trail, content moderation, and platform analytics land in
          Phase 6 — Administration.
        </CardContent>
      </Card>
    </div>
  );
}
