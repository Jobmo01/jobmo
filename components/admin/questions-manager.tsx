"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  createQuestionAction, updateQuestionAction, deleteQuestionAction,
} from "@/app/dashboard/admin/learning-center/actions";
import type { QuizQuestionFull, QuizOption } from "@/types/database.types";

function newOption(): QuizOption {
  return { id: Math.random().toString(36).slice(2, 8), text: "" };
}

export function QuestionsManager({ quizId, questions }: { quizId: string; questions: QuizQuestionFull[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [questionText, setQuestionText] = React.useState("");
  const [options, setOptions] = React.useState<QuizOption[]>([newOption(), newOption()]);
  const [correctOptionId, setCorrectOptionId] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function openCreate() {
    setEditingId(null);
    setQuestionText("");
    const opts = [newOption(), newOption()];
    setOptions(opts);
    setCorrectOptionId("");
    setOpen(true);
  }

  function openEdit(q: QuizQuestionFull) {
    setEditingId(q.id);
    setQuestionText(q.question_text);
    setOptions(q.options);
    setCorrectOptionId(q.correct_option_id);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!correctOptionId) {
      toast.error("Select which option is correct");
      return;
    }
    setIsSubmitting(true);
    const payload = {
      question_text: questionText,
      options: options.filter((o) => o.text.trim()),
      correct_option_id: correctOptionId,
      sort_order: questions.length,
    };
    const result = editingId
      ? await updateQuestionAction(editingId, quizId, payload)
      : await createQuestionAction(quizId, payload);
    setIsSubmitting(false);
    if (result.error) return toast.error(result.error);
    toast.success(editingId ? "Question updated" : "Question added");
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteQuestionAction(id, quizId);
    if (result.error) return toast.error(result.error);
    toast.success("Deleted");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Add question</Button>
      </div>

      {questions.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No questions yet — applicants can&apos;t take this quiz until you add at least one.
        </p>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <Card key={q.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{i + 1}. {q.question_text}</p>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>Edit</Button>
                    <Button variant="ghost" size="icon" aria-label="Delete question" onClick={() => handleDelete(q.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <ul className="mt-2 space-y-1">
                  {q.options.map((o) => (
                    <li key={o.id} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {o.id === q.correct_option_id && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                      {o.text}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit question" : "Add question"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Question</Label>
              <Input value={questionText} onChange={(e) => setQuestionText(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Options — select the correct one</Label>
              {options.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={correctOptionId === opt.id}
                    onChange={() => setCorrectOptionId(opt.id)}
                    className="h-4 w-4"
                  />
                  <Input
                    value={opt.text}
                    onChange={(e) => setOptions((prev) => prev.map((o, idx) => idx === i ? { ...o, text: e.target.value } : o))}
                    placeholder={`Option ${i + 1}`}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button" variant="ghost" size="icon" aria-label="Remove option"
                      onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setOptions((prev) => [...prev, newOption()])}>
                <Plus className="h-3.5 w-3.5" /> Add option
              </Button>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
