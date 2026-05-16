"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Image from "next/image";
import {
  findVariantBySelection,
  formatGenreLabel,
  formatVariantLabel,
  getProductCategoryLabel,
  getProductStatusLabel,
  getProductStock,
  getVariantName,
  hasProductVariants,
  legacyProductCategoryOptions,
} from "@/types/domain/products";
import type { ProductDetailClientProps } from "@/types/ui/products";
import ProductListPublic from "@/components/products/ProductListPublic";
import AddedToCartPanel from "@/components/products/AddedToCartPanel";
import { useCategories } from "@/services/categories/useCategories";
import { RootState } from "@/store";
import { useCartActions } from "@/lib/useCartActions";
import { useFavoriteActions } from "@/lib/useFavoriteActions";
import {
  MdAdd,
  MdArrowBack,
  MdFavorite,
  MdFavoriteBorder,
  MdRemove,
  MdShare,
  MdShoppingCart,
  MdTrendingUp,
  MdVisibility,
  MdSearch,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";
import {
  PAYMENTS_ENABLED,
  paymentsDisabledMessage,
} from "@/lib/commerceConfig";
import { toast } from "sonner";
import { isStoredAdminUser } from "@/services/users";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinaryImages";
import { saveRecentlyViewedProduct } from "@/lib/recentlyViewedProducts";

const sizePattern = /^(RN|M3|M6|M9|M12|M18|M24|T2|T3|T4|T5|T6|T7|T8|T9|T10|T12)$/i;

export default function ProductDetailClient({
  producto,
  mode = "public",
  relatedProducts = [],
}: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isAddedPanelOpen, setIsAddedPanelOpen] = useState(false);
  const [showShareCopied, setShowShareCopied] = useState(false);
  const isAdminMode = mode === "admin";
  const isAdminUser = isAdminMode || isStoredAdminUser();
  const isRopa = hasProductVariants(producto) || Boolean(producto.genre);
  const { options } = useCategories();
  const { addProductToCart, changeCartItemQuantity } = useCartActions();
  const { toggleProductFavorite } = useFavoriteActions();
  const categoryOptions = options.length
    ? options
    : legacyProductCategoryOptions;

  const images =
    Array.isArray(producto.images) && producto.images.length > 0
      ? producto.images
      : [{ url: "/placeholder.webp", publicId: "placeholder" }];
  const selectedImage = images[selectedImageIndex] || images[0];
  const selectedImageUrl =
    getOptimizedCloudinaryUrl(selectedImage.url, {
      width: isAdminMode ? 1000 : 1200,
      height: isAdminMode ? 1000 : 1500,
      crop: "limit",
    }) || selectedImage.url;
  const viewerImageUrl =
    getOptimizedCloudinaryUrl(selectedImage.url, {
      width: 1800,
      height: 2200,
      crop: "limit",
    }) || selectedImage.url;

  const isFavorite = useSelector((state: RootState) =>
    state.favorites.items.some((item) => item.id === producto.id),
  );
  const cartItems = useSelector((state: RootState) => state.cart.items);

  useEffect(() => {
    setSelectedImageIndex(0);
    setIsImageViewerOpen(false);
    if (isRopa && producto.variants && producto.variants.length > 0) {
      const firstAvailableSize =
        getVariantName(producto.variants.find((v) => (v.stock || 0) > 0)) ||
        getVariantName(producto.variants[0]) ||
        "";
      setSelectedSize(firstAvailableSize);
      return;
    }
    setSelectedSize("");
  }, [isRopa, producto.id, producto.variants]);

  useEffect(() => {
    if (!isAdminMode) {
      saveRecentlyViewedProduct(producto);
    }
  }, [isAdminMode, producto]);

  useEffect(() => {
    if (!isImageViewerOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsImageViewerOpen(false);
      }

      if (event.key === "ArrowLeft") {
        setSelectedImageIndex((prev) =>
          prev === 0 ? images.length - 1 : prev - 1,
        );
      }

      if (event.key === "ArrowRight") {
        setSelectedImageIndex((prev) => (prev + 1) % images.length);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [images.length, isImageViewerOpen]);

  const variants = producto.variants || [];
  const currentVariant = isRopa
    ? findVariantBySelection(variants, selectedSize)
    : null;
  const currentCartItem = useMemo(
    () =>
      cartItems.find(
        (item) =>
          item.id === producto.id &&
          item.selectedSize === (isRopa ? selectedSize : undefined),
      ) || null,
    [cartItems, isRopa, producto.id, selectedSize],
  );
  const cartQuantity = currentCartItem?.quantity ?? 0;
  const displayQuantity = cartQuantity || quantity;
  const displayPrice = isRopa
    ? (currentVariant?.price ??
      (variants.length > 0
        ? Math.min(
            ...variants.map((v) => Number(v?.price) || 0).filter((n) => n > 0),
          )
        : 0))
    : Number(producto.price || 0);
  const availableStock = isRopa
    ? currentVariant?.stock || 0
    : Number(producto.stock || 0);
  const displayGenre = formatGenreLabel(producto.genre);
  const displayStatus = getProductStatusLabel(producto);
  const displayCategory = getProductCategoryLabel(producto, categoryOptions);
  const hasOnlySizeVariants =
    variants.length > 0 &&
    variants.every((variant) =>
      sizePattern.test(String(variant.name || variant.size || "").trim()),
    );
  const productModeLabel = !hasProductVariants(producto)
    ? "Simple"
    : hasOnlySizeVariants
      ? "Ropa"
      : "Variantes";
  const productModeDetail = !hasProductVariants(producto)
    ? `Stock total: ${getProductStock(producto)}`
    : hasOnlySizeVariants
      ? `${variants.length} talla(s)`
      : `${variants.length} variante(s)`;
  const stats = {
    views: Number(producto.stats?.views ?? 0),
    favorites: Number(producto.stats?.favorites ?? 0),
    cartAdds: Number(producto.stats?.cartAdds ?? 0),
    purchases: Number(producto.stats?.purchases ?? 0),
    searches: Number(producto.stats?.searches ?? 0),
  };
  const conversionRate =
    stats.views > 0 ? Math.round((stats.purchases / stats.views) * 1000) / 10 : 0;
  const adminStats = [
    {
      label: "Vistas",
      value: stats.views,
      helper: "Aperturas del detalle publico",
      icon: <MdVisibility size={20} />,
    },
    {
      label: "Favoritos",
      value: stats.favorites,
      helper: "Usuarios que lo guardaron",
      icon: <MdFavorite size={20} />,
    },
    {
      label: "Carrito",
      value: stats.cartAdds,
      helper: "Veces agregado al carrito",
      icon: <MdShoppingCart size={20} />,
    },
    {
      label: "Compras",
      value: stats.purchases,
      helper: "Unidades pagadas",
      icon: <MdTrendingUp size={20} />,
    },
    {
      label: "Busquedas",
      value: stats.searches,
      helper: "Apariciones al buscar",
      icon: <MdSearch size={20} />,
    },
  ];

  useEffect(() => {
    setQuantity(cartQuantity || 1);
  }, [cartQuantity, selectedSize]);

  const handleAddToCart = () => {
    if (isRopa && !selectedSize) {
      toast.error("Por favor selecciona una talla");
      return;
    }
    if (availableStock === 0) {
      toast.error(
        isRopa
          ? "Esta talla no esta disponible"
          : "Este producto no esta disponible",
      );
      return;
    }

    if (!currentCartItem) {
      void addProductToCart({
        product: producto,
        quantity: displayQuantity,
        selectedSize: isRopa ? selectedSize : undefined,
      });
    }

    setIsAddedPanelOpen(true);
  };

  const handleFavoriteToggle = () => {
    void toggleProductFavorite(producto);
  };

  const handleRelatedAddToCart = (productId: string) => {
    const relatedProduct = relatedProducts.find((item) => item.id === productId);
    if (!relatedProduct) return;

    const relatedVariants = relatedProduct.variants || [];
    const selectedVariant =
      relatedVariants.find((variant) => (variant.stock || 0) > 0) ||
      relatedVariants[0];
    const variantName = getVariantName(selectedVariant);

    void addProductToCart({
      product: relatedProduct,
      quantity: 1,
      selectedSize: variantName || undefined,
    });
  };

  const handleRelatedFavorite = (productId: string) => {
    const relatedProduct = relatedProducts.find((item) => item.id === productId);
    if (!relatedProduct) return;
    void toggleProductFavorite(relatedProduct);
  };

  const handleShare = async () => {
    const shareUrl =
      typeof window !== "undefined" ? window.location.href : `/products/${producto.id}`;
    const shareTitle = producto.name || "Producto";
    const shareText = producto.description?.trim()
      ? `${producto.name} - ${producto.description.trim()}`
      : `Mira este producto: ${producto.name}`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareCopied(true);
        toast.success("Enlace copiado");
        setTimeout(() => setShowShareCopied(false), 2000);
        return;
      }

      toast.error("No se pudo copiar el enlace automaticamente");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "AbortError") return;

      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareCopied(true);
        toast.success("Enlace copiado");
        setTimeout(() => setShowShareCopied(false), 2000);
      } catch {
        toast.error("No se pudo copiar el enlace automaticamente");
      }
    }
  };

  const handleBuyNow = async () => {
    if (isBuyingNow) return;
    if (!PAYMENTS_ENABLED) {
      toast.error(paymentsDisabledMessage);
      return;
    }
    if (isRopa && !selectedSize) {
      toast.error("Por favor selecciona una talla");
      return;
    }
    if (availableStock === 0) {
      toast.error(
        isRopa
          ? "Esta talla no esta disponible"
          : "Este producto no esta disponible",
      );
      return;
    }

    setIsBuyingNow(true);

    try {
      if (!currentCartItem) {
        await addProductToCart({
          product: producto,
          quantity: displayQuantity,
          selectedSize: isRopa ? selectedSize : undefined,
        });
      }

      router.push("/checkout");
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleDecreaseQuantity = () => {
    if (currentCartItem) {
      void changeCartItemQuantity({
        productId: currentCartItem.id,
        quantity: currentCartItem.quantity - 1,
        selectedSize: currentCartItem.selectedSize,
        selectedColor: currentCartItem.selectedColor,
      });
      return;
    }

    setQuantity(Math.max(1, quantity - 1));
  };

  const handleIncreaseQuantity = () => {
    if (currentCartItem) {
      void changeCartItemQuantity({
        productId: currentCartItem.id,
        quantity: Math.min(availableStock, currentCartItem.quantity + 1),
        selectedSize: currentCartItem.selectedSize,
        selectedColor: currentCartItem.selectedColor,
      });
      return;
    }

    setQuantity(Math.min(availableStock, quantity + 1));
  };

  const showPreviousImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const showNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isImageViewerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ampliada de ${producto.name || "producto"}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 sm:p-6"
          onClick={() => setIsImageViewerOpen(false)}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsImageViewerOpen(false);
            }}
            className="absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition hover:bg-white sm:right-5 sm:top-5"
            aria-label="Cerrar imagen ampliada"
          >
            <MdClose size={24} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPreviousImage();
                }}
                className="absolute left-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition hover:bg-white sm:left-5"
                aria-label="Ver imagen anterior"
              >
                <MdChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNextImage();
                }}
                className="absolute right-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition hover:bg-white sm:right-5"
                aria-label="Ver imagen siguiente"
              >
                <MdChevronRight size={28} />
              </button>
            </>
          )}

          <div
            className="relative h-full max-h-[92dvh] w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={viewerImageUrl}
              alt={producto.name || "Producto"}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-2">
          <button
            className="flex items-center gap-2 text-gray-600 hover:text-brand-600 transition-colors"
            onClick={() =>
              isAdminMode ? router.push("/dashboard/products") : router.back()
            }
          >
            <MdArrowBack size={20} />
            <span className="text-sm font-medium">Volver</span>
          </button>
          {isAdminMode && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  router.push(`/dashboard/products/edit/${producto.id}`)
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Editar producto
              </button>
            </div>
          )}
        </div>
      </div>

      {!isAdminUser && (
        <div className="fixed inset-x-0 bottom-[76px] z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500">Total</p>
              <p className="truncate text-lg font-bold text-brand-700">
                ${Number(displayPrice || 0).toFixed(2)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={
                isBuyingNow ||
                !PAYMENTS_ENABLED ||
                (isRopa && !selectedSize) ||
                availableStock === 0
              }
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {!PAYMENTS_ENABLED
                ? "No disponible"
                : isBuyingNow
                  ? "Preparando..."
                  : "Comprar"}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 pb-40 sm:px-6 sm:pb-40 lg:px-8 lg:pb-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div
            className={`grid grid-cols-1 gap-8 p-5 sm:p-6 lg:p-8 ${
              isAdminMode
                ? "lg:grid-cols-2"
                : "lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]"
            }`}
          >
            <div className="space-y-4">
              <div
                className={`bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative ${
                  isAdminMode
                    ? "aspect-square"
                    : "aspect-[4/5] min-h-[420px] lg:min-h-[620px]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsImageViewerOpen(true)}
                  className="relative flex h-full w-full cursor-zoom-in items-center justify-center"
                  aria-label="Ampliar imagen del producto"
                >
                  <Image
                    src={selectedImageUrl}
                    alt={producto.name || "Producto"}
                    width={900}
                    height={1125}
                    className="object-contain max-w-full max-h-full"
                    priority
                  />
                </button>
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => {
                    const isSelected = idx === selectedImageIndex;
                    return (
                      <button
                        key={`${img.publicId}-${idx}`}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-16 h-16 rounded-md overflow-hidden border-2 shrink-0 ${
                          isSelected
                            ? "border-brand-500"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        aria-label={`Ver imagen ${idx + 1}`}
                      >
                        <Image
                          src={
                            getOptimizedCloudinaryUrl(img.url, {
                              width: 160,
                              height: 160,
                              crop: "fill",
                            }) || img.url
                          }
                          alt={`${producto.name} miniatura ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {!isAdminUser && (
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleFavoriteToggle}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title={
                      isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
                    }
                    aria-label={
                      isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
                    }
                  >
                    {isFavorite ? (
                      <MdFavorite className="text-red-500" size={20} />
                    ) : (
                      <MdFavoriteBorder className="text-gray-600" size={20} />
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Compartir producto"
                    aria-label="Compartir producto"
                  >
                    <MdShare className="text-gray-600" size={20} />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={(isRopa && !selectedSize) || availableStock === 0}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Agregar al carrito"
                    aria-label="Agregar al carrito"
                  >
                    <MdShoppingCart className="text-gray-600" size={20} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6 lg:pt-2">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {producto.name}
                </h1>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl font-bold text-brand-700">
                    ${Number(displayPrice || 0).toFixed(2)}
                  </span>
                  {isAdminMode && displayStatus && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        displayStatus === "disponible"
                          ? "bg-green-100 text-green-800"
                          : displayStatus === "agotado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {displayStatus}
                    </span>
                  )}
                </div>
                {isAdminMode && (
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {productModeLabel}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      {productModeDetail}
                    </span>
                  </div>
                )}
              </div>

              {producto.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Descripcion
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {producto.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Categoria:</span>
                  <span className="ml-2 text-gray-600">
                    {displayCategory || "Sin categoria"}
                  </span>
                </div>
                {isAdminMode && !isRopa && (
                  <div>
                    <span className="font-medium text-gray-900">Stock:</span>
                    <span className="ml-2 text-gray-600">
                      {getProductStock(producto)} unidades
                    </span>
                  </div>
                )}
                {!isRopa && (
                  <div>
                    <span className="font-medium text-gray-900">Precio:</span>
                    <span className="ml-2 text-gray-600">
                      ${Number(displayPrice || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                {isRopa && (
                  <div>
                    <span className="font-medium text-gray-900">Genero:</span>
                    <span className="ml-2 text-gray-600">
                      {displayGenre || "Sin genero"}
                    </span>
                  </div>
                )}
                {isAdminMode && producto.sku && (
                  <div>
                    <span className="font-medium text-gray-900">SKU:</span>
                    <span className="ml-2 text-gray-600">{producto.sku}</span>
                  </div>
                )}
                {isAdminMode && (
                  <div>
                    <span className="font-medium text-gray-900">
                      Stock total:
                    </span>
                    <span className="ml-2 text-gray-600">
                      {getProductStock(producto)} unidades
                    </span>
                  </div>
                )}
              </div>

              {isRopa && variants.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Variantes
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {variants.map((variant) => {
                      const variantName = getVariantName(variant);
                      const isSelected = selectedSize === variantName;
                      const hasStock = (variant.stock || 0) > 0;

                      return (
                        <button
                          key={variantName}
                          onClick={() =>
                            hasStock && setSelectedSize(variantName)
                          }
                          disabled={!hasStock}
                          className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                            isSelected && hasStock
                              ? "border-brand-500 bg-brand-50 text-brand-800"
                              : hasStock
                                ? "border-gray-300 hover:border-brand-400 hover:bg-brand-50"
                                : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <div>{formatVariantLabel(variant)}</div>
                          {!isAdminMode && !hasStock ? (
                            <div className="text-xs text-gray-500">Agotado</div>
                          ) : null}
                          {isAdminMode ? (
                            <div className="text-xs text-gray-500">
                              {hasStock ? `(${variant.stock})` : "Agotado"}
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  {selectedSize && currentVariant && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        Variante seleccionada:{" "}
                        <span className="font-medium">
                          {formatVariantLabel(selectedSize)}
                        </span>{" "}
                        - Precio:{" "}
                        <span className="font-medium text-brand-700">
                          ${Number(currentVariant.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isAdminMode && variants.length > 0 && !hasOnlySizeVariants && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Resumen de variantes
                  </h3>
                  <div className="space-y-2">
                    {variants.map((variant) => (
                      <div
                        key={getVariantName(variant)}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
                      >
                        <div className="font-medium text-gray-800">
                          {getVariantName(variant)}
                        </div>
                        <div className="text-gray-600">
                          Stock: {variant.stock} · $
                          {Number(variant.price || 0).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isAdminMode && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Estadisticas
                      </h3>
                      <p className="text-sm text-slate-500">
                        Actividad guardada en el documento del producto.
                      </p>
                    </div>
                    <div className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                      Conversion: {conversionRate.toFixed(1)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {adminStats.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium uppercase text-slate-500">
                              {item.label}
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                              {item.value.toLocaleString("es-ES")}
                            </p>
                          </div>
                          <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                            {item.icon}
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {item.helper}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isAdminUser && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Cantidad
                    </h3>
                    {cartQuantity > 0 && (
                      <p className="mb-3 text-sm font-medium text-emerald-700">
                        Ya tienes {cartQuantity} en el carrito.
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleDecreaseQuantity}
                        className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={!currentCartItem && quantity <= 1}
                        aria-label="Disminuir cantidad"
                      >
                        <MdRemove size={18} />
                      </button>
                      <span className="w-16 text-center font-medium">
                        {displayQuantity}
                      </span>
                      <button
                        onClick={handleIncreaseQuantity}
                        disabled={displayQuantity >= availableStock}
                        className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        <MdAdd size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <button
                      onClick={handleBuyNow}
                      disabled={
                        isBuyingNow ||
                        !PAYMENTS_ENABLED ||
                        (isRopa && !selectedSize) ||
                        availableStock === 0
                      }
                      className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {!PAYMENTS_ENABLED
                        ? "Compra no disponible"
                        : isBuyingNow
                          ? "Preparando compra..."
                          : "Comprar ahora"}
                    </button>
                    {!PAYMENTS_ENABLED && (
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        {paymentsDisabledMessage}
                      </p>
                    )}
                  </div>

                  {showShareCopied && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                      Enlace copiado
                    </div>
                  )}
                </>
              )}

              <div className="pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600 space-y-2">
                  <p>Entrega y condiciones sujetas a disponibilidad.</p>
                  <p>Revisa disponibilidad y variantes antes de confirmar.</p>
                  <p>
                    {isAdminMode
                      ? "Si tienes dudas, consulta el detalle antes de editar."
                      : "Si tienes dudas, contactanos antes de comprar."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isAdminMode && relatedProducts.length > 0 && (
          <section className="mt-8 rounded-lg bg-white p-5 shadow-lg sm:p-6 lg:mt-10 lg:p-8">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Tambien te puede gustar
              </h2>
              <p className="mt-2 text-sm text-gray-600 sm:text-base">
                Productos similares para seguir explorando sin volver al
                catalogo.
              </p>
            </div>
            <ProductListPublic
              products={relatedProducts}
              onAddToCart={handleRelatedAddToCart}
              onFavorite={handleRelatedFavorite}
            />
          </section>
        )}
      </div>

      {!isAdminUser && (
        <AddedToCartPanel
          open={isAddedPanelOpen}
          product={producto}
          relatedProducts={relatedProducts}
          onClose={() => setIsAddedPanelOpen(false)}
        />
      )}
    </div>
  );
}
