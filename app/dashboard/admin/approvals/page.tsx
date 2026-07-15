import { dobReviewRepository } from "@/lib/repositories/dob-review-repository";
import { companyRepository } from "@/lib/repositories/company-repository";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DobApprovals } from "@/components/admin/dob-approvals";
import { CompanyApprovals } from "@/components/admin/company-approvals";

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const [dobRequests, companies] = await Promise.all([
    dobReviewRepository.listByStatus("all"),
    companyRepository.listForAdmin(),
  ]);

  const pendingDobCount = dobRequests.filter((r: any) => r.status === "pending").length;
  const pendingCompanyCount = companies.filter((c) => c.verification_status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Approvals</h1>
        <p className="text-sm text-muted-foreground">DOB change requests and employer verification.</p>
      </div>

      <Tabs defaultValue={tab === "companies" ? "companies" : "dob"}>
        <TabsList>
          <TabsTrigger value="dob">DOB Requests {pendingDobCount > 0 && `(${pendingDobCount})`}</TabsTrigger>
          <TabsTrigger value="companies">Companies {pendingCompanyCount > 0 && `(${pendingCompanyCount})`}</TabsTrigger>
        </TabsList>
        <TabsContent value="dob">
          <DobApprovals requests={dobRequests} />
        </TabsContent>
        <TabsContent value="companies">
          <CompanyApprovals companies={companies} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
