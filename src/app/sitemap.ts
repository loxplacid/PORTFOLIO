import type { MetadataRoute } from "next";
import { SITE_PATH, SITE_URL } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}${SITE_PATH}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
