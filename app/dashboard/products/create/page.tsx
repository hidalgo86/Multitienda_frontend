"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CreateProduct,
  resolveCategoryOption,
  VariantProduct,
  Size,
  Genre,
  legacyProductCategoryOptions,
  formatSizeLabel,
  getVariantName,
  isClothingCategory,
} from "@/types/domain/products";
import type {
  ProductCreateFormState,
  ProductVariantDraft,
  ProductVariantDraftErrors,
} from "@/types/ui/products";
import { PRODUCT_FORM_MAX_IMAGES } from "@/types/ui/products";
import { createProduct, uploadProductImage } from "@/services/products";
import { useCategories } from "@/services/categories/useCategories";

const CreateProductPage: React.FC = () => {
  const router = useRouter();
  const { options } = useCategories();
  const categoryOptions = options.length
    ? options
    : legacyProductCategoryOptions;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useVariants, setUseVariants] = useState(false);
  const [form, setForm] = useState<ProductCreateFormState>({
    categoryId: "",
    name: "",
    category: "",
    genre: Genre.UNISEX,
    description: "",
    variants: [] as VariantProduct[],
    stock: 1,
    price: 1,
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const openCamera = () => {
    const input = cameraInputRef.current;
    if (!input) return;
    try {
      input.setAttribute("capture", "environment");
      input.setAttribute("accept", "image/*;capture=camera");
    } catch {}
    input.click();
  };

  const [variant, setVariant] = useState<ProductVariantDraft>({
    name: "",
    size: Size.RN,
    stock: 1,
    price: 1,
  });
  const [variantErrors, setVariantErrors] = useState<ProductVariantDraftErrors>(
    {},
  );

  const preventStockInvalidKeys = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
      e.preventDefault();
    }
  };

  const preventPriceInvalidKeys = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (["e", "E", "+", "-", ","].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "categoryId") {
      const selectedOption = resolveCategoryOption(value, categoryOptions);
      setForm((prev) => {
        if (selectedOption?.supportsGenre) {
          setUseVariants(true);
          return {
            ...prev,
            category: selectedOption.value,
            categoryId: selectedOption.categoryId,
            genre: prev.genre || Genre.UNISEX,
            stock: undefined,
            price: undefined,
          };
        }

        setUseVariants(false);
        return {
          ...prev,
          category: selectedOption?.value || prev.category,
          categoryId: selectedOption?.categoryId || "",
          genre: undefined,
          variants: [],
          stock: prev.stock ?? 1,
          price: prev.price ?? 1,
        };
      });
      return;
    }

    if (name === "stock" || name === "price") {
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : Number(value),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    setForm((prev) => {
      if (!categoryOptions.length) {
        return prev;
      }

      const selectedCategory =
        resolveCategoryOption(prev.categoryId, categoryOptions) ||
        resolveCategoryOption(prev.category, categoryOptions);

      if (selectedCategory) {
        const nextCategoryId = selectedCategory.categoryId;
        const nextCategory = selectedCategory.value;

        if (
          prev.categoryId === nextCategoryId &&
          prev.category === nextCategory
        ) {
          return prev;
        }

        return {
          ...prev,
          categoryId: nextCategoryId,
          category: nextCategory,
          genre: selectedCategory.supportsGenre
            ? prev.genre || Genre.UNISEX
            : undefined,
          stock: selectedCategory.supportsGenre ? undefined : (prev.stock ?? 1),
          price: selectedCategory.supportsGenre ? undefined : (prev.price ?? 1),
        };
      }

      const defaultCategory = categoryOptions[0];
      setUseVariants(defaultCategory.supportsGenre);
      return {
        ...prev,
        categoryId: defaultCategory.categoryId,
        category: defaultCategory.value,
        genre: defaultCategory.supportsGenre ? Genre.UNISEX : undefined,
        stock: defaultCategory.supportsGenre ? undefined : 1,
        price: defaultCategory.supportsGenre ? undefined : 1,
      };
    });
  }, [categoryOptions]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    if (images.length >= PRODUCT_FORM_MAX_IMAGES) {
      setError(`Maximo ${PRODUCT_FORM_MAX_IMAGES} imagenes permitidas.`);
      e.currentTarget.value = "";
      return;
    }

    const availableSlots = PRODUCT_FORM_MAX_IMAGES - images.length;
    const filesToAdd = selectedFiles.slice(0, availableSlots);

    if (filesToAdd.length < selectedFiles.length) {
      setError(`Solo puedes subir hasta ${PRODUCT_FORM_MAX_IMAGES} imagenes.`);
    } else {
      setError(null);
    }

    setImages((prev) => [...prev, ...filesToAdd]);
    setImagePreviews((prev) => [
      ...prev,
      ...filesToAdd.map((file) => URL.createObjectURL(file)),
    ]);

    e.currentTarget.value = "";
  };

  const handleVariantChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "name") {
      setVariant((prev) => ({ ...prev, name: value }));
      setVariantErrors((prev) => ({ ...prev, name: undefined }));
      return;
    }

    if (name === "stock") {
      if (value !== "" && !/^\d+$/.test(value)) {
        setVariantErrors((prev) => ({
          ...prev,
          stock: "Stock: solo enteros no negativos",
        }));
        return;
      }
      setVariantErrors((prev) => ({ ...prev, stock: undefined }));
    }

    if (name === "price") {
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) {
        setVariantErrors((prev) => ({
          ...prev,
          price: "Precio: solo numeros no negativos",
        }));
        return;
      }
      setVariantErrors((prev) => ({ ...prev, price: undefined }));
    }

    setVariant((prev) => ({
      ...prev,
      [name]:
        name === "size"
          ? (value as Size)
          : name === "stock"
            ? value === ""
              ? ""
              : Number(value)
            : name === "price"
              ? value === ""
                ? ""
                : Number(value)
              : Number(value),
    }));
  };

  const selectedCategoryOption =
    resolveCategoryOption(form.categoryId, categoryOptions) ||
    resolveCategoryOption(form.category, categoryOptions);
  const isClothingProduct = isClothingCategory(
    form.categoryId || form.category,
    categoryOptions,
  );
  const shouldUseVariants = isClothingProduct || useVariants;

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    const variantName = isClothingProduct
      ? String(variant.size || "").trim()
      : String(variant.name || "").trim();

    if (
      !variantName ||
      variant.stock === "" ||
      variant.stock < 0 ||
      !Number.isInteger(variant.stock) ||
      variant.price === "" ||
      variant.price < 0
    ) {
      setVariantErrors({
        name: !variantName ? "Nombre de variante requerido" : undefined,
        stock:
          variant.stock === "" ||
          variant.stock < 0 ||
          !Number.isInteger(variant.stock)
            ? "Stock: solo enteros no negativos"
            : undefined,
        price:
          variant.price === "" || variant.price < 0
            ? "Precio: solo numeros no negativos"
            : undefined,
      });
      return;
    }

    const normalizedVariantName = variantName.toLowerCase();
    const hasDuplicate = (form.variants || []).some(
      (existingVariant) =>
        getVariantName(existingVariant).trim().toLowerCase() ===
        normalizedVariantName,
    );

    if (hasDuplicate) {
      setVariantErrors((prev) => ({
        ...prev,
        name: "No repitas el nombre de la variante",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        {
          ...variant,
          name: variantName,
          size: isClothingProduct ? (variant.size as Size) : undefined,
          stock: Number(variant.stock),
          price: Number(variant.price),
        },
      ],
    }));
    setVariant({ name: "", size: Size.RN, stock: 1, price: 1 });
    setVariantErrors({});
  };

  const handleRemoveVariant = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      variants: (prev.variants || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (images.length === 0) {
        throw new Error(
          "Selecciona al menos una imagen desde galeria o camara",
        );
      }

      if (images.length > PRODUCT_FORM_MAX_IMAGES) {
        throw new Error(
          `Maximo ${PRODUCT_FORM_MAX_IMAGES} imagenes permitidas`,
        );
      }

      if (!String(form.categoryId || "").trim()) {
        throw new Error("Ingresa un categoryId valido");
      }

      if (shouldUseVariants && (!form.variants || form.variants.length === 0)) {
        throw new Error("Agrega al menos una variante (talla, stock y precio)");
      }

      if (
        isClothingCategory(form.categoryId || form.category, categoryOptions) &&
        !form.genre
      ) {
        throw new Error("Selecciona un genero para productos de ropa");
      }

      if (!shouldUseVariants) {
        const stock = Number(form.stock);
        const price = Number(form.price);
        if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
          throw new Error("Stock invalido: usa enteros no negativos");
        }
        if (!Number.isFinite(price) || price < 0) {
          throw new Error("Precio invalido: usa numeros no negativos");
        }
      }

      const uploadedImages = await Promise.all(
        images.map((image) => uploadProductImage(image)),
      );

      const payload: CreateProduct = {
        categoryId: String(form.categoryId || "").trim(),
        name: String(form.name || "").trim(),
        category: String(form.category || "").trim() || undefined,
        description: form.description ? String(form.description) : undefined,
        images: uploadedImages,
      };

      if (
        isClothingCategory(payload.categoryId || payload.category, categoryOptions)
      ) {
        payload.genre = form.genre as Genre;
        payload.variants = (form.variants || []).map((v) => ({
          name: getVariantName(v),
          stock: Number(v.stock),
          price: Number(v.price),
        }));
      } else if (useVariants) {
        payload.variants = (form.variants || []).map((v) => ({
          name: String(getVariantName(v)).trim(),
          stock: Number(v.stock),
          price: Number(v.price),
        }));
      } else {
        payload.stock = Number(form.stock ?? 0);
        payload.price = Number(form.price ?? 0);
      }

      await createProduct(payload);
      router.push("/dashboard/products");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear el producto",
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const removeImageAt = (index: number) => {
    setImagePreviews((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed);
      return next;
    });
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <button
        type="button"
        onClick={() => router.push("/dashboard/products")}
        className="flex items-center gap-2 text-gray-600 hover:text-brand-600 transition-colors mb-4"
      >
        <span aria-hidden="true">&lt;</span>
        <span className="text-sm font-medium">Volver</span>
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Crear nuevo producto</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={galleryInputRef}
          onChange={handleImageChange}
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={cameraInputRef}
          onChange={handleImageChange}
        />
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-40 h-40">
            <div className="w-40 h-40 bg-gray-100 border border-gray-300 rounded flex items-center justify-center overflow-hidden">
              {imagePreviews[0] ? (
                <Image
                  src={imagePreviews[0]}
                  alt="Previsualizacion"
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              ) : (
                <svg
                  className="w-16 h-16 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7v10a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7a4 4 0 00-4 4z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-3">
              <button
                type="button"
                aria-label="Subir desde galeria"
                title="Subir desde galeria"
                className="group relative bg-white/90 hover:bg-white text-emerald-600 hover:text-emerald-700 rounded-full p-2 shadow backdrop-blur"
                onClick={() => galleryInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    galleryInputRef.current?.click();
                  }
                }}
              >
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                  Galeria
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M4 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H4zm3.5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM4 17l4.5-4.5 3 3L15 12l5 5H4z" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Tomar foto"
                title="Tomar foto"
                className="group relative bg-white/90 hover:bg-white text-brand-600 hover:text-brand-700 rounded-full p-2 shadow backdrop-blur"
                onClick={openCamera}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openCamera();
                  }
                }}
              >
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                  Camara
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.25 4.5a1.75 1.75 0 0 0-1.49.833L6.86 6.75H5A2.75 2.75 0 0 0 2.25 9.5v7A2.75 2.75 0 0 0 5 19.25h14A2.75 2.75 0 0 0 21.75 16.5v-7A2.75 2.75 0 0 0 19 6.75h-1.86l-.9-1.417A1.75 1.75 0 0 0 14.75 4.5h-5.5Zm2.75 11.75a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
          {imagePreviews.length > 0 && (
            <>
              <div className="text-xs text-gray-600">
                {imagePreviews.length} imagen(es) seleccionada(s) de{" "}
                {PRODUCT_FORM_MAX_IMAGES}
              </div>
              <div className="grid grid-cols-4 gap-2 w-full max-w-md">
                {imagePreviews.map((preview, idx) => (
                  <div key={`${preview}-${idx}`} className="relative">
                    <Image
                      src={preview}
                      alt={`Imagen ${idx + 1}`}
                      width={72}
                      height={72}
                      className="w-18 h-18 object-cover rounded border"
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                      onClick={() => removeImageAt(idx)}
                      aria-label={`Quitar imagen ${idx + 1}`}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <input
          type="text"
          name="name"
          value={form.name || ""}
          onChange={handleChange}
          placeholder="Nombre del producto"
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <textarea
          name="description"
          value={form.description || ""}
          onChange={handleChange}
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
          onChange={handleChange}
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
        {!isClothingProduct && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={useVariants}
              onChange={(e) => {
                const nextChecked = e.target.checked;
                setUseVariants(nextChecked);
                setForm((prev) => ({
                  ...prev,
                  variants: nextChecked ? prev.variants || [] : [],
                  stock: nextChecked ? undefined : (prev.stock ?? 1),
                  price: nextChecked ? undefined : (prev.price ?? 1),
                }));
                setVariantErrors({});
              }}
            />
            Este producto usa variantes
          </label>
        )}
        {isClothingProduct ? (
          <>
            <select
              name="genre"
              value={form.genre || ""}
              onChange={handleChange}
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

            <div className="border p-4 rounded bg-gray-50">
              <h2 className="font-semibold mb-1">Detalle por talla</h2>
              <p className="text-xs text-gray-600 mb-2">
                Completa Talla, Stock y Precio para cada registro.
              </p>
              <div className="flex gap-2 mb-1 text-xs font-medium text-gray-600">
                <span className="w-1/3">Talla</span>
                <span className="w-1/3">Stock</span>
                <span className="w-1/3">Precio</span>
                <span className="sr-only">Accion</span>
              </div>
              <div className="flex gap-2 mb-2 items-end">
                <select
                  name="size"
                  value={variant.size}
                  onChange={handleVariantChange}
                  className="p-2 border border-gray-300 rounded w-1/3"
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
                  onChange={handleVariantChange}
                  onKeyDown={preventStockInvalidKeys}
                  placeholder="Stock"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className="p-2 border border-gray-300 rounded w-1/3"
                />
                <input
                  type="number"
                  name="price"
                  value={variant.price}
                  onChange={handleVariantChange}
                  onKeyDown={preventPriceInvalidKeys}
                  placeholder="Precio"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  className="p-2 border border-gray-300 rounded w-1/3"
                />
                <button
                  onClick={handleAddVariant}
                  className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                  type="button"
                >
                  Agregar
                </button>
              </div>
              <div className="mb-2 space-y-1">
                <p
                  className={`text-xs ${
                    variantErrors.name ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {variantErrors.name || "Cada talla solo puede aparecer una vez"}
                </p>
                <p
                  className={`text-xs ${
                    variantErrors.stock ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {variantErrors.stock || "Stock: solo enteros no negativos"}
                </p>
                <p
                  className={`text-xs ${
                    variantErrors.price ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {variantErrors.price ||
                    "Precio: numeros enteros o decimales no negativos"}
                </p>
              </div>
              <ul className="space-y-1">
                {(form.variants || []).map((v, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span className="font-mono">
                      Talla: {formatSizeLabel(v.size)}, Stock: {v.stock},
                      Precio: ${v.price}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : shouldUseVariants ? (
          <div className="border p-4 rounded bg-gray-50">
            <h2 className="font-semibold mb-1">Variantes del producto</h2>
            <p className="text-xs text-gray-600 mb-2">
              Usa nombres como color, volumen o presentacion.
            </p>
            <div className="grid grid-cols-[minmax(0,1.3fr)_90px_110px_auto] gap-2 mb-2 items-end">
              <label className="block text-sm font-medium text-gray-700">
                Variante
                <input
                  type="text"
                  name="name"
                  value={variant.name}
                  onChange={handleVariantChange}
                  placeholder="Nombre de variante"
                  className="mt-1 w-full p-2 border border-gray-300 rounded"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Stock
                <input
                  type="number"
                  name="stock"
                  value={variant.stock}
                  onChange={handleVariantChange}
                  onKeyDown={preventStockInvalidKeys}
                  placeholder="Stock"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className="mt-1 w-full p-2 border border-gray-300 rounded"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Precio
                <input
                  type="number"
                  name="price"
                  value={variant.price}
                  onChange={handleVariantChange}
                  onKeyDown={preventPriceInvalidKeys}
                  placeholder="Precio"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  className="mt-1 w-full p-2 border border-gray-300 rounded"
                />
              </label>
              <button
                onClick={handleAddVariant}
                className="bg-green-600 text-white px-2 py-2 rounded hover:bg-green-700"
                type="button"
              >
                Agregar
              </button>
            </div>
            <div className="mb-2 space-y-1">
              <p
                className={`text-xs ${
                  variantErrors.name ? "text-red-600" : "text-gray-500"
                }`}
              >
                {variantErrors.name || "Nombre de variante obligatorio y unico"}
              </p>
              <p
                className={`text-xs ${
                  variantErrors.stock ? "text-red-600" : "text-gray-500"
                }`}
              >
                {variantErrors.stock || "Stock: solo enteros no negativos"}
              </p>
              <p
                className={`text-xs ${
                  variantErrors.price ? "text-red-600" : "text-gray-500"
                }`}
              >
                {variantErrors.price ||
                  "Precio: numeros enteros o decimales no negativos"}
              </p>
            </div>
            <ul className="space-y-1">
              {(form.variants || []).map((v, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <span className="font-mono">
                    Variante: {getVariantName(v)}, Stock: {v.stock}, Precio: $
                    {v.price}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(idx)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-gray-700">
              Stock
              <input
                type="number"
                name="stock"
                value={form.stock ?? ""}
                onChange={handleChange}
                onKeyDown={preventStockInvalidKeys}
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
                onChange={handleChange}
                onKeyDown={preventPriceInvalidKeys}
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
          {loading ? "Creando..." : "Crear Producto"}
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </div>
  );
};

export default CreateProductPage;
