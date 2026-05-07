import type { ReactNode } from "react";
import { EmptyState } from "@/features/admin/components/empty-state";

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
}: {
  columns: Array<{
    key: keyof T | string;
    label: string;
    render?: (row: T) => ReactNode;
  }>;
  rows: T[];
  rowKey: (row: T) => string;
}) {
  if (!rows.length)
    return (
      <EmptyState
        title="Sin datos"
        description="No hay registros para mostrar."
      />
    );
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--admin-border,#ece7ea)] bg-[var(--admin-surface,#fff)]">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--admin-soft,#fafafa)] text-left text-xs uppercase tracking-wide text-stone-500">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="px-3 py-2 font-semibold">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-t border-[var(--admin-border,#ece7ea)]"
            >
              {columns.map((c) => (
                <td key={String(c.key)} className="px-3 py-2">
                  {c.render
                    ? c.render(row)
                    : String(row[c.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
