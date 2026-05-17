"use client";

import Image from "next/image";
import type React from "react";
import ProductImageButtons from "./ProductImageButtons";
import ProductImagePlaceholder from "./ProductImagePlaceholder";

interface ProductImageHeroProps {
  imageUrl: string;
  alt: string;
  onOpenGallery: () => void;
  onOpenCamera: () => void;
}

const ProductImageHero: React.FC<ProductImageHeroProps> = ({
  imageUrl,
  alt,
  onOpenGallery,
  onOpenCamera,
}) => (
  <div className="relative mb-6 flex justify-center">
    <div className="relative h-56 w-56 overflow-hidden rounded border border-gray-300 bg-gray-100 shadow">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          width={224}
          height={224}
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-gray-400">
          <ProductImagePlaceholder />
        </div>
      )}
      <ProductImageButtons
        onOpenGallery={onOpenGallery}
        onOpenCamera={onOpenCamera}
      />
    </div>
  </div>
);

export default ProductImageHero;
