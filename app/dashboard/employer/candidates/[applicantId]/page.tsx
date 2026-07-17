import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Mail, Phone, MapPin, Award, Briefcase, GraduationCap, Languages, Heart, Users } from "lucide-react";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { companyRepository } from "@/lib/repositories/company-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { talentPoolRepository } from "@/lib/repositories/talent-pool-repository";
import { referralRepository } from "@/lib/repositories/referral-repository";
import {
  applicantProfileRepository, educationRepository, experienceRepository, skillsRepository,
  certificationsRepository, projectsRepository, awardsRepository, volunteerRepository,
  languagesRepository, hobbiesRepository, referencesRepository,
} from "@/lib/repositories/applicant-profile-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Full applicant profile, viewable by an employer — but only for a
 * candidate who has actually applied to one of their jobs, or who's in
 * their talent pool. An employer should never be able to browse arbitrary
 * applicant profiles just by guessing a URL.
 */
export default async function CandidateProfilePage({ params }: { params: Promise<{ applicantId: string }> }) {
  const { applicantId } = await params;

  const account = await profileRepository.getCurrent();
  if (!account) notFound();
  const company = await companyRepository.getByOwner(account.id);
  if (!company) notFound();

  const [hasApplied, inTalentPool] = await Promise.all([
    applicationRepository.hasApplicantAppliedToCompany(applicantId, company.id),
    talentPoolRepository.isInPool(company.id, applicantId),
  ]);
  if (!hasApplied && !inTalentPool) notFound();

  const applicantProfileRow = await profileRepository.getById(applicantId);
  if (!applicantProfileRow) notFound();

  const [
    profile, education, experience, skills, certifications, projects, awards, volunteer, languages, hobbies, references, referralCount,
  ] = await Promise.all([
    applicantProfileRepository.get(applicantId),
    educationRepository.list(applicantId),
    experienceRepository.list(applicantId),
    skillsRepository.list(applicantId),
    certificationsRepository.list(applicantId),
    projectsRepository.list(applicantId),
    awardsRepository.list(applicantId),
    volunteerRepository.list(applicantId),
    languagesRepository.list(applicantId),
    hobbiesRepository.list(applicantId),
    referencesRepository.list(applicantId),
    referralRepository.countReferrals(applicantId),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/employer/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div>
        <h1 className="inline-flex items-center gap-2 font-display text-2xl font-semibold">
          {applicantProfileRow.full_name ?? "Applicant"}
          {referralCount >= 3 && (
            <Badge variant="accent" className="gap-1"><Award className="h-3 w-3" /> Talent Scout</Badge>
          )}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {applicantProfileRow.email}</span>
          {profile?.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {profile.phone}</span>}
          {profile?.district && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.district}</span>}
        </div>
      </div>

      {skills.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {skills.map((s: any) => <Badge key={s.id} variant="secondary">{s.name}</Badge>)}
          </CardContent>
        </Card>
      )}

      {experience.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Experience</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {experience.map((e: any) => (
              <div key={e.id}>
                <p className="font-medium">{e.position} — {e.company}</p>
                <p className="text-xs text-muted-foreground">
                  {e.start_date ? format(new Date(e.start_date), "MMM yyyy") : "—"} – {e.end_date ? format(new Date(e.end_date), "MMM yyyy") : "Present"}
                </p>
                {e.description && <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {education.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Education</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {education.map((e: any) => (
              <div key={e.id}>
                <p className="font-medium">{e.qualification} — {e.institution}</p>
                {e.field_of_study && <p className="text-sm text-muted-foreground">{e.field_of_study}</p>}
                <p className="text-xs text-muted-foreground">
                  {e.start_date ? format(new Date(e.start_date), "MMM yyyy") : "—"} – {e.end_date ? format(new Date(e.end_date), "MMM yyyy") : "Present"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {certifications.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-4 w-4" /> Certifications</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {certifications.map((c: any) => (
              <div key={c.id}>
                <p className="font-medium">{c.name}</p>
                {c.issuer && <p className="text-sm text-muted-foreground">{c.issuer}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {projects.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {projects.map((p: any) => (
              <div key={p.id}>
                <p className="font-medium">{p.title}</p>
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                {p.project_url && (
                  <a href={p.project_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    View project →
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {awards.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Awards</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {awards.map((a: any) => (
              <div key={a.id}>
                <p className="font-medium">{a.title}</p>
                {a.issuer && <p className="text-sm text-muted-foreground">{a.issuer}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {volunteer.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-4 w-4" /> Volunteer experience</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {volunteer.map((v: any) => (
              <div key={v.id}>
                <p className="font-medium">{v.organization}{v.role ? ` — ${v.role}` : ""}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(languages.length > 0 || hobbies.length > 0) && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Languages className="h-4 w-4" /> Languages & interests</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {languages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {languages.map((l: any) => <Badge key={l.id} variant="outline">{l.name}{l.proficiency ? ` (${l.proficiency})` : ""}</Badge>)}
              </div>
            )}
            {hobbies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {hobbies.map((h: any) => <Badge key={h.id} variant="secondary">{h.name}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {references.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> References</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {references.map((r: any) => (
              <div key={r.id} className="text-sm">
                <p className="font-medium">{r.name}{r.relationship ? ` — ${r.relationship}` : ""}</p>
                <p className="text-muted-foreground">
                  {[r.company, r.email, r.phone].filter(Boolean).join(" • ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
