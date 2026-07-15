import { notFound } from "next/navigation";
import Link from "next/link";
import { Video, FileText, File, CheckCircle2 } from "lucide-react";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { learningRepository } from "@/lib/repositories/learning-repository";
import { Card, CardContent } from "@/components/ui/card";

const TYPE_ICON = { video: Video, article: FileText, pdf: File };

export default async function CategoryContentPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const account = await profileRepository.getCurrent();
  if (!account) return null;

  const category = await learningRepository.getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const [content, completedIds] = await Promise.all([
    learningRepository.listPublishedContent(category.id),
    learningRepository.listCompletedContentIds(account.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/applicant/learning" className="text-sm text-muted-foreground hover:text-foreground">
          ← Learning Center
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold">{category.name}</h1>
        {category.description && <p className="text-sm text-muted-foreground">{category.description}</p>}
      </div>

      {content.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nothing published in this category yet.
        </p>
      ) : (
        <div className="space-y-2">
          {content.map((item) => {
            const Icon = TYPE_ICON[item.type];
            const completed = completedIds.has(item.id);
            return (
              <Link key={item.id} href={`/dashboard/applicant/learning/content/${item.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      </div>
                    </div>
                    {completed && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
