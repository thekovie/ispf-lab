import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/lab"), lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/resources"), lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];
}
