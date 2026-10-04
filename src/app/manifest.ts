import type { MetadataRoute } from "next";

// Lets phones add MONTHLIV to the home screen. The store apps are built with Capacitor (see README).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MONTHLIV 먼슬리브",
    short_name: "MONTHLIV",
    description: "A night or a month, a room of your own — MONTHLIV branches in Seoul and Jeju.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf6f1",
    theme_color: "#fbf6f1",
    icons: [
      { src: "/brand/monthliv-app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/brand/monthliv-app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/monthliv-app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/brand/monthliv-app-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
