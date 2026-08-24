import type { MetadataRoute } from "next";
import { SITE_MODE, SITE_URL } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  // Placeholder-content deployments stay out of search results until
  // SITE_MODE flips to "live" with real data.
  return SITE_MODE === "live"
    ? {
        rules: { userAgent: "*", allow: "/" },
        sitemap: `${SITE_URL}/sitemap.xml`,
      }
    : {
        rules: { userAgent: "*", disallow: "/" },
      };
}
