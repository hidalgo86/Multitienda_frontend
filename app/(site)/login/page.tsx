"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSubmitCooldown } from "@/lib/useSubmitCooldown";
import { reportClientError } from "@/lib/errorUtils";
import {
  clearStoredSession,
  getCurrentUser,
  getStoredAuthToken,
  loginUser,
  storeAuthSession,
} from "@/services/users";
import type { LoginFormState } from "@/types/ui/users";

const initialFormState: LoginFormState = {
  username: "",
  password: "",
};

const getSafeRedirectPath = (fallbackPath = "/"): string => {
  const redirectTo = new URLSearchParams(window.location.search).get("redirect");

  if (!redirectTo?.startsWith("/") || redirectTo.startsWith("//")) {
    return fallbackPath;
  }

  return redirectTo;
};

export default function LoginPage() {
  const [form, setForm] = useState<LoginFormState>(initialFormState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isCoolingDown, remainingSeconds, startCooldown } =
    useSubmitCooldown(5);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const redirectIfSessionIsValid = async () => {
      if (!getStoredAuthToken()) {
        return;
      }

      try {
        await getCurrentUser();

        if (isMounted) {
          router.replace(getSafeRedirectPath("/account"));
        }
      } catch {
        clearStoredSession();
      }
    };

    void redirectIfSessionIsValid();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isCoolingDown) return;

    setError("");

    if (!form.username.trim() || !form.password) {
      setError("Usuario y contrasena requeridos");
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await loginUser({
        username: form.username.trim(),
        password: form.password,
      });

      storeAuthSession(session);
      toast.success("Sesion iniciada");

      router.push(getSafeRedirectPath());
    } catch (submissionError) {
      reportClientError("[Login]", submissionError);
      const message = "No se pudo iniciar sesion. Intenta nuevamente.";
      setError(message);
      toast.error(message, {
        description:
          "Verifica tus datos o vuelve a intentarlo en unos minutos.",
      });
      startCooldown();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <div className="relative w-full rounded-2xl bg-white p-5 shadow-md sm:p-8">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute right-3 top-3 text-2xl font-bold text-gray-400 focus:outline-none hover:text-gray-700 sm:right-4 sm:top-4"
            onClick={() => router.push("/")}
          >
            x
          </button>
          <div className="mb-6 pr-8">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Iniciar sesion
            </h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Accede a tu cuenta para guardar favoritos y sincronizar tu carrito.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium sm:text-base">
                Usuario
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm sm:text-base"
                value={form.username}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    username: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium sm:text-base">
                Contrasena
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm sm:text-base"
                value={form.password}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    password: e.target.value,
                  }))
                }
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-green-600"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Mostrar contrasena
            </label>
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex flex-col items-start mt-2 space-y-1">
              <button
                className="text-brand-600 text-sm hover:underline"
                type="button"
                onClick={() => router.push("/forgot-password")}
              >
                Olvide mi contrasena
              </button>
              <button
                className="text-brand-600 text-sm hover:underline"
                type="button"
                onClick={() => router.push("/forgot-username")}
              >
                Olvide mi usuario
              </button>
              <button
                className="text-brand-600 text-sm hover:underline"
                type="button"
                onClick={() => router.push("/register")}
              >
                ¿No estás registrado? Pincha aquí
              </button>
            </div>
            <div className="mt-6">
              <button
                type="submit"
                className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-white disabled:opacity-60"
                disabled={isSubmitting || isCoolingDown}
              >
                {isSubmitting
                  ? "Entrando..."
                  : isCoolingDown
                    ? `Espera ${remainingSeconds}s`
                    : "Iniciar sesion"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
