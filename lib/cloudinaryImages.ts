const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";

type CloudinaryImageOptions = {
  width?: number;
  height?: number;
  crop?: "limit" | "fill" | "fit";
  quality?: "auto" | number;
};

export const getOptimizedCloudinaryUrl = (
  sourceUrl?: string | null,
  options: CloudinaryImageOptions = {},
): string => {
  if (!sourceUrl || !sourceUrl.includes("res.cloudinary.com")) {
    return sourceUrl || "";
  }

  const uploadIndex = sourceUrl.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (uploadIndex === -1) return sourceUrl;

  const prefixEnd = uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length;
  const prefix = sourceUrl.slice(0, prefixEnd);
  const suffix = sourceUrl.slice(prefixEnd);

  if (suffix.startsWith("f_auto,") || suffix.startsWith("q_auto,")) {
    return sourceUrl;
  }

  const transformations = [
    "f_auto",
    `q_${options.quality ?? "auto"}`,
    `c_${options.crop ?? "limit"}`,
    options.width ? `w_${options.width}` : null,
    options.height ? `h_${options.height}` : null,
  ].filter(Boolean);

  return `${prefix}${transformations.join(",")}/${suffix}`;
};
