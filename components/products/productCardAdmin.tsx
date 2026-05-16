import React from "react";
import Link from "next/link";
import {
  formatSizeLabel,
  getProductStatusLabel,
  getProductStock,
} from "@/types/domain/products";
import type { ProductCardAdminProps } from "@/types/ui/products";
import ProductImage from "@/components/products/ProductImage";

const statusColors: Record<string, string> = {
  disponible: "bg-green-100 text-green-700 border-green-300",
  agotado: "bg-gray-200 text-gray-700 border-gray-300",
  eliminado: "bg-red-100 text-red-700 border-red-300",
};

const PLACEHOLDER = "/placeholder.webp";

const getProductMode = (product: ProductCardAdminProps["product"]) => {
  const variants = product.variants ?? [];
  if (variants.length === 0) {
    return {
      label: "Simple",
      detail: `Stock total: ${getProductStock(product)}`,
    };
  }

  const hasOnlySizeVariants = variants.every((variant) => {
    const variantName = String(variant.name || variant.size || "").trim();
    return formatSizeLabel(variantName) !== variantName
      ? true
      : /^(RN|M3|M6|M9|M12|M18|M24|T2|T3|T4|T5|T6|T7|T8|T9|T10|T12)$/i.test(
          variantName,
        );
  });

  return {
    label: hasOnlySizeVariants ? "Ropa" : "Variantes",
    detail: hasOnlySizeVariants
      ? `${variants.length} talla(s)`
      : `${variants.length} variante(s)`,
  };
};

const ProductCardAdmin: React.FC<ProductCardAdminProps> = ({
  product,
  onEdit,
  onDelete,
  onRestore,
  actionLoadingId,
}) => {
  const status = getProductStatusLabel(product);
  const isEliminado = status === "eliminado";
  const isActionLoading = actionLoadingId === product.id;
  const variants = product.variants ?? [];
  const minPrice =
    variants.length > 0
      ? Math.min(...variants.map((v) => Number(v.price) || 0))
      : null;
  const directPrice = Number(product.price ?? 0);
  const finalPrice =
    minPrice !== null
      ? minPrice
      : Number.isFinite(directPrice)
        ? directPrice
        : null;
  const coverImage = product.images?.[0]?.url || PLACEHOLDER;
  const productMode = getProductMode(product);
  const stockSummary =
    variants.length > 0
      ? `Stock total: ${getProductStock(product)}`
      : `Stock: ${Math.max(0, Number(product.stock ?? 0))}`;

  return (
    <div
      className="relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 border flex flex-col overflow-hidden group"
      tabIndex={0}
      aria-label={`Tarjeta producto ${product.name}`}
    >
      {/* Imagen y estado */}
      <Link
        href={`/dashboard/products/${product.id}`}
        className="w-full h-40 sm:h-48 bg-gray-100 flex items-center justify-center overflow-hidden relative"
        aria-label={`Ver detalle de ${product.name}`}
      >
        <ProductImage
          src={coverImage}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <span
          className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold border shadow ${
            statusColors[status || ""] ||
            "bg-gray-100 text-gray-500 border-gray-300"
          }`}
          style={{ zIndex: 2 }}
        >
          {status}
        </span>
      </Link>
      {/* Botones de acción admin o restaurar */}
      {!isEliminado && (
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {onEdit && (
            <button
              onClick={() => onEdit(product.id)}
              disabled={isActionLoading}
              className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full shadow focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              title="Editar producto"
              aria-label="Editar producto"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.475 5.408a2.357 2.357 0 1 1 3.336 3.336L7.5 21.055l-4.5 1.5 1.5-4.5 11.975-12.647Z"
                />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(product.id)}
              disabled={isActionLoading}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              title="Eliminar producto"
              aria-label="Eliminar producto"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 6L6 18M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}
      {isEliminado && onRestore && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => onRestore(product.id)}
            disabled={isActionLoading}
            className="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-full shadow disabled:opacity-60 disabled:cursor-not-allowed"
            title="Restablecer producto"
            aria-label="Restablecer producto"
          >
            <svg
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
      {/* Info principal */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="font-bold text-base text-gray-900 mb-1 relative group">
          <span
            tabIndex={0}
            className="cursor-pointer"
            aria-label={product.description || "Sin descripción"}
          >
            {product.name}
          </span>
          {product.description && (
            <span className="absolute left-0 top-full mt-1 w-max max-w-xs bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-20">
              {product.description}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {productMode.label}
          </span>
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            {productMode.detail}
          </span>
        </div>
        {variants.length > 0 && (
          <div className="mb-2 text-xs text-gray-500 line-clamp-2">
            {variants
              .slice(0, 3)
              .map((variant) => formatSizeLabel(variant.name || variant.size))
              .join(" · ")}
            {variants.length > 3 ? " · ..." : ""}
          </div>
        )}
        <div className="text-xs text-gray-500">{stockSummary}</div>
        <div className="mt-auto pt-2 text-sm text-gray-700 flex justify-end items-end">
          {finalPrice !== null ? (
            <div className="font-bold text-lg text-gray-900 text-right min-w-[80px]">
              ${finalPrice.toFixed(2)}
            </div>
          ) : (
            <div className="text-gray-400">Precio no disponible</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCardAdmin;
