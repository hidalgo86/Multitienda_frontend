"use client";

import { MdWarningAmber } from "react-icons/md";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "warning" | "success";
  isBusy?: boolean;
  busyLabel?: string;
  details?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const toneClasses = {
  danger: {
    icon: "bg-red-100 text-red-700",
    button: "bg-red-600 text-white hover:bg-red-700",
    border: "border-red-200",
  },
  warning: {
    icon: "bg-amber-100 text-amber-700",
    button: "bg-amber-600 text-white hover:bg-amber-700",
    border: "border-amber-200",
  },
  success: {
    icon: "bg-emerald-100 text-emerald-700",
    button: "bg-emerald-600 text-white hover:bg-emerald-700",
    border: "border-emerald-200",
  },
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Volver",
  tone = "warning",
  isBusy = false,
  busyLabel = "Procesando...",
  details,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  const classes = toneClasses[tone];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
    >
      <div
        className={`w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl ${classes.border}`}
      >
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 ${classes.icon}`}>
            <MdWarningAmber size={24} />
          </div>
          <div>
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-slate-900"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
            {details ? (
              <p className="mt-3 break-words text-sm font-medium text-slate-900">
                {details}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${classes.button}`}
          >
            {isBusy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
