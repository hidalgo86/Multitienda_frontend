"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MdClose, MdSearch } from "react-icons/md";

const SEARCH_KEYS = ["search", "page"] as const;

export default function ProductSearchBar({
  initialSearch = "",
}: {
  initialSearch?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  const updateSearch = (nextSearch: string) => {
    const params = new URLSearchParams(searchParams.toString());
    SEARCH_KEYS.forEach((key) => params.delete(key));

    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim());
    }

    params.set("page", "1");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSearch(search);
  };

  const clearSearch = () => {
    setSearch("");
    updateSearch("");
  };

  return (
    <form className="w-full max-w-xl" onSubmit={handleSubmit}>
      <div className="relative">
        <MdSearch
          size={20}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          role="searchbox"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-24 text-sm text-slate-800 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
          placeholder="Buscar productos"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {search ? (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Limpiar busqueda"
            >
              <MdClose size={18} />
            </button>
          ) : null}
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Buscar
          </button>
        </div>
      </div>
    </form>
  );
}
