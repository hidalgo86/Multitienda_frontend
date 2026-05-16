import type { Metadata } from "next";
import type { ProductsPageProps } from "@/types/ui/products";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Productos",
  description:
    "Explora ropa, juguetes y artículos para bebés y niños en Chikitoslandia.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Productos | Chikitoslandia",
    description:
      "Explora ropa, juguetes y artículos para bebés y niños en Chikitoslandia.",
    url: "/products",
    type: "website",
  },
};

export default function ProductsPage(props: ProductsPageProps) {
  return <ProductsClient {...props} />;
}
