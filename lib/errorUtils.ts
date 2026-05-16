export const getErrorMessage = (
  error: unknown,
  fallback = "Ocurrio un error inesperado",
): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return fallback;
};

export const isSessionError = (error: unknown): boolean => {
  const message = getErrorMessage(error, "").toLowerCase();

  return (
    message.includes("token") ||
    message.includes("jwt") ||
    message.includes("unauthorized") ||
    message.includes("unauthoriz") ||
    message.includes("sesion") ||
    message.includes("session")
  );
};

export const reportClientError = (context: string, error: unknown): void => {
  if (process.env.NODE_ENV === "production") return;
  console.error(context, error);
};
