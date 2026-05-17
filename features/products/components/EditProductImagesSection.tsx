"use client";

import Image from "next/image";
import type React from "react";
import type { ProductImage } from "@/types/domain/products";
import { PRODUCT_FORM_MAX_IMAGES } from "@/types/ui/products";

interface EditProductImagesSectionProps {
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  currentImages: ProductImage[];
  currentImagesCount: number;
  selectedFilesCount: number;
  previewUrls: string[];
  onImageSelection: (files: FileList | null) => void;
  onMoveExistingImage: (index: number, direction: -1 | 1) => void;
  onRemoveExistingImage: (index: number) => void;
  onRemoveSelectedFile: (index: number) => void;
  onResetSelectedFiles: () => void;
}

const EditProductImagesSection: React.FC<EditProductImagesSectionProps> = ({
  galleryInputRef,
  cameraInputRef,
  currentImages,
  currentImagesCount,
  selectedFilesCount,
  previewUrls,
  onImageSelection,
  onMoveExistingImage,
  onRemoveExistingImage,
  onRemoveSelectedFile,
  onResetSelectedFiles,
}) => {
  const totalSelectedCount = currentImagesCount + selectedFilesCount;

  return (
    <>
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        ref={galleryInputRef}
        onChange={(e) => {
          onImageSelection(e.target.files);
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
          onImageSelection(e.target.files);
          e.currentTarget.value = "";
        }}
      />
      {currentImagesCount > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Imagenes actuales: {currentImagesCount} de{" "}
            {PRODUCT_FORM_MAX_IMAGES}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {currentImages.map((image, idx) => (
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
                    onClick={() => onMoveExistingImage(idx, -1)}
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
                    onClick={() => onMoveExistingImage(idx, 1)}
                    disabled={idx === currentImagesCount - 1}
                    aria-label={`Mover imagen ${idx + 1} hacia la derecha`}
                    title="Mover despues"
                  >
                    &gt;
                  </button>
                </div>
                <button
                  type="button"
                  className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-600 text-xs text-white"
                  onClick={() => onRemoveExistingImage(idx)}
                  aria-label={`Quitar imagen actual ${idx + 1}`}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {previewUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Nuevas imagenes seleccionadas</p>
          <p className="text-xs text-gray-500">
            Se agregaran a las imagenes actuales al guardar.
          </p>
          <p className="text-xs text-gray-500">
            Total previsto: {totalSelectedCount} de {PRODUCT_FORM_MAX_IMAGES}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {previewUrls.map((preview, idx) => (
              <div key={`${preview}-${idx}`} className="relative">
                <Image
                  src={preview}
                  alt={`Nueva imagen ${idx + 1}`}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded border object-cover"
                />
                <button
                  type="button"
                  className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-600 text-xs text-white"
                  onClick={() => onRemoveSelectedFile(idx)}
                  aria-label={`Quitar imagen ${idx + 1}`}
                >
                  x
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="rounded bg-gray-200 px-3 py-1 text-gray-800"
            onClick={onResetSelectedFiles}
          >
            Restablecer imagenes
          </button>
        </div>
      )}
    </>
  );
};

export default EditProductImagesSection;
