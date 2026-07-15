import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { format } from "date-fns";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { reportsRepository } from "@/lib/repositories/reports-repository";
import { generateExcelReport } from "@/lib/reports/excel-generator";
import { ReportPdfTemplate } from "@/lib/pdf/report-template";

const REPORT_LABELS: Record<string, { title: string; sheet: string }> = {
  jobs: { title: "Job Postings Report", sheet: "Jobs" },
  users: { title: "Users Report", sheet: "Users" },
  applications: { title: "Applications Report", sheet: "Applications" },
  companies: { title: "Companies Report", sheet: "Companies" },
};

export async function GET(request: Request) {
  // API routes aren't covered by the dashboard middleware's role gating
  // (it deliberately excludes /api — "api routes handle their own auth
  // checks"), so this is checked explicitly here rather than assumed.
  const account = await profileRepository.getCurrent();
  if (!account || (account.role !== "admin" && account.role !== "super_admin")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  const fileFormat = searchParams.get("format") ?? "excel";
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;

  const meta = REPORT_LABELS[type];
  if (!meta) {
    return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  }

  let rows: Record<string, string | number>[];
  const filterSummary: string[] = [];

  try {
    switch (type) {
      case "jobs": {
        const status = searchParams.get("status") ?? undefined;
        const workType = searchParams.get("workType") ?? undefined;
        const employmentType = searchParams.get("employmentType") ?? undefined;
        if (status) filterSummary.push(`Status: ${status}`);
        if (workType) filterSummary.push(`Work type: ${workType}`);
        if (employmentType) filterSummary.push(`Employment type: ${employmentType}`);
        rows = await reportsRepository.getJobsReport({ status, workType, employmentType, dateFrom, dateTo });
        break;
      }
      case "users": {
        const role = searchParams.get("role") ?? undefined;
        const status = searchParams.get("status") ?? undefined;
        if (role) filterSummary.push(`Role: ${role}`);
        if (status) filterSummary.push(`Status: ${status}`);
        rows = await reportsRepository.getUsersReport({ role, status, dateFrom, dateTo });
        break;
      }
      case "applications": {
        const status = searchParams.get("status") ?? undefined;
        if (status) filterSummary.push(`Status: ${status}`);
        rows = await reportsRepository.getApplicationsReport({ status, dateFrom, dateTo });
        break;
      }
      case "companies": {
        const verificationStatus = searchParams.get("verificationStatus") ?? undefined;
        if (verificationStatus) filterSummary.push(`Verification: ${verificationStatus}`);
        rows = await reportsRepository.getCompaniesReport({ verificationStatus, dateFrom, dateTo });
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to generate report" }, { status: 500 });
  }

  if (dateFrom || dateTo) {
    filterSummary.push(`Date range: ${dateFrom ?? "any"} to ${dateTo ?? "any"}`);
  }
  const subtitle = filterSummary.length > 0 ? `Filtered by ${filterSummary.join(", ")}` : "All records, no filters applied";
  const generatedAt = format(new Date(), "d MMM yyyy, h:mm a");
  const filenameBase = `JobMo_${meta.sheet}_${format(new Date(), "yyyy-MM-dd")}`;

  if (fileFormat === "pdf") {
    const buffer = await renderToBuffer(
      ReportPdfTemplate({ data: { title: meta.title, subtitle, generatedAt, rows } })
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
      },
    });
  }

  const excelBuffer = generateExcelReport(meta.sheet, rows);
  return new NextResponse(new Uint8Array(excelBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`,
    },
  });
}
