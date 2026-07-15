import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { profileRepository } from "@/lib/repositories/profile-repository";
import {
  applicantProfileRepository,
  educationRepository,
  experienceRepository,
  skillsRepository,
  certificationsRepository,
  languagesRepository,
  getProfileCompletion,
} from "@/lib/repositories/applicant-profile-repository";
import { ClassicResumeTemplate, ModernResumeTemplate, type ResumeData } from "@/lib/pdf/resume-templates";

const FREE_TEMPLATES = ["classic", "modern"] as const;
type FreeTemplate = (typeof FREE_TEMPLATES)[number];

export async function GET(request: NextRequest) {
  const account = await profileRepository.getCurrent();
  if (!account) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const templateParam = request.nextUrl.searchParams.get("template") ?? "classic";
  if (!FREE_TEMPLATES.includes(templateParam as FreeTemplate)) {
    return NextResponse.json(
      { error: "That template isn't available for download yet — premium templates are coming soon." },
      { status: 400 }
    );
  }
  const template = templateParam as FreeTemplate;

  const completion = await getProfileCompletion(account.id);
  if (completion.percentage < 100) {
    return NextResponse.json(
      { error: "Reach 100% profile completion to unlock the Resume Builder." },
      { status: 403 }
    );
  }

  const [profile, education, experience, skills, certifications, languages] = await Promise.all([
    applicantProfileRepository.get(account.id),
    educationRepository.list(account.id),
    experienceRepository.list(account.id),
    skillsRepository.list(account.id),
    certificationsRepository.list(account.id),
    languagesRepository.list(account.id),
  ]);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const data: ResumeData = {
    account: { full_name: account.full_name, email: account.email },
    profile,
    education,
    experience,
    skills,
    certifications,
    languages,
  };

  const Document = template === "classic" ? ClassicResumeTemplate({ data }) : ModernResumeTemplate({ data });
  const buffer = await renderToBuffer(Document);

  const fileName = `${(account.full_name ?? "resume").replace(/\s+/g, "_")}_JobMo_Resume.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
