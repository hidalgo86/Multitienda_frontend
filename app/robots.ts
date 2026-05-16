import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/cart",
          "/checkout",
          "/dashboard",
          "/favorites",
          "/login",
          "/orders",
          "/register",
          "/reset-password",
          "/verify",
          "/forgot-password",
          "/forgot-username",
          "/api",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
