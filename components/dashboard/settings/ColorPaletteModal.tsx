"use client";

import { MdClose, MdSave } from "react-icons/md";
import {
  BRAND_COLOR_KEYS,
  brandPalettePresets,
  type BrandColorKey,
} from "@/lib/brandPalettes";
import type { BusinessColorPalette } from "@/types/domain/business-settings";

interface ColorPaletteModalProps {
  colorPalette: BusinessColorPalette;
  isSaving: boolean;
  isUploadingLogo: boolean;
  onClose: () => void;
  onPresetChange: (presetId: string) => void;
  onColorChange: (key: BrandColorKey, value: string) => void;
}

export function ColorPaletteModal({
  colorPalette,
  isSaving,
  isUploadingLogo,
  onClose,
  onPresetChange,
  onColorChange,
}: ColorPaletteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="palette-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
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
              Estos colores alimentan las clases visuales principales de la
              tienda.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
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
                value={colorPalette.preset}
                onChange={(event) => onPresetChange(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                {colorPalette.preset === "custom" ? (
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
                  style={{ backgroundColor: colorPalette[key] }}
                  title={`${key}: ${colorPalette[key]}`}
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
                    value={colorPalette[key]}
                    onChange={(event) => onColorChange(key, event.target.value)}
                    className="h-10 w-12 border-0 bg-transparent p-1"
                    aria-label={`Color ${key}`}
                  />
                  <input
                    value={colorPalette[key]}
                    onChange={(event) => onColorChange(key, event.target.value)}
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
            onClick={onClose}
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
  );
}
