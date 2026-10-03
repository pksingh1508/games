import type { MetadataRoute } from "next";
import { GAME_SLUGS } from "@/games/slugs";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/games", "/about", "/settings", "/data"];
  return [
    ...pages.map((path) => ({ url: `${SITE.url}${path}`, priority: path === "" ? 1 : 0.6 })),
    ...GAME_SLUGS.map((slug) => ({ url: `${SITE.url}/games/${slug}`, priority: 0.8 })),
  ];
}
