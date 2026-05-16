import type { Metadata } from "next";
import type { ProductsPageProps } from "@/types/ui/products";
import ProductsClient from "./ProductsClient";
import { getServerBusinessSettings } from "@/lib/businessSettingsServer";

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getServerBusinessSettings();
  const description = `Explora el catalogo de ${settings.businessName}. ${settings.seoDescription}`;

  return {
    title: "Productos",
    description,
    alternates: {
      canonical: "/products",
    },
    openGraph: {
      title: `Productos | ${settings.businessName}`,
      description,
      url: "/products",
      type: "website",
      images: [settings.ogImageUrl],
    },
  };
};

export default function ProductsPage(props: ProductsPageProps) {
  return <ProductsClient {...props} />;
}
