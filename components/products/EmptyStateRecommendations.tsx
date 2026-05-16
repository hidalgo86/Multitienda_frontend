"use client";

import Link from "next/link";
import ProductListPublic from "@/components/products/ProductListPublic";
import { useCartActions } from "@/lib/useCartActions";
import { useFavoriteActions } from "@/lib/useFavoriteActions";
import { getVariantName, type Product } from "@/types/domain/products";

interface EmptyStateRecommendationsProps {
  products?: Product[];
}

const categoryLinks = [
  { label: "Ropa", href: "/products?category=ropa" },
  { label: "Juguetes", href: "/products?category=juguete" },
  { label: "Accesorios", href: "/products?category=accesorio" },
  { label: "Alimentacion", href: "/products?category=alimentacion" },
];

export default function EmptyStateRecommendations({
  products = [],
}: EmptyStateRecommendationsProps) {
  const { addProductToCart } = useCartActions();
  const { toggleProductFavorite } = useFavoriteActions();
  const visibleProducts = products.slice(0, 4);

  const handleAddToCart = (id: string) => {
    const product = visibleProducts.find((item) => item.id === id);
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
    const product = visibleProducts.find((item) => item.id === id);
    if (!product) return;
    void toggleProductFavorite(product);
  };

  return (
    <div className="mt-10 space-y-8 text-left">
      <div>
        <h3 className="text-center text-lg font-bold text-slate-900 sm:text-xl">
          Explora por categoria
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categoryLinks.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </div>

      {visibleProducts.length > 0 && (
        <div>
          <div className="mb-4 text-center">
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
              Productos populares
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Algunas opciones para empezar sin volver al inicio.
            </p>
          </div>
          <ProductListPublic
            products={visibleProducts}
            onAddToCart={handleAddToCart}
            onFavorite={handleFavorite}
          />
        </div>
      )}
    </div>
  );
}
