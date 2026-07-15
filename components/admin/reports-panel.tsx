"use client";

import * as React from "react";
import { FileText, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ReportType = "jobs" | "users" | "applications" | "companies";

const APPLICATION_STATUSES = [
  "applied", "viewed", "shortlisted", "assessment", "interview_scheduled", "interview_completed",
  "pending_decision", "selected", "offer_sent", "offer_accepted", "offer_rejected", "rejected", "hired",
];

export function ReportsPanel() {
  const [reportType, setReportType] = React.useState<ReportType>("jobs");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  // Per-type filter state — kept as one object so switching tabs doesn't
  // require remounting or losing unrelated filter values.
  const [jobStatus, setJobStatus] = React.useState("");
  const [workType, setWorkType] = React.useState("");
  const [employmentType, setEmploymentType] = React.useState("");
  const [userRole, setUserRole] = React.useState("");
  const [userStatus, setUserStatus] = React.useState("");
  const [applicationStatus, setApplicationStatus] = React.useState("");
  const [verificationStatus, setVerificationStatus] = React.useState("");

  function buildQuery(fileFormat: "pdf" | "excel"): string {
    const params = new URLSearchParams();
    params.set("type", reportType);
    params.set("format", fileFormat);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    if (reportType === "jobs") {
      if (jobStatus) params.set("status", jobStatus);
      if (workType) params.set("workType", workType);
      if (employmentType) params.set("employmentType", employmentType);
    } else if (reportType === "users") {
      if (userRole) params.set("role", userRole);
      if (userStatus) params.set("status", userStatus);
    } else if (reportType === "applications") {
      if (applicationStatus) params.set("status", applicationStatus);
    } else if (reportType === "companies") {
      if (verificationStatus) params.set("verificationStatus", verificationStatus);
    }

    return params.toString();
  }

  function handleExport(fileFormat: "pdf" | "excel") {
    window.location.href = `/api/reports/export?${buildQuery(fileFormat)}`;
  }

  return (
    <div className="space-y-6">
      <Tabs value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
        <TabsList>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>From date</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>To date</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          {reportType === "jobs" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={jobStatus} onValueChange={setJobStatus}>
                  <SelectTrigger><SelectValue placeholder="Any status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Work type</Label>
                <Select value={workType} onValueChange={setWorkType}>
                  <SelectTrigger><SelectValue placeholder="Any work type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_site">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Employment type</Label>
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger><SelectValue placeholder="Any employment type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {reportType === "users" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger><SelectValue placeholder="Any role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applicant">Applicant</SelectItem>
                    <SelectItem value="employer">Employer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Account status</Label>
                <Select value={userStatus} onValueChange={setUserStatus}>
                  <SelectTrigger><SelectValue placeholder="Any status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending_verification">Pending verification</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {reportType === "applications" && (
            <div className="space-y-1.5 sm:max-w-xs">
              <Label>Status</Label>
              <Select value={applicationStatus} onValueChange={setApplicationStatus}>
                <SelectTrigger><SelectValue placeholder="Any status" /></SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {reportType === "companies" && (
            <div className="space-y-1.5 sm:max-w-xs">
              <Label>Verification status</Label>
              <Select value={verificationStatus} onValueChange={setVerificationStatus}>
                <SelectTrigger><SelectValue placeholder="Any status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="h-4 w-4" /> Export as Excel
        </Button>
        <Button variant="outline" onClick={() => handleExport("pdf")}>
          <FileText className="h-4 w-4" /> Export as PDF
        </Button>
      </div>
    </div>
  );
}
