"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { submitQuizAction } from "@/app/dashboard/applicant/learning/actions";
import type { QuizQuestionPublic } from "@/types/database.types";

interface Props {
  quizId: string;
  title: string;
  timeLimitMinutes: number;
  passingScorePercent: number;
  questions: QuizQuestionPublic[];
}

export function QuizRunner({ quizId, title, timeLimitMinutes, passingScorePercent, questions }: Props) {
  const router = useRouter();
  const [started, setStarted] = React.useState(false);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = React.useState(timeLimitMinutes * 60);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<{ scorePercent: number; correctCount: number; totalCount: number; passed: boolean } | null>(null);
  const startTimeRef = React.useRef<number>(0);
  const submittedRef = React.useRef(false);

  const handleSubmit = React.useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setIsSubmitting(true);

    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const formattedAnswers = Object.entries(answers).map(([question_id, selected_option_id]) => ({
      question_id, selected_option_id,
    }));

    const response = await submitQuizAction(quizId, formattedAnswers, timeTaken);
    setIsSubmitting(false);
    if (response.error) {
      toast.error(response.error);
      submittedRef.current = false;
      return;
    }
    if (response.result) {
      setResult(response.result);
      router.refresh();
    }
  }, [answers, quizId, router]);

  React.useEffect(() => {
    if (!started || result) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [started, secondsLeft, result, handleSubmit]);

  function handleStart() {
    startTimeRef.current = Date.now();
    setStarted(true);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const answeredCount = Object.keys(answers).length;

  if (result) {
    return (
      <Card className={result.passed ? "border-success/40" : "border-destructive/40"}>
        <CardContent className="p-6 text-center">
          {result.passed ? (
            <Trophy className="mx-auto h-10 w-10 text-success" />
          ) : (
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
          )}
          <h1 className="mt-3 font-display text-2xl font-semibold">
            {result.passed ? "You passed!" : "Not quite — try again"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {result.correctCount} of {result.totalCount} correct — {result.scorePercent}%
            {" "}(needed {passingScorePercent}%)
          </p>
          {result.passed && (
            <p className="mt-2 text-sm text-success">A certificate has been added to your account.</p>
          )}
          <div className="mt-6 flex justify-center gap-2">
            {result.passed && (
              <Button asChild>
                <Link href="/dashboard/applicant/learning/certificates">View certificates</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/dashboard/applicant/learning/quizzes/${quizId}/leaderboard`}>Leaderboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/applicant/learning/quizzes">All quizzes</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!started) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h1 className="font-display text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-muted-foreground">
            {questions.length} questions • {timeLimitMinutes} minutes • {passingScorePercent}% to pass
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Once you start, the timer runs continuously — the quiz auto-submits when time runs out.
          </p>
          <Button className="mt-6" onClick={handleStart}>Start quiz</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md border border-border bg-card p-3">
        <span className="text-sm text-muted-foreground">{answeredCount} of {questions.length} answered</span>
        <span className={`inline-flex items-center gap-1.5 font-mono text-sm font-semibold ${secondsLeft < 60 ? "text-destructive" : ""}`}>
          <Clock className="h-4 w-4" /> {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>
      <Progress value={(answeredCount / questions.length) * 100} />

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id}>
            <CardContent className="p-4">
              <p className="font-medium">{i + 1}. {q.question_text}</p>
              <div className="mt-3 space-y-2">
                {q.options.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2.5 text-sm hover:bg-secondary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === opt.id}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                      className="h-4 w-4"
                    />
                    {opt.text}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit quiz"}
      </Button>
    </div>
  );
}
