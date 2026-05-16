"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { MdArrowBack } from "react-icons/md";
import {
  createBanner,
  listAdminBanners,
  uploadBannerImage,
} from "@/services/banners";
import BannerForm, { type BannerFormValues } from "../BannerForm";

const emptyValues: BannerFormValues = {
  title: "",
  linkUrl: "",
  isActive: true,
  imageUrl: "",
};

export default function CreateBannerPage() {
  const router = useRouter();
  const [values, setValues] = React.useState<BannerFormValues>(emptyValues);
  const [file, setFile] = React.useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = React.useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [nextOrder, setNextOrder] = React.useState(1);

  React.useEffect(() => {
    const loadNextOrder = async () => {
      try {
        const items = await listAdminBanners();
        const highestOrder = items.reduce(
          (maxOrder, banner) => Math.max(maxOrder, Number(banner.order) || 0),
          0,
        );
        setNextOrder(highestOrder + 1);
      } catch {
        setNextOrder(1);
      }
    };

    void loadNextOrder();
  }, []);

  React.useEffect(() => {
    if (!file) {
      setPreviewImageUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewImageUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleChange = (
    field: keyof BannerFormValues,
    value: string | boolean,
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!values.title.trim()) {
      toast.error("El banner necesita un titulo");
      return;
    }

    if (!file) {
      toast.error("Selecciona una imagen publicitaria");
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedImage = await uploadBannerImage(file);
      await createBanner({
        title: values.title.trim(),
        altText: values.title.trim(),
        subtitle: "",
        linkUrl: values.linkUrl.trim() || undefined,
        ctaLabel: "",
        order: nextOrder,
        isActive: values.isActive,
        imageUrl: uploadedImage.url,
        imagePublicId: uploadedImage.publicId,
      });

      toast.success("Banner creado");
      router.push("/dashboard/banners");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error creando banner");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/banners"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <MdArrowBack size={18} />
        Volver a banners
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Agregar banner</h1>
        </div>

        <BannerForm
          values={values}
          submitLabel="Crear banner"
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
