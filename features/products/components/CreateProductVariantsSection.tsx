"use client";

import type React from "react";
import {
  formatSizeLabel,
  getVariantName,
  Size,
  type VariantProduct,
} from "@/types/domain/products";
import type {
  ProductVariantDraft,
  ProductVariantDraftErrors,
} from "@/types/ui/products";

interface CreateProductVariantsSectionProps {
  formVariants: VariantProduct[];
  isClothingProduct: boolean;
  variant: ProductVariantDraft;
  variantErrors: ProductVariantDraftErrors;
  onVariantChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onAddVariant: (e: React.FormEvent) => void;
  onRemoveVariant: (index: number) => void;
  onStockKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPriceKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const CreateProductVariantsSection: React.FC<
  CreateProductVariantsSectionProps
> = ({
  formVariants,
  isClothingProduct,
  variant,
  variantErrors,
  onVariantChange,
  onAddVariant,
  onRemoveVariant,
  onStockKeyDown,
  onPriceKeyDown,
}) => {
  if (isClothingProduct) {
    return (
      <div className="rounded border bg-gray-50 p-4">
        <h2 className="mb-1 font-semibold">Detalle por talla</h2>
        <p className="mb-2 text-xs text-gray-600">
          Completa Talla, Stock y Precio para cada registro.
        </p>
        <div className="mb-1 flex gap-2 text-xs font-medium text-gray-600">
          <span className="w-1/3">Talla</span>
          <span className="w-1/3">Stock</span>
          <span className="w-1/3">Precio</span>
          <span className="sr-only">Accion</span>
        </div>
        <div className="mb-2 flex items-end gap-2">
          <select
            name="size"
            value={variant.size}
            onChange={onVariantChange}
            className="w-1/3 rounded border border-gray-300 p-2"
          >
            <option value="" disabled>
              Selecciona talla
            </option>
            {Object.values(Size).map((sz) => (
              <option key={sz} value={sz}>
                {formatSizeLabel(sz)}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="stock"
            value={variant.stock}
            onChange={onVariantChange}
            onKeyDown={onStockKeyDown}
            placeholder="Stock"
            min={0}
            step={1}
            inputMode="numeric"
            className="w-1/3 rounded border border-gray-300 p-2"
          />
          <input
            type="number"
            name="price"
            value={variant.price}
            onChange={onVariantChange}
            onKeyDown={onPriceKeyDown}
            placeholder="Precio"
            min={0}
            step="any"
            inputMode="decimal"
            className="w-1/3 rounded border border-gray-300 p-2"
          />
          <button
            onClick={onAddVariant}
            className="rounded bg-green-600 px-2 py-1 text-white hover:bg-green-700"
            type="button"
          >
            Agregar
          </button>
        </div>
        <VariantErrorHelp errors={variantErrors} clothing />
        <ul className="space-y-1">
          {formVariants.map((v, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm">
              <span className="font-mono">
                Talla: {formatSizeLabel(v.size)}, Stock: {v.stock}, Precio: $
                {v.price}
              </span>
              <button
                type="button"
                onClick={() => onRemoveVariant(idx)}
                className="text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded border bg-gray-50 p-4">
      <h2 className="mb-1 font-semibold">Variantes del producto</h2>
      <p className="mb-2 text-xs text-gray-600">
        Usa nombres como color, volumen o presentacion.
      </p>
      <div className="mb-2 grid grid-cols-[minmax(0,1.3fr)_90px_110px_auto] items-end gap-2">
        <label className="block text-sm font-medium text-gray-700">
          Variante
          <input
            type="text"
            name="name"
            value={variant.name}
            onChange={onVariantChange}
            placeholder="Nombre de variante"
            className="mt-1 w-full rounded border border-gray-300 p-2"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Stock
          <input
            type="number"
            name="stock"
            value={variant.stock}
            onChange={onVariantChange}
            onKeyDown={onStockKeyDown}
            placeholder="Stock"
            min={0}
            step={1}
            inputMode="numeric"
            className="mt-1 w-full rounded border border-gray-300 p-2"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Precio
          <input
            type="number"
            name="price"
            value={variant.price}
            onChange={onVariantChange}
            onKeyDown={onPriceKeyDown}
            placeholder="Precio"
            min={0}
            step="any"
            inputMode="decimal"
            className="mt-1 w-full rounded border border-gray-300 p-2"
          />
        </label>
        <button
          onClick={onAddVariant}
          className="rounded bg-green-600 px-2 py-2 text-white hover:bg-green-700"
          type="button"
        >
          Agregar
        </button>
      </div>
      <VariantErrorHelp errors={variantErrors} />
      <ul className="space-y-1">
        {formVariants.map((v, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm">
            <span className="font-mono">
              Variante: {getVariantName(v)}, Stock: {v.stock}, Precio: $
              {v.price}
            </span>
            <button
              type="button"
              onClick={() => onRemoveVariant(idx)}
              className="text-red-600 hover:underline"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const VariantErrorHelp = ({
  errors,
  clothing = false,
}: {
  errors: ProductVariantDraftErrors;
  clothing?: boolean;
}) => (
  <div className="mb-2 space-y-1">
    <p className={`text-xs ${errors.name ? "text-red-600" : "text-gray-500"}`}>
      {errors.name ||
        (clothing
          ? "Cada talla solo puede aparecer una vez"
          : "Nombre de variante obligatorio y unico")}
    </p>
    <p className={`text-xs ${errors.stock ? "text-red-600" : "text-gray-500"}`}>
      {errors.stock || "Stock: solo enteros no negativos"}
    </p>
    <p className={`text-xs ${errors.price ? "text-red-600" : "text-gray-500"}`}>
      {errors.price || "Precio: numeros enteros o decimales no negativos"}
    </p>
  </div>
);

export default CreateProductVariantsSection;
