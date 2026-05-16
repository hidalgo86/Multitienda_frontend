import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  formatSizeLabel,
  getProductStatusLabel,
  getProductStock,
} from "@/types/domain/products";
import type { ProductListAdminProps } from "@/types/ui/products";

const PLACEHOLDER = "/placeholder.webp";

const statusBadgeClass = (status: string): string => {
  switch (status) {
    case "disponible":
      return "bg-emerald-50 text-emerald-700";
    case "agotado":
      return "bg-amber-50 text-amber-700";
    case "eliminado":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const resolveVariantSummary = (product: ProductListAdminProps["products"][number]) => {
  const variants = product.variants ?? [];

  if (variants.length === 0) {
    return "Producto simple";
  }

  const labels = variants
    .slice(0, 3)
    .map((variant) => formatSizeLabel(variant.name || variant.size))
    .join(" · ");

  return variants.length > 3 ? `${labels} · ...` : labels;
};

const resolvePrice = (product: ProductListAdminProps["products"][number]) => {
  const variants = product.variants ?? [];
  const minPrice =
    variants.length > 0
      ? Math.min(...variants.map((variant) => Number(variant.price) || 0))
      : null;
  const directPrice = Number(product.price ?? 0);

  if (minPrice !== null) {
    return `$${minPrice.toFixed(2)}`;
  }

  if (Number.isFinite(directPrice)) {
    return `$${directPrice.toFixed(2)}`;
  }

  return "Sin precio";
};

const getStats = (product: ProductListAdminProps["products"][number]) => ({
  views: Number(product.stats?.views ?? 0),
  favorites: Number(product.stats?.favorites ?? 0),
  cartAdds: Number(product.stats?.cartAdds ?? 0),
  purchases: Number(product.stats?.purchases ?? 0),
});

const formatMetric = (value: number): string => value.toLocaleString("es-ES");

const ProductListAdmin: React.FC<ProductListAdminProps> = ({
  products,
  onEdit,
  onDelete,
  onRestore,
  actionLoadingId,
}) => {
  if (!products || products.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
        No hay productos para mostrar.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto xl:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Variantes</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Metricas</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => {
              const status = getProductStatusLabel(product);
              const isDeleted = status === "eliminado";
              const isBusy = actionLoadingId === product.id;
              const imageSrc = product.images?.[0]?.url || PLACEHOLDER;
              const stats = getStats(product);

              return (
                <tr key={product.id} className="text-sm text-slate-700">
                  <td className="px-4 py-4">
                    <div className="flex min-w-[280px] items-center gap-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
                        <Image
                          src={imageSrc}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="line-clamp-1 font-semibold text-slate-900 transition hover:text-brand-700"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {product.description?.trim() || "Sin descripcion"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {resolveVariantSummary(product)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {getProductStock(product)}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {resolvePrice(product)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="grid min-w-[220px] grid-cols-2 gap-2 text-xs text-slate-600">
                      <span className="rounded-lg bg-slate-50 px-2 py-1">
                        Vistas:{" "}
                        <b className="text-slate-900">
                          {formatMetric(stats.views)}
                        </b>
                      </span>
                      <span className="rounded-lg bg-slate-50 px-2 py-1">
                        Fav:{" "}
                        <b className="text-slate-900">
                          {formatMetric(stats.favorites)}
                        </b>
                      </span>
                      <span className="rounded-lg bg-slate-50 px-2 py-1">
                        Carrito:{" "}
                        <b className="text-slate-900">
                          {formatMetric(stats.cartAdds)}
                        </b>
                      </span>
                      <span className="rounded-lg bg-slate-50 px-2 py-1">
                        Compras:{" "}
                        <b className="text-slate-900">
                          {formatMetric(stats.purchases)}
                        </b>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Ver detalle
                      </Link>

                      {onEdit && !isDeleted && (
                        <button
                          type="button"
                          onClick={() => onEdit(product.id)}
                          disabled={isBusy}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          Editar
                        </button>
                      )}

                      {onDelete && !isDeleted && (
                        <button
                          type="button"
                          onClick={() => onDelete(product.id)}
                          disabled={isBusy}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          Eliminar
                        </button>
                      )}

                      {onRestore && isDeleted && (
                        <button
                          type="button"
                          onClick={() => onRestore(product.id)}
                          disabled={isBusy}
                          className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-medium text-brand-700 transition hover:bg-brand-50 disabled:opacity-60"
                        >
                          Restaurar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 xl:hidden">
        {products.map((product) => {
          const status = getProductStatusLabel(product);
          const isDeleted = status === "eliminado";
          const isBusy = actionLoadingId === product.id;
          const imageSrc = product.images?.[0]?.url || PLACEHOLDER;
          const stats = getStats(product);

          return (
            <article key={product.id} className="space-y-4 p-4">
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  <Image
                    src={imageSrc}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="line-clamp-2 font-semibold text-slate-900 transition hover:text-brand-700"
                    >
                      {product.name}
                    </Link>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}
                    >
                      {status}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {product.description?.trim() || "Sin descripcion"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Variantes
                  </p>
                  <p className="mt-1">{resolveVariantSummary(product)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Stock
                  </p>
                  <p className="mt-1">{getProductStock(product)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Precio
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {resolvePrice(product)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <span className="rounded-lg bg-slate-50 px-3 py-2">
                  Vistas:{" "}
                  <b className="text-slate-900">{formatMetric(stats.views)}</b>
                </span>
                <span className="rounded-lg bg-slate-50 px-3 py-2">
                  Favoritos:{" "}
                  <b className="text-slate-900">
                    {formatMetric(stats.favorites)}
                  </b>
                </span>
                <span className="rounded-lg bg-slate-50 px-3 py-2">
                  Carrito:{" "}
                  <b className="text-slate-900">
                    {formatMetric(stats.cartAdds)}
                  </b>
                </span>
                <span className="rounded-lg bg-slate-50 px-3 py-2">
                  Compras:{" "}
                  <b className="text-slate-900">
                    {formatMetric(stats.purchases)}
                  </b>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/products/${product.id}`}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Ver detalle
                </Link>

                {onEdit && !isDeleted && (
                  <button
                    type="button"
                    onClick={() => onEdit(product.id)}
                    disabled={isBusy}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Editar
                  </button>
                )}

                {onDelete && !isDeleted && (
                  <button
                    type="button"
                    onClick={() => onDelete(product.id)}
                    disabled={isBusy}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    Eliminar
                  </button>
                )}

                {onRestore && isDeleted && (
                  <button
                    type="button"
                    onClick={() => onRestore(product.id)}
                    disabled={isBusy}
                    className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-medium text-brand-700 transition hover:bg-brand-50 disabled:opacity-60"
                  >
                    Restaurar
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default ProductListAdmin;
