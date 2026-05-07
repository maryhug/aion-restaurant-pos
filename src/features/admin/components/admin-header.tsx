"use client";

import { useAdminTenant } from "@/features/admin/tenant-context";
import type { DatePreset } from "@/features/admin/types";
import { getDateRangeLabel } from "@/features/admin/helpers";

export function AdminHeader({
  title,
  datePreset,
  onDatePresetChange,
  onMenuClick,
  onExport,
}: {
  title: string;
  datePreset: DatePreset;
  onDatePresetChange: (value: DatePreset) => void;
  onMenuClick: () => void;
  onExport?: () => void;
}) {
  const { tenant, branchId, setBranchId } = useAdminTenant();
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--admin-border,#ece7ea)] bg-white px-3 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-lg border border-[var(--admin-border,#ece7ea)] bg-white px-2 py-1 text-sm lg:hidden"
          onClick={onMenuClick}
        >
          Menu
        </button>
        <div className="mr-auto">
          <p className="text-xs font-semibold text-stone-500">
            {tenant.restaurantName}
          </p>
          <h1 className="text-lg font-black text-[var(--admin-primary,#581c22)]">
            {title}
          </h1>
        </div>
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="rounded-xl border border-[var(--admin-border,#ece7ea)] bg-white px-3 py-2 text-sm"
        >
          {tenant.branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={datePreset}
          onChange={(e) => onDatePresetChange(e.target.value as DatePreset)}
          className="rounded-xl border border-[var(--admin-border,#ece7ea)] bg-white px-3 py-2 text-sm"
        >
          {(["today", "week", "month", "year", "custom"] as DatePreset[]).map(
            (preset) => (
              <option key={preset} value={preset}>
                {getDateRangeLabel(preset)}
              </option>
            ),
          )}
        </select>
        {onExport ? (
          <button
            onClick={onExport}
            className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white"
          >
            Exportar
          </button>
        ) : null}
        <div className="grid size-9 place-items-center rounded-full bg-stone-100 text-xs font-bold text-[var(--admin-primary,#6b0024)] ring-1 ring-[var(--admin-border,#ece7ea)]">
          AD
        </div>
      </div>
    </header>
  );
}
