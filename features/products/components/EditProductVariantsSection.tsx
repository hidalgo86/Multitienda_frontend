"use client";

import type React from "react";
import {
  formatSizeLabel,
  getVariantName,
  Size,
  type VariantProduct,
} from "@/types/domain/products";
import type { ProductVariantDraftValuesByIndex } from "@/types/ui/products";

interface EditProductVariantsSectionProps {
  variants: VariantProduct[];
  variantDraftValues: ProductVariantDraftValuesByIndex;
  isClothingProduct: boolean;
  onVariantsChange: (variants: VariantProduct[]) => void;
  onVariantDraftValuesChange: (
    updater: (
      prev: ProductVariantDraftValuesByIndex,
    ) => ProductVariantDraftValuesByIndex,
  ) => void;
  onRemoveVariant: (index: number) => void;
  onStockKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPriceKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const EditProductVariantsSection: React.FC<EditProductVariantsSectionProps> = ({
  variants,
  variantDraftValues,
  isClothingProduct,
  onVariantsChange,
  onVariantDraftValuesChange,
  onRemoveVariant,
  onStockKeyDown,
  onPriceKeyDown,
}) => {
  const updateVariant = (index: number, nextVariant: VariantProduct) => {
    onVariantsChange(
      variants.map((variant, currentIndex) =>
        currentIndex === index ? nextVariant : variant,
      ),
    );
  };

  const updateDraftValue = (
    index: number,
    field: "stock" | "price",
    value: string,
  ) => {
    onVariantDraftValuesChange((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: value },
    }));
  };

  if (isClothingProduct) {
    return (
      <div className="space-y-2">
        <label className="block font-semibold">Detalle por talla</label>
        <div className="grid grid-cols-[minmax(0,1fr)_80px_96px_32px] items-center gap-2 text-xs font-medium text-gray-600">
          <span>Talla</span>
          <span>Stock</span>
          <span>Precio</span>
          <span className="sr-only">Accion</span>
        </div>
        {variants.map((variant, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <select
              value={getVariantName(variant) || ""}
              onChange={(e) => {
                const value = e.target.value as VariantProduct["size"];
                updateVariant(idx, {
                  ...variant,
                  size: value,
                  name: String(value || ""),
                });
              }}
              className="flex-1 rounded border px-2 py-1"
            >
              <option value="">Talla</option>
              {Object.values(Size).map((size) => {
                const isUsed = variants.some(
                  (currentVariant, currentIndex) =>
                    getVariantName(currentVariant) === size &&
                    currentIndex !== idx,
                );
                return (
                  <option key={size} value={size} disabled={isUsed}>
                    {formatSizeLabel(size)}
                  </option>
                );
              })}
            </select>
            <VariantNumberInputs
              index={idx}
              variantDraftValues={variantDraftValues}
              onStockKeyDown={onStockKeyDown}
              onPriceKeyDown={onPriceKeyDown}
              onDraftValueChange={updateDraftValue}
            />
            <RemoveVariantButton onClick={() => onRemoveVariant(idx)} />
          </div>
        ))}
        <button
          type="button"
          className="rounded bg-green-600 px-3 py-1 text-white"
          onClick={() => {
            const usedSizes = variants.map((variant) => getVariantName(variant));
            const availableSize = Object.values(Size).find(
              (size) => !usedSizes.includes(size),
            );
            if (!availableSize) return;
            const nextIndex = variants.length;
            onVariantsChange([
              ...variants,
              {
                name: String(availableSize),
                size: availableSize as VariantProduct["size"],
                stock: 0,
                price: 0,
              },
            ]);
            onVariantDraftValuesChange((prev) => ({
              ...prev,
              [nextIndex]: { stock: "0", price: "0" },
            }));
          }}
        >
          + Anadir talla
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block font-semibold">Variantes del producto</label>
      <div className="grid grid-cols-[minmax(0,1.3fr)_80px_96px_32px] items-center gap-2 text-xs font-medium text-gray-600">
        <span>Nombre</span>
        <span>Stock</span>
        <span>Precio</span>
        <span className="sr-only">Accion</span>
      </div>
      {variants.map((variant, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            value={getVariantName(variant) || ""}
            onChange={(e) => {
              updateVariant(idx, {
                ...variant,
                name: e.target.value,
                size: undefined,
              });
            }}
            className="flex-1 rounded border px-2 py-1"
            placeholder="Nombre de variante"
          />
          <VariantNumberInputs
            index={idx}
            variantDraftValues={variantDraftValues}
            onStockKeyDown={onStockKeyDown}
            onPriceKeyDown={onPriceKeyDown}
            onDraftValueChange={updateDraftValue}
          />
          <RemoveVariantButton onClick={() => onRemoveVariant(idx)} />
        </div>
      ))}
      <button
        type="button"
        className="rounded bg-green-600 px-3 py-1 text-white"
        onClick={() => {
          const nextIndex = variants.length;
          onVariantsChange([...variants, { name: "", stock: 0, price: 0 }]);
          onVariantDraftValuesChange((prev) => ({
            ...prev,
            [nextIndex]: { stock: "0", price: "0" },
          }));
        }}
      >
        + Anadir variante
      </button>
    </div>
  );
};

const VariantNumberInputs = ({
  index,
  variantDraftValues,
  onStockKeyDown,
  onPriceKeyDown,
  onDraftValueChange,
}: {
  index: number;
  variantDraftValues: ProductVariantDraftValuesByIndex;
  onStockKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPriceKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onDraftValueChange: (
    index: number,
    field: "stock" | "price",
    value: string,
  ) => void;
}) => (
  <>
    <input
      type="number"
      min={0}
      step={1}
      value={variantDraftValues[index]?.stock || ""}
      onKeyDown={onStockKeyDown}
      onChange={(e) => onDraftValueChange(index, "stock", e.target.value)}
      className="w-20 rounded border px-2 py-1"
      placeholder="Stock"
      required
    />
    <input
      type="number"
      min={0}
      step="any"
      value={variantDraftValues[index]?.price || ""}
      onKeyDown={onPriceKeyDown}
      onChange={(e) => onDraftValueChange(index, "price", e.target.value)}
      className="w-24 rounded border px-2 py-1"
      placeholder="Precio"
      required
    />
  </>
);

const RemoveVariantButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    className="px-2 font-bold text-red-600"
    onClick={onClick}
  >
    x
  </button>
);

export default EditProductVariantsSection;
