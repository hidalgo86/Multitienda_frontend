export const defaultImageHosts = ["res.cloudinary.com"];

export const getAllowedImageHosts = (): Set<string> => {
  const hosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  return new Set(hosts.length > 0 ? hosts : defaultImageHosts);
};

export const isAllowedRemoteImageUrl = (value: string): boolean => {
  try {
    const parsedUrl = new URL(value);
    return (
      parsedUrl.protocol === "https:" &&
      getAllowedImageHosts().has(parsedUrl.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
};

export const isCloudinaryImageUrl = (value: string): boolean => {
  try {
    return new URL(value).hostname.toLowerCase() === "res.cloudinary.com";
  } catch {
    return false;
  }
};
