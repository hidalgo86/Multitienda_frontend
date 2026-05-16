"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { isAllowedRemoteImageUrl } from "@/lib/imageHosts";

const DEFAULT_FALLBACK_SRC = "/placeholder.webp";

type ProductImageProps = ImageProps & {
  fallbackSrc?: string;
};

const isRemoteImage = (src: ImageProps["src"]): boolean =>
  typeof src === "string" && isAllowedRemoteImageUrl(src);

export default function ProductImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  unoptimized,
  onError,
  ...props
}: ProductImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [fallbackSrc, src]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized={unoptimized ?? isRemoteImage(currentSrc)}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}
