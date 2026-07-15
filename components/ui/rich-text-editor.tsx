"use client";

import * as React from "react";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Deliberately lightweight: a contentEditable surface + document.execCommand
 * for bold/italic/lists/links, rather than pulling in a full editor
 * framework (Tiptap/Slate/etc). Keeps the dependency surface small — this is
 * "rich text" in the literal sense (bold/italic/lists), not a page builder.
 * Stores/emits raw HTML.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Syncs once, on mount, using whatever `value` was passed in at that
    // moment. This is intentionally NOT re-run on every value change —
    // for genuine external resets (like "Improve with AI" replacing the
    // whole description), the caller should change this component's
    // `key` prop, which makes React unmount and remount a fresh instance
    // with the new value baked in as the initial content. That's a more
    // reliable pattern for a contentEditable-based editor than trying to
    // diff "did this change come from the user typing or from outside"
    // on every render — see job-posting-form.tsx's descriptionResetKey
    // for the one place that actually needs an external reset today.
    if (ref.current) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command: string, arg?: string) {
    document.execCommand(command, false, arg);
    ref.current?.focus();
    onChange(ref.current?.innerHTML ?? "");
  }

  function handleLink() {
    const url = window.prompt("Link URL (https://...)");
    if (url) exec("createLink", url);
  }

  return (
    <div className="rounded-md border border-input bg-background">
      <div className="flex items-center gap-1 border-b border-border p-1.5">
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec("bold")} aria-label="Bold">
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec("italic")} aria-label="Italic">
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec("insertUnorderedList")} aria-label="Bullet list">
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec("insertOrderedList")} aria-label="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={handleLink} aria-label="Insert link">
          <LinkIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        onBlur={() => onChange(ref.current?.innerHTML ?? "")}
        data-placeholder={placeholder}
        className={cn(
          "min-h-[180px] px-3 py-2 text-sm leading-relaxed focus:outline-none",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline"
        )}
      />
    </div>
  );
}
