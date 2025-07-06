import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://dineeasy.com";
  const lastModified = new Date();

  // Main pages (highest priority)
  const mainRoutes = [
    {
      url: `${baseUrl}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/features`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
  ];

  // Solutions pages
  const solutionRoutes = [
    "/solutions/restaurants",
    "/solutions/cafes",
    "/solutions/bars",
    "/solutions/food-trucks",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Information pages
  const infoRoutes = ["/about", "/contact", "/security"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Authentication pages
  const authRoutes = ["/login", "/signup", "/forgot-password"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Legal pages
  const legalRoutes = ["/privacy", "/terms"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Support pages
  const supportRoutes = ["/help", "/setup-guide"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Combine all routes
  return [
    ...mainRoutes,
    ...solutionRoutes,
    ...infoRoutes,
    ...authRoutes,
    ...legalRoutes,
    ...supportRoutes,
  ];
}
