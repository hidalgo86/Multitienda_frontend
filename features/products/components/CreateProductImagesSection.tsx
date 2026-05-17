"use client";

import Image from "next/image";
import type React from "react";
import { PRODUCT_FORM_MAX_IMAGES } from "@/types/ui/products";
import ProductImageButtons from "./ProductImageButtons";
import ProductImagePlaceholder from "./ProductImagePlaceholder";

interface CreateProductImagesSectionProps {
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  imagePreviews: string[];
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenCamera: () => void;
  onRemoveImage: (index: number) => void;
}

const CreateProductImagesSection: React.FC<CreateProductImagesSectionProps> = ({
  galleryInputRef,
  cameraInputRef,
  imagePreviews,
  onImageChange,
  onOpenCamera,
  onRemoveImage,
}) => (
  <>
    <input
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      ref={galleryInputRef}
      onChange={onImageChange}
    />
    <input
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      ref={cameraInputRef}
      onChange={onImageChange}
    />
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-40 w-40">
        <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded border border-gray-300 bg-gray-100">
          {imagePreviews[0] ? (
            <Image
              src={imagePreviews[0]}
              alt="Previsualizacion"
              width={160}
              height={160}
              className="h-full w-full object-cover"
            />
          ) : (
            <ProductImagePlaceholder />
          )}
        </div>
        <ProductImageButtons
          onOpenGallery={() => galleryInputRef.current?.click()}
          onOpenCamera={onOpenCamera}
        />
      </div>
      {imagePreviews.length > 0 && (
        <>
          <div className="text-xs text-gray-600">
            {imagePreviews.length} imagen(es) seleccionada(s) de{" "}
            {PRODUCT_FORM_MAX_IMAGES}
          </div>
          <div className="grid w-full max-w-md grid-cols-4 gap-2">
            {imagePreviews.map((preview, idx) => (
              <div key={`${preview}-${idx}`} className="relative">
                <Image
                  src={preview}
                  alt={`Imagen ${idx + 1}`}
                  width={72}
                  height={72}
                  className="h-18 w-18 rounded border object-cover"
                />
                <button
                  type="button"
                  className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-600 text-xs text-white"
                  onClick={() => onRemoveImage(idx)}
                  aria-label={`Quitar imagen ${idx + 1}`}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  </>
);

export default CreateProductImagesSection;
