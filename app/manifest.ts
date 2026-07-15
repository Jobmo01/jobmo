import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JobMo — AI-Powered Hiring for Sri Lanka",
    short_name: "JobMo",
    description: "Matching applicants and employers with AI-driven precision.",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F5F7",
    theme_color: "#7235BC",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
