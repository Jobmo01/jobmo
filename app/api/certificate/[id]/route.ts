import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { certificateRepository } from "@/lib/repositories/quiz-repository";
import { CertificateTemplate, type CertificateData } from "@/lib/pdf/certificate-template";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
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
      certificateId: certificate.id,
    };

    const buffer = await renderToBuffer(CertificateTemplate({ data }));

    // Confirmed root cause of "site wasn't available" downloads: a quiz
    // title containing anything outside Latin-1 (an em-dash, curly
    // quotes, etc. — genuinely common in admin-authored titles) crashes
    // the Content-Disposition header outright, since HTTP header values
    // can't contain arbitrary Unicode. Reproduced this directly before
    // fixing it: `"Time Management — Level 1"` throws "Cannot convert
    // argument to a ByteString" the instant the header is set, which
    // aborts the response before anything is sent — exactly the kind of
    // failure a browser shows as a connection error rather than a clean
    // HTTP error page. Stripping to safe ASCII here removes the
    // possibility entirely, regardless of what an admin later titles a
    // quiz.
    const safeFilename = certificate.title
      .replace(/[^\x20-\x7E]/g, "") // strip anything outside printable ASCII
      .replace(/\s+/g, "_")
      .replace(/[^A-Za-z0-9_-]/g, "") || "Certificate";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="JobMo_Certificate_${safeFilename}.pdf"`,
      },
    });
  } catch (e) {
    console.error("Certificate generation failed:", e);
    return NextResponse.json({ error: "Failed to generate certificate. Please try again." }, { status: 500 });
  }
}
