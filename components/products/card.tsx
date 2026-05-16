import Image from "next/image";
import { getProductStatusLabel } from "@/types/domain/products";
import type { ProductCardProps } from "@/types/ui/products";
import { MdShoppingCart } from "react-icons/md";

const statusColors: Record<string, string> = {
  disponible: "bg-green-100 text-green-700 border-green-300",
  agotado: "bg-red-100 text-red-700 border-red-300",
  eliminado: "bg-gray-200 text-gray-500 border-gray-400",
};

const PLACEHOLDER = "/placeholder.webp";

function Card({
  product,
  admin = false,
  onEdit,
  onDelete,
  onRestore,
  onAddToCart,
  onFavorite,
}: ProductCardProps) {
  const status = getProductStatusLabel(product);
  const isEliminado = status === "eliminado";

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

  return (
    <div
      className="relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 border flex flex-col overflow-hidden group"
      tabIndex={0}
      aria-label={`Tarjeta producto ${product.name}`}
    >
      <div className="w-full h-40 sm:h-48 bg-gray-100 flex items-center justify-center overflow-hidden relative">
        <Image
          src={coverImage}
          alt={product.name}
          width={224}
          height={192}
          className="object-cover w-full h-full"
        />
        {admin && (
          <span
            className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold border shadow ${
              statusColors[status || ""] ||
              "bg-gray-100 text-gray-500 border-gray-300"
            }`}
            style={{ zIndex: 2 }}
          >
            {status}
          </span>
        )}
      </div>
      {/* Botones de acción solo si admin */}
      {!isEliminado && admin && (
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {onEdit && (
            <button
              onClick={() => onEdit(product.id)}
              className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full shadow focus:outline-none"
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
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow focus:outline-none"
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
      {/* Botones de acción para cliente (carrito y favorito) */}
      {!isEliminado && !admin && (onAddToCart || onFavorite) && (
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product.id)}
              className="bg-brand-500 hover:bg-brand-600 text-white p-2 rounded-full shadow focus:outline-none"
              title="Agregar al carrito"
              aria-label="Agregar al carrito"
            >
              <MdShoppingCart size={16} />
            </button>
          )}
          {onFavorite && (
            <button
              onClick={() => onFavorite(product.id)}
              className="bg-brand-500 hover:bg-brand-600 text-white p-2 rounded-full shadow focus:outline-none"
              title="Agregar a favoritos"
              aria-label="Agregar a favoritos"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
            </button>
          )}
        </div>
      )}
      {/* Botón restaurar si eliminado */}
      {isEliminado && onRestore && (
        <button
          onClick={() => onRestore(product.id)}
          className="absolute bottom-2 right-2 bg-brand-600 hover:bg-brand-700 text-white px-3 py-1 rounded shadow text-xs font-medium"
          title="Restablecer producto"
          aria-label="Restablecer producto"
        >
          Restablecer
        </button>
      )}

      {/* Info principal */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Nombre con tooltip */}
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
        {/* Variantes */}
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
}

export default Card;
