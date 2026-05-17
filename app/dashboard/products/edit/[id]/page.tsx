"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  legacyProductCategoryOptions,
  Product,
  ProductState,
  UploadProduct,
  VariantProduct,
  ProductStatus,
  Genre,
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
import EditProductImagesSection from "@/features/products/components/EditProductImagesSection";
import EditProductVariantsSection from "@/features/products/components/EditProductVariantsSection";
import ProductForm from "@/features/products/components/ProductForm";
import ProductImageHero from "@/features/products/components/ProductImageHero";

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
  const currentImageUrl =
    previewUrls[0] || form.images?.[0]?.url || product.images?.[0]?.url || "";

  const heroSection = (
    <ProductImageHero
      imageUrl={currentImageUrl}
      alt={form.name || "Imagen del producto"}
      onOpenGallery={() => galleryInputRef.current?.click()}
      onOpenCamera={openCamera}
    />
  );

  const imageSection = (
    <EditProductImagesSection
      galleryInputRef={galleryInputRef}
      cameraInputRef={cameraInputRef}
      currentImages={form.images || []}
      currentImagesCount={currentImagesCount}
      selectedFilesCount={selectedFiles.length}
      previewUrls={previewUrls}
      onImageSelection={handleImageSelection}
      onMoveExistingImage={moveExistingImage}
      onRemoveExistingImage={removeExistingImage}
      onRemoveSelectedFile={(index) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
      }}
      onResetSelectedFiles={() => setSelectedFiles([])}
    />
  );

  const variantsSection = shouldUseVariants ? (
    <EditProductVariantsSection
      variants={form.variants || []}
      variantDraftValues={variantDraftValues}
      isClothingProduct={isClothingProduct}
      onVariantsChange={(variants) => {
        setForm((prev) => ({ ...prev, variants }));
      }}
      onVariantDraftValuesChange={setVariantDraftValues}
      onRemoveVariant={removeVariantAt}
      onStockKeyDown={(e) => preventInvalidKeys(e)}
      onPriceKeyDown={(e) => preventInvalidKeys(e, true)}
    />
  ) : null;

  return (
    <ProductForm
      title="Editar producto"
      submitLabel="Guardar cambios"
      error={error}
      form={form}
      categoryOptions={categoryOptions}
      selectedCategoryOption={selectedCategoryOption}
      isClothingProduct={isClothingProduct}
      shouldUseVariants={shouldUseVariants}
      showVariantsToggle={!isClothingProduct}
      heroSection={heroSection}
      imageSection={imageSection}
      variantsSection={variantsSection}
      onBack={() => router.push(returnTo)}
      onSubmit={handleSubmit}
      onChange={handleChange}
      onUseVariantsChange={(nextChecked) => {
        setUseVariants(nextChecked);
        setForm((prev) => ({
          ...prev,
          variants: nextChecked ? prev.variants || [] : [],
          stock: nextChecked ? undefined : (prev.stock ?? product.stock ?? 0),
          price: nextChecked ? undefined : (prev.price ?? product.price ?? 0),
        }));
      }}
      onStockKeyDown={(e) => preventInvalidKeys(e)}
      onPriceKeyDown={(e) => preventInvalidKeys(e, true)}
    />
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
