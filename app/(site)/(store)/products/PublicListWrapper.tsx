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
  const productsById = React.useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const handleAddToCart = React.useCallback((id: string) => {
    const producto = productsById.get(id);
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
  }, [addProductToCart, productsById]);

  const handleFavorite = React.useCallback((id: string) => {
    const producto = productsById.get(id);
    if (!producto) return;
    void toggleProductFavorite(producto);
  }, [productsById, toggleProductFavorite]);

  return (
    <ProductListPublic
      products={products}
      onAddToCart={handleAddToCart}
      onFavorite={handleFavorite}
    />
  );
}
