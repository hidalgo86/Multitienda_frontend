"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  legacyProductCategoryOptions,
  Product,
  ProductState,
  UploadProduct,
  VariantProduct,
  ProductStatus,
  Size,
  Genre,
  formatSizeLabel,
  getVariantName,
  hasProductVariants,
  isClothingCategory,
  resolveCategoryOption,
} from "@/types/domain/products";
import type {
  ProductEditFormState,
  ProductVariantDraftValuesByIndex,
} from "@/types/ui/products";
import { PRODUCT_FORM_MAX_IMAGES } from "@/types/ui/products";
import {
  deleteProductImage,
  getProductById,
  updateProduct,
  uploadProductImage,
} from "@/services/products";
import { getStoredAuthToken } from "@/services/users";
import { useCategories } from "@/services/categories/useCategories";

const EditProductContent: React.FC = () => {
  const router = useRouter();
  const { options } = useCategories();
  const categoryOptions = options.length
    ? options
    : legacyProductCategoryOptions;
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const rawReturnTo = searchParams.get("returnTo");
  const returnTo =
    rawReturnTo && rawReturnTo.startsWith("/dashboard/products")
      ? rawReturnTo
      : "/dashboard/products";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useVariants, setUseVariants] = useState(false);
  const [form, setForm] = useState<ProductEditFormState>({});
  const [variantDraftValues, setVariantDraftValues] =
    useState<ProductVariantDraftValuesByIndex>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const preventInvalidKeys = (
    e: React.KeyboardEvent<HTMLInputElement>,
    allowDecimal: boolean = false,
  ) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const invalidKeys = ["e", "E", "+", "-", ","];
    if (!allowDecimal) invalidKeys.push(".");
    if (invalidKeys.includes(e.key)) e.preventDefault();
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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProductById(id, { token: getStoredAuthToken(), trackView: false })
      .then((data) => {
        const inferredCategory =
          resolveCategoryOption(data.categoryId, categoryOptions)?.value ||
          resolveCategoryOption(data.category, categoryOptions)?.value;

        setProduct(data);
        setUseVariants(Boolean(data.genre) || Boolean(data.variants?.length));
        setForm({
          ...data,
          category: inferredCategory ?? data.category,
          variants: data.variants?.map((v) => ({ ...v })) || [],
        });

        const drafts: ProductVariantDraftValuesByIndex = {};
        data.variants?.forEach((v, idx) => {
          drafts[idx] = {
            stock: v.stock != null ? String(v.stock) : "",
            price: v.price != null ? String(v.price) : "",
          };
        });
        setVariantDraftValues(drafts);
      })
      .catch(() => setError("No se pudo cargar el producto"))
      .finally(() => setLoading(false));
  }, [categoryOptions, id]);

  useEffect(() => {
    if (selectedFiles.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const handleImageSelection = (files: FileList | null) => {
    const incomingFiles = Array.from(files || []);
    if (!incomingFiles.length) return;

    const currentImagesCount = form.images?.length || 0;
    const availableSlots =
      PRODUCT_FORM_MAX_IMAGES - currentImagesCount - selectedFiles.length;

    if (availableSlots <= 0) {
      setError(`Maximo ${PRODUCT_FORM_MAX_IMAGES} imagenes permitidas.`);
      return;
    }

    const filesToAdd = incomingFiles.slice(0, availableSlots);
    if (filesToAdd.length < incomingFiles.length) {
      setError(`Solo puedes subir hasta ${PRODUCT_FORM_MAX_IMAGES} imagenes.`);
    } else {
      setError(null);
    }

    setSelectedFiles((prev) => [...prev, ...filesToAdd]);
  };

  const removeExistingImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    }));
    setError(null);
  };

  const moveExistingImage = (index: number, direction: -1 | 1) => {
    setForm((prev) => {
      const images = [...(prev.images || [])];
      const targetIndex = index + direction;

      if (
        index < 0 ||
        index >= images.length ||
        targetIndex < 0 ||
        targetIndex >= images.length
      ) {
        return prev;
      }

      [images[index], images[targetIndex]] = [
        images[targetIndex],
        images[index],
      ];

      return { ...prev, images };
    });
    setError(null);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "categoryId") {
      const selectedOption = resolveCategoryOption(value, categoryOptions);
      if (!selectedOption) return;

      setForm((prev) => {
        const wasClothingCategory = isClothingCategory(
          prev.categoryId ?? prev.category,
          categoryOptions,
        );
        const nextIsClothingCategory = selectedOption.supportsGenre;

        return {
          ...prev,
          categoryId: selectedOption.categoryId,
          category: selectedOption.value,
          genre: nextIsClothingCategory ? prev.genre || Genre.UNISEX : undefined,
          variants:
            wasClothingCategory === nextIsClothingCategory
              ? prev.variants
              : [],
          stock: nextIsClothingCategory
            ? undefined
            : (prev.stock ?? product?.stock ?? 0),
          price: nextIsClothingCategory
            ? undefined
            : (prev.price ?? product?.price ?? 0),
        };
      });

      if (selectedOption.supportsGenre) {
        setUseVariants(true);
      } else if (
        isClothingCategory(form.categoryId ?? form.category, categoryOptions)
      ) {
        setUseVariants(false);
      }

      if (
        isClothingCategory(form.categoryId ?? form.category, categoryOptions) !==
        selectedOption.supportsGenre
      ) {
        setVariantDraftValues({});
      }

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

  const removeVariantAt = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: (prev.variants || []).filter((_, i) => i !== index),
    }));
    setVariantDraftValues((prev) => {
      const next: ProductVariantDraftValuesByIndex = {};
      Object.entries(prev).forEach(([key, value]) => {
        const numericKey = Number(key);
        if (numericKey < index) next[numericKey] = value;
        if (numericKey > index) next[numericKey - 1] = value;
      });
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let uploadedImages: Product["images"] = [];
    try {
      const resolvedCategoryId = String(
        form.categoryId ?? product?.categoryId ?? "",
      ).trim();
      if (!resolvedCategoryId) {
        throw new Error("No se pudo determinar el categoryId del producto");
      }

      let nextImages = form.images;
      if (selectedFiles.length > 0) {
        uploadedImages = await Promise.all(
          selectedFiles.map((file) => uploadProductImage(file)),
        );

        nextImages = [...(form.images || []), ...uploadedImages];

        if (nextImages.length > PRODUCT_FORM_MAX_IMAGES) {
          throw new Error(
            `Maximo ${PRODUCT_FORM_MAX_IMAGES} imagenes permitidas.`,
          );
        }
      }

      if (!nextImages || nextImages.length === 0) {
        throw new Error("Agrega al menos una imagen");
      }

      const categoryIsClothing = isClothingCategory(
        form.categoryId ??
          form.category ??
          product?.categoryId ??
          product?.category,
        categoryOptions,
      );
      const isClothingProduct = categoryIsClothing || Boolean(form.genre);
      const shouldUseVariants =
        isClothingProduct || useVariants || hasProductVariants(form);

      const formStatus = form.status;
      const formWithoutStatus: Partial<UploadProduct> = { ...form };
      delete formWithoutStatus.state;
      delete formWithoutStatus.status;
      delete formWithoutStatus.thumbnail;
      const payload: Partial<UploadProduct> = {
        ...formWithoutStatus,
        name: String(form.name || "").trim(),
        description: form.description ? String(form.description) : undefined,
        categoryId: resolvedCategoryId,
        images: nextImages,
        thumbnail: nextImages[0]?.url,
        ...(formStatus === ProductStatus.ELIMINADO
          ? { state: ProductState.ELIMINADO }
          : {}),
      };

      if (shouldUseVariants) {
        if (isClothingProduct && !form.genre) {
          throw new Error("Selecciona un genero para productos de ropa");
        }

        const normalizedVariants: VariantProduct[] = (form.variants || []).map(
          (variant, idx) => {
            const variantName = String(getVariantName(variant)).trim();
            const stockRaw = variantDraftValues[idx]?.stock ?? "";
            const priceRaw = variantDraftValues[idx]?.price ?? "";

            if (!variantName) {
              throw new Error("Cada variante debe tener un nombre");
            }
            if (!/^\d+$/.test(stockRaw)) {
              throw new Error("Stock invalido: usa enteros no negativos");
            }
            if (!/^\d*\.?\d+$/.test(priceRaw)) {
              throw new Error("Precio invalido: usa numeros no negativos");
            }

            return {
              ...variant,
              name: variantName,
              size: isClothingProduct ? variant.size : undefined,
              stock: Number(stockRaw),
              price: Number(priceRaw),
            };
          },
        );

        if (!normalizedVariants.length) {
          throw new Error(
            "Agrega al menos una variante (talla, stock y precio)",
          );
        }

        const uniqueNames = new Set(
          normalizedVariants.map((variant) => variant.name.trim().toLowerCase()),
        );
        if (uniqueNames.size !== normalizedVariants.length) {
          throw new Error("No repitas nombres de variantes");
        }

        payload.genre = isClothingProduct ? form.genre : undefined;
        payload.variants = normalizedVariants;
        payload.stock = undefined;
        payload.price = undefined;
      } else {
        const nextStock = Number(form.stock ?? product?.stock);
        const nextPrice = Number(form.price ?? product?.price);

        if (
          !Number.isFinite(nextStock) ||
          nextStock < 0 ||
          !Number.isInteger(nextStock)
        ) {
          throw new Error("Stock invalido: usa enteros no negativos");
        }

        if (!Number.isFinite(nextPrice) || nextPrice < 0) {
          throw new Error("Precio invalido: usa numeros no negativos");
        }

        Object.assign(payload, { genre: null, variants: [] });
        payload.stock = nextStock;
        payload.price = nextPrice;
      }

      const nextImagePublicIds = new Set(
        nextImages.map((image) => image.publicId),
      );
      const removedImages = (product?.images || []).filter(
        (image) => !nextImagePublicIds.has(image.publicId),
      );

      await updateProduct(id, payload);

      if (removedImages.length > 0) {
        await Promise.allSettled(
          removedImages.map((image) => deleteProductImage(image.publicId)),
        );
      }

      router.push(returnTo);
    } catch (err) {
      if (uploadedImages.length > 0) {
        await Promise.allSettled(
          uploadedImages.map((image) => deleteProductImage(image.publicId)),
        );
      }

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el producto",
      );
    }
  };

  if (loading) return <div className="py-10 text-center">Cargando...</div>;
  if (error)
    return <div className="py-10 text-center text-red-600">{error}</div>;
  if (!product)
    return <div className="py-10 text-center">Producto no encontrado</div>;

  const inferredCategory =
    resolveCategoryOption(
      form.categoryId ?? product.categoryId,
      categoryOptions,
    )?.value ||
    resolveCategoryOption(form.category ?? product.category, categoryOptions)
      ?.value;
  const selectedCategoryOption =
    resolveCategoryOption(form.categoryId, categoryOptions) ||
    resolveCategoryOption(form.category, categoryOptions) ||
    resolveCategoryOption(product.categoryId, categoryOptions) ||
    resolveCategoryOption(product.category, categoryOptions);
  const categoryIsClothing = isClothingCategory(
    form.categoryId ?? inferredCategory ?? form.category ?? product.category,
    categoryOptions,
  );
  const isClothingProduct = categoryIsClothing || Boolean(form.genre);
  const shouldUseVariants =
    isClothingProduct || useVariants || hasProductVariants(form);
  const currentImagesCount = form.images?.length || 0;
  const totalSelectedCount = currentImagesCount + selectedFiles.length;
  const currentImageUrl =
    previewUrls[0] || form.images?.[0]?.url || product.images?.[0]?.url || "";

  return (
    <div className="max-w-xl mx-auto py-8">
      <button
        type="button"
        onClick={() => router.push(returnTo)}
        className="flex items-center gap-2 text-gray-600 hover:text-brand-600 transition-colors mb-4"
      >
        <span aria-hidden="true">&lt;</span>
        <span className="text-sm font-medium">Volver</span>
      </button>
      <div className="flex justify-center mb-6 relative">
        <div className="relative h-56 w-56 overflow-hidden rounded border border-gray-300 bg-gray-100 shadow">
          {currentImageUrl ? (
            <Image
              src={currentImageUrl}
              alt={form.name || "Imagen del producto"}
              width={224}
              height={224}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <svg
                className="h-16 w-16 text-gray-300"
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
            </div>
          )}

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-3">
            <button
              type="button"
              aria-label="Subir desde galeria"
              title="Subir desde galeria"
              className="group relative rounded-full bg-white/90 p-2 text-emerald-600 shadow backdrop-blur transition hover:bg-white hover:text-emerald-700"
              onClick={() => galleryInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  galleryInputRef.current?.click();
                }
              }}
            >
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
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
              className="group relative rounded-full bg-white/90 p-2 text-brand-600 shadow backdrop-blur transition hover:bg-white hover:text-brand-700"
              onClick={openCamera}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openCamera();
                }
              }}
            >
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
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
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Editar producto</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={galleryInputRef}
          onChange={(e) => {
            handleImageSelection(e.target.files);
            e.currentTarget.value = "";
          }}
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={cameraInputRef}
          onChange={(e) => {
            handleImageSelection(e.target.files);
            e.currentTarget.value = "";
          }}
        />
        {currentImagesCount > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Imagenes actuales: {currentImagesCount} de{" "}
              {PRODUCT_FORM_MAX_IMAGES}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(form.images || []).map((image, idx) => (
                <div
                  key={`${image.publicId}-${idx}`}
                  className="relative rounded border bg-white p-1"
                >
                  <Image
                    src={image.url}
                    alt={`Imagen actual ${idx + 1}`}
                    width={96}
                    height={96}
                    className="mx-auto h-24 w-24 rounded object-cover"
                  />
                  <div className="mt-1 grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      className="rounded bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-700 disabled:opacity-40"
                      onClick={() => moveExistingImage(idx, -1)}
                      disabled={idx === 0}
                      aria-label={`Mover imagen ${idx + 1} hacia la izquierda`}
                      title="Mover antes"
                    >
                      &lt;
                    </button>
                    <span className="flex items-center justify-center rounded bg-gray-50 px-1 text-xs font-medium text-gray-600">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      className="rounded bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-700 disabled:opacity-40"
                      onClick={() => moveExistingImage(idx, 1)}
                      disabled={idx === currentImagesCount - 1}
                      aria-label={`Mover imagen ${idx + 1} hacia la derecha`}
                      title="Mover despues"
                    >
                      &gt;
                    </button>
                  </div>
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                    onClick={() => removeExistingImage(idx)}
                    aria-label={`Quitar imagen actual ${idx + 1}`}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Nuevas imagenes seleccionadas</p>
            <p className="text-xs text-gray-500">
              Se agregaran a las imagenes actuales al guardar.
            </p>
            <p className="text-xs text-gray-500">
              Total previsto: {totalSelectedCount} de {PRODUCT_FORM_MAX_IMAGES}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {previewUrls.map((preview, idx) => (
                <div key={`${preview}-${idx}`} className="relative">
                  <Image
                    src={preview}
                    alt={`Nueva imagen ${idx + 1}`}
                    width={96}
                    height={96}
                    className="w-24 h-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                    onClick={() => {
                      setSelectedFiles((prev) =>
                        prev.filter((_, i) => i !== idx),
                      );
                    }}
                    aria-label={`Quitar imagen ${idx + 1}`}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="bg-gray-200 text-gray-800 px-3 py-1 rounded"
              onClick={() => setSelectedFiles([])}
            >
              Restablecer imagenes
            </button>
          </div>
        )}

        <input
          type="text"
          name="name"
          value={form.name || ""}
          onChange={handleChange}
          placeholder="Nombre"
          className="w-full border rounded px-3 py-2"
          required
        />
        <textarea
          name="description"
          value={form.description || ""}
          onChange={handleChange}
          placeholder="Descripcion"
          className="w-full border rounded px-3 py-2"
        />
        <select
          name="categoryId"
          value={
            selectedCategoryOption?.categoryId ||
            selectedCategoryOption?.value ||
            ""
          }
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
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
              checked={shouldUseVariants}
              onChange={(e) => {
                const nextChecked = e.target.checked;
                setUseVariants(nextChecked);
                setForm((prev) => ({
                  ...prev,
                  variants: nextChecked ? prev.variants || [] : [],
                  stock: nextChecked ? undefined : (prev.stock ?? product.stock ?? 0),
                  price: nextChecked ? undefined : (prev.price ?? product.price ?? 0),
                }));
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
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Selecciona un genero</option>
              <option value={Genre.NINA}>Nina</option>
              <option value={Genre.NINO}>Nino</option>
              <option value={Genre.UNISEX}>Unisex</option>
            </select>

            <div className="space-y-2">
              <label className="block font-semibold">Detalle por talla</label>
              <div className="grid grid-cols-[minmax(0,1fr)_80px_96px_32px] gap-2 items-center text-xs font-medium text-gray-600">
                <span>Talla</span>
                <span>Stock</span>
                <span>Precio</span>
                <span className="sr-only">Accion</span>
              </div>
              {(form.variants || []).map((variant, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={getVariantName(variant) || ""}
                    onChange={(e) => {
                      const value = e.target.value as VariantProduct["size"];
                      setForm((prev) => ({
                        ...prev,
                        variants: (prev.variants || []).map((v, i) =>
                          i === idx
                            ? { ...v, size: value, name: String(value || "") }
                            : v,
                        ),
                      }));
                    }}
                    className="border rounded px-2 py-1 flex-1"
                  >
                    <option value="">Talla</option>
                    {Object.values(Size).map((size) => {
                      const isUsed = form.variants?.some(
                        (v, i) => getVariantName(v) === size && i !== idx,
                      );
                      return (
                        <option key={size} value={size} disabled={isUsed}>
                          {formatSizeLabel(size)}
                        </option>
                      );
                    })}
                  </select>

                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={variantDraftValues[idx]?.stock || ""}
                    onKeyDown={(e) => preventInvalidKeys(e)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setVariantDraftValues((prev) => ({
                        ...prev,
                        [idx]: { ...prev[idx], stock: raw },
                      }));
                    }}
                    className="border rounded px-2 py-1 w-20"
                    placeholder="Stock"
                    required
                  />

                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={variantDraftValues[idx]?.price || ""}
                    onKeyDown={(e) => preventInvalidKeys(e, true)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setVariantDraftValues((prev) => ({
                        ...prev,
                        [idx]: { ...prev[idx], price: raw },
                      }));
                    }}
                    className="border rounded px-2 py-1 w-24"
                    placeholder="Precio"
                    required
                  />

                  <button
                    type="button"
                    className="text-red-600 font-bold px-2"
                    onClick={() => removeVariantAt(idx)}
                  >
                    x
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="bg-green-600 text-white px-3 py-1 rounded"
                onClick={() => {
                  const usedSizes = (form.variants || []).map((v) =>
                    getVariantName(v),
                  );
                  const availableSize = Object.values(Size).find(
                    (size) => !usedSizes.includes(size),
                  );
                  if (!availableSize) return;
                  const nextIndex = (form.variants || []).length;
                  setForm((prev) => ({
                    ...prev,
                    variants: [
                      ...(prev.variants || []),
                      {
                        name: String(availableSize),
                        size: availableSize as VariantProduct["size"],
                        stock: 0,
                        price: 0,
                      },
                    ],
                  }));
                  setVariantDraftValues((prev) => ({
                    ...prev,
                    [nextIndex]: { stock: "0", price: "0" },
                  }));
                }}
              >
                + Anadir talla
              </button>
            </div>
          </>
        ) : shouldUseVariants ? (
          <div className="space-y-2">
            <label className="block font-semibold">Variantes del producto</label>
            <div className="grid grid-cols-[minmax(0,1.3fr)_80px_96px_32px] gap-2 items-center text-xs font-medium text-gray-600">
              <span>Nombre</span>
              <span>Stock</span>
              <span>Precio</span>
              <span className="sr-only">Accion</span>
            </div>
            {(form.variants || []).map((variant, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={getVariantName(variant) || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      variants: (prev.variants || []).map((v, i) =>
                        i === idx ? { ...v, name: value, size: undefined } : v,
                      ),
                    }));
                  }}
                  className="border rounded px-2 py-1 flex-1"
                  placeholder="Nombre de variante"
                />

                <input
                  type="number"
                  min={0}
                  step={1}
                  value={variantDraftValues[idx]?.stock || ""}
                  onKeyDown={(e) => preventInvalidKeys(e)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setVariantDraftValues((prev) => ({
                      ...prev,
                      [idx]: { ...prev[idx], stock: raw },
                    }));
                  }}
                  className="border rounded px-2 py-1 w-20"
                  placeholder="Stock"
                  required
                />

                <input
                  type="number"
                  min={0}
                  step="any"
                  value={variantDraftValues[idx]?.price || ""}
                  onKeyDown={(e) => preventInvalidKeys(e, true)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setVariantDraftValues((prev) => ({
                      ...prev,
                      [idx]: { ...prev[idx], price: raw },
                    }));
                  }}
                  className="border rounded px-2 py-1 w-24"
                  placeholder="Precio"
                  required
                />

                <button
                  type="button"
                  className="text-red-600 font-bold px-2"
                  onClick={() => removeVariantAt(idx)}
                >
                  x
                </button>
              </div>
            ))}
            <button
              type="button"
              className="bg-green-600 text-white px-3 py-1 rounded"
              onClick={() => {
                const nextIndex = (form.variants || []).length;
                setForm((prev) => ({
                  ...prev,
                  variants: [
                    ...(prev.variants || []),
                    { name: "", stock: 0, price: 0 },
                  ],
                }));
                setVariantDraftValues((prev) => ({
                  ...prev,
                  [nextIndex]: { stock: "0", price: "0" },
                }));
              }}
            >
              + Anadir variante
            </button>
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
                onKeyDown={(e) => preventInvalidKeys(e)}
                placeholder="Stock"
                min={0}
                step={1}
                inputMode="numeric"
                className="mt-1 w-full border rounded px-3 py-2"
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
                onKeyDown={(e) => preventInvalidKeys(e, true)}
                placeholder="Precio"
                min={0}
                step="any"
                inputMode="decimal"
                className="mt-1 w-full border rounded px-3 py-2"
                required
              />
            </label>
          </div>
        )}

        <button
          type="submit"
          className="bg-brand-600 text-white px-4 py-2 rounded"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
};

const EditProductPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="py-10 text-center">Cargando...</div>}>
      <EditProductContent />
    </Suspense>
  );
};

export default EditProductPage;
