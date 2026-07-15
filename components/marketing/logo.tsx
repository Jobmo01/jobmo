/**
 * Renders the real JobMo brand mark (processed from the supplied logo file
 * into an icon-only crop and a full icon+wordmark+tagline lockup).
 * - variant="icon": magnifying-glass/briefcase mark only — for navbar,
 *   footer, dashboard sidebar, and app icon contexts. Set height via
 *   className; width follows automatically to preserve the aspect ratio.
 * - variant="full": icon + "Jobmo" wordmark + tagline — for the auth
 *   screens and anywhere the full lockup fits comfortably.
 */
export function Logo({
  className,
  variant = "icon",
}: {
  className?: string;
  variant?: "icon" | "full";
}) {
  const src = variant === "full" ? "/logo-full.png" : "/logo-icon.png";
  const alt = variant === "full" ? "JobMo — Find Your Next Opportunity" : "JobMo";

  // Plain <img> rather than next/image: the asset is small, used at a handful
  // of fixed spots (nav, footer, sidebar, auth), and this avoids next/image's
  // required width/height when the display size varies by className alone.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`w-auto object-contain ${className ?? ""}`} />;
}
