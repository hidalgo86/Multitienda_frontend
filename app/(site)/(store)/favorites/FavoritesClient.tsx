"use client";

import Link from "next/link";
import { useState } from "react";
import ProductListPublic from "@/components/products/ProductListPublic";
import { Product, getVariantName } from "@/types/domain/products";
import { MdDeleteSweep } from "react-icons/md";
import { useCartActions } from "@/lib/useCartActions";
import { useFavoriteActions } from "@/lib/useFavoriteActions";
import { getStoredAuthToken, isStoredAdminUser } from "@/services/users";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyStateRecommendations from "@/components/products/EmptyStateRecommendations";

interface FavoritesClientProps {
  popularProducts?: Product[];
}

export default function FavoritesClient({
  popularProducts = [],
}: FavoritesClientProps) {
  const { addProductToCart } = useCartActions();
  const { favoriteItems, toggleProductFavorite, clearAllFavorites } =
    useFavoriteActions();
  const isAuthenticated = Boolean(getStoredAuthToken());
  const isAdminUser = isStoredAdminUser();
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  if (isAdminUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              Favoritos no disponible
            </h1>
            <p className="mt-3 text-gray-600">
              Las cuentas administradoras no usan favoritos.
            </p>
            <Link
              href="/dashboard/products"
              className="mt-6 inline-flex rounded-lg bg-gray-900 px-5 py-3 text-white hover:bg-black"
            >
              Ir al dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleFavorite = (productId: string) => {
    const producto = favoriteItems.find((p) => p.id === productId);
    if (!producto) return;
    void toggleProductFavorite(producto);
  };

  const handleAddToCart = (productId: string) => {
    const producto = favoriteItems.find((p) => p.id === productId);
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

  const handleClearAllFavorites = () => {
    setShowClearConfirmation(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ConfirmDialog
        open={showClearConfirmation}
        title="Limpiar favoritos"
        description="Se eliminaran todos los productos guardados en tu lista de favoritos."
        confirmLabel="Limpiar favoritos"
        tone="danger"
        onCancel={() => setShowClearConfirmation(false)}
        onConfirm={() => {
          void clearAllFavorites();
          setShowClearConfirmation(false);
        }}
      />

      <div className="max-w-7xl mx-auto px-3 py-4 pb-24 sm:px-6 sm:py-6 sm:pb-24 lg:px-8 lg:py-8 lg:pb-8">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Mis Favoritos
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {favoriteItems.length === 0
                  ? "Aun no tienes productos favoritos"
                  : `${favoriteItems.length} producto${
                      favoriteItems.length === 1 ? "" : "s"
                    } guardado${favoriteItems.length === 1 ? "" : "s"}`}
              </p>
            </div>

            {favoriteItems.length > 0 && (
              <button
                onClick={handleClearAllFavorites}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 sm:w-auto"
              >
                <MdDeleteSweep size={20} />
                Limpiar todos
              </button>
            )}
          </div>
        </div>

        {favoriteItems.length === 0 ? (
          <div className="text-center py-16 sm:py-20 lg:py-24">
            <div className="max-w-md mx-auto">
              <div className="text-6xl sm:text-7xl lg:text-8xl mb-6">♡</div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
                No tienes favoritos aun
              </h2>
              <p className="text-gray-600 mb-8">
                Explora nuestros productos y marca los que mas te gusten tocando
                el corazon.
              </p>
              <Link
                href="/products"
                className="inline-block px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
              >
                Explorar productos
              </Link>
              <EmptyStateRecommendations products={popularProducts} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-brand-500 mt-0.5">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-brand-900 mb-1">
                    {isAuthenticated
                      ? "Favoritos sincronizados con tu cuenta"
                      : "Guardado en memoria local"}
                  </h3>
                  <p className="text-sm text-brand-700">
                    {isAuthenticated
                      ? "Tus favoritos ya estan vinculados a tu usuario y se conservaran cuando vuelvas a iniciar sesion."
                      : "Tus favoritos se guardan en este dispositivo. Cuando inicies sesion, se sincronizaran con tu cuenta."}
                  </p>
                </div>
              </div>
            </div>

            <ProductListPublic
              products={favoriteItems as Product[]}
              onAddToCart={handleAddToCart}
              onFavorite={handleFavorite}
            />
          </div>
        )}
      </div>
    </div>
  );
}
