"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { listPublicBanners } from "@/services/banners";
import type { Banner } from "@/types/domain/banners";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinaryImages";

const AUTOPLAY_DELAY_MS = 3000;
const MANUAL_PAUSE_MS = 8000;

export default function Carrusel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [actual, setActual] = useState(0);
  const [manualPauseVersion, setManualPauseVersion] = useState(0);

  useEffect(() => {
    let isMounted = true;

    void listPublicBanners()
      .then((items) => {
        if (!isMounted) return;
        setBanners(items);
        setActual(0);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const imagenes = banners.map((banner) => ({
    src:
      getOptimizedCloudinaryUrl(banner.imageUrl, {
        width: 1400,
        height: 560,
        crop: "fit",
      }) || banner.imageUrl,
    alt: banner.altText || banner.title,
    title: banner.title,
    subtitle: banner.subtitle,
    href: banner.linkUrl || undefined,
    ctaLabel: banner.ctaLabel,
  }));
  const totalImagenes = imagenes.length;
  const hasMultipleImages = totalImagenes > 1;

  useEffect(() => {
    if (!hasMultipleImages) {
      return undefined;
    }

    const waitTime =
      manualPauseVersion > 0 ? MANUAL_PAUSE_MS : AUTOPLAY_DELAY_MS;
    const timer = window.setTimeout(() => {
      setActual((prev) => (prev + 1) % totalImagenes);
      setManualPauseVersion(0);
    }, waitTime);

    return () => window.clearTimeout(timer);
  }, [actual, hasMultipleImages, manualPauseVersion, totalImagenes]);

  if (!isLoaded) {
    return (
      <div
        className="relative w-full 
                    max-w-full sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl
                    mx-auto
                    rounded-lg sm:rounded-xl lg:rounded-2xl
                    overflow-hidden
                    shadow-md sm:shadow-lg lg:shadow-xl"
      >
        <div
          className="w-full
                      h-[200px] min-[420px]:h-[240px] sm:h-[280px] lg:h-[400px] xl:h-[480px]
                      bg-brand-50"
        />
      </div>
    );
  }

  if (imagenes.length === 0) {
    return null;
  }

  const currentImage = imagenes[actual];

  const pauseAfterManualNavigation = () => {
    setManualPauseVersion((version) => version + 1);
  };

  const siguiente = () => {
    pauseAfterManualNavigation();
    setActual((prev) => (prev + 1) % totalImagenes);
  };

  const anterior = () => {
    pauseAfterManualNavigation();
    setActual((prev) => (prev - 1 + totalImagenes) % totalImagenes);
  };

  const goToImage = (index: number) => {
    pauseAfterManualNavigation();
    setActual(index);
  };

  return (
    <div
      className="relative w-full 
                    max-w-full sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 
                    mx-auto 
                    rounded-lg sm:rounded-xl lg:rounded-2xl 
                    overflow-hidden 
                    shadow-md sm:shadow-lg lg:shadow-xl"
    >
      <div
        className="w-full 
                      h-[200px] min-[420px]:h-[240px] sm:h-[280px] lg:h-[400px] xl:h-[480px] 
                      bg-brand-50 flex items-center justify-center relative"
      >
        {currentImage.href ? (
          <a
            href={currentImage.href}
            className="block h-full w-full"
            aria-label={currentImage.alt}
          >
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              style={{ objectFit: "contain" }}
              className="rounded-lg sm:rounded-xl lg:rounded-2xl"
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 70vw"
            />
          </a>
        ) : (
          <Image
            src={currentImage.src}
            alt={currentImage.alt}
            fill
            style={{ objectFit: "contain" }}
            className="rounded-lg sm:rounded-xl lg:rounded-2xl"
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 70vw"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />
        {(currentImage.title || currentImage.subtitle || currentImage.ctaLabel) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6 lg:p-10">
            <div className="max-w-2xl text-white">
              {currentImage.title && (
                <p className="text-xl font-bold leading-tight sm:text-3xl lg:text-5xl">
                  {currentImage.title}
                </p>
              )}
              {currentImage.subtitle && (
                <p className="mt-2 max-w-xl text-sm text-white/90 sm:text-base lg:mt-3 lg:text-lg">
                  {currentImage.subtitle}
                </p>
              )}
              {currentImage.href && currentImage.ctaLabel && (
                <a
                  href={currentImage.href}
                  className="pointer-events-auto mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-brand-100 sm:px-5 sm:py-2.5 sm:text-base"
                >
                  {currentImage.ctaLabel}
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {hasMultipleImages && (
        <>
          <button
            onClick={anterior}
            className="absolute top-1/2 
                     left-2 sm:left-4 lg:left-6 
                     -translate-y-1/2 
                     hidden min-[420px]:inline-flex
                     bg-brand-200 hover:bg-brand-300 active:bg-brand-400
                     text-gray-700 
                     rounded-full 
                     p-1.5 sm:p-2 lg:p-3
                     shadow-md hover:shadow-lg 
                     transition-all duration-200
                     text-sm sm:text-base lg:text-lg
                     z-10"
            aria-label="Imagen anterior"
          >
            &#8592;
          </button>

          <button
            onClick={siguiente}
            className="absolute top-1/2 
                     right-2 sm:right-4 lg:right-6 
                     -translate-y-1/2 
                     hidden min-[420px]:inline-flex
                     bg-brand-200 hover:bg-brand-300 active:bg-brand-400
                     text-gray-700 
                     rounded-full 
                     p-1.5 sm:p-2 lg:p-3
                     shadow-md hover:shadow-lg 
                     transition-all duration-200
                     text-sm sm:text-base lg:text-lg
                     z-10"
            aria-label="Siguiente imagen"
          >
            &#8594;
          </button>

          <div
            className="absolute 
                        bottom-2 sm:bottom-4 lg:bottom-6 
                        w-full flex justify-center 
                        gap-1.5 sm:gap-2 lg:gap-3"
          >
            {imagenes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToImage(idx)}
                className={`
                  w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 
                  rounded-full transition-all duration-300
                  ${
                    idx === actual
                      ? "bg-brand-500 scale-110"
                      : "bg-brand-200 hover:bg-brand-300"
                  }
                `}
                aria-label={`Ir a imagen ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
