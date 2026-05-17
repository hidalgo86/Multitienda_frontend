import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getProductById, listProducts } from "@/services/products";
import type { ProductPageProps } from "@/types/ui/products";
import ProductDetailClient from "@/features/products/components/ProductDetailClient";
import {
  ProductAvailability,
  ProductSortBy,
} from "@/types/domain/products";
import {
  absoluteUrl,
  getProductDescription,
  getProductImageUrl,
  getProductPrice,
  getProductUrlPath,
  siteUrl,
} from "@/lib/seo";
import { getServerBusinessSettings } from "@/lib/businessSettingsServer";
import { paginationConfig } from "@/lib/paginationConfig";

const getRequestBaseUrl = async (): Promise<string> => {
  const reqHeaders = await headers();
  const host = reqHeaders.get("x-forwarded-host") ?? reqHeaders.get("host");
  const protocol = reqHeaders.get("x-forwarded-proto") ?? "https";

  return host ? `${protocol}://${host}` : siteUrl;
};

const safeJsonLd = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, "\\u003c");

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;

  if (!id) {
    return {
      title: "Producto no encontrado",
      robots: { index: false, follow: false },
    };
  }

  try {
    const producto = await getProductById(id, {
      baseUrl: await getRequestBaseUrl(),
      cache: "no-store",
      trackView: false,
    });
    const settings = await getServerBusinessSettings();
    const description = getProductDescription(producto, settings.businessName);
    const image = getProductImageUrl(producto);
    const path = getProductUrlPath(producto);

    return {
      title: producto.name,
      description,
      alternates: {
        canonical: path,
      },
      openGraph: {
        title: producto.name,
        description,
        url: path,
        type: "website",
        images: [
          {
            url: image,
            alt: producto.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: producto.name,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Producto no encontrado",
      robots: { index: false, follow: false },
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  if (!id) return notFound();

  try {
    const baseUrl = await getRequestBaseUrl();
    const producto = await getProductById(id, {
      baseUrl,
      cache: "no-store",
    });
    const relatedProducts = await listProducts(
      {
        page: 1,
        limit: paginationConfig.relatedProductsLimit,
        availability: ProductAvailability.DISPONIBLE,
        categoryId: producto.categoryId || undefined,
        category: producto.categoryId
          ? undefined
          : producto.category
            ? String(producto.category)
            : undefined,
        sortBy: ProductSortBy.NEWEST,
      },
      { baseUrl, cache: "no-store" },
    )
      .then((response) =>
        (response.items ?? [])
          .filter((item) => item.id !== producto.id)
          .slice(0, 4),
      )
      .catch(() => []);
    const nonce = (await headers()).get("x-nonce") ?? undefined;
    const settings = await getServerBusinessSettings();
    const price = getProductPrice(producto);
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: producto.name,
      description: getProductDescription(producto, settings.businessName),
      image: [getProductImageUrl(producto)],
      sku: producto.sku || producto.id,
      brand: {
        "@type": "Brand",
        name: producto.brand || settings.businessName,
      },
      offers: price
        ? {
            "@type": "Offer",
            url: absoluteUrl(getProductUrlPath(producto)),
            priceCurrency: "USD",
            price,
            availability:
              producto.availability === "agotado"
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
          }
        : undefined,
    };

    return (
      <>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(productSchema) }}
        />
        <ProductDetailClient
          producto={producto}
          relatedProducts={relatedProducts}
        />
      </>
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return notFound();
  }
}
