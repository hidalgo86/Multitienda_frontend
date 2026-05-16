"use client";

import type { Product } from "@/types/domain/products";
import type { ProductSortBy } from "@/types/domain/products";
import Cards from "./Cards/Cards";

interface ClientCardsProps {
  initialProducts?: Product[];
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  limit?: number;
  sortBy?: ProductSortBy;
}

export default function ClientCards({
  initialProducts = [],
  title,
  description,
  ctaLabel,
  ctaHref,
  limit,
  sortBy,
}: ClientCardsProps) {
  return (
    <Cards
      initialProducts={initialProducts}
      title={title}
      description={description}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
      limit={limit}
      sortBy={sortBy}
    />
  );
}
