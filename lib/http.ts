const genericErrorMessages = new Set([
  "bad request exception",
  "bad request",
  "internal server error",
  "error backend",
  "error del backend",
]);

export class ApiResponseError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiResponseError";
  }
}

const isGenericErrorMessage = (value: string): boolean =>
  genericErrorMessages.has(value.trim().toLowerCase());

export const extractErrorMessage = (
  value: unknown,
  fallbackErrorMessage: string,
): string => {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue || fallbackErrorMessage;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((item) => extractErrorMessage(item, ""))
      .filter(Boolean);

    return messages.join(". ") || fallbackErrorMessage;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    const nestedMessage = [
      record.originalError,
      record.extensions,
      record.exception,
      record.response,
    ]
      .map((item) => extractErrorMessage(item, ""))
      .find(Boolean);

    if (typeof record.message === "string" && record.message.trim()) {
      const message = record.message.trim();
      if (!isGenericErrorMessage(message) || !nestedMessage) {
        return message;
      }
    }

    if (typeof record.error === "string" && record.error.trim()) {
      const errorMessage = record.error.trim();
      if (!isGenericErrorMessage(errorMessage) || !nestedMessage) {
        return errorMessage;
      }
    }

    if (nestedMessage) {
      return nestedMessage;
    }
  }

  return fallbackErrorMessage;
};

export const buildApiUrl = (path: string, baseUrl?: string): string => {
  if (!baseUrl) return path;
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};

export const parseResponseOrThrow = async <T>(
  response: Response,
  fallbackErrorMessage: string,
): Promise<T> => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = extractErrorMessage(
      data && typeof data === "object"
        ? [
            (data as { error?: unknown }).error,
            (data as { message?: unknown }).message,
          ]
        : data,
      fallbackErrorMessage,
    );
    throw new ApiResponseError(message, response.status);
  }

  return data as T;
};
