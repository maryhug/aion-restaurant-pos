"use client";

export function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-[var(--admin-primary,#581c22)] px-3 py-2 text-sm font-semibold text-white"
    >
      Exportar Excel
    </button>
  );
}
