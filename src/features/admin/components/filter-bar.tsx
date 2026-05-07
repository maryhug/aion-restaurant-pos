import type { ReactNode } from "react";

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--admin-border,#ece7ea)] bg-[var(--admin-surface,#fff)] p-3">
      {children}
    </div>
  );
}
