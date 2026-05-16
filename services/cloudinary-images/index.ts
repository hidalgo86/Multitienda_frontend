import {
  buildApiUrl,
  buildAuthHeaders,
  fetchWithAuthRetry,
  parseResponseOrThrow,
  type ApiRequestOptions,
} from "@/lib/apiClient";

type ApiOptions = Pick<ApiRequestOptions, "baseUrl" | "signal" | "token">;

export type CloudinaryFolder = "products" | "banners" | "categories" | "logos";

export interface UploadedCloudinaryImage {
  url: string;
  publicId: string;
}

export const uploadCloudinaryImage = async (
  file: File,
  folder: CloudinaryFolder,
  options: ApiOptions = {},
): Promise<UploadedCloudinaryImage> =>
  fetchWithAuthRetry(async (token) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch(
      buildApiUrl("/api/cloudinary/upload", options.baseUrl),
      {
        method: "POST",
        headers: buildAuthHeaders(options.token ?? token),
        body: formData,
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<UploadedCloudinaryImage>(
      response,
      "Error subiendo imagen",
    );
  }, "Error subiendo imagen", options);

export const deleteCloudinaryImage = async (
  publicId: string,
  options: ApiOptions = {},
): Promise<void> =>
  fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl("/api/cloudinary/upload", options.baseUrl),
      {
        method: "DELETE",
        headers: buildAuthHeaders(options.token ?? token, true),
        body: JSON.stringify({ publicId }),
        signal: options.signal,
      },
    );

    await parseResponseOrThrow<{ success: boolean }>(
      response,
      "Error eliminando imagen",
    );
  }, "Error eliminando imagen", options);
