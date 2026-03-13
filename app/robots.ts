import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://smsok.9phum.me";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/packages", "/docs/api", "/privacy", "/terms", "/refund-policy", "/acceptable-use", "/cookie-policy"],
        disallow: ["/admin/", "/api/", "/dashboard/", "/login", "/register", "/forgot-password", "/2fa", "/order-documents/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
