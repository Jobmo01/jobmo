"use client";

import { useEffect } from "react";

/** Registers the minimal offline-fallback service worker. Silently no-ops
 *  if service workers aren't supported (older browsers) — this is a
 *  progressive enhancement, never a requirement for the app to function. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures (e.g. running over plain HTTP in some dev
        // setups) are non-fatal — the app works fine without it.
      });
    }
  }, []);

  return null;
}
