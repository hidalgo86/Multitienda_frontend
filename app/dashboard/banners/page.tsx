"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { toast } from "sonner";
import { MdAdd } from "react-icons/md";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  deleteBanner,
  listAdminBanners,
  updateBanner,
} from "@/services/banners";
import { getStoredAuthToken } from "@/services/users";
import type { Banner } from "@/types/domain/banners";

const reorderBanners = (
  items: Banner[],
  sourceId: string,
  targetId: string,
): Banner[] => {
  const sourceIndex = items.findIndex((banner) => banner.id === sourceId);
  const targetIndex = items.findIndex((banner) => banner.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedBanner] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(targetIndex, 0, movedBanner);

  return nextItems.map((banner, index) => ({
    ...banner,
    order: index + 1,
  }));
};

export default function DashboardBannersPage() {
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [draggedBannerId, setDraggedBannerId] = React.useState<string | null>(
    null,
  );
  const [isReordering, setIsReordering] = React.useState(false);
  const [bannerToDelete, setBannerToDelete] = React.useState<Banner | null>(
    null,
  );

  const loadBanners = React.useCallback(async () => {
    setIsLoading(true);

    try {
      if (!getStoredAuthToken()) {
        setBanners([]);
        return;
      }

      const items = await listAdminBanners();
      setBanners(
        (Array.isArray(items) ? [...items] : []).sort(
          (a, b) => a.order - b.order,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudieron cargar banners",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadBanners();
  }, [loadBanners]);

  React.useEffect(() => {
    const handleSessionChanged = () => {
      if (!getStoredAuthToken()) {
        setBanners([]);
        setIsLoading(false);
      }
    };

    window.addEventListener("auth:session-changed", handleSessionChanged);

    return () => {
      window.removeEventListener("auth:session-changed", handleSessionChanged);
    };
  }, []);

  React.useEffect(() => {
    const handleFocus = () => {
      void loadBanners();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadBanners();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadBanners]);

  const hasValidBannerId = React.useCallback((id: string | undefined) => {
    const normalizedId = typeof id === "string" ? id.trim() : "";
    return Boolean(
      normalizedId && normalizedId !== "undefined" && normalizedId !== "null",
    );
  }, []);

  const persistBannerOrder = React.useCallback(
    async (nextBanners: Banner[], previousBanners: Banner[]) => {
      setBanners(nextBanners);
      setIsReordering(true);

      try {
        await Promise.all(
          nextBanners.map((banner) =>
            updateBanner(banner.id, {
              order: banner.order,
            }),
          ),
        );
      } catch (error) {
        setBanners(previousBanners);
        toast.error(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el orden",
        );
      } finally {
        setIsReordering(false);
      }
    },
    [],
  );

  const deleteSelectedBanner = async (banner: Banner) => {
    const id = banner.id;
    if (!hasValidBannerId(id)) {
      toast.error("Este banner no tiene un identificador valido");
      return;
    }

    setBusyId(id);
    try {
      await deleteBanner(id);

      const remainingBanners = banners
        .filter((banner) => banner.id !== id)
        .map((banner, index) => ({
          ...banner,
          order: index + 1,
        }));

      setBanners(remainingBanners);

      await Promise.all(
        remainingBanners.map((banner) =>
          updateBanner(banner.id, {
            order: banner.order,
          }),
        ),
      );

      toast.success("Banner eliminado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error eliminando");
      void loadBanners();
    } finally {
      setBusyId(null);
      setBannerToDelete(null);
    }
  };

  const handleDelete = (banner: Banner) => {
    setBannerToDelete(banner);
  };

  const handleDrop = async (targetId: string) => {
    if (
      !draggedBannerId ||
      draggedBannerId === targetId ||
      isReordering ||
      !hasValidBannerId(draggedBannerId) ||
      !hasValidBannerId(targetId)
    ) {
      setDraggedBannerId(null);
      return;
    }

    const previousBanners = banners;
    const nextBanners = reorderBanners(banners, draggedBannerId, targetId);

    setDraggedBannerId(null);
    await persistBannerOrder(nextBanners, previousBanners);
  };

  const moveBanner = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;

    if (
      isReordering ||
      targetIndex < 0 ||
      targetIndex >= banners.length ||
      !hasValidBannerId(banners[index]?.id) ||
      !hasValidBannerId(banners[targetIndex]?.id)
    ) {
      return;
    }

    const previousBanners = banners;
    const nextBanners = [...banners];

    [nextBanners[index], nextBanners[targetIndex]] = [
      nextBanners[targetIndex],
      nextBanners[index],
    ];

    await persistBannerOrder(
      nextBanners.map((banner, nextIndex) => ({
        ...banner,
        order: nextIndex + 1,
      })),
      previousBanners,
    );
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={Boolean(bannerToDelete)}
        title="Eliminar banner"
        description="Este banner dejara de mostrarse en el carrusel y se reorganizara el orden restante."
        details={bannerToDelete?.title}
        confirmLabel="Eliminar banner"
        busyLabel="Eliminando..."
        tone="danger"
        isBusy={Boolean(bannerToDelete && busyId === bannerToDelete.id)}
        onCancel={() => setBannerToDelete(null)}
        onConfirm={() => {
          if (bannerToDelete) {
            void deleteSelectedBanner(bannerToDelete);
          }
        }}
      />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carrusel</h1>
          <p className="mt-1 text-sm text-slate-500">
            Arrastra cada banner o usa las flechas para cambiar el orden.
          </p>
        </div>

        <Link
          href="/dashboard/banners/create"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <MdAdd size={18} />
          Agregar banner
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Cargando banners...
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Aun no has creado banners.
        </div>
      ) : (
        <div className="space-y-3">
          {isReordering ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Guardando nuevo orden...
            </div>
          ) : null}

          {banners.map((banner, index) => {
            const hasValidId = hasValidBannerId(banner.id);
            const isBusy = busyId === banner.id;
            const isDragging = draggedBannerId === banner.id;
            const position = index + 1;

            return (
              <article
                key={banner.id || `${banner.title}-${banner.order}`}
                draggable={hasValidId && !isBusy && !isReordering}
                onDragStart={() => setDraggedBannerId(banner.id)}
                onDragEnd={() => setDraggedBannerId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => void handleDrop(banner.id)}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                  isDragging
                    ? "border-brand-300 opacity-70"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-slate-100 px-3 text-sm font-semibold text-slate-700">
                      {position}
                    </div>

                    <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <Image
                        src={banner.imageUrl || "/placeholder.webp"}
                        alt={banner.title}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">
                        {banner.title}
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-600">
                        {banner.linkUrl || "Sin enlace"}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            banner.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {banner.isActive ? "Activo" : "Oculto"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => void moveBanner(index, -1)}
                      disabled={
                        index === 0 ||
                        isBusy ||
                        !hasValidId ||
                        isReordering
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                      aria-label={`Subir banner ${banner.title}`}
                      title="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => void moveBanner(index, 1)}
                      disabled={
                        index === banners.length - 1 ||
                        isBusy ||
                        !hasValidId ||
                        isReordering
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                      aria-label={`Bajar banner ${banner.title}`}
                      title="Bajar"
                    >
                      ↓
                    </button>
                    <Link
                      href={hasValidId ? `/dashboard/banners/${banner.id}` : "#"}
                      aria-disabled={!hasValidId}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 aria-disabled:pointer-events-none aria-disabled:opacity-60"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(banner)}
                      disabled={isBusy || !hasValidId || isReordering}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
