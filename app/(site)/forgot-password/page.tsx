"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSubmitCooldown } from "@/lib/useSubmitCooldown";
import { reportClientError } from "@/lib/errorUtils";
import { forgotPassword } from "@/services/users";
import type { ForgotPasswordFormState } from "@/types/ui/users";

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const initialFormState: ForgotPasswordFormState = {
  email: "",
};
const safeRecoveryMessage =
  "Si la cuenta existe, enviaremos instrucciones al correo indicado.";

export default function Page() {
  const [form, setForm] = useState<ForgotPasswordFormState>(initialFormState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isCoolingDown, remainingSeconds, startCooldown } =
    useSubmitCooldown(20);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isCoolingDown) return;

    setError("");
    setSuccessMessage("");

    if (!validateEmail(form.email)) {
      setError("El email no es valido");
      return;
    }

    setIsSubmitting(true);

    try {
      await forgotPassword({
        email: form.email.trim().toLowerCase(),
      });

      setSuccessMessage(safeRecoveryMessage);
      toast.success(safeRecoveryMessage);
      setForm(initialFormState);
    } catch (submissionError) {
      reportClientError("[Forgot Password]", submissionError);
      setSuccessMessage(safeRecoveryMessage);
      toast.success(safeRecoveryMessage);
    } finally {
      startCooldown();
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
          Recuperar contrasena
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600 sm:text-base">
          Te enviaremos instrucciones para crear una nueva contrasena.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium sm:text-base">
              Correo electronico
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm sm:text-base"
              value={form.email}
              onChange={(e) =>
                setForm((current) => ({ ...current, email: e.target.value }))
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
                ? "Enviando..."
                : isCoolingDown
                  ? `Espera ${remainingSeconds}s`
                  : "Enviar"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
