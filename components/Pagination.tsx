import React from "react";
import type { ProductPaginationProps } from "@/types/ui/products";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: ProductPaginationProps) {
  if (totalPages <= 1) return null;

  // Función para obtener páginas visibles según el tamaño de pantalla
  const getVisiblePages = () => {
    const maxVisible = 5; // Máximo de páginas visibles en desktop

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  return (
    <nav className="flex justify-center" aria-label="Navegación de páginas">
      <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg border border-gray-200 p-1">
        {/* Botón anterior */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            currentPage === 1
              ? "pointer-events-none opacity-40 text-gray-400"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          }`}
          aria-disabled={currentPage === 1}
        >
          <span className="hidden sm:inline">← Anterior</span>
          <span className="sm:hidden">←</span>
        </button>

        {/* Primera página si no está visible */}
        {visiblePages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              1
            </button>
            {visiblePages[0] > 2 && (
              <span className="px-1 text-gray-400 text-xs sm:text-sm">...</span>
            )}
          </>
        )}

        {/* Páginas visibles */}
        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              page === currentPage
                ? "bg-brand-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}

        {/* Última página si no está visible */}
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="px-1 text-gray-400 text-xs sm:text-sm">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Botón siguiente */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            currentPage === totalPages
              ? "pointer-events-none opacity-40 text-gray-400"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          }`}
          aria-disabled={currentPage === totalPages}
        >
          <span className="hidden sm:inline">Siguiente →</span>
          <span className="sm:hidden">→</span>
        </button>
      </div>

      {/* Información de página en móvil */}
      <div className="sm:hidden ml-3 flex items-center text-xs text-gray-600">
        <span className="bg-gray-100 px-2 py-1 rounded">
          {currentPage}/{totalPages}
        </span>
      </div>
    </nav>
  );
}
