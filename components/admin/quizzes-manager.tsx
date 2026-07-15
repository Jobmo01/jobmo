"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { createQuizAction, deleteQuizAction, updateQuizAction } from "@/app/dashboard/admin/learning-center/actions";
import type { LearningCategory, Quiz } from "@/types/database.types";

export function QuizzesManager({ quizzes, categories }: { quizzes: Quiz[]; categories: LearningCategory[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [timeLimit, setTimeLimit] = React.useState("10");
  const [passingScore, setPassingScore] = React.useState("70");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createQuizAction({
      category_id: categoryId, title, description,
      time_limit_minutes: timeLimit, passing_score_percent: passingScore, status: "draft",
    });
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success("Quiz created — add questions next");
    setOpen(false);
    router.push(`/dashboard/admin/learning-center/quizzes/${result.data?.id}`);
  }

  async function togglePublish(quiz: Quiz) {
    const nextStatus = quiz.status === "published" ? "draft" : "published";
    const result = await updateQuizAction(quiz.id, { status: nextStatus });
    if (result.error) return toast.error(result.error);
    toast.success(nextStatus === "published" ? "Published" : "Unpublished");
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteQuizAction(id);
    if (result.error) return toast.error(result.error);
    toast.success("Deleted");
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" /> Add quiz</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New quiz</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Time limit (minutes)</Label>
                  <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Passing score (%)</Label>
                  <Input type="number" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create & add questions"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {quizzes.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No quizzes yet.
        </p>
      ) : (
        <div className="space-y-2">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <Link href={`/dashboard/admin/learning-center/quizzes/${quiz.id}`} className="font-medium hover:text-primary">
                    {quiz.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {quiz.time_limit_minutes} min • {quiz.passing_score_percent}% to pass
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={quiz.status === "published" ? "success" : "outline"}>{quiz.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => togglePublish(quiz)}>
                    {quiz.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Delete quiz" onClick={() => handleDelete(quiz.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
