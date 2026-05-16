import PublicListWrapper from "./PublicListWrapper";
import Pagination from "./Pagination";
import Filtros from "../../../../components/Filtros";
import { notFound } from "next/navigation";
import { MdTune } from "react-icons/md";
import {
  ProductAvailability,
  Product,
  ProductSortBy,
  Size,
  allowedSizes,
  parseGenre,
} from "@/types/domain/products";
import FiltrosMobileButton from "./FiltrosMobileButton";
import { listProducts } from "@/services/products";
import { listCategories } from "@/services/categories";
import ProductSearchBar from "./ProductSearchBar";
import ProductSortSelect from "./ProductSortSelect";
import { getRequestBaseUrl } from "@/lib/requestBaseUrl";
import { paginationConfig } from "@/lib/paginationConfig";

const readSingleParam = (
  params: Record<string, string> | undefined,
  ...keys: string[]
) => {
  for (const key of keys) {
    const value = params?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
};

const parseOptionalNumber = (value: string) => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseSortBy = (value: string): ProductSortBy | undefined =>
  Object.values(ProductSortBy).includes(value as ProductSortBy)
    ? (value as ProductSortBy)
    : undefined;

const normalizeCategoryLookupValue = (value: string): string =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const resolveCategoryId = async (
  categoryId: string,
  category: string,
  baseUrl: string,
) => {
  if (categoryId) return categoryId;
  if (!category) return "";

  const normalizedCategory = normalizeCategoryLookupValue(category);

  try {
    const categories = await listCategories({ baseUrl, cache: "no-store" });
    return (
      categories.find(
        (item) =>
          normalizeCategoryLookupValue(item.slug) === normalizedCategory ||
          normalizeCategoryLookupValue(item.name) === normalizedCategory,
      )?.id || ""
    );
  } catch {
    return "";
  }
};

export default async function ProductsClient({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const search = readSingleParam(params, "search");
  const sortBy = parseSortBy(readSingleParam(params, "sortBy"));
  const minPrice = parseOptionalNumber(
    readSingleParam(params, "minPrice", "precioMin"),
  );
  const maxPrice = parseOptionalNumber(
    readSingleParam(params, "maxPrice", "precioMax"),
  );
  const parsedGenre = parseGenre(readSingleParam(params, "genre", "genero"));
  const categoryId = readSingleParam(params, "categoryId");
  const category = readSingleParam(params, "category");
  const sizeParam = readSingleParam(params, "size", "talla");
  const sizes = sizeParam
    ? [String(sizeParam).trim().toUpperCase() as Size].filter(
        (size): size is Size => allowedSizes.has(size),
      )
    : undefined;

  const baseUrl = await getRequestBaseUrl();
  const resolvedCategoryId = await resolveCategoryId(
    categoryId,
    category,
    baseUrl,
  );
  const hasUnresolvedCategoryFilter = Boolean(category && !resolvedCategoryId);

  let data;
  try {
    data = hasUnresolvedCategoryFilter
      ? {
          items: [],
          total: 0,
          page,
          totalPages: 1,
        }
      : await listProducts(
          {
            page,
            limit: paginationConfig.productListLimit,
            availability: ProductAvailability.DISPONIBLE,
            name: search || undefined,
            categoryId: resolvedCategoryId || undefined,
            genre: parsedGenre ?? undefined,
            sizes,
            minPrice,
            maxPrice,
            sortBy,
          },
          { baseUrl, cache: "no-store" },
        );
  } catch {
    return notFound();
  }

  const { items, totalPages } = data;
  const safeTotalPages = Math.max(1, totalPages || 1);
  const noProducts = !items || items.length === 0;
  const activeFiltersCount = [
    minPrice !== undefined ? String(minPrice) : "",
    maxPrice !== undefined ? String(maxPrice) : "",
    parsedGenre ?? "",
    categoryId || category,
    sizeParam,
  ].filter(Boolean).length;

  if (page < 1 || (!noProducts && page > safeTotalPages)) return notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <FiltrosMobileButton activeCount={activeFiltersCount} />

      <div className="flex w-full min-w-0 flex-1">
        <aside
          className="hidden w-full max-w-[320px] min-w-[280px] border-r border-slate-200 bg-white lg:block"
          aria-label="Filtros de productos"
        >
          <div className="sticky top-24 p-5 xl:p-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Filtros />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-4 pb-24 sm:px-6 sm:py-6 sm:pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Productos
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Busca productos y ajusta filtros cuando lo necesites.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 xl:max-w-3xl">
                <ProductSearchBar initialSearch={search} />
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                    {data.total || 0} resultados
                  </span>
                  {search ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                      Busqueda: {search}
                    </span>
                  ) : null}
                  {activeFiltersCount > 0 ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                      <MdTune size={16} />
                      {activeFiltersCount} filtros activos
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-5 flex justify-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <ProductSortSelect currentSort={sortBy} />
          </div>

          {noProducts ? (
            <div className="flex min-h-[320px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center sm:px-8 sm:py-12 lg:py-16">
              <div className="max-w-md">
                <p className="text-base font-medium text-slate-900 sm:text-lg lg:text-xl">
                  No hay productos disponibles
                </p>
                <div className="mt-3 space-y-2 text-xs text-slate-500 sm:text-sm">
                  <p>
                    Total productos: {data?.total || 0} • Pagina: {page}
                  </p>
                  <p className="text-slate-600">
                    Ajusta los filtros o revisa la disponibilidad para ver
                    resultados aqui.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <PublicListWrapper products={items as Product[]} />
          )}
        </main>
      </div>

      <footer className="sticky bottom-0 left-0 z-20 w-full border-t border-slate-200 bg-white/95 pt-2 pb-20 backdrop-blur-sm sm:pt-3 sm:pb-24 lg:pt-4 lg:pb-5">
        <div className="flex justify-center px-3 sm:px-6 lg:px-8">
          <Pagination currentPage={page} totalPages={safeTotalPages} />
        </div>
      </footer>
    </div>
  );
}
