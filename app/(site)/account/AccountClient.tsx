"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "sonner";
import { MdDeleteForever, MdLogout, MdReceiptLong } from "react-icons/md";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useSubmitCooldown } from "@/lib/useSubmitCooldown";
import { reportClientError } from "@/lib/errorUtils";
import {
  changePassword,
  clearStoredSession,
  confirmAccountDeletion,
  getCurrentUser,
  getStoredAuthToken,
  getStoredUser,
  requestAccountDeletion,
  resendVerification,
  updateProfile,
  updateStoredUser,
} from "@/services/users";
import { listMyOrders } from "@/services/orders";
import { useCommerceSettings } from "@/lib/useCommerceSettings";
import type { User } from "@/types/domain/users";
import type {
  AccountProfileFormState,
  ChangePasswordFormState,
} from "@/types/ui/users";

const isAdminRole = (role?: string | null): boolean =>
  role?.trim().toLowerCase() === "administrador";

const isAuthSessionError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return (
    message.includes("unauthorized") ||
    message.includes("unauthoriz") ||
    message.includes("token") ||
    message.includes("jwt") ||
    message.includes("sesion") ||
    message.includes("session")
  );
};

const initialProfileForm: AccountProfileFormState = {
  name: "",
  phone: "",
  address: "",
};

const initialPasswordForm: ChangePasswordFormState = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function AccountClient() {
  const router = useRouter();
  const storedUser = getStoredUser();
  const isAdminUser = isAdminRole(storedUser?.role);
  const { paymentsEnabled } = useCommerceSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [profileForm, setProfileForm] =
    useState<AccountProfileFormState>(initialProfileForm);
  const [passwordForm, setPasswordForm] =
    useState<ChangePasswordFormState>(initialPasswordForm);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [deletionCode, setDeletionCode] = useState("");
  const [deletionError, setDeletionError] = useState("");
  const [deletionMessage, setDeletionMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRequestDeletionConfirmation, setShowRequestDeletionConfirmation] =
    useState(false);
  const [showDeleteAccountConfirmation, setShowDeleteAccountConfirmation] =
    useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const {
    isCoolingDown: isResendCoolingDown,
    remainingSeconds: resendRemainingSeconds,
    startCooldown: startResendCooldown,
  } = useSubmitCooldown(60);

  useEffect(() => {
    const token = getStoredAuthToken();

    if (!token) {
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    const loadUserAndOrders = async () => {
      try {
        const user = await getCurrentUser();
        const adminUser = isAdminRole(user.role);

        const orderList =
          adminUser || !paymentsEnabled ? [] : await listMyOrders();
        const safeOrderList = Array.isArray(orderList) ? orderList : [];

        setUserInfo(user);
        setOrdersCount(safeOrderList.length);
        setPendingOrdersCount(
          safeOrderList.filter((order) => order.status === "pending").length,
        );
        setProfileForm({
          name: user.name ?? "",
          phone: user.phone ?? "",
          address: user.address ?? "",
        });
      } catch (loadError) {
        clearStoredSession();
        if (!isAuthSessionError(loadError)) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar tu perfil";
          toast.error(message);
        }
        router.push("/login?redirect=%2Faccount");
      } finally {
        setIsLoading(false);
        setOrdersLoading(false);
      }
    };

    void loadUserAndOrders();
  }, [paymentsEnabled, router]);

  const refreshOrders = async () => {
    if (!paymentsEnabled) return;

    if (!getStoredAuthToken()) return;

    try {
      const orderList = await listMyOrders();
      const safeOrderList = Array.isArray(orderList) ? orderList : [];

      setOrdersCount(safeOrderList.length);
      setPendingOrdersCount(
        safeOrderList.filter((order) => order.status === "pending").length,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron actualizar tus pedidos";
      toast.error(message);
    }
  };

  const handleResendVerification = async () => {
    if (isResendingVerification || isResendCoolingDown) return;

    const resolvedUserId = userInfo?.id?.trim() || storedUser?.id?.trim() || "";
    const token = getStoredAuthToken();

    if (!resolvedUserId) {
      const message =
        "No pudimos identificar tu cuenta para reenviar el codigo. Cierra sesion e inicia nuevamente.";
      setVerificationMessage(message);
      toast.error(message);
      return;
    }

    setVerificationMessage("");
    setIsResendingVerification(true);

    try {
      const response = await resendVerification(
        { userId: resolvedUserId },
        { token },
      );
      setVerificationMessage(response.message);
      toast.success(response.message);
    } catch (resendError) {
      reportClientError("[Resend Verification]", resendError);
      const message =
        "No se pudo reenviar el codigo de verificacion. Intenta nuevamente mas tarde.";
      setVerificationMessage(message);
      toast.error(message);
    } finally {
      startResendCooldown();
      setIsResendingVerification(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setIsSavingProfile(true);

    try {
      const updatedUser = await updateProfile({
        name: profileForm.name.trim() || undefined,
        phone: profileForm.phone.trim() || undefined,
        address: profileForm.address.trim() || undefined,
      });

      setUserInfo(updatedUser);
      setProfileForm({
        name: updatedUser.name ?? "",
        phone: updatedUser.phone ?? "",
        address: updatedUser.address ?? "",
      });
      updateStoredUser(updatedUser);
      toast.success("Perfil actualizado");
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "No se pudo actualizar el perfil";
      setProfileError(message);
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("La nueva contrasena debe tener al menos 6 caracteres");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Las contrasenas no coinciden");
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm(initialPasswordForm);
      toast.success(response.message || "Contrasena actualizada");
    } catch (changeError) {
      const message =
        changeError instanceof Error
          ? changeError.message
          : "No se pudo cambiar la contrasena";
      setPasswordError(message);
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const requestDeletionCode = async () => {
    setDeletionError("");
    setDeletionMessage("");
    setIsRequestingDeletion(true);

    try {
      const response = await requestAccountDeletion();
      setDeletionMessage(response.message);
      toast.success(response.message);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo enviar el codigo de eliminacion";
      setDeletionError(message);
      toast.error(message);
    } finally {
      setIsRequestingDeletion(false);
      setShowRequestDeletionConfirmation(false);
    }
  };

  const handleRequestDeletionCode = () => {
    setShowRequestDeletionConfirmation(true);
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeletionError("");

    const code = deletionCode.trim();
    if (code.length !== 6) {
      setDeletionError("Ingresa el codigo de 6 digitos enviado a tu correo");
      return;
    }

    setShowDeleteAccountConfirmation(true);
  };

  const deleteAccount = async () => {
    const code = deletionCode.trim();
    setIsDeletingAccount(true);

    try {
      const response = await confirmAccountDeletion(code);
      toast.success(response.message || "Cuenta eliminada");
      clearStoredSession();
      router.replace("/");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar la cuenta";
      setDeletionError(message);
      toast.error(message);
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountConfirmation(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirmation(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ConfirmDialog
        open={showRequestDeletionConfirmation}
        title="Solicitar eliminacion"
        description="Enviaremos un codigo a tu correo para confirmar la eliminacion definitiva de tu cuenta."
        confirmLabel="Enviar codigo"
        busyLabel="Enviando..."
        tone="danger"
        isBusy={isRequestingDeletion}
        onCancel={() => setShowRequestDeletionConfirmation(false)}
        onConfirm={() => void requestDeletionCode()}
      />
      <ConfirmDialog
        open={showDeleteAccountConfirmation}
        title="Eliminar cuenta definitivamente"
        description="Esta accion eliminara tu cuenta y cerrara tu sesion. No podras recuperarla."
        details={userInfo.username}
        confirmLabel="Eliminar cuenta"
        busyLabel="Eliminando..."
        tone="danger"
        isBusy={isDeletingAccount}
        onCancel={() => setShowDeleteAccountConfirmation(false)}
        onConfirm={() => void deleteAccount()}
      />
      <ConfirmDialog
        open={showLogoutConfirmation}
        title="Cerrar sesion"
        description="Saldras de tu cuenta en este dispositivo."
        confirmLabel="Cerrar sesion"
        tone="warning"
        onCancel={() => setShowLogoutConfirmation(false)}
        onConfirm={() => {
          clearStoredSession();
          setShowLogoutConfirmation(false);
          router.push("/");
        }}
      />

      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Cuenta</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gestiona tu informacion personal y tu acceso.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-24 lg:px-8 lg:pb-8">
        {!userInfo.isEmailVerified && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-amber-900">
                  Correo pendiente de verificacion
                </h2>
                <p className="mt-1 text-sm text-amber-800">
                  Tu cuenta aun no esta verificada. Puedes verificarla ahora o
                  reenviar un nuevo codigo a tu correo.
                </p>
                {verificationMessage && (
                  <p className="mt-2 text-sm text-amber-900">
                    {verificationMessage}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => router.push(`/verify?userId=${userInfo.id}`)}
                  className="inline-flex w-full items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 sm:w-auto"
                >
                  Verificar ahora
                </button>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="inline-flex w-full items-center justify-center rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-60 sm:w-auto"
                  disabled={isResendingVerification || isResendCoolingDown}
                >
                  {isResendingVerification
                    ? "Reenviando..."
                    : isResendCoolingDown
                      ? `Espera ${resendRemainingSeconds}s`
                    : "Reenviar codigo"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-6 lg:col-span-1 lg:space-y-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Resumen</h3>
              </div>
              <div className="px-6 py-4 space-y-3 text-sm text-gray-700">
                <div>
                  <span className="font-medium text-gray-900">Usuario:</span>{" "}
                  {userInfo.username}
                </div>
                <div>
                  <span className="font-medium text-gray-900">Email:</span>{" "}
                  {userInfo.email}
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 sm:w-auto"
                  >
                    <MdLogout size={18} />
                    Cerrar sesion
                  </button>
                </div>
              </div>
            </div>

            {!isAdminUser && paymentsEnabled && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                  <MdReceiptLong className="text-brand-700" size={20} />
                  <h3 className="text-lg font-medium text-gray-900">
                    Mis pedidos
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-600">
                    {ordersLoading
                      ? "Cargando pedidos..."
                      : ordersCount === 0
                        ? "Aun no tienes pedidos registrados."
                        : `${ordersCount} pedido${ordersCount === 1 ? "" : "s"} registrado${ordersCount === 1 ? "" : "s"}.`}
                  </p>
                  {!ordersLoading && pendingOrdersCount > 0 && (
                    <p className="mt-2 text-sm text-amber-700">
                      Tienes {pendingOrdersCount} pedido
                      {pendingOrdersCount === 1 ? "" : "s"} pendiente
                      {pendingOrdersCount === 1 ? "" : "s"}.
                    </p>
                  )}
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => void refreshOrders()}
                      className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
                    >
                      Actualizar pedidos
                    </button>
                    <Link
                      href="/orders"
                      className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black sm:w-auto"
                    >
                      Ver mis pedidos
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 lg:col-span-2 lg:space-y-8">
            {!isAdminUser && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Datos de envio
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Usa estos datos para preparar y entregar tus compras.
                  </p>
                </div>
                <form
                  onSubmit={handleProfileSubmit}
                  className="px-6 py-4 space-y-6"
                >
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre de quien recibe
                      </label>
                      <input
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm((current) => ({
                            ...current,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Telefono de contacto
                      </label>
                      <input
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm((current) => ({
                            ...current,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="Tu telefono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Direccion de entrega
                    </label>
                    <textarea
                      className="mt-1 min-h-24 w-full rounded border border-gray-300 px-3 py-2"
                      value={profileForm.address}
                      onChange={(e) =>
                        setProfileForm((current) => ({
                          ...current,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Calle, numero, colonia, referencia..."
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Esta direccion se usara para preparar el envio de tus
                      pedidos.
                    </p>
                  </div>

                  {profileError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {profileError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? "Guardando..." : "Guardar perfil"}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Cambiar contrasena
                </h3>
              </div>
              <form
                onSubmit={handlePasswordSubmit}
                className="px-6 py-4 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contrasena actual
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      className="w-full rounded border border-gray-300 px-3 py-2 pr-12"
                      value={passwordForm.oldPassword}
                      onChange={(e) =>
                        setPasswordForm((current) => ({
                          ...current,
                          oldPassword: e.target.value,
                        }))
                      }
                      required
                    />
                    <button
                      type="button"
                      aria-label={
                        showOldPassword
                          ? "Ocultar contrasena actual"
                          : "Mostrar contrasena actual"
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowOldPassword((current) => !current)}
                    >
                      {showOldPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nueva contrasena
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="w-full rounded border border-gray-300 px-3 py-2 pr-12"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((current) => ({
                          ...current,
                          newPassword: e.target.value,
                        }))
                      }
                      required
                    />
                    <button
                      type="button"
                      aria-label={
                        showNewPassword
                          ? "Ocultar nueva contrasena"
                          : "Mostrar nueva contrasena"
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowNewPassword((current) => !current)}
                    >
                      {showNewPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirmar nueva contrasena
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full rounded border border-gray-300 px-3 py-2 pr-12"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((current) => ({
                          ...current,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                    />
                    <button
                      type="button"
                      aria-label={
                        showConfirmPassword
                          ? "Ocultar confirmacion de contrasena"
                          : "Mostrar confirmacion de contrasena"
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {passwordError}
                  </div>
                )}

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-60 sm:w-auto"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword
                    ? "Actualizando..."
                    : "Actualizar contrasena"}
                </button>
              </form>
            </div>

            <div className="bg-white shadow rounded-lg border border-red-100">
              <div className="px-6 py-4 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <MdDeleteForever className="text-red-600" size={22} />
                  <h3 className="text-lg font-medium text-gray-900">
                    Eliminar cuenta
                  </h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Esta accion es definitiva. Se eliminara tu cuenta de usuario,
                  tus datos de perfil, carrito y favoritos. Es posible que se
                  conserven registros de pedidos y auditoria cuando sean
                  necesarios para soporte, seguridad u obligaciones operativas.
                </p>
              </div>
              <div className="px-6 py-4 space-y-4">
                <button
                  type="button"
                  onClick={handleRequestDeletionCode}
                  disabled={isRequestingDeletion || isDeletingAccount}
                  className="inline-flex w-full items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 sm:w-auto"
                >
                  {isRequestingDeletion
                    ? "Enviando codigo..."
                    : "Enviar codigo de eliminacion"}
                </button>

                {(deletionMessage || deletionError) && (
                  <div
                    className={`rounded-md border px-3 py-2 text-sm ${
                      deletionError
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {deletionError || deletionMessage}
                  </div>
                )}

                <form
                  onSubmit={handleDeleteAccountSubmit}
                  className="flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                  <label className="block flex-1 text-sm font-medium text-gray-700">
                    Codigo recibido por correo
                    <input
                      value={deletionCode}
                      onChange={(event) =>
                        setDeletionCode(event.target.value.replace(/\D/g, ""))
                      }
                      inputMode="numeric"
                      maxLength={6}
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                      placeholder="123456"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isDeletingAccount || deletionCode.trim().length !== 6}
                    className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60 sm:w-auto"
                  >
                    {isDeletingAccount
                      ? "Eliminando..."
                      : "Eliminar definitivamente"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
