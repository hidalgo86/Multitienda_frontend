"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useSubmitCooldown } from "@/lib/useSubmitCooldown";
import { reportClientError } from "@/lib/errorUtils";
import { resetPassword } from "@/services/users";
import type { ResetPasswordFormState } from "@/types/ui/users";

const initialFormState: ResetPasswordFormState = {
  username: "",
  token: "",
  newPassword: "",
  confirmPassword: "",
};

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
const safeResetError =
  "No se pudo restablecer la contrasena. Solicita un nuevo enlace e intenta otra vez.";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<ResetPasswordFormState>({
    ...initialFormState,
    username: searchParams.get("username")?.trim() || "",
    token: searchParams.get("token")?.trim() || "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isCoolingDown, remainingSeconds, startCooldown } =
    useSubmitCooldown(10);
  const hasResetLinkData = Boolean(form.username.trim() && form.token.trim());

  useEffect(() => {
    if (searchParams.get("token") || searchParams.get("username")) {
      router.replace("/reset-password", { scroll: false });
    }
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isCoolingDown) return;

    setError("");
    setSuccessMessage("");

    if (!form.username.trim() || !form.token.trim()) {
      setError("Debes indicar username y token");
      return;
    }

    if (!strongPasswordRegex.test(form.newPassword)) {
      setError(
        "La nueva contrasena debe tener al menos 6 caracteres, una minuscula, una mayuscula, un numero y un caracter especial (@$!%*?&)",
      );
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword({
        username: form.username.trim(),
        token: form.token.trim(),
        newPassword: form.newPassword,
      });

      setSuccessMessage(response.message);
      toast.success(response.message);
      setForm(initialFormState);
      setTimeout(() => router.push("/login"), 1200);
    } catch (submissionError) {
      reportClientError("[Reset Password]", submissionError);
      setError(safeResetError);
      toast.error(safeResetError);
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
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border-none bg-transparent text-gray-400 hover:text-gray-600 sm:right-4 sm:top-4"
            style={{ borderRadius: 0, background: "none" }}
            onClick={() => router.push("/")}
          >
            <span className="text-2xl font-bold">x</span>
          </button>
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Restablecer contrasena
          </h1>
          <p className="mb-6 text-center text-sm text-gray-600 sm:text-base">
            {hasResetLinkData
              ? "Crea una nueva contrasena para actualizar tu acceso."
              : "Completa los datos del enlace recibido para actualizar tu acceso."}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!hasResetLinkData && (
              <>
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
                    Token
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm sm:text-base"
                    value={form.token}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        token: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium sm:text-base">
                Nueva contrasena
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm sm:text-base"
                value={form.newPassword}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    newPassword: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium sm:text-base">
                Confirmar nueva contrasena
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm sm:text-base"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    confirmPassword: e.target.value,
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
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {successMessage}
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="w-full rounded-lg bg-gray-300 px-6 py-2.5 text-gray-700 hover:bg-gray-400 sm:w-1/2"
                onClick={() => router.push("/login")}
                disabled={isSubmitting || isCoolingDown}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full rounded-lg bg-green-600 px-6 py-2.5 text-white hover:bg-green-700 disabled:opacity-60 sm:w-1/2"
                disabled={isSubmitting || isCoolingDown}
              >
                {isSubmitting
                  ? "Guardando..."
                  : isCoolingDown
                    ? `Espera ${remainingSeconds}s`
                    : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
