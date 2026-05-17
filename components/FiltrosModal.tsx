"use client";

import { useEffect } from "react";
import { MdClose, MdTune } from "react-icons/md";
import type { ProductFiltersModalProps } from "@/types/ui/products";
import Filtros from "./Filtros";

export default function FiltrosModal({
  isOpen,
  onClose,
  categoryOptions,
}: ProductFiltersModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="border-b border-brand-100 bg-brand-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-brand-100 p-2 text-brand-700">
                <MdTune size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Ajusta categoria, talla y precio.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-brand-100 hover:text-gray-700"
              aria-label="Cerrar filtros"
            >
              <MdClose size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <Filtros onFilterApply={onClose} categoryOptions={categoryOptions} />
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-center text-xs text-gray-500">
            Los cambios se aplican sobre el catalogo actual.
          </p>
        </div>
      </div>
    </div>
  );
}
