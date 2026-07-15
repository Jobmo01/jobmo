"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Video, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { createContentAction, deleteContentAction, updateContentAction } from "@/app/dashboard/admin/learning-center/actions";
import type { LearningCategory, LearningContentItem, ContentType, ContentStatus } from "@/types/database.types";

const TYPE_ICON = { video: Video, article: FileText, pdf: File };

export function ContentManager({ content, categories }: { content: LearningContentItem[]; categories: LearningCategory[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState("");
  const [type, setType] = React.useState<ContentType>("article");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [body, setBody] = React.useState("");
  const [durationMinutes, setDurationMinutes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createContentAction({
      category_id: categoryId, type, title, description, body,
      duration_minutes: durationMinutes || undefined, status: "draft", sort_order: content.length,
    });
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success("Content created as draft");
    setOpen(false);
    setTitle(""); setDescription(""); setBody(""); setDurationMinutes("");
    router.refresh();
  }

  async function togglePublish(item: LearningContentItem) {
    const nextStatus: ContentStatus = item.status === "published" ? "draft" : "published";
    const result = await updateContentAction(item.id, { status: nextStatus });
    if (result.error) return toast.error(result.error);
    toast.success(nextStatus === "published" ? "Published" : "Unpublished");
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteContentAction(id);
    if (result.error) return toast.error(result.error);
    toast.success("Deleted");
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" /> Add content</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New content</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as ContentType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>{type === "article" ? "Article body (HTML allowed)" : `${type === "video" ? "Video" : "PDF"} URL`}</Label>
                {type === "article" ? (
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} required />
                ) : (
                  <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="https://…" required />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Duration (minutes, optional)</Label>
                <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create as draft"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {content.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No content yet.
        </p>
      ) : (
        <div className="space-y-2">
          {content.map((item) => {
            const Icon = TYPE_ICON[item.type];
            return (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {categories.find((c) => c.id === item.category_id)?.name ?? "Uncategorized"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === "published" ? "success" : "outline"}>{item.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => togglePublish(item)}>
                      {item.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete content" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
