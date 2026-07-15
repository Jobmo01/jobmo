import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { learningRepository } from "@/lib/repositories/learning-repository";
import { MarkCompleteButton } from "@/components/applicant/mark-complete-button";

function toEmbedUrl(url: string): string {
  const youtubeMatch = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/);
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

export default async function ContentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await profileRepository.getCurrent();
  if (!account) return null;

  const content = await learningRepository.getContentById(id);
  if (!content || content.status !== "published") notFound();

  const completedIds = await learningRepository.listCompletedContentIds(account.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/applicant/learning" className="text-sm text-muted-foreground hover:text-foreground">
          ← Learning Center
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold">{content.title}</h1>
        {content.description && <p className="mt-1 text-muted-foreground">{content.description}</p>}
        {content.duration_minutes && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {content.duration_minutes} min
          </p>
        )}
      </div>

      {content.type === "video" && (
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
          <iframe
            src={toEmbedUrl(content.body)}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {content.type === "pdf" && (
        <div className="rounded-lg border border-border">
          <iframe src={content.body} className="h-[70vh] w-full rounded-lg" />
        </div>
      )}

      {content.type === "article" && (
        <div
          className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary"
          dangerouslySetInnerHTML={{ __html: content.body }}
        />
      )}

      <MarkCompleteButton contentId={content.id} alreadyCompleted={completedIds.has(content.id)} />
    </div>
  );
}
