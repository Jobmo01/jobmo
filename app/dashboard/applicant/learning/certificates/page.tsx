import { format } from "date-fns";
import { Award, Download } from "lucide-react";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { certificateRepository } from "@/lib/repositories/quiz-repository";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CertificatesPage() {
  const account = await profileRepository.getCurrent();
  if (!account) return null;

  const certificates = await certificateRepository.listForApplicant(account.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">My Certificates</h1>
        <p className="text-sm text-muted-foreground">Earned by passing quizzes in the Learning Center.</p>
      </div>

      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <Award className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No certificates yet — pass a quiz to earn your first one.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert.id} className="border-accent/30">
              <CardContent className="p-5">
                <Award className="h-6 w-6 text-accent" />
                <p className="mt-3 font-medium">{cert.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Issued {format(new Date(cert.issued_at), "d MMM yyyy")}
                </p>
                <Button size="sm" variant="outline" className="mt-4" asChild>
                  <a href={`/api/certificate/${cert.id}`} download>
                    <Download className="h-4 w-4" /> Download
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
