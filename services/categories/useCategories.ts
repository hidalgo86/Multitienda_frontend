"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildProductCategoryOptions,
  type Category,
  type ProductCategoryOption,
} from "@/types/domain/products";
import { listCategories } from "./index";

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [options, setOptions] = useState<ProductCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextCategories = await listCategories();
      setCategories(nextCategories);
      setOptions(buildProductCategoryOptions(nextCategories));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar categorías",
      );
      setCategories([]);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    categories,
    options,
    loading,
    error,
    reload,
  };
};
