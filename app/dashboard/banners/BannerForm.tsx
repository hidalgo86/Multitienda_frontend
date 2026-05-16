"use client";

import React from "react";
import Image from "next/image";
import { MdOutlinePhotoLibrary, MdPhotoCamera } from "react-icons/md";

export type BannerFormValues = {
  title: string;
  linkUrl: string;
  isActive: boolean;
  imageUrl: string;
};

interface BannerFormProps {
  values: BannerFormValues;
  submitLabel: string;
  busyLabel: string;
  isSubmitting: boolean;
  previewImageUrl?: string | null;
  onChange: (field: keyof BannerFormValues, value: string | boolean) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function BannerForm({
  values,
  submitLabel,
  busyLabel,
  isSubmitting,
  previewImageUrl,
  onChange,
  onFileChange,
  onSubmit,
}: BannerFormProps) {
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const imageSrc = previewImageUrl || values.imageUrl || "/placeholder.webp";

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(e.target.files?.[0] ?? null);
    e.currentTarget.value = "";
  };

  const openCamera = () => {
    const input = cameraInputRef.current;
    if (!input) return;

    try {
      input.setAttribute("capture", "environment");
      input.setAttribute("accept", "image/*;capture=camera");
    } catch {}

    input.click();
  };

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelection}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelection}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <Image
              src={imageSrc}
              alt={values.title || "Banner"}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 360px"
            />

            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3">
              <button
                type="button"
                aria-label="Seleccionar imagen desde galeria"
                title="Galeria"
                className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-emerald-600 shadow backdrop-blur transition hover:bg-white hover:text-emerald-700"
                onClick={() => galleryInputRef.current?.click()}
              >
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                  Galeria
                </span>
                <MdOutlinePhotoLibrary size={20} />
              </button>

              <button
                type="button"
                aria-label="Tomar foto con camara"
                title="Camara"
                className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow backdrop-blur transition hover:bg-white hover:text-brand-700"
                onClick={openCamera}
              >
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                  Camara
                </span>
                <MdPhotoCamera size={20} />
              </button>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Titulo interno
            </label>
            <input
              value={values.title}
              onChange={(e) => onChange("title", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Promo invierno"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Enlace opcional
            </label>
            <input
              value={values.linkUrl}
              onChange={(e) => onChange("linkUrl", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="/products o https://..."
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 md:self-end">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => onChange("isActive", e.target.checked)}
            />
            Mostrar este banner en el carrusel
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-white hover:bg-black disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? busyLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
