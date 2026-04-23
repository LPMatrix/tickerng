import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tickerng.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/signup", "/signin", "/privacy", "/terms"];
  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : ("monthly" as const),
    priority: path === "" ? 1 : 0.8,
  }));
}
