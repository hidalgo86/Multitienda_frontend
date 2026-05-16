import type { BusinessColorPalette } from "@/types/domain/business-settings";

export const BRAND_COLOR_KEYS = [
  "brand50",
  "brand100",
  "brand200",
  "brand300",
  "brand400",
  "brand500",
  "brand600",
  "brand700",
  "brand800",
  "brand900",
  "brand950",
] as const;

export type BrandColorKey = (typeof BRAND_COLOR_KEYS)[number];

export const brandPalettePresets: Array<{
  id: string;
  label: string;
  colors: BusinessColorPalette;
}> = [
  {
    id: "pink",
    label: "Rosa",
    colors: {
      preset: "pink",
      brand50: "#fdf2f8",
      brand100: "#fce7f3",
      brand200: "#fbcfe8",
      brand300: "#f9a8d4",
      brand400: "#f472b6",
      brand500: "#ec4899",
      brand600: "#db2777",
      brand700: "#be185d",
      brand800: "#9d174d",
      brand900: "#831843",
      brand950: "#500724",
    },
  },
  {
    id: "emerald",
    label: "Esmeralda",
    colors: {
      preset: "emerald",
      brand50: "#ecfdf5",
      brand100: "#d1fae5",
      brand200: "#a7f3d0",
      brand300: "#6ee7b7",
      brand400: "#34d399",
      brand500: "#10b981",
      brand600: "#059669",
      brand700: "#047857",
      brand800: "#065f46",
      brand900: "#064e3b",
      brand950: "#022c22",
    },
  },
  {
    id: "sky",
    label: "Azul cielo",
    colors: {
      preset: "sky",
      brand50: "#f0f9ff",
      brand100: "#e0f2fe",
      brand200: "#bae6fd",
      brand300: "#7dd3fc",
      brand400: "#38bdf8",
      brand500: "#0ea5e9",
      brand600: "#0284c7",
      brand700: "#0369a1",
      brand800: "#075985",
      brand900: "#0c4a6e",
      brand950: "#082f49",
    },
  },
  {
    id: "violet",
    label: "Violeta",
    colors: {
      preset: "violet",
      brand50: "#f5f3ff",
      brand100: "#ede9fe",
      brand200: "#ddd6fe",
      brand300: "#c4b5fd",
      brand400: "#a78bfa",
      brand500: "#8b5cf6",
      brand600: "#7c3aed",
      brand700: "#6d28d9",
      brand800: "#5b21b6",
      brand900: "#4c1d95",
      brand950: "#2e1065",
    },
  },
  {
    id: "amber",
    label: "Ambar",
    colors: {
      preset: "amber",
      brand50: "#fffbeb",
      brand100: "#fef3c7",
      brand200: "#fde68a",
      brand300: "#fcd34d",
      brand400: "#fbbf24",
      brand500: "#f59e0b",
      brand600: "#d97706",
      brand700: "#b45309",
      brand800: "#92400e",
      brand900: "#78350f",
      brand950: "#451a03",
    },
  },
];

export const defaultBrandPalette = brandPalettePresets[0].colors;

const cssVariableNames: Record<BrandColorKey, string> = {
  brand50: "--brand-50",
  brand100: "--brand-100",
  brand200: "--brand-200",
  brand300: "--brand-300",
  brand400: "--brand-400",
  brand500: "--brand-500",
  brand600: "--brand-600",
  brand700: "--brand-700",
  brand800: "--brand-800",
  brand900: "--brand-900",
  brand950: "--brand-950",
};

export const applyBrandPalette = (palette?: Partial<BusinessColorPalette>) => {
  if (typeof document === "undefined") return;

  const resolvedPalette = {
    ...defaultBrandPalette,
    ...(palette ?? {}),
  };

  BRAND_COLOR_KEYS.forEach((key) => {
    document.documentElement.style.setProperty(
      cssVariableNames[key],
      resolvedPalette[key] || defaultBrandPalette[key],
    );
  });
};
