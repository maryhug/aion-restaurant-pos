"use client";

export function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4">
        <h3 className="text-base font-bold">{title}</h3>
        <p className="mt-1 text-sm text-stone-600">{description}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
