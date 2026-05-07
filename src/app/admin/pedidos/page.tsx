"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/features/admin/components/data-table";
import { ExportButton } from "@/features/admin/components/export-button";
import { FilterBar } from "@/features/admin/components/filter-bar";
import { Pagination } from "@/features/admin/components/pagination";
import { ordersMock } from "@/features/admin/mocks";
import { exportRowsAsCSV, formatCOP, paginate } from "@/features/admin/helpers";

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      ordersMock.filter((o) =>
        `${o.id}${o.customer}${o.waiter}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );
  const paged = paginate(filtered, page, 10);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--admin-border,#f1cfd4)] bg-white p-3">
          Día con más ventas: Sábado
        </div>
        <div className="rounded-2xl border border-[var(--admin-border,#f1cfd4)] bg-white p-3">
          Mes con más ventas: Mayo
        </div>
        <div className="rounded-2xl border border-[var(--admin-border,#f1cfd4)] bg-white p-3">
          Plato más vendido: Latte Avellana
        </div>
        <div className="rounded-2xl border border-[var(--admin-border,#f1cfd4)] bg-white p-3">
          Hora pico: 8:00 PM
        </div>
      </div>
      <FilterBar>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por ID, cliente o mesero"
          className="min-w-64 rounded-xl border border-[var(--admin-border,#f1cfd4)] px-3 py-2 text-sm"
        />
        <select className="rounded-xl border border-[var(--admin-border,#f1cfd4)] px-3 py-2 text-sm">
          <option>Estado</option>
        </select>
        <select className="rounded-xl border border-[var(--admin-border,#f1cfd4)] px-3 py-2 text-sm">
          <option>Método de pago</option>
        </select>
        <select className="rounded-xl border border-[var(--admin-border,#f1cfd4)] px-3 py-2 text-sm">
          <option>Tipo de pedido</option>
        </select>
        <input
          type="date"
          className="rounded-xl border border-[var(--admin-border,#f1cfd4)] px-3 py-2 text-sm"
        />
        <ExportButton
          onClick={() =>
            exportRowsAsCSV(
              "pedidos.csv",
              filtered.map((o) => ({
                id: o.id,
                fecha: o.date,
                cliente: o.customer,
                estado: o.status,
                total: o.total,
              })),
            )
          }
        />
      </FilterBar>
      <DataTable
        rows={paged}
        rowKey={(r) => String(r.id)}
        columns={[
          { key: "id", label: "ID pedido" },
          {
            key: "date",
            label: "Fecha/Hora",
            render: (r) => new Date(String(r.date)).toLocaleString("es-CO"),
          },
          { key: "tableOrType", label: "Mesa/Tipo" },
          { key: "customer", label: "Cliente" },
          { key: "waiter", label: "Mesero" },
          { key: "status", label: "Estado" },
          { key: "paymentMethod", label: "Método pago" },
          {
            key: "total",
            label: "Total",
            render: (r) => formatCOP(Number(r.total)),
          },
          {
            key: "acciones",
            label: "Acciones",
            render: () => (
              <div className="flex gap-1">
                <button className="rounded border px-2 py-1">Ver</button>
                <button className="rounded border px-2 py-1">Editar</button>
                <button className="rounded border px-2 py-1 text-red-600">
                  Eliminar
                </button>
              </div>
            ),
          },
        ]}
      />
      <Pagination
        page={page}
        total={filtered.length}
        pageSize={10}
        onPageChange={setPage}
      />
    </div>
  );
}
