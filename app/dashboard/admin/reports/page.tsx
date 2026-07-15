import { ReportsPanel } from "@/components/admin/reports-panel";

export default function ReportsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Export platform data as a PDF or Excel file — filter by status, type, and date
          range first, then export only what you need.
        </p>
      </div>
      <ReportsPanel />
    </div>
  );
}
