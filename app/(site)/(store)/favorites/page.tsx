import FavoritesClient from "./FavoritesClient";
import { getRequestBaseUrl } from "@/lib/requestBaseUrl";
import { listProducts } from "@/services/products";
import { ProductAvailability, ProductSortBy } from "@/types/domain/products";
import { paginationConfig } from "@/lib/paginationConfig";


export default async function FavoritesPage() {
  const baseUrl = await getRequestBaseUrl();
  const popularProducts = await listProducts(
    {
      page: 1,
      limit: paginationConfig.homeSectionLimit,
      availability: ProductAvailability.DISPONIBLE,
      sortBy: ProductSortBy.MOST_FAVORITED,
    },
    { baseUrl, cache: "no-store" },
  )
    .then((response) => response.items ?? [])
    .catch(() => []);

  return <FavoritesClient popularProducts={popularProducts} />;
}
