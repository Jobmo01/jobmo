"use client";

import * as React from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Placeholder widget only — per spec, live chat is not implemented in Phase 1.
 * Wire this up to a real provider (or a Supabase-backed messaging table) in a later phase.
 */
export function LiveChatPlaceholder() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className="mb-3 w-72 rounded-lg border border-border bg-card p-4 shadow-xl"
          >
            <p className="font-display text-sm font-semibold">Chat with JobMo</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Live chat isn&apos;t connected yet — this is a placeholder for a
              later phase. In the meantime, reach us via the Contact page.
            </p>
            <Button size="sm" variant="outline" className="mt-3 w-full" asChild>
              <a href="/contact">Go to Contact</a>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>
    </div>
  );
}
