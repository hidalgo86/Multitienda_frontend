import {
  getVariantName,
  PaginatedProducts,
  parseProductAvailability,
  parseGenre,
  Product,
  ProductAvailability,
  ProductImage,
  parseProductState,
  ProductState,
  ProductStatus,
  ProductStats,
  VariantProduct,
} from "@/types/domain/products";

type UnknownRecord = Record<string, unknown>;
const PLACEHOLDER_IMAGE = "/placeholder.webp";
const ALLOWED_IMAGE_HOSTS = new Set(["res.cloudinary.com"]);

const normalizeImageUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;

  const url = value.trim();
  if (!url) return undefined;
  if (url.startsWith("/")) return url;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === "https:" && ALLOWED_IMAGE_HOSTS.has(parsedUrl.hostname)) {
      return url;
    }
  } catch {
    return undefined;
  }

  return undefined;
};

const normalizeVariant = (variant: unknown): VariantProduct => {
  const source = (
    variant && typeof variant === "object" ? variant : {}
  ) as UnknownRecord;
  const name = getVariantName({
    name: typeof source.name === "string" ? source.name : "",
    size: typeof source.size === "string" ? source.size : undefined,
  });

    return {
      name,
      size: name,
      stock: Number(source.stock ?? 0),
      price: Number(source.price ?? 0),
      image: normalizeImageUrl(source.image),
    };
  };

const normalizeStatus = (product: UnknownRecord): ProductStatus | undefined => {
  if (typeof product.status === "string" && product.status.trim()) {
    return product.status as ProductStatus;
  }

  if (product.state === ProductState.ELIMINADO) {
    return ProductStatus.ELIMINADO;
  }

  if (product.availability === ProductAvailability.DISPONIBLE) {
    return ProductStatus.DISPONIBLE;
  }

  if (product.availability === ProductAvailability.AGOTADO) {
    return ProductStatus.AGOTADO;
  }

  return undefined;
};

const normalizeImages = (images: unknown): ProductImage[] => {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image) => {
      const source = (
        image && typeof image === "object" ? image : {}
      ) as UnknownRecord;

      const url = normalizeImageUrl(source.url);
      if (!url || typeof source.publicId !== "string") {
        return null;
      }

      return {
        url,
        publicId: source.publicId,
      } satisfies ProductImage;
    })
    .filter((image): image is ProductImage => Boolean(image));
};

const normalizeStats = (stats: unknown): ProductStats | undefined => {
  if (!stats || typeof stats !== "object") {
    return undefined;
  }

  const source = stats as UnknownRecord;

  return {
    views: Number(source.views ?? 0),
    favorites: Number(source.favorites ?? 0),
    cartAdds: Number(source.cartAdds ?? 0),
    purchases: Number(source.purchases ?? 0),
    searches: Number(source.searches ?? 0),
  };
};

export const normalizeProduct = (value: unknown): Product => {
  const product = (
    value && typeof value === "object" ? value : {}
  ) as UnknownRecord;
  const variants = Array.isArray(product.variants)
    ? product.variants.map(normalizeVariant)
    : undefined;

  return {
    id: typeof product.id === "string" ? product.id : "",
    sku: typeof product.sku === "string" ? product.sku : undefined,
    slug: typeof product.slug === "string" ? product.slug : undefined,
    categoryId:
      typeof product.categoryId === "string" ? product.categoryId : undefined,
    name: typeof product.name === "string" ? product.name : "",
    description:
      typeof product.description === "string" ? product.description : undefined,
    brand: typeof product.brand === "string" ? product.brand : undefined,
    thumbnail: normalizeImageUrl(product.thumbnail) ?? PLACEHOLDER_IMAGE,
    genre:
      typeof product.genre === "string"
        ? (parseGenre(product.genre) ?? undefined)
        : undefined,
    state:
      typeof product.state === "string"
        ? (parseProductState(product.state) ?? undefined)
        : undefined,
    availability:
      typeof product.availability === "string"
        ? (parseProductAvailability(product.availability) ?? undefined)
        : undefined,
    variants,
    images: normalizeImages(product.images),
    stock: product.stock === undefined ? undefined : Number(product.stock ?? 0),
    price: product.price === undefined ? undefined : Number(product.price ?? 0),
    stats: normalizeStats(product.stats),
    createdAt:
      typeof product.createdAt === "string" || product.createdAt instanceof Date
        ? product.createdAt
        : undefined,
    updatedAt:
      typeof product.updatedAt === "string" || product.updatedAt instanceof Date
        ? product.updatedAt
        : undefined,
    category:
      typeof product.category === "string"
        ? (product.category as Product["category"])
        : undefined,
    status: normalizeStatus(product),
  };
};

export const normalizeProductsPage = (value: unknown): PaginatedProducts => {
  const page = (
    value && typeof value === "object" ? value : {}
  ) as UnknownRecord;

  return {
    items: Array.isArray(page.items) ? page.items.map(normalizeProduct) : [],
    total: Number(page.total ?? 0),
    page: Number(page.page ?? 1),
    totalPages: Number(page.totalPages ?? 1),
  };
};
