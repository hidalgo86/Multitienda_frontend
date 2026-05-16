"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { MdArrowBack } from "react-icons/md";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  deleteBanner,
  listAdminBanners,
  updateBanner,
  uploadBannerImage,
} from "@/services/banners";
import BannerForm, { type BannerFormValues } from "../BannerForm";

export default function EditBannerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bannerId = String(params?.id ?? "").trim();
  const hasValidBannerId =
    bannerId !== "" && bannerId !== "undefined" && bannerId !== "null";
  const [values, setValues] = React.useState<BannerFormValues | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = React.useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    React.useState(false);

  React.useEffect(() => {
    if (!file) {
      setPreviewImageUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewImageUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  React.useEffect(() => {
    const loadBanner = async () => {
      setIsLoading(true);
      try {
        const banners = await listAdminBanners();
        const banner = banners.find((item) => item.id === bannerId);

        if (!banner) {
          toast.error("No se encontro el banner");
          router.push("/dashboard/banners");
          return;
        }

        setValues({
          title: banner.title,
          linkUrl: banner.linkUrl || "",
          isActive: banner.isActive,
          imageUrl: banner.imageUrl,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo cargar el banner",
        );
        router.push("/dashboard/banners");
      } finally {
        setIsLoading(false);
      }
    };

    if (!hasValidBannerId) {
      toast.error("El banner no tiene un identificador valido");
      router.push("/dashboard/banners");
      return;
    }

    if (bannerId) {
      void loadBanner();
    }
  }, [bannerId, hasValidBannerId, router]);

  const handleChange = (
    field: keyof BannerFormValues,
    value: string | boolean,
  ) => {
    setValues((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!values) return;
    if (!values.title.trim()) {
      toast.error("El banner necesita un titulo");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = values.imageUrl;
      let imagePublicId: string | undefined;

      if (file) {
        const uploadedImage = await uploadBannerImage(file);
        imageUrl = uploadedImage.url;
        imagePublicId = uploadedImage.publicId;
      }

      await updateBanner(bannerId, {
        title: values.title.trim(),
        altText: values.title.trim(),
        subtitle: "",
        linkUrl: values.linkUrl.trim() || undefined,
        ctaLabel: "",
        isActive: values.isActive,
        imageUrl,
        imagePublicId,
      });

      toast.success("Banner actualizado");
      router.push("/dashboard/banners");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error actualizando banner",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!hasValidBannerId || isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteBanner(bannerId);
      toast.success("Banner eliminado");
      router.push("/dashboard/banners");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error eliminando banner",
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  if (isLoading || !values) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
        Cargando banner...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={showDeleteConfirmation}
        title="Eliminar banner"
        description="Este banner dejara de mostrarse en el carrusel."
        details={values.title}
        confirmLabel="Eliminar banner"
        busyLabel="Eliminando..."
        tone="danger"
        isBusy={isDeleting}
        onCancel={() => setShowDeleteConfirmation(false)}
        onConfirm={() => void handleDelete()}
      />

      <Link
        href="/dashboard/banners"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <MdArrowBack size={18} />
        Volver a banners
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Editar banner</h1>

          <button
            type="button"
            onClick={() => setShowDeleteConfirmation(true)}
            disabled={isSubmitting || isDeleting}
            className="inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Eliminando..." : "Eliminar banner"}
          </button>
        </div>

        <BannerForm
          values={values}
          submitLabel="Guardar cambios"
          busyLabel="Guardando..."
          isSubmitting={isSubmitting}
          previewImageUrl={previewImageUrl}
          onChange={handleChange}
          onFileChange={setFile}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
