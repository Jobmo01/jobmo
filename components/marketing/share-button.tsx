"use client";

import * as React from "react";
import { Share2, Copy, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

/**
 * Generic share dialog — copy link, WhatsApp, email, plus a native OS
 * share sheet where supported. Used for both job listings and referral
 * links, so the actual channels only need to be built and tested once.
 */
export function ShareButton({
  url, shareText, dialogTitle, dialogDescription, buttonLabel = "Share",
}: {
  url: string;
  shareText: string;
  dialogTitle: string;
  dialogDescription: string;
  buttonLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [supportsNativeShare, setSupportsNativeShare] = React.useState(false);

  // Checked in an effect, not during render — `navigator` behaves
  // differently between the server-rendered pass and the real browser,
  // so reading it directly in the render body risks a hydration mismatch.
  React.useEffect(() => {
    setSupportsNativeShare(typeof navigator.share === "function");
  }, []);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable — the link is still visible in
      // the dialog for the person to select and copy manually.
    }
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(`${shareText}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function handleEmail() {
    const subject = encodeURIComponent(shareText);
    const body = encodeURIComponent(`${shareText}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title: shareText, url });
    } catch {
      // User cancelled the native share sheet — no error state needed.
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Share2 className="h-4 w-4" /> {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 p-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 truncate bg-transparent text-sm text-muted-foreground outline-none"
            />
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleWhatsApp}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.821.487 3.53 1.338 5.001L2 22l5.117-1.318A9.94 9.94 0 0012.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.061a8.02 8.02 0 01-4.35-1.267l-.312-.187-3.19.822.851-3.113-.203-.319A8.026 8.026 0 013.939 12c0-4.446 3.616-8.061 8.062-8.061 4.445 0 8.06 3.615 8.06 8.061 0 4.446-3.615 8.061-8.06 8.061z" />
              </svg>
              WhatsApp
            </Button>
            <Button variant="outline" onClick={handleEmail}>
              <Mail className="h-4 w-4" /> Email
            </Button>
          </div>

          {supportsNativeShare && (
            <Button variant="ghost" size="sm" onClick={handleNativeShare} className="w-full">
              More sharing options…
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
