import { announcementRepository } from "@/lib/repositories/announcement-repository";
import { AnnouncementsManager } from "@/components/super-admin/announcements-manager";

export default async function CmsPage() {
  const announcements = await announcementRepository.listAll();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">CMS & Announcements</h1>
        <p className="text-sm text-muted-foreground">
          Active announcements appear as a banner to every signed-in user.
        </p>
      </div>
      <AnnouncementsManager announcements={announcements} />
    </div>
  );
}
