"use client";

import { useState, type ReactNode } from "react";
import { EmptyState } from "@/features/admin/components/empty-state";

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  pageSize,
}: {
  columns: Array<{
    key: keyof T | string;
    label: string;
    render?: (row: T) => ReactNode;
  }>;
  rows: T[];
  rowKey: (row: T) => string;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);

  if (!rows.length)
    return (
      <EmptyState
        title="Sin datos"
        description="No hay registros para mostrar."
      />
    );

  const totalPages = pageSize ? Math.ceil(rows.length / pageSize) : 1;
  const visibleRows = pageSize
    ? rows.slice(page * pageSize, (page + 1) * pageSize)
    : rows;

  return (
    <div className="space-y-2">
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
            {visibleRows.map((row) => (
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
      {pageSize && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-stone-500">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg px-3 py-1 hover:bg-stone-100 disabled:opacity-30"
          >
            ← Anterior
          </button>
          <span>
            {page + 1} / {totalPages} &nbsp;·&nbsp; {rows.length} registros
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg px-3 py-1 hover:bg-stone-100 disabled:opacity-30"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
