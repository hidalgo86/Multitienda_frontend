import { useCallback, useState } from "react";
import { getErrorMessage, reportClientError } from "@/lib/errorUtils";

export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: unknown, context?: string) => {
    const message = getErrorMessage(err);
    setError(message);

    if (context) {
      reportClientError(context, err);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { error, setError, handleError, clearError };
}
