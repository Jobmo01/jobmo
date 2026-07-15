"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export type FieldType = "text" | "textarea" | "date" | "select" | "checkbox" | "number" | "url";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

type Item = Record<string, any> & { id: string };

/** Plain-data description of how to summarize a list item — NOT a function,
 *  since this config is passed down from a Server Component and only
 *  Server Actions (not arbitrary closures) can cross that boundary as props. */
export interface SummaryConfig {
  /** Field name(s) to join with " — " for the primary line. */
  primary: string | string[];
  /** Field name for the secondary (muted) line. */
  secondary?: string;
  /** Field name to show as a badge, or a boolean field + label for it. */
  badge?: string | { field: string; trueLabel: string };
}

function resolveSummary(item: Item, config: SummaryConfig) {
  const primaryFields = Array.isArray(config.primary) ? config.primary : [config.primary];
  const primary = primaryFields.map((f) => item[f]).filter(Boolean).join(" — ");
  const secondary = config.secondary ? (item[config.secondary] ?? undefined) : undefined;

  let badge: string | undefined;
  if (typeof config.badge === "string") {
    badge = item[config.badge] ?? undefined;
  } else if (config.badge) {
    badge = item[config.badge.field] ? config.badge.trueLabel : undefined;
  }

  return { primary, secondary, badge };
}

interface RepeatableSectionProps {
  title: string;
  description?: string;
  emptyMessage?: string;
  addLabel?: string;
  items: Item[];
  fields: FieldConfig[];
  summary: SummaryConfig;
  createAction: (input: Record<string, unknown>) => Promise<{ data?: unknown; error?: string }>;
  updateAction: (id: string, input: Record<string, unknown>) => Promise<{ data?: unknown; error?: string }>;
  deleteAction: (id: string) => Promise<{ success?: true; error?: string }>;
}

function defaultsFromFields(fields: FieldConfig[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const f of fields) defaults[f.name] = f.type === "checkbox" ? false : "";
  return defaults;
}

export function RepeatableSection({
  title,
  description,
  emptyMessage = "Nothing added yet.",
  addLabel = "Add",
  items,
  fields,
  summary,
  createAction,
  updateAction,
  deleteAction,
}: RepeatableSectionProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [values, setValues] = React.useState<Record<string, unknown>>(defaultsFromFields(fields));
  const [deleteTarget, setDeleteTarget] = React.useState<Item | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function openCreate() {
    setEditingId(null);
    setValues(defaultsFromFields(fields));
    setDialogOpen(true);
  }

  function openEdit(item: Item) {
    setEditingId(item.id);
    const next: Record<string, unknown> = {};
    for (const f of fields) next[f.name] = item[f.name] ?? (f.type === "checkbox" ? false : "");
    setValues(next);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = editingId ? await updateAction(editingId, values) : await createAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(editingId ? "Updated" : "Added");
      setDialogOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteAction(deleteTarget.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Deleted");
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {items.length === 0 && (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        )}
        {items.map((item) => {
          const itemSummary = resolveSummary(item, summary);
          return (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{itemSummary.primary}</p>
                  {itemSummary.secondary && (
                    <p className="truncate text-sm text-muted-foreground">{itemSummary.secondary}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {itemSummary.badge && <Badge variant="accent">{itemSummary.badge}</Badge>}
                  <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setDeleteTarget(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
            <DialogDescription>Fields marked required must be filled in.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                {field.type !== "checkbox" && (
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                  </Label>
                )}

                {field.type === "text" || field.type === "url" || field.type === "number" ? (
                  <Input
                    id={field.name}
                    type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={values[field.name] as string}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                ) : field.type === "date" ? (
                  <Input
                    id={field.name}
                    type="date"
                    required={field.required}
                    value={(values[field.name] as string) ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                ) : field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={values[field.name] as string}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                ) : field.type === "select" ? (
                  <Select
                    value={(values[field.name] as string) || undefined}
                    onValueChange={(val) => setValues((v) => ({ ...v, [field.name]: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder ?? "Select…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "checkbox" ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={field.name}
                      checked={Boolean(values[field.name])}
                      onCheckedChange={(checked) => setValues((v) => ({ ...v, [field.name]: Boolean(checked) }))}
                    />
                    <Label htmlFor={field.name} className="font-normal">
                      {field.label}
                    </Label>
                  </div>
                ) : null}
              </div>
            ))}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. {deleteTarget && resolveSummary(deleteTarget, summary).primary}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
