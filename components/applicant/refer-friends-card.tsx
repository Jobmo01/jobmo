import { Users2, Award } from "lucide-react";
import { referralRepository } from "@/lib/repositories/referral-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShareButton } from "@/components/marketing/share-button";

const TALENT_SCOUT_THRESHOLD = 3;

export async function ReferFriendsCard({ applicantId }: { applicantId: string }) {
  const [referralCode, referralCount] = await Promise.all([
    referralRepository.getOrCreateReferralCode(applicantId),
    referralRepository.countReferrals(applicantId),
  ]);

  const referralUrl = `https://www.jobmo.lk/register?ref=${referralCode}`;
  const hasBadge = referralCount >= TALENT_SCOUT_THRESHOLD;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users2 className="h-4 w-4" /> Refer friends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasBadge ? (
          <div className="flex items-center gap-2 rounded-md bg-accent/10 p-3">
            <Award className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">You&apos;re a Talent Scout!</p>
              <p className="text-sm text-muted-foreground">
                {referralCount} friend{referralCount === 1 ? "" : "s"} joined JobMo through your link.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground">
              Refer {TALENT_SCOUT_THRESHOLD} friends who create a profile and earn the{" "}
              <strong className="text-foreground">Talent Scout</strong> badge on your profile.
            </p>
            <Progress value={(referralCount / TALENT_SCOUT_THRESHOLD) * 100} className="mt-2" />
            <p className="mt-1 text-xs text-muted-foreground">{referralCount} of {TALENT_SCOUT_THRESHOLD}</p>
          </div>
        )}

        <ShareButton
          url={referralUrl}
          shareText="I've been using JobMo to find jobs in Sri Lanka — thought you might want to check it out"
          dialogTitle="Share your referral link"
          dialogDescription="Anyone who signs up through this link counts toward your Talent Scout badge."
          buttonLabel="Share your link"
        />
      </CardContent>
    </Card>
  );
}
