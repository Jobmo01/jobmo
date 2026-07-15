"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

interface TimeSeriesBarChartProps {
  data: Record<string, string | number>[];
  series: ChartSeries[];
  height?: number;
}

/** Generic weekly/period bar chart — used for signup growth, application
 *  activity, and job-posting activity across the employer, admin, and
 *  platform-analytics dashboards. Pass 1 series for a simple chart, or
 *  several for a grouped comparison (e.g. applicants vs. employers). */
export function TimeSeriesBarChart({ data, series, height = 220 }: TimeSeriesBarChartProps) {
  const hasData = data.some((d) => series.some((s) => Number(d[s.key] ?? 0) > 0));

  if (!hasData) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        Not enough activity yet to chart.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
          cursor={{ fill: "hsl(var(--secondary))" }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
