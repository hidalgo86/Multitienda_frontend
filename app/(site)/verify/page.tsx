"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useSubmitCooldown } from "@/lib/useSubmitCooldown";
import { reportClientError } from "@/lib/errorUtils";
import {
  getStoredAuthToken,
  getStoredUser,
  resendVerification,
  verifyEmail,
} from "@/services/users";
import type { VerifyEmailFormState } from "@/types/ui/users";

const initialFormState: VerifyEmailFormState = {
  userId: "",
  code: "",
};

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storedUserId = getStoredUser()?.id?.trim() || "";
  const initialUserId = storedUserId || searchParams.get("userId")?.trim() || "";
  const initialCode = searchParams.get("code")?.trim() || "";

  const [form, setForm] = useState<VerifyEmailFormState>({
    ...initialFormState,
    userId: initialUserId,
    code: initialCode,
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const {
    isCoolingDown: isResendCoolingDown,
    remainingSeconds: resendRemainingSeconds,
    startCooldown: startResendCooldown,
  } = useSubmitCooldown(60);

  const canResend = useMemo(() => form.userId.trim().length > 0, [form.userId]);

  useEffect(() => {
    if (searchParams.get("code") || searchParams.get("userId")) {
      router.replace("/verify", { scroll: false });
    }
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!form.userId.trim()) {
      setError("No pudimos identificar tu cuenta. Inicia sesion nuevamente.");
      return;
    }

    if (!form.code.trim()) {
      setError("Debes indicar el codigo de verificacion");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await verifyEmail({
        userId: form.userId.trim(),
        code: form.code.trim(),
      });

      setSuccessMessage(response.message);
      toast.success(response.message);
      window.setTimeout(() => {
        router.push("/account");
      }, 1200);
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "No se pudo verificar el correo";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (isResending || isResendCoolingDown) return;

    setError("");
    setSuccessMessage("");

    const userId = form.userId.trim();
    if (!userId) {
      setError("No pudimos identificar tu cuenta. Inicia sesion nuevamente.");
      return;
    }

    setIsResending(true);

    try {
      const response = await resendVerification(
        { userId },
        { token: getStoredAuthToken() },
      );
      setSuccessMessage(response.message);
      toast.success(response.message);
    } catch (resendError) {
      reportClientError("[Resend Verification]", resendError);
      const message =
        "No se pudo reenviar el codigo. Intenta nuevamente mas tarde.";
      setError(message);
      toast.error(message);
    } finally {
      startResendCooldown();
      setIsResending(false);
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
          Verificar correo
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600 sm:text-base">
          Confirma tu cuenta para desbloquear toda la experiencia de usuario.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600">
            Introduce el codigo que recibiste por correo. Tu cuenta se
            identificara automaticamente.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium sm:text-base">
              Codigo
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm sm:text-base"
              value={form.code}
              onChange={(e) =>
                setForm((current) => ({ ...current, code: e.target.value }))
              }
              required
            />
          </div>
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
          {!canResend && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              No encontramos tu sesion activa. Vuelve a iniciar sesion para
              verificar tu cuenta.
            </div>
          )}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="w-full rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-amber-900 hover:bg-amber-50 disabled:opacity-60 sm:w-auto"
              onClick={handleResendVerification}
              disabled={
                !canResend || isSubmitting || isResending || isResendCoolingDown
              }
            >
              {isResending
                ? "Reenviando..."
                : isResendCoolingDown
                  ? `Espera ${resendRemainingSeconds}s`
                  : "Reenviar codigo"}
            </button>
            <button
              type="button"
              className="w-full rounded-lg bg-gray-300 px-4 py-2.5 text-gray-700 hover:bg-gray-400 disabled:opacity-60 sm:w-auto"
              onClick={() => router.push("/account")}
              disabled={isSubmitting || isResending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-white hover:bg-green-700 disabled:opacity-60 sm:w-auto"
              disabled={isSubmitting || isResending}
            >
              {isSubmitting ? "Verificando..." : "Verificar"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPageContent />
    </Suspense>
  );
}
