"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Product,
  ProductAvailability,
  ProductSortBy,
  getVariantName,
} from "@/types/domain/products";
import ProductListPublic from "@/components/products/ProductListPublic";
import { listProducts } from "@/services/products";
import { useCartActions } from "@/lib/useCartActions";
import { useFavoriteActions } from "@/lib/useFavoriteActions";
import { reportClientError } from "@/lib/errorUtils";

interface CardsProps {
  initialProducts?: Product[];
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  limit?: number;
  sortBy?: ProductSortBy;
}

export default function Cards({
  initialProducts = [],
  title = "Nuestros Productos",
  description = "Descubre nuestra coleccion de ropa para bebes",
  ctaLabel = "Ver todos",
  ctaHref = "/products",
  limit = 4,
  sortBy,
}: CardsProps) {
  const [productos, setProductos] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);
  const { addProductToCart } = useCartActions();
  const { toggleProductFavorite } = useFavoriteActions();

  const loadProducts = useCallback(
    async (showLoader = false, showError = false) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        setError(null);
        const response = await listProducts({
          page: 1,
          limit,
          availability: ProductAvailability.DISPONIBLE,
          sortBy,
        });
        setProductos(response.items ?? []);
      } catch (err) {
        reportClientError("Error cargando productos:", err);
        if (showError) {
          setError("Error al cargar los productos");
        }
      } finally {
        setLoading(false);
      }
    },
    [limit, sortBy],
  );

  useEffect(() => {
    const shouldLoadOnClient = initialProducts.length === 0;

    if (shouldLoadOnClient) {
      void loadProducts(true, true);
      return undefined;
    }

    return undefined;
  }, [initialProducts.length, loadProducts]);

  if (loading) {
    return (
      <div className="py-6 text-center sm:py-10 lg:py-12">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          Cargando productos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center sm:py-10 lg:py-12">
        <div className="mx-auto max-w-md px-4">
          <p className="mb-4 text-sm text-red-600 sm:text-base">{error}</p>
          <button
            type="button"
            onClick={() => loadProducts(true, true)}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="py-6 text-center sm:py-10 lg:py-12">
        <p className="text-sm text-gray-500 sm:text-base">
          No hay productos para mostrar.
        </p>
      </div>
    );
  }

  const handleAddToCart = (id: string) => {
    const producto = productos.find((p) => p.id === id);
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
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;
    void toggleProductFavorite(producto);
  };

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-8">
      <div className="mx-auto max-w-2xl text-center sm:max-w-none sm:text-left">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
          {title}
        </h2>
        <p className="mt-2 text-sm text-gray-600 sm:text-base lg:text-lg">
          {description}
        </p>
      </div>

      <ProductListPublic
        products={productos.slice(0, limit)}
        onAddToCart={handleAddToCart}
        onFavorite={handleFavorite}
      />

      <div className="flex justify-center sm:justify-start">
        <Link
          href={ctaHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-700 sm:w-auto sm:px-6 sm:text-base"
          aria-label="Ver todos los productos"
        >
          {ctaLabel}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
