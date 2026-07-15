"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface StatusGroup {
  label: string;
  count: number;
  color: string;
}

const STATUS_GROUPS: Record<string, string> = {
  applied: "Applied", viewed: "Applied",
  shortlisted: "In progress", assessment: "In progress", interview_scheduled: "In progress",
  interview_completed: "In progress", pending_decision: "In progress", selected: "In progress",
  offer_sent: "In progress",
  hired: "Hired", offer_accepted: "Hired",
  rejected: "Not selected", offer_rejected: "Not selected",
};

const GROUP_COLORS: Record<string, string> = {
  "Applied": "hsl(var(--muted-foreground))",
  "In progress": "hsl(var(--primary))",
  "Hired": "hsl(var(--success))",
  "Not selected": "hsl(var(--destructive))",
};

export function PipelineStatusChart({ applications }: { applications: { status: string }[] }) {
  const counts: Record<string, number> = {};
  for (const app of applications) {
    const group = STATUS_GROUPS[app.status] ?? "Applied";
    counts[group] = (counts[group] ?? 0) + 1;
  }

  const data: StatusGroup[] = Object.entries(counts).map(([label, count]) => ({
    label, count, color: GROUP_COLORS[label] ?? "hsl(var(--muted-foreground))",
  }));

  if (applications.length === 0) {
    return (
      <div className="flex h-[180px] flex-col items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">No applications yet — your pipeline will show up here.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="h-[160px] w-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} application${value === 1 ? "" : "s"}`, name]}
              contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {data.map((entry) => (
          <div key={entry.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.label}</span>
            <span className="font-medium">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
