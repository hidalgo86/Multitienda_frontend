"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildProductCategoryOptions,
  type Category,
  type ProductCategoryOption,
} from "@/types/domain/products";
import { listCategories } from "./index";

interface UseCategoriesOptions {
  enabled?: boolean;
  initialCategories?: Category[];
  initialOptions?: ProductCategoryOption[];
}

export const useCategories = ({
  enabled = true,
  initialCategories = [],
  initialOptions,
}: UseCategoriesOptions = {}) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [options, setOptions] = useState<ProductCategoryOption[]>(
    initialOptions ?? buildProductCategoryOptions(initialCategories),
  );
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

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
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    void reload();
  }, [enabled, reload]);

  return {
    categories,
    options,
    loading,
    error,
    reload,
  };
};
