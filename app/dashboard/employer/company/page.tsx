import { profileRepository } from "@/lib/repositories/profile-repository";
import { companyRepository } from "@/lib/repositories/company-repository";
import { CompanyProfileForm } from "@/components/employer/company-profile-form";

export default async function CompanyProfilePage() {
  const account = await profileRepository.getCurrent();
  if (!account) return null;

  const company = await companyRepository.getByOwner(account.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Company Profile</h1>
        <p className="text-sm text-muted-foreground">
          This is what applicants see on your public company page.
        </p>
      </div>
      <CompanyProfileForm company={company} />
    </div>
  );
}
