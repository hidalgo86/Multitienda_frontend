"use client";

import Image from "next/image";
import React from "react";
import { toast } from "sonner";
import {
  MdAdd,
  MdArrowBack,
  MdClose,
  MdDelete,
  MdEdit,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from "react-icons/md";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  createBanner,
  deleteBannerImage,
  deleteBanner,
  listAdminBanners,
  updateBanner,
  uploadBannerImage,
} from "@/services/banners";
import BannerForm, {
  type BannerFormValues,
} from "@/app/dashboard/banners/BannerForm";
import type { Banner } from "@/types/domain/banners";

interface BannersManagerModalProps {
  open: boolean;
  onClose: () => void;
}

type ModalMode = "list" | "create" | "edit";

const emptyValues: BannerFormValues = {
  title: "",
  linkUrl: "",
  isActive: true,
  imageUrl: "",
};

const reorderBanners = (
  items: Banner[],
  sourceIndex: number,
  targetIndex: number,
): Banner[] => {
  if (
    sourceIndex < 0 ||
    targetIndex < 0 ||
    sourceIndex >= items.length ||
    targetIndex >= items.length ||
    sourceIndex === targetIndex
  ) {
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

export default function BannersManagerModal({
  open,
  onClose,
}: BannersManagerModalProps) {
  const [mode, setMode] = React.useState<ModalMode>("list");
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [selectedBanner, setSelectedBanner] = React.useState<Banner | null>(null);
  const [values, setValues] = React.useState<BannerFormValues>(emptyValues);
  const [file, setFile] = React.useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = React.useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [isReordering, setIsReordering] = React.useState(false);
  const [bannerToDelete, setBannerToDelete] = React.useState<Banner | null>(
    null,
  );

  const sortedBanners = React.useMemo(
    () => [...banners].sort((a, b) => a.order - b.order),
    [banners],
  );

  const resetForm = React.useCallback(() => {
    setValues(emptyValues);
    setFile(null);
    setSelectedBanner(null);
  }, []);

  const loadBanners = React.useCallback(async () => {
    setIsLoading(true);

    try {
      setBanners(await listAdminBanners());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudieron cargar banners",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      setMode("list");
      resetForm();
      void loadBanners();
    }
  }, [loadBanners, open, resetForm]);

  React.useEffect(() => {
    if (!file) {
      setPreviewImageUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewImageUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const hasValidBannerId = (id: string | undefined) => {
    const normalizedId = typeof id === "string" ? id.trim() : "";
    return Boolean(
      normalizedId && normalizedId !== "undefined" && normalizedId !== "null",
    );
  };

  const handleChange = (
    field: keyof BannerFormValues,
    value: string | boolean,
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const startCreate = () => {
    resetForm();
    setMode("create");
  };

  const startEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setValues({
      title: banner.title,
      linkUrl: banner.linkUrl || "",
      isActive: banner.isActive,
      imageUrl: banner.imageUrl,
    });
    setFile(null);
    setMode("edit");
  };

  const returnToList = () => {
    setMode("list");
    resetForm();
  };

  const getNextOrder = () =>
    sortedBanners.reduce(
      (maxOrder, banner) => Math.max(maxOrder, Number(banner.order) || 0),
      0,
    ) + 1;

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!values.title.trim()) {
      toast.error("El banner necesita un titulo");
      return;
    }

    if (!file) {
      toast.error("Selecciona una imagen publicitaria");
      return;
    }

    setIsSubmitting(true);
    let uploadedImage: { url: string; publicId: string } | null = null;

    try {
      uploadedImage = await uploadBannerImage(file);
      const created = await createBanner({
        title: values.title.trim(),
        altText: values.title.trim(),
        subtitle: "",
        linkUrl: values.linkUrl.trim() || undefined,
        ctaLabel: "",
        order: getNextOrder(),
        isActive: values.isActive,
        imageUrl: uploadedImage.url,
        imagePublicId: uploadedImage.publicId,
      });

      setBanners((current) => [...current, created]);
      toast.success("Banner creado");
      returnToList();
    } catch (error) {
      if (uploadedImage?.publicId) {
        await deleteBannerImage(uploadedImage.publicId).catch(() => undefined);
      }
      toast.error(error instanceof Error ? error.message : "Error creando banner");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedBanner || !hasValidBannerId(selectedBanner.id)) return;

    if (!values.title.trim()) {
      toast.error("El banner necesita un titulo");
      return;
    }

    setIsSubmitting(true);
    let uploadedImage: { url: string; publicId: string } | null = null;

    try {
      let imageUrl = values.imageUrl;
      let imagePublicId: string | null | undefined;

      if (file) {
        uploadedImage = await uploadBannerImage(file);
        imageUrl = uploadedImage.url;
        imagePublicId = uploadedImage.publicId;
      } else {
        imagePublicId = selectedBanner.imagePublicId ?? null;
      }

      const updated = await updateBanner(selectedBanner.id, {
        title: values.title.trim(),
        altText: values.title.trim(),
        subtitle: "",
        linkUrl: values.linkUrl.trim() || undefined,
        ctaLabel: "",
        isActive: values.isActive,
        imageUrl,
        imagePublicId,
      });

      setBanners((current) =>
        current.map((banner) =>
          banner.id === selectedBanner.id ? updated : banner,
        ),
      );
      toast.success("Banner actualizado");
      returnToList();

      if (
        uploadedImage?.publicId &&
        selectedBanner.imagePublicId &&
        selectedBanner.imagePublicId !== uploadedImage.publicId
      ) {
        await deleteBannerImage(selectedBanner.imagePublicId).catch(
          () => undefined,
        );
      }
    } catch (error) {
      if (uploadedImage?.publicId) {
        await deleteBannerImage(uploadedImage.publicId).catch(() => undefined);
      }
      toast.error(
        error instanceof Error ? error.message : "Error actualizando banner",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const persistBannerOrder = async (
    nextBanners: Banner[],
    previousBanners: Banner[],
  ) => {
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
  };

  const moveBanner = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;

    if (
      isReordering ||
      targetIndex < 0 ||
      targetIndex >= sortedBanners.length ||
      !hasValidBannerId(sortedBanners[index]?.id) ||
      !hasValidBannerId(sortedBanners[targetIndex]?.id)
    ) {
      return;
    }

    const previousBanners = sortedBanners;
    const nextBanners = reorderBanners(sortedBanners, index, targetIndex);
    await persistBannerOrder(nextBanners, previousBanners);
  };

  const deleteSelectedBanner = async (banner: Banner) => {
    if (!hasValidBannerId(banner.id)) {
      toast.error("Este banner no tiene un identificador valido");
      return;
    }

    setBusyId(banner.id);
    try {
      const deletedBanner = await deleteBanner(banner.id);
      const imagePublicId =
        deletedBanner.imagePublicId ?? banner.imagePublicId ?? null;
      const remainingBanners = sortedBanners
        .filter((item) => item.id !== banner.id)
        .map((item, index) => ({
          ...item,
          order: index + 1,
        }));

      setBanners(remainingBanners);
      await Promise.all(
        remainingBanners.map((item) =>
          updateBanner(item.id, {
            order: item.order,
          }),
        ),
      );
      if (imagePublicId) {
        await deleteBannerImage(imagePublicId).catch(() => undefined);
      }
      toast.success("Banner eliminado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error eliminando");
      void loadBanners();
    } finally {
      setBusyId(null);
      setBannerToDelete(null);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="banners-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-3 py-5"
    >
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

      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="banners-modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              Carrusel de productos
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Administra los banners que aparecen en la tienda.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Cerrar carrusel"
            title="Cerrar"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {mode === "list" ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Usa las flechas para cambiar el orden.
                </p>
                <button
                  type="button"
                  onClick={startCreate}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <MdAdd size={18} />
                  Agregar banner
                </button>
              </div>

              {isReordering ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Guardando nuevo orden...
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-200 bg-white">
                {isLoading ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Cargando banners...
                  </div>
                ) : sortedBanners.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Aun no has creado banners.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {sortedBanners.map((banner, index) => {
                      const isBusy = busyId === banner.id;
                      const hasValidId = hasValidBannerId(banner.id);

                      return (
                        <article
                          key={banner.id || `${banner.title}-${banner.order}`}
                          className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                        >
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-slate-100 px-3 text-sm font-semibold text-slate-700">
                              {index + 1}
                            </div>
                            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              <Image
                                src={banner.imageUrl || "/placeholder.webp"}
                                alt={banner.title}
                                fill
                                className="object-contain"
                                sizes="112px"
                              />
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-slate-900">
                                {banner.title}
                              </h3>
                              <p className="mt-1 break-all text-xs text-slate-500">
                                {banner.linkUrl || "Sin enlace"}
                              </p>
                              <span
                                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  banner.isActive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {banner.isActive ? "Activo" : "Oculto"}
                              </span>
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
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                              aria-label={`Subir banner ${banner.title}`}
                              title="Subir"
                            >
                              <MdKeyboardArrowUp size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void moveBanner(index, 1)}
                              disabled={
                                index === sortedBanners.length - 1 ||
                                isBusy ||
                                !hasValidId ||
                                isReordering
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                              aria-label={`Bajar banner ${banner.title}`}
                              title="Bajar"
                            >
                              <MdKeyboardArrowDown size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(banner)}
                              disabled={isBusy || !hasValidId || isReordering}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                            >
                              <MdEdit size={16} />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setBannerToDelete(banner)}
                              disabled={isBusy || !hasValidId || isReordering}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                            >
                              <MdDelete size={16} />
                              Eliminar
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={returnToList}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                <MdArrowBack size={18} />
                Volver al carrusel
              </button>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="mb-5 text-lg font-semibold text-slate-900">
                  {mode === "create" ? "Agregar banner" : "Editar banner"}
                </h3>
                <BannerForm
                  values={values}
                  submitLabel={
                    mode === "create" ? "Crear banner" : "Guardar cambios"
                  }
                  busyLabel="Guardando..."
                  isSubmitting={isSubmitting}
                  previewImageUrl={previewImageUrl}
                  onChange={handleChange}
                  onFileChange={setFile}
                  onSubmit={mode === "create" ? handleCreate : handleUpdate}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
