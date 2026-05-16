import type { MetadataRoute } from "next";
import { listProducts } from "@/services/products";
import { ProductAvailability } from "@/types/domain/products";
import { absoluteUrl, getProductUrlPath, siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const products = await listProducts(
    {
      page: 1,
      limit: 100,
      availability: ProductAvailability.DISPONIBLE,
    },
    { baseUrl: siteUrl, cache: "no-store" },
  )
    .then((response) => response.items ?? [])
    .catch(() => []);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/products"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/acerca"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(getProductUrlPath(product)),
    lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
