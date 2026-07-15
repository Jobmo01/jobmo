import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { certificateRepository } from "@/lib/repositories/quiz-repository";
import { CertificateTemplate, type CertificateData } from "@/lib/pdf/certificate-template";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await profileRepository.getCurrent();
  if (!account) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const certificate = await certificateRepository.getById(id);
  if (!certificate) {
    // RLS already scopes this to the owner or an admin.
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const data: CertificateData = {
    recipientName: account.full_name ?? account.email,
    title: certificate.title,
    issuedAt: certificate.issued_at,
  };

  const buffer = await renderToBuffer(CertificateTemplate({ data }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="JobMo_Certificate_${certificate.title.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
