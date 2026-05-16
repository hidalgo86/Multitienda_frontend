"use client";

import React, { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ADMIN_PRODUCT_FILTER_ALL,
  AdminProductFilter,
  Product,
  ProductAvailability,
  ProductSortBy,
  ProductState,
  parseAdminProductFilter,
} from "@/types/domain/products";
import ProductListAdmin from "@/components/products/ProductListAdmin";
import Pagination from "@/components/Pagination";
import ConfirmDialog from "@/components/ConfirmDialog";
import CategoriesManagerModal from "./CategoriesManagerModal";
import BannersManagerModal from "./BannersManagerModal";
import { useAdminProducts } from "./useAdminProducts";
import { updateProduct } from "@/services/products";
import { MdAdd, MdCategory, MdSearch, MdViewCarousel } from "react-icons/md";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";

const FILTER_LABELS: Record<string, string> = {
  [ADMIN_PRODUCT_FILTER_ALL]: "Todos",
  [ProductAvailability.DISPONIBLE]: "Disponibles",
  [ProductAvailability.AGOTADO]: "Agotados",
  [ProductState.ELIMINADO]: "Eliminados",
};

const SORT_LABELS: Record<ProductSortBy, string> = {
  [ProductSortBy.NEWEST]: "Mas recientes",
  [ProductSortBy.OLDEST]: "Mas antiguos",
  [ProductSortBy.PRICE_ASC]: "Precio menor",
  [ProductSortBy.PRICE_DESC]: "Precio mayor",
  [ProductSortBy.NAME_ASC]: "Nombre A-Z",
  [ProductSortBy.NAME_DESC]: "Nombre Z-A",
  [ProductSortBy.MOST_VIEWED]: "Mas vistos",
  [ProductSortBy.MOST_FAVORITED]: "Mas favoritos",
  [ProductSortBy.MOST_CART_ADDED]: "Mas agregados al carrito",
  [ProductSortBy.MOST_PURCHASED]: "Mas comprados",
  [ProductSortBy.MOST_SEARCHED]: "Mas buscados",
};

const parseProductSortBy = (value: string | null): ProductSortBy =>
  Object.values(ProductSortBy).includes(value as ProductSortBy)
    ? (value as ProductSortBy)
    : ProductSortBy.NEWEST;

const ProductsContent: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialLimit = Number(searchParams.get("limit")) || 50;
  const initialPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const initialSearch = searchParams.get("search") || "";
  const initialSortBy = parseProductSortBy(searchParams.get("sortBy"));
  const initialFilter =
    parseAdminProductFilter(searchParams.get("status")) ||
    ADMIN_PRODUCT_FILTER_ALL;

  const [limit] = useState(initialLimit);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [filter, setFilter] = useState<AdminProductFilter>(initialFilter);
  const [sortBy, setSortBy] = useState<ProductSortBy>(initialSortBy);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isBannersModalOpen, setIsBannersModalOpen] = useState(false);

  const { products, setProducts, totalPages, loading, error, refetch } =
    useAdminProducts({
      filter,
      page,
      limit,
      search: debouncedSearch,
      sortBy,
    });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (filter !== ADMIN_PRODUCT_FILTER_ALL) {
      params.set("status", filter);
    }
    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }
    if (sortBy !== ProductSortBy.NEWEST) {
      params.set("sortBy", sortBy);
    }

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();

    if (currentQuery !== nextQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    }
  }, [
    page,
    filter,
    limit,
    debouncedSearch,
    sortBy,
    pathname,
    router,
    searchParams,
  ]);

  useEffect(() => {
    const nextPage = Math.max(1, Number(searchParams.get("page")) || 1);
    const nextStatus =
      parseAdminProductFilter(searchParams.get("status")) ||
      ADMIN_PRODUCT_FILTER_ALL;
    const nextSearch = searchParams.get("search") || "";
    const nextSortBy = parseProductSortBy(searchParams.get("sortBy"));

    setPage((prev) => (prev === nextPage ? prev : nextPage));
    setFilter((prev) => (prev === nextStatus ? prev : nextStatus));
    setSortBy((prev) => (prev === nextSortBy ? prev : nextSortBy));
    setSearch((prev) => (prev === nextSearch ? prev : nextSearch));
    setDebouncedSearch((prev) => (prev === nextSearch ? prev : nextSearch));
  }, [searchParams]);

  const deleteProduct = async (id: string) => {
    if (actionLoadingId === id) return;

    setActionLoadingId(id);
    let previousProducts: Product[] = [];
    setProducts((prev) => {
      previousProducts = prev;
      return prev.filter((product) => product.id !== id);
    });

    try {
      await updateProduct(id, { state: ProductState.ELIMINADO });
      await refetch({ silent: true }).catch(() => {
        return;
      });
    } catch (err) {
      setProducts(previousProducts);
      toast.error(getErrorMessage(err, "No se pudo eliminar el producto"));
    } finally {
      setActionLoadingId(null);
      setProductToDelete(null);
    }
  };

  const handleDelete = async (id: string) => {
    const product = products.find((item) => item.id === id) ?? null;
    setProductToDelete(product ?? ({ id, name: "este producto" } as Product));
  };

  const handleRestore = async (id: string) => {
    if (actionLoadingId === id) return;

    setActionLoadingId(id);
    let previousProducts: Product[] = [];
    setProducts((prev) => {
      previousProducts = prev;
      return prev.filter((product) => product.id !== id);
    });

    try {
      await updateProduct(id, { state: ProductState.ACTIVO });
      await refetch({ silent: true }).catch(() => {
        return;
      });
    } catch (err) {
      setProducts(previousProducts);
      toast.error(getErrorMessage(err, "No se pudo restaurar el producto"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEdit = (id: string) => {
    const currentQuery = searchParams.toString();
    const returnTo = `${pathname}${currentQuery ? `?${currentQuery}` : ""}`;
    router.push(
      `/dashboard/products/edit/${id}?returnTo=${encodeURIComponent(returnTo)}`,
    );
  };

  const handleStatusChange = (value: AdminProductFilter) => {
    setPage(1);
    setFilter(value);
  };

  const handleSearchChange = (value: string) => {
    setPage(1);
    setSearch(value);
  };

  const handleSortChange = (value: ProductSortBy) => {
    setPage(1);
    setSortBy(value);
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={Boolean(productToDelete)}
        title="Eliminar producto"
        description="Este producto dejara de aparecer como activo en la tienda. Podras restaurarlo desde el filtro de eliminados."
        details={productToDelete?.name || productToDelete?.id}
        confirmLabel="Eliminar producto"
        busyLabel="Eliminando..."
        tone="danger"
        isBusy={Boolean(
          productToDelete && actionLoadingId === productToDelete.id,
        )}
        onCancel={() => setProductToDelete(null)}
        onConfirm={() => {
          if (productToDelete?.id) {
            void deleteProduct(productToDelete.id);
          }
        }}
      />
      <CategoriesManagerModal
        open={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />
      <BannersManagerModal
        open={isBannersModalOpen}
        onClose={() => setIsBannersModalOpen(false)}
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setIsBannersModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <MdViewCarousel size={18} />
              Carrusel
            </button>
            <button
              type="button"
              onClick={() => setIsCategoriesModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <MdCategory size={18} />
              Categorias
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/products/create")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <MdAdd size={18} />
              Nuevo producto
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              Filtro: {FILTER_LABELS[filter] ?? "Todos"}
            </span>
            {debouncedSearch.trim() ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                Busqueda: {debouncedSearch.trim()}
              </span>
            ) : null}
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              Orden: {SORT_LABELS[sortBy]}
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <MdSearch
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="admin-product-search"
                type="text"
                aria-label="Buscar productos por nombre"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 sm:w-72"
              />
            </div>
            <select
              aria-label="Filtrar productos por estado"
              value={filter}
              onChange={(e) =>
                handleStatusChange(e.target.value as AdminProductFilter)
              }
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
            >
              <option value={ADMIN_PRODUCT_FILTER_ALL}>Todos</option>
              <option value={ProductAvailability.DISPONIBLE}>Disponibles</option>
              <option value={ProductAvailability.AGOTADO}>Agotados</option>
              <option value={ProductState.ELIMINADO}>Eliminados</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as ProductSortBy)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
              aria-label="Ordenar productos"
            >
              {Object.values(ProductSortBy).map((value) => (
                <option key={value} value={value}>
                  {SORT_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Cargando productos...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No hay productos para mostrar.
        </div>
      ) : (
        <>
          <ProductListAdmin
            products={products}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onRestore={handleRestore}
            actionLoadingId={actionLoadingId}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

const ProductsPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Cargando productos...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
};

export default ProductsPage;
