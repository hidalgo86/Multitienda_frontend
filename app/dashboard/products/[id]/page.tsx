import { notFound } from "next/navigation";
import { Product } from "@/types/domain/products";
import type { DashboardProductDetailPageProps } from "@/types/ui/products";
import ProductDetailClient from "../../../(site)/(store)/products/[id]/ProductDetailClient";
import { getProductById } from "@/services/products";
import { getRequestBaseUrl } from "@/lib/requestBaseUrl";

export default async function DashboardProductDetailPage({
  params,
}: DashboardProductDetailPageProps) {
  const { id } = await params;

  if (!id) {
    return notFound();
  }

  try {
    const baseUrl = await getRequestBaseUrl();

    const producto: Product = await getProductById(id, {
      baseUrl,
      cache: "no-store",
      trackView: false,
    });

    if (!producto) {
      return notFound();
    }

    return <ProductDetailClient producto={producto} mode="admin" />;
  } catch (error) {
    console.error("Error fetching dashboard product detail:", error);
    return notFound();
  }
}
