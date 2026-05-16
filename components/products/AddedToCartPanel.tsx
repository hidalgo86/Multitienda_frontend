"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MdCheckCircle, MdClose, MdShoppingCart } from "react-icons/md";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinaryImages";
import ProductImage from "@/components/products/ProductImage";
import type { Product } from "@/types/domain/products";

interface AddedToCartPanelProps {
  open: boolean;
  product: Product;
  relatedProducts?: Product[];
  onClose: () => void;
}

const resolvePrice = (product: Product): string => {
  const variants = product.variants ?? [];
  const variantPrices = variants
    .map((variant) => Number(variant.price) || 0)
    .filter((price) => price > 0);
  const price =
    variantPrices.length > 0
      ? Math.min(...variantPrices)
      : Number(product.price || 0);

  return price > 0 ? `$${price.toFixed(2)}` : "Ver precio";
};

const resolveImage = (product: Product): string =>
  getOptimizedCloudinaryUrl(product.images?.[0]?.url, {
    width: 160,
    height: 160,
    crop: "fill",
  }) || "/placeholder.webp";

export default function AddedToCartPanel({
  open,
  product,
  relatedProducts = [],
  onClose,
}: AddedToCartPanelProps) {
  const visibleRelated = relatedProducts
    .filter((item) => item.id !== product.id)
    .slice(0, 3);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 hidden bg-black/20 lg:block"
        aria-label="Cerrar confirmacion de carrito"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="false"
        aria-label="Producto agregado al carrito"
        className="fixed inset-x-3 bottom-[154px] z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-[min(520px,calc(100vw-2rem))] sm:-translate-x-1/2 lg:bottom-6 lg:left-auto lg:right-6 lg:top-28 lg:w-[380px] lg:translate-x-0 lg:overflow-y-auto"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <MdCheckCircle size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-950">
              Agregado al carrito
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">
              {product.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-black"
          >
            Seguir comprando
          </button>
          <Link
            href="/cart"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <MdShoppingCart size={18} />
            Ver carrito
          </Link>
        </div>

        {visibleRelated.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-bold text-slate-900">
              Tambien te puede gustar
            </p>
            <div className="mt-3 space-y-2">
              {visibleRelated.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  className="flex gap-3 rounded-lg border border-slate-100 p-2 transition hover:border-brand-200 hover:bg-brand-50"
                  onClick={onClose}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                    <ProductImage
                      src={resolveImage(item)}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm font-bold text-brand-700">
                      {resolvePrice(item)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
