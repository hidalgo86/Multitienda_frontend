"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductListPublic from "@/components/products/ProductListPublic";
import { useCartActions } from "@/lib/useCartActions";
import { useFavoriteActions } from "@/lib/useFavoriteActions";
import { getRecentlyViewedProducts } from "@/lib/recentlyViewedProducts";
import { getVariantName, type Product } from "@/types/domain/products";

export default function RecentlyViewedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const { addProductToCart } = useCartActions();
  const { toggleProductFavorite } = useFavoriteActions();

  useEffect(() => {
    setProducts(getRecentlyViewedProducts());
  }, []);

  if (products.length === 0) return null;

  const handleAddToCart = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    const variants = product.variants || [];
    const selectedVariant =
      variants.find((variant) => (variant.stock || 0) > 0) || variants[0];
    const variantName = getVariantName(selectedVariant);

    void addProductToCart({
      product,
      quantity: 1,
      selectedSize: variantName || undefined,
    });
  };

  const handleFavorite = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    void toggleProductFavorite(product);
  };

  return (
    <section className="mb-8 mt-8 sm:mb-12 sm:mt-12 lg:mb-16 lg:mt-16">
      <div className="space-y-5 sm:space-y-6 lg:space-y-8">
        <div className="mx-auto max-w-2xl text-center sm:max-w-none sm:text-left">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
            Visto recientemente
          </h2>
          <p className="mt-2 text-sm text-gray-600 sm:text-base lg:text-lg">
            Retoma los productos que ya llamaron tu atencion.
          </p>
        </div>

        <ProductListPublic
          products={products.slice(0, 4)}
          onAddToCart={handleAddToCart}
          onFavorite={handleFavorite}
        />

        <div className="flex justify-center sm:justify-start">
          <Link
            href="/products"
            className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto sm:px-6 sm:text-base"
          >
            Seguir explorando
          </Link>
        </div>
      </div>
    </section>
  );
}
