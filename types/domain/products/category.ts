export enum ProductCategory {
  ROPA = "ROPA",
  JUGUETE = "JUGUETE",
  ACCESORIO = "ACCESORIO",
  ALIMENTACION = "ALIMENTACION",
}

const allowedCategories = new Set<ProductCategory>(
  Object.values(ProductCategory),
);

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent?: string;
  parentId?: string;
}

export interface ProductCategoryOption {
  value: string;
  label: string;
  categoryId: string;
  supportsGenre: boolean;
}

const legacyCategoryLabels: Record<ProductCategory, string> = {
  [ProductCategory.ROPA]: "Ropa",
  [ProductCategory.JUGUETE]: "Juguetes",
  [ProductCategory.ACCESORIO]: "Accesorios",
  [ProductCategory.ALIMENTACION]: "Alimentación",
};

export const legacyProductCategoryOptions: ProductCategoryOption[] = [
  {
    value: "ropa",
    label: legacyCategoryLabels[ProductCategory.ROPA],
    categoryId: "",
    supportsGenre: true,
  },
  {
    value: "juguete",
    label: legacyCategoryLabels[ProductCategory.JUGUETE],
    categoryId: "",
    supportsGenre: false,
  },
  {
    value: "accesorio",
    label: legacyCategoryLabels[ProductCategory.ACCESORIO],
    categoryId: "",
    supportsGenre: false,
  },
  {
    value: "alimentacion",
    label: legacyCategoryLabels[ProductCategory.ALIMENTACION],
    categoryId: "",
    supportsGenre: false,
  },
];

const normalizeCategoryLookupValue = (value: string): string =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const buildProductCategoryOptions = (
  categories?: Category[],
): ProductCategoryOption[] => {
  if (!Array.isArray(categories) || categories.length === 0) {
    return [];
  }

  return categories
    .filter(
      (category) =>
        Boolean(category?.id?.trim()) &&
        Boolean(category?.name?.trim()) &&
        Boolean(category?.slug?.trim()),
    )
    .map((category) => {
      const normalizedSlug = normalizeCategoryLookupValue(category.slug);
      return {
        value: category.slug,
        label: category.name,
        categoryId: category.id,
        supportsGenre:
          normalizedSlug === "ropa" || normalizedSlug.includes("ropa"),
      };
    });
};

const getCategoryOptionsPool = (
  options?: ProductCategoryOption[],
): ProductCategoryOption[] => {
  const dynamicOptions = Array.isArray(options) ? options : [];
  if (dynamicOptions.length > 0) {
    return dynamicOptions;
  }

  return legacyProductCategoryOptions;
};

const findCategoryOptionByNormalizedValue = (
  value: string,
  options?: ProductCategoryOption[],
): ProductCategoryOption | null => {
  const normalizedValue = normalizeCategoryLookupValue(String(value));
  return (
    getCategoryOptionsPool(options).find(
      (option) =>
        normalizeCategoryLookupValue(option.value) === normalizedValue ||
        normalizeCategoryLookupValue(option.label) === normalizedValue,
    ) || null
  );
};

const getCategoryOptionById = (
  categoryId?: string | null,
  options?: ProductCategoryOption[],
): ProductCategoryOption | null => {
  if (!categoryId) return null;
  return (
    getCategoryOptionsPool(options).find(
      (option) => option.categoryId === categoryId,
    ) || null
  );
};

export const resolveCategoryOption = (
  value?: string | null,
  options?: ProductCategoryOption[],
): ProductCategoryOption | null => {
  if (!value) return null;
  return (
    getCategoryOptionById(value, options) ||
    findCategoryOptionByNormalizedValue(value, options)
  );
};

export const isClothingCategory = (
  value?: string | null,
  options?: ProductCategoryOption[],
): boolean => {
  return resolveCategoryOption(value, options)?.supportsGenre || false;
};

export const parseProductCategory = (
  category?: string | ProductCategory | null,
): ProductCategory | null => {
  if (!category) return null;
  const normalized = String(category).trim().toUpperCase() as ProductCategory;
  return allowedCategories.has(normalized) ? normalized : null;
};

export const getLegacyProductCategoryLabel = (
  category: ProductCategory,
): string => legacyCategoryLabels[category];
