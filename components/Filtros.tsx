"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { MdOutlineRestartAlt, MdTune } from "react-icons/md";
import {
  formatSizeLabel,
  Genre,
  isClothingCategory,
  legacyProductCategoryOptions,
  resolveCategoryOption,
  Size,
} from "@/types/domain/products";
import type { ProductFiltersProps } from "@/types/ui/products";
import { useCategories } from "@/services/categories/useCategories";

const FILTER_KEYS = [
  "search",
  "categoryId",
  "category",
  "genre",
  "size",
  "minPrice",
  "maxPrice",
  "page",
  "genero",
  "talla",
  "precioMin",
  "precioMax",
] as const;

const readParam = (searchParams: URLSearchParams | null, ...keys: string[]) => {
  for (const key of keys) {
    const value = searchParams?.get(key);
    if (value && value.trim()) return value;
  }
  return "";
};

const fieldClassName =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100 disabled:bg-gray-50 disabled:text-gray-400";

export default function Filtros({
  onFilterApply,
  categoryOptions: initialCategoryOptions,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const { options } = useCategories({
    enabled: !initialCategoryOptions?.length,
    initialOptions: initialCategoryOptions,
  });
  const categoryOptions = initialCategoryOptions?.length
    ? initialCategoryOptions
    : options.length
      ? options
    : legacyProductCategoryOptions;

  const [categoryId, setCategoryId] = useState(
    readParam(searchParams, "categoryId", "category"),
  );
  const [genre, setGenre] = useState(
    readParam(searchParams, "genre", "genero"),
  );
  const [size, setSize] = useState(readParam(searchParams, "size", "talla"));
  const [minPrice, setMinPrice] = useState(
    readParam(searchParams, "minPrice", "precioMin"),
  );
  const [maxPrice, setMaxPrice] = useState(
    readParam(searchParams, "maxPrice", "precioMax"),
  );
  const [isSearching, setIsSearching] = useState(false);
  const isClothingFilter =
    !categoryId || isClothingCategory(categoryId, categoryOptions);

  useEffect(() => {
    setCategoryId(readParam(searchParams, "categoryId", "category"));
    setGenre(readParam(searchParams, "genre", "genero"));
    setSize(readParam(searchParams, "size", "talla"));
    setMinPrice(readParam(searchParams, "minPrice", "precioMin"));
    setMaxPrice(readParam(searchParams, "maxPrice", "precioMax"));
  }, [searchParams]);

  const updateURL = (paramsObj: Record<string, string>) => {
    const params = new URLSearchParams(
      searchParams ? searchParams.toString() : "",
    );

    FILTER_KEYS.forEach((key) => params.delete(key));

    Object.entries(paramsObj).forEach(([key, value]) => {
      if (value && value.trim()) {
        params.set(key, value.trim());
      }
    });

    params.set("page", "1");
    const query = params.toString();
    const newUrl = query ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      router.replace(newUrl, { scroll: false });
    });
    onFilterApply?.();
  };

  const applyCurrentFilters = async () => {
    setIsSearching(true);
    try {
      updateURL({
        search: readParam(searchParams, "search"),
        categoryId,
        genre,
        size,
        minPrice,
        maxPrice,
      });
    } finally {
      setTimeout(() => setIsSearching(false), 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await applyCurrentFilters();
  };

  const resetFilters = () => {
    setCategoryId("");
    setGenre("");
    setSize("");
    setMinPrice("");
    setMaxPrice("");
    updateURL({});
  };

  const activeCount = [
    categoryId,
    genre,
    size,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ajusta categoria, talla y precio.
            </p>
          </div>
          <div className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            {activeCount} activos
          </div>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <section className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
          <div className="text-sm font-semibold text-gray-900">
            Clasificacion
          </div>

          <div className="space-y-2">
            <label
              htmlFor="categoryId"
              className="text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Categoria
            </label>
            <select
              id="categoryId"
              value={categoryId}
              onChange={(e) => {
                const nextCategoryId = e.target.value;
                const nextOption = resolveCategoryOption(
                  nextCategoryId,
                  categoryOptions,
                );
                const nextGenre =
                  nextCategoryId && !nextOption?.supportsGenre ? "" : genre;
                const nextSize =
                  nextCategoryId && !nextOption?.supportsGenre ? "" : size;

                setCategoryId(nextCategoryId);
                setGenre(nextGenre);
                setSize(nextSize);
              }}
              className={fieldClassName}
            >
              <option value="">Todas</option>
              {categoryOptions.map((option) => (
                <option
                  key={option.categoryId || option.value}
                  value={option.categoryId || option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="genre"
                className="text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Genero
              </label>
              <select
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                disabled={!isClothingFilter}
                className={fieldClassName}
              >
                <option value="">Todas</option>
                <option value={Genre.NINO}>Nino</option>
                <option value={Genre.NINA}>Nina</option>
                <option value={Genre.UNISEX}>Unisex</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="size"
                className="text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Talla
              </label>
              <select
                id="size"
                value={size}
                disabled={!isClothingFilter}
                onChange={(e) => setSize(e.target.value)}
                className={fieldClassName}
              >
                <option value="">Todas</option>
                {Object.values(Size).map((option) => (
                  <option key={option} value={option}>
                    {formatSizeLabel(option)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
          <div className="text-sm font-semibold text-gray-900">Precio</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label
                htmlFor="minPrice"
                className="text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Minimo
              </label>
              <input
                id="minPrice"
                type="number"
                min="0"
                step="0.01"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className={fieldClassName}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="maxPrice"
                className="text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Maximo
              </label>
              <input
                id="maxPrice"
                type="number"
                min="0"
                step="0.01"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className={fieldClassName}
                placeholder="999"
              />
            </div>
          </div>
        </section>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-100"
            disabled={isSearching}
          >
            {isSearching ? (
              <div className="h-[18px] w-[18px] rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <MdTune size={18} />
            )}
            Aplicar filtros
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100"
          >
            <MdOutlineRestartAlt size={18} />
            Limpiar filtros
          </button>
        </div>
      </form>
    </div>
  );
}
