import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://dineeasy.com";

  // Add all public routes
  const routes = [
    "",
    "/about",
    "/features",
    "/pricing",
    "/contact",
    "/privacy",
    "/terms",
    "/login",
    "/signup",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
