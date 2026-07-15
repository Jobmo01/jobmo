"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export interface DonutSlice {
  label: string;
  count: number;
  color: string;
}

/** Generic donut chart — role breakdowns, verification-status breakdowns,
 *  ticket-status breakdowns, anywhere a small set of categories needs a
 *  quick visual split. See PipelineStatusChart for the applicant-pipeline-
 *  specific version this pattern originated from. */
export function CategoryDonutChart({ data, emptyLabel }: { data: DonutSlice[]; emptyLabel: string }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[180px] flex-col items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="h-[160px] w-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" innerRadius={45} outerRadius={70} paddingAngle={2} strokeWidth={0}>
              {data.map((entry) => <Cell key={entry.label} fill={entry.color} />)}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [value, name]}
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
