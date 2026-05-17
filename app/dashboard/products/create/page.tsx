"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreateProduct,
  resolveCategoryOption,
  VariantProduct,
  Size,
  Genre,
  legacyProductCategoryOptions,
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
import CreateProductImagesSection from "@/features/products/components/CreateProductImagesSection";
import CreateProductVariantsSection from "@/features/products/components/CreateProductVariantsSection";
import ProductForm from "@/features/products/components/ProductForm";

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

  const imageSection = (
    <CreateProductImagesSection
      galleryInputRef={galleryInputRef}
      cameraInputRef={cameraInputRef}
      imagePreviews={imagePreviews}
      onImageChange={handleImageChange}
      onOpenCamera={openCamera}
      onRemoveImage={removeImageAt}
    />
  );

  const variantsSection = shouldUseVariants ? (
    <CreateProductVariantsSection
      formVariants={form.variants || []}
      isClothingProduct={isClothingProduct}
      variant={variant}
      variantErrors={variantErrors}
      onVariantChange={handleVariantChange}
      onAddVariant={handleAddVariant}
      onRemoveVariant={handleRemoveVariant}
      onStockKeyDown={preventStockInvalidKeys}
      onPriceKeyDown={preventPriceInvalidKeys}
    />
  ) : null;

  return (
    <ProductForm
      title="Crear nuevo producto"
      submitLabel="Crear Producto"
      loadingLabel="Creando..."
      loading={loading}
      error={error}
      form={form}
      categoryOptions={categoryOptions}
      selectedCategoryOption={selectedCategoryOption}
      isClothingProduct={isClothingProduct}
      shouldUseVariants={shouldUseVariants}
      showVariantsToggle={!isClothingProduct}
      imageSection={imageSection}
      variantsSection={variantsSection}
      onBack={() => router.push("/dashboard/products")}
      onSubmit={handleSubmit}
      onChange={handleChange}
      onUseVariantsChange={(nextChecked) => {
        setUseVariants(nextChecked);
        setForm((prev) => ({
          ...prev,
          variants: nextChecked ? prev.variants || [] : [],
          stock: nextChecked ? undefined : (prev.stock ?? 1),
          price: nextChecked ? undefined : (prev.price ?? 1),
        }));
        setVariantErrors({});
      }}
      onStockKeyDown={preventStockInvalidKeys}
      onPriceKeyDown={preventPriceInvalidKeys}
    />
  );
};

export default CreateProductPage;
