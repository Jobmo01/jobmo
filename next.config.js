/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        // Applies to every route.
        source: "/:path*",
        headers: [
          // Prevents the site from being framed by another origin (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // Stops browsers from MIME-sniffing a response away from its declared Content-Type.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Only send the origin (not full URL/path) to other sites on outbound links.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Force HTTPS for a year, including subdomains, once a browser has seen this once.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Disable browser features this app never uses.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // Content-Security-Policy: allows what the app actually needs (Supabase, Google
          // Fonts, YouTube/Vimeo embeds for Learning Center videos) and nothing else.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 'unsafe-eval'/'unsafe-inline' needed by Next.js dev/hydration — tighten further with nonces in a later hardening pass
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
              "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
