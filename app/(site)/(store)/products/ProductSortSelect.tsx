"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ProductSortBy } from "@/types/domain/products";

const sortOptions = [
  { value: ProductSortBy.NEWEST, label: "Mas recientes" },
  { value: ProductSortBy.PRICE_ASC, label: "Precio menor" },
  { value: ProductSortBy.PRICE_DESC, label: "Precio mayor" },
  { value: ProductSortBy.MOST_VIEWED, label: "Mas vistos" },
  { value: ProductSortBy.MOST_FAVORITED, label: "Mas favoritos" },
];

export default function ProductSortSelect({
  currentSort,
}: {
  currentSort?: ProductSortBy;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSort = event.target.value;
    const params = new URLSearchParams(searchParams.toString());

    params.delete("page");

    if (nextSort) {
      params.set("sortBy", nextSort);
    } else {
      params.delete("sortBy");
    }

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  };

  return (
    <label className="flex w-full flex-col gap-1 text-xs font-semibold uppercase text-slate-500 sm:w-auto">
      Ordenar por
      <select
        value={currentSort ?? ""}
        onChange={handleChange}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium normal-case text-slate-800 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100 sm:w-48"
      >
        <option value="">Relevancia</option>
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
