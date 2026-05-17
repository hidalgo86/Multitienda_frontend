import type React from "react";

interface ProductImageButtonsProps {
  onOpenGallery: () => void;
  onOpenCamera: () => void;
}

const ProductImageButtons: React.FC<ProductImageButtonsProps> = ({
  onOpenGallery,
  onOpenCamera,
}) => (
  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-3">
    <button
      type="button"
      aria-label="Subir desde galeria"
      title="Subir desde galeria"
      className="group relative rounded-full bg-white/90 p-2 text-emerald-600 shadow backdrop-blur transition hover:bg-white hover:text-emerald-700"
      onClick={onOpenGallery}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenGallery();
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
      onClick={onOpenCamera}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenCamera();
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
);

export default ProductImageButtons;
