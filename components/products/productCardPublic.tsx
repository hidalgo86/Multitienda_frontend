import React from "react";
import Link from "next/link";
import {
  formatSizeLabel,
  getVariantName,
  getProductStatusLabel,
} from "@/types/domain/products";
import type { ProductCardPublicProps } from "@/types/ui/products";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  MdAdd,
  MdFavorite,
  MdFavoriteBorder,
  MdRemove,
  MdShoppingCart,
} from "react-icons/md";
import { useCartActions } from "@/lib/useCartActions";
import { isStoredAdminUser } from "@/services/users";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinaryImages";
import ProductImage from "@/components/products/ProductImage";

const PLACEHOLDER = "/placeholder.webp";

const resolveVariantSummary = (
  product: ProductCardPublicProps["product"],
): string | null => {
  const variants = product.variants ?? [];

  if (variants.length === 0) {
    return null;
  }

  const labels = variants
    .slice(0, 3)
    .map((variant) => formatSizeLabel(variant.name || variant.size))
    .join(" - ");

  return variants.length > 3 ? `${labels} - ...` : labels;
};

const resolvePrice = (product: ProductCardPublicProps["product"]) => {
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

const ProductCardPublic: React.FC<ProductCardPublicProps> = ({
  product,
  onAddToCart,
  onFavorite,
  imagePriority = false,
}) => {
  const { changeCartItemQuantity } = useCartActions();
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const isAdminUser = hasMounted ? isStoredAdminUser() : false;
  const imageSrc =
    getOptimizedCloudinaryUrl(product.images?.[0]?.url, {
      width: 640,
      height: 800,
      crop: "fill",
    }) || PLACEHOLDER;
  const status = getProductStatusLabel(product);
  const isDeleted = status === "eliminado";
  const variantSummary = resolveVariantSummary(product);
  const variants = product.variants ?? [];
  const quickVariant = variants.find((variant) => (variant.stock || 0) > 0) || variants[0];
  const quickVariantName = getVariantName(quickVariant) || undefined;
  const allCartItems = useSelector((state: RootState) => state.cart.items);
  const cartItems = React.useMemo(
    () => allCartItems.filter((item) => item.id === product.id),
    [allCartItems, product.id],
  );
  const primaryCartItem =
    cartItems.find((item) => item.selectedSize === quickVariantName) ||
    cartItems[0];
  const cartQuantity = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const isFavorite = useSelector((state: RootState) =>
    state.favorites?.items?.some((item) => item.id === product.id),
  );
  const isInCart = cartQuantity > 0;

  const handleDecreaseCartQuantity = () => {
    if (!primaryCartItem) return;

    void changeCartItemQuantity({
      productId: primaryCartItem.id,
      quantity: primaryCartItem.quantity - 1,
      selectedSize: primaryCartItem.selectedSize,
      selectedColor: primaryCartItem.selectedColor,
    });
  };

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link
        href={`/products/${product.id}`}
        className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100"
        aria-label={`Ver detalle de ${product.name}`}
      >
        <ProductImage
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover transition duration-200 hover:scale-[1.03]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading={imagePriority ? "eager" : "lazy"}
          fetchPriority={imagePriority ? "high" : "auto"}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">
        <div className="min-w-0">
          <Link
            href={`/products/${product.id}`}
            className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition hover:text-brand-700 sm:text-base"
          >
            {product.name}
          </Link>

          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
            {product.description?.trim() || "Sin descripcion"}
          </p>
        </div>

        {variantSummary ? (
          <p className="line-clamp-1 text-xs text-slate-500">
            {variantSummary}
          </p>
        ) : null}

        <p className="mt-auto text-base font-bold text-slate-900 sm:text-lg">
          {resolvePrice(product)}
        </p>

        {!isDeleted && (
          <div className="flex items-center gap-2">
            <Link
              href={`/products/${product.id}`}
              className="flex-1 rounded-lg border border-slate-300 px-2 py-2 text-center text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Ver
            </Link>

            {!isAdminUser && onAddToCart &&
              (isInCart ? (
                <div className="flex h-9 items-center overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800">
                  <button
                    type="button"
                    onClick={handleDecreaseCartQuantity}
                    className="flex h-9 w-8 items-center justify-center transition hover:bg-emerald-100"
                    title="Disminuir cantidad"
                    aria-label="Disminuir cantidad en carrito"
                  >
                    <MdRemove size={15} />
                  </button>
                  <span
                    className="min-w-7 px-1 text-center text-xs font-bold"
                    title="Cantidad en carrito"
                  >
                    {cartQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddToCart(product.id)}
                    className="flex h-9 w-8 items-center justify-center transition hover:bg-emerald-100"
                    title="Aumentar cantidad"
                    aria-label="Aumentar cantidad en carrito"
                  >
                    <MdAdd size={15} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onAddToCart(product.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50"
                  title="Agregar al carrito"
                  aria-label="Agregar al carrito"
                >
                  <MdShoppingCart size={16} />
                </button>
              ))}

            {!isAdminUser && onFavorite && (
              <button
                type="button"
                onClick={() => onFavorite(product.id)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  isFavorite
                    ? "border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
                title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                aria-label={
                  isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
                }
              >
                {isFavorite ? (
                  <MdFavorite size={16} />
                ) : (
                  <MdFavoriteBorder size={16} />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default ProductCardPublic;
