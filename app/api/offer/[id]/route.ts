import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { offerRepository } from "@/lib/repositories/offer-repository";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { OfferLetterTemplate, type OfferLetterData } from "@/lib/pdf/offer-letter-template";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await profileRepository.getCurrent();
  if (!account) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const offer = await offerRepository.getById(id);
  if (!offer) {
    // RLS already scopes this to the applicant or the hiring company —
    // a null result here means "not found or not yours", same response either way.
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  const application = await applicationRepository.getById(offer.application_id);
  const supabase = await createClient();
  const { data: applicantProfile } = await (supabase.from("profiles") as any)
    .select("full_name, email")
    .eq("id", application?.applicant_id)
    .single();

  const data: OfferLetterData = {
    companyName: application?.job_postings?.companies?.name ?? "The Company",
    applicantName: applicantProfile?.full_name ?? applicantProfile?.email ?? "Candidate",
    positionTitle: offer.position_title,
    salary: offer.salary,
    currency: offer.currency,
    startDate: offer.start_date,
    benefits: offer.benefits,
    terms: offer.terms,
    status: offer.status,
    createdAt: offer.created_at,
    respondedAt: offer.responded_at,
  };

  const buffer = await renderToBuffer(OfferLetterTemplate({ data }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Offer_Letter_${data.companyName.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
