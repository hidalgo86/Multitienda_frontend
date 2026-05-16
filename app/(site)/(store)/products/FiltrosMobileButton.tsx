"use client";

import { useState } from "react";
import { MdKeyboardArrowRight, MdTune } from "react-icons/md";
import FiltrosModal from "../../../../components/FiltrosModal";

export default function FiltrosMobileButton({
  activeCount = 0,
}: {
  activeCount?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-20 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:border-slate-300"
          onClick={() => setOpen(true)}
          aria-label="Abrir filtros"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
              <MdTune size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Filtrar productos
              </div>
              <div className="text-xs text-gray-500">
                {activeCount > 0
                  ? `${activeCount} filtros activos`
                  : "Categoria, talla y precio"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeCount > 0 ? (
              <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                {activeCount}
              </span>
            ) : null}
            <MdKeyboardArrowRight size={22} className="text-gray-400" />
          </div>
        </button>
      </div>
      <FiltrosModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
