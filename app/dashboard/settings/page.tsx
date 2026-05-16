"use client";

import Image from "next/image";
import React from "react";
import { toast } from "sonner";
import { MdAdd, MdClose, MdDelete, MdPalette, MdSave, MdUpload } from "react-icons/md";
import {
  getAdminBusinessSettings,
  updateBusinessSettings,
  uploadBusinessLogo,
} from "@/services/business-settings";
import {
  BRAND_COLOR_KEYS,
  applyBrandPalette,
  brandPalettePresets,
  defaultBrandPalette,
} from "@/lib/brandPalettes";
import type {
  BusinessExtraField,
  BusinessSettings,
} from "@/types/domain/business-settings";

const emptySettings: BusinessSettings = {
  businessName: "",
  legalName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  logoUrl: "/placeholder.webp",
  logoPublicId: null,
  extraFields: [],
  colorPalette: defaultBrandPalette,
  paymentsEnabled: true,
  checkoutDisabledMessage:
    "Ya puedes explorar la tienda, guardar favoritos y usar el carrito. La compra estara disponible cuando activemos los pagos.",
  storePickupAddress: "",
  pickupMessage: "",
  deliveryEnabled: false,
  deliveryDisabledMessage: "El envio a domicilio estara disponible proximamente.",
  manualPaymentInstructions: [],
  seoTitle: "",
  seoDescription: "",
  ogImageUrl: "/placeholder.webp",
  instagramUrl: "",
  aboutTitle: "",
  aboutText: "",
  aboutImageUrl: "/placeholder.webp",
};

const compactExtraFields = (
  fields: BusinessExtraField[],
): BusinessExtraField[] =>
  fields
    .map((field) => ({
      label: field.label.trim(),
      value: field.value.trim(),
    }))
    .filter((field) => field.label || field.value);

export default function DashboardSettingsPage() {
  const [form, setForm] = React.useState<BusinessSettings>(emptySettings);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [isPaletteModalOpen, setIsPaletteModalOpen] = React.useState(false);

  const loadSettings = React.useCallback(async () => {
    setIsLoading(true);

    try {
      setForm(await getAdminBusinessSettings());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la configuracion",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateField = (field: keyof BusinessSettings, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateBooleanField = (field: keyof BusinessSettings, value: boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updatePaymentInstructions = (value: string) => {
    setForm((current) => ({
      ...current,
      manualPaymentInstructions: value
        .split("\n")
        .map((instruction) => instruction.trim())
        .filter(Boolean),
    }));
  };

  const updateExtraField = (
    index: number,
    field: keyof BusinessExtraField,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      extraFields: current.extraFields.map((extraField, extraIndex) =>
        extraIndex === index ? { ...extraField, [field]: value } : extraField,
      ),
    }));
  };

  const addExtraField = () => {
    setForm((current) => ({
      ...current,
      extraFields: [...current.extraFields, { label: "", value: "" }],
    }));
  };

  const removeExtraField = (index: number) => {
    setForm((current) => ({
      ...current,
      extraFields: current.extraFields.filter((_, extraIndex) => extraIndex !== index),
    }));
  };

  const applyPalettePreset = (presetId: string) => {
    const preset =
      brandPalettePresets.find((item) => item.id === presetId) ??
      brandPalettePresets[0];

    setForm((current) => ({
      ...current,
      colorPalette: preset.colors,
    }));
    applyBrandPalette(preset.colors);
  };

  const updatePaletteColor = (
    key: (typeof BRAND_COLOR_KEYS)[number],
    value: string,
  ) => {
    setForm((current) => {
      const nextPalette = {
        ...current.colorPalette,
        preset: "custom",
        [key]: value,
      };

      applyBrandPalette(nextPalette);

      return {
        ...current,
        colorPalette: nextPalette,
      };
    });
  };

  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const uploadedLogo = await uploadBusinessLogo(file);
      setForm((current) => ({
        ...current,
        logoUrl: uploadedLogo.url,
        logoPublicId: uploadedLogo.publicId,
      }));
      toast.success("Logo cargado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.businessName.trim()) {
      toast.error("El nombre de la empresa es obligatorio");
      return;
    }

    setIsSaving(true);
    try {
      const updatedSettings = await updateBusinessSettings({
        businessName: form.businessName,
        legalName: form.legalName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        logoUrl: form.logoUrl,
        logoPublicId: form.logoPublicId,
        extraFields: compactExtraFields(form.extraFields),
        colorPalette: form.colorPalette,
        paymentsEnabled: form.paymentsEnabled,
        checkoutDisabledMessage: form.checkoutDisabledMessage,
        storePickupAddress: form.storePickupAddress,
        pickupMessage: form.pickupMessage,
        deliveryEnabled: form.deliveryEnabled,
        deliveryDisabledMessage: form.deliveryDisabledMessage,
        manualPaymentInstructions: form.manualPaymentInstructions,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        ogImageUrl: form.ogImageUrl,
        instagramUrl: form.instagramUrl,
        aboutTitle: form.aboutTitle,
        aboutText: form.aboutText,
        aboutImageUrl: form.aboutImageUrl,
      });

      setForm(updatedSettings);
      applyBrandPalette(updatedSettings.colorPalette);
      window.dispatchEvent(new Event("business-settings:updated"));
      toast.success("Configuracion guardada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
        Cargando configuracion...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Negocio</h1>
          <p className="mt-1 text-sm text-slate-500">
            Datos generales usados por la tienda, el checkout y los correos.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setIsPaletteModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <MdPalette size={18} />
            Colores
          </button>

          <button
            type="submit"
            disabled={isSaving || isUploadingLogo}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MdSave size={18} />
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {isPaletteModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="palette-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsPaletteModalOpen(false);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2
                  id="palette-modal-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Paleta de colores
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Estos colores alimentan las clases visuales principales de la tienda.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPaletteModalOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Cerrar modal de colores"
              >
                <MdClose size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Paleta base
                  </span>
                  <select
                    value={form.colorPalette.preset}
                    onChange={(event) => applyPalettePreset(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  >
                    {form.colorPalette.preset === "custom" ? (
                      <option value="custom">Personalizada</option>
                    ) : null}
                    {brandPalettePresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-6 overflow-hidden rounded-lg border border-slate-200 sm:grid-cols-11">
                  {BRAND_COLOR_KEYS.map((key) => (
                    <div
                      key={key}
                      className="h-10"
                      style={{ backgroundColor: form.colorPalette[key] }}
                      title={`${key}: ${form.colorPalette[key]}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {BRAND_COLOR_KEYS.map((key) => (
                  <label key={key} className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-600">
                      {key.replace("brand", "Brand ")}
                    </span>
                    <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white">
                      <input
                        type="color"
                        value={form.colorPalette[key]}
                        onChange={(event) =>
                          updatePaletteColor(key, event.target.value)
                        }
                        className="h-10 w-12 border-0 bg-transparent p-1"
                        aria-label={`Color ${key}`}
                      />
                      <input
                        value={form.colorPalette[key]}
                        onChange={(event) =>
                          updatePaletteColor(key, event.target.value)
                        }
                        className="min-w-0 flex-1 px-2 text-sm uppercase outline-none"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsPaletteModalOpen(false)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Listo
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploadingLogo}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MdSave size={18} />
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">
            Informacion principal
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                Nombre de la empresa
              </span>
              <input
                value={form.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                Nombre legal
              </span>
              <input
                value={form.legalName}
                onChange={(e) => updateField("legalName", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                Telefono
              </span>
              <input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">Logo</h2>
          <div className="mt-4 flex h-36 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {form.logoUrl ? (
              <Image
                src={form.logoUrl}
                alt={form.businessName || "Logo del negocio"}
                width={280}
                height={120}
                unoptimized={form.logoUrl.startsWith("/")}
                className="max-h-32 w-auto max-w-full object-contain"
              />
            ) : (
              <span className="text-sm text-slate-500">Sin logo</span>
            )}
          </div>

          <label className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <MdUpload size={18} />
            {isUploadingLogo ? "Subiendo..." : "Cambiar logo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={isUploadingLogo}
              onChange={(event) => void handleLogoChange(event)}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Comercio
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Configura pagos, retiro y mensajes visibles durante la compra.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={form.paymentsEnabled}
              onChange={(event) =>
                updateBooleanField("paymentsEnabled", event.target.checked)
              }
              className="h-4 w-4 accent-brand-600"
            />
            <span className="text-sm font-medium text-slate-700">
              Permitir compras y pagos
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={form.deliveryEnabled}
              onChange={(event) =>
                updateBooleanField("deliveryEnabled", event.target.checked)
              }
              className="h-4 w-4 accent-brand-600"
            />
            <span className="text-sm font-medium text-slate-700">
              Permitir envio a domicilio
            </span>
          </label>
        </div>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Mensaje cuando las compras estan desactivadas
          </span>
          <textarea
            value={form.checkoutDisabledMessage}
            onChange={(e) =>
              updateField("checkoutDisabledMessage", e.target.value)
            }
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Direccion de retiro
          </span>
          <input
            value={form.storePickupAddress}
            onChange={(e) => updateField("storePickupAddress", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Mensaje de retiro
          </span>
          <textarea
            value={form.pickupMessage}
            onChange={(e) => updateField("pickupMessage", e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Mensaje cuando el envio esta desactivado
          </span>
          <textarea
            value={form.deliveryDisabledMessage}
            onChange={(e) =>
              updateField("deliveryDisabledMessage", e.target.value)
            }
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Instrucciones de pago manual
          </span>
          <textarea
            value={form.manualPaymentInstructions.join("\n")}
            onChange={(e) => updatePaymentInstructions(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Presentacion publica
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Textos usados por el SEO, redes sociales, footer y pagina Acerca.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Titulo SEO
            </span>
            <input
              value={form.seoTitle}
              onChange={(e) => updateField("seoTitle", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Instagram
            </span>
            <input
              value={form.instagramUrl}
              onChange={(e) => updateField("instagramUrl", e.target.value)}
              placeholder="https://instagram.com/tu_tienda"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Descripcion SEO
          </span>
          <textarea
            value={form.seoDescription}
            onChange={(e) => updateField("seoDescription", e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Imagen para compartir
          </span>
          <input
            value={form.ogImageUrl}
            onChange={(e) => updateField("ogImageUrl", e.target.value)}
            placeholder="/imagen-og.png o https://..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Titulo Acerca
            </span>
            <input
              value={form.aboutTitle}
              onChange={(e) => updateField("aboutTitle", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Imagen Acerca
            </span>
            <input
              value={form.aboutImageUrl}
              onChange={(e) => updateField("aboutImageUrl", e.target.value)}
              placeholder="/imagen.png o https://..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Texto Acerca
          </span>
          <textarea
            value={form.aboutText}
            onChange={(e) => updateField("aboutText", e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Direccion</h2>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Direccion
          </span>
          <input
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Ciudad</span>
            <input
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Estado</span>
            <input
              value={form.state}
              onChange={(e) => updateField("state", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Pais</span>
            <input
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Campos adicionales
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Agrega datos propios como RIF, horario, WhatsApp o redes.
            </p>
          </div>

          <button
            type="button"
            onClick={addExtraField}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <MdAdd size={18} />
            Agregar campo
          </button>
        </div>

        <div className="space-y-3">
          {form.extraFields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              No hay campos adicionales.
            </div>
          ) : (
            form.extraFields.map((field, index) => (
              <div key={index} className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                <input
                  value={field.label}
                  placeholder="Campo"
                  onChange={(e) =>
                    updateExtraField(index, "label", e.target.value)
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <input
                  value={field.value}
                  placeholder="Valor"
                  onChange={(e) =>
                    updateExtraField(index, "value", e.target.value)
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => removeExtraField(index)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 px-3 text-red-700 transition hover:bg-red-50"
                  aria-label="Eliminar campo"
                  title="Eliminar"
                >
                  <MdDelete size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </form>
  );
}
