import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bacalao Cup MMXXVI",
    short_name: "Bacalao Cup",
    description: "Live stillingstavle og kampoppsett for Bacalao Cup MMXXVI, Marbella",
    start_url: "/",
    display: "standalone",
    background_color: "#e9ebf0",
    theme_color: "#0a1330",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
