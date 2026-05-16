"use client";

import React from "react";
import {
  clearStoredSession,
  getCurrentUser,
  getStoredAuthToken,
} from "@/services/users";

const AUTH_SESSION_EVENT = "auth:session-changed";

export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const validatingRef = React.useRef(false);

  React.useEffect(() => {
    let mounted = true;

    const validateStoredSession = async () => {
      if (validatingRef.current || !getStoredAuthToken()) {
        return;
      }

      validatingRef.current = true;

      try {
        await getCurrentUser();
      } catch {
        if (mounted) {
          clearStoredSession();
        }
      } finally {
        validatingRef.current = false;
      }
    };

    const validateWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void validateStoredSession();
      }
    };

    void validateStoredSession();

    window.addEventListener("pageshow", validateStoredSession);
    window.addEventListener("focus", validateStoredSession);
    document.addEventListener("visibilitychange", validateWhenVisible);
    window.addEventListener(AUTH_SESSION_EVENT, validateStoredSession);

    return () => {
      mounted = false;
      window.removeEventListener("pageshow", validateStoredSession);
      window.removeEventListener("focus", validateStoredSession);
      document.removeEventListener("visibilitychange", validateWhenVisible);
      window.removeEventListener(AUTH_SESSION_EVENT, validateStoredSession);
    };
  }, []);

  return <>{children}</>;
}
