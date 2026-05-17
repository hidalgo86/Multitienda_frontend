"use client";

import type React from "react";
import { Genre, type ProductCategoryOption } from "@/types/domain/products";
import type {
  ProductCreateFormState,
  ProductEditFormState,
} from "@/types/ui/products";

type ProductFormState = ProductCreateFormState | ProductEditFormState;

interface ProductFormProps {
  title: string;
  submitLabel: string;
  loadingLabel?: string;
  loading?: boolean;
  error?: string | null;
  form: ProductFormState;
  categoryOptions: ProductCategoryOption[];
  selectedCategoryOption?: ProductCategoryOption | null;
  isClothingProduct: boolean;
  shouldUseVariants: boolean;
  showVariantsToggle: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  onUseVariantsChange: (checked: boolean) => void;
  onStockKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPriceKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  heroSection?: React.ReactNode;
  imageSection: React.ReactNode;
  variantsSection?: React.ReactNode;
}

const ProductForm: React.FC<ProductFormProps> = ({
  title,
  submitLabel,
  loadingLabel,
  loading = false,
  error,
  form,
  categoryOptions,
  selectedCategoryOption,
  isClothingProduct,
  shouldUseVariants,
  showVariantsToggle,
  onBack,
  onSubmit,
  onChange,
  onUseVariantsChange,
  onStockKeyDown,
  onPriceKeyDown,
  heroSection,
  imageSection,
  variantsSection,
}) => {
  return (
    <div className="max-w-xl mx-auto py-8">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-brand-600 transition-colors mb-4"
      >
        <span aria-hidden="true">&lt;</span>
        <span className="text-sm font-medium">Volver</span>
      </button>

      {heroSection}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {imageSection}

        <input
          type="text"
          name="name"
          value={form.name || ""}
          onChange={onChange}
          placeholder="Nombre del producto"
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <textarea
          name="description"
          value={form.description || ""}
          onChange={onChange}
          placeholder="Descripcion del producto"
          className="w-full p-2 border border-gray-300 rounded"
        />
        <select
          name="categoryId"
          value={
            selectedCategoryOption?.categoryId ||
            selectedCategoryOption?.value ||
            ""
          }
          onChange={onChange}
          className="w-full p-2 border border-gray-300 rounded"
          required
        >
          <option value="" disabled>
            Selecciona una categoria
          </option>
          {categoryOptions.map((option) => (
            <option
              key={option.categoryId || option.value}
              value={option.categoryId || option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        {showVariantsToggle && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={shouldUseVariants}
              onChange={(e) => onUseVariantsChange(e.target.checked)}
            />
            Este producto usa variantes
          </label>
        )}

        {isClothingProduct ? (
          <>
            <select
              name="genre"
              value={form.genre || ""}
              onChange={onChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            >
              <option value="" disabled>
                Selecciona un genero
              </option>
              <option value={Genre.NINO}>Nino</option>
              <option value={Genre.NINA}>Nina</option>
              <option value={Genre.UNISEX}>Unisex</option>
            </select>
            {variantsSection}
          </>
        ) : shouldUseVariants ? (
          variantsSection
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-gray-700">
              Stock
              <input
                type="number"
                name="stock"
                value={form.stock ?? ""}
                onChange={onChange}
                onKeyDown={onStockKeyDown}
                placeholder="Stock"
                min={0}
                step={1}
                inputMode="numeric"
                className="mt-1 w-full p-2 border border-gray-300 rounded"
                required
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Precio
              <input
                type="number"
                name="price"
                value={form.price ?? ""}
                onChange={onChange}
                onKeyDown={onPriceKeyDown}
                placeholder="Precio"
                min={0}
                step="any"
                inputMode="decimal"
                className="mt-1 w-full p-2 border border-gray-300 rounded"
                required
              />
            </label>
          </div>
        )}

        <button
          type="submit"
          className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700"
          disabled={loading}
        >
          {loading ? loadingLabel || submitLabel : submitLabel}
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </div>
  );
};

export default ProductForm;
