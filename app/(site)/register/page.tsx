"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSubmitCooldown } from "@/lib/useSubmitCooldown";
import { reportClientError } from "@/lib/errorUtils";
import { getStoredAuthToken, registerUser } from "@/services/users";
import type { RegisterFormState } from "@/types/ui/users";

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const initialFormState: RegisterFormState = {
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterFormState>(initialFormState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isCoolingDown, remainingSeconds, startCooldown } =
    useSubmitCooldown(10);
  const router = useRouter();

  useEffect(() => {
    if (getStoredAuthToken()) {
      router.replace("/account");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isCoolingDown) return;

    setError("");

    if (!validateEmail(form.email)) {
      setError("El email no es valido");
      return;
    }

    if (form.username.trim().length < 3) {
      setError("El usuario debe tener al menos 3 caracteres");
      return;
    }

    // Validación de contraseña fuerte igual que backend
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!strongPasswordRegex.test(form.password)) {
      setError(
        "La contraseña debe tener al menos 6 caracteres, una mayúscula, un número y un carácter especial (@$!%*?&)",
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registerUser({
        email: form.email.trim().toLowerCase(),
        username: form.username.trim(),
        password: form.password,
      });

      toast.success(response.message || "Registro exitoso");
      router.push("/login");
    } catch (submissionError) {
      reportClientError("[Register]", submissionError);
      const message =
        "No se pudo completar el registro. Revisa los datos o intenta mas tarde.";
      setError(message);
      toast.error(message);
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
            Registro de Usuario
          </h1>
          <p className="mb-6 text-center text-sm text-gray-600 sm:text-base">
            Crea tu cuenta para guardar favoritos y sincronizar tu carrito.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium sm:text-base">
                Email
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
            <div>
              <label className="mb-1 block text-sm font-medium sm:text-base">
                Confirmar contrasena
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
                    : "Registrarse"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
