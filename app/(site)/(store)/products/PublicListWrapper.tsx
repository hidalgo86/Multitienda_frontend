"use client";

import React from "react";
import { Product, getVariantName } from "@/types/domain/products";
import ProductListPublic from "@/components/products/ProductListPublic";
import { useCartActions } from "@/lib/useCartActions";
import { useFavoriteActions } from "@/lib/useFavoriteActions";

export default function PublicListWrapper({
  products,
}: {
  products: Product[];
}) {
  const { addProductToCart } = useCartActions();
  const { toggleProductFavorite } = useFavoriteActions();

  const handleAddToCart = (id: string) => {
    const producto = products.find((p) => p.id === id);
    if (!producto) return;
    const variants = producto.variants || [];
    const selectedVariant =
      variants.find((v) => (v.stock || 0) > 0) || variants[0];
    const variantName = getVariantName(selectedVariant);
    void addProductToCart({
        product: producto,
        quantity: 1,
        selectedSize: variantName || undefined,
      });
  };

  const handleFavorite = (id: string) => {
    const producto = products.find((p) => p.id === id);
    if (!producto) return;
    void toggleProductFavorite(producto);
  };

  return (
    <ProductListPublic
      products={products}
      onAddToCart={handleAddToCart}
      onFavorite={handleFavorite}
    />
  );
}
