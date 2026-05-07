import type { DatePreset, TenantBranding } from "@/features/admin/types";

export function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getDateRangeLabel(preset: DatePreset) {
  const map: Record<DatePreset, string> = {
    today: "Hoy",
    week: "Esta semana",
    month: "Este mes",
    year: "Este año",
    custom: "Personalizado",
  };
  return map[preset];
}

export function paginate<T>(items: T[], page: number, pageSize = 10) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function exportRowsAsCSV(
  filename: string,
  rows: Record<string, unknown>[],
) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => `"${String(r[h] ?? "").replaceAll('"', '""')}"`)
        .join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function applyTenantTheme(branding: TenantBranding) {
  const root = document.documentElement;
  root.style.setProperty("--admin-primary", branding.primary);
  root.style.setProperty("--admin-secondary", branding.secondary);
  root.style.setProperty("--admin-accent", branding.accent);
  root.style.setProperty("--admin-bg", branding.background);
  root.style.setProperty("--admin-surface", "#ffffff");
  root.style.setProperty("--admin-soft", "#fafafa");
  root.style.setProperty("--admin-border", "#ece7ea");
  root.style.setProperty("--admin-text", "#24131a");
  root.style.setProperty("--admin-sidebar-bg", "#6b0024");
  root.style.setProperty("--admin-sidebar-bg-2", "#5c001f");
}
