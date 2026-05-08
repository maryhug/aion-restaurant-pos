"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/features/admin/components/data-table";
import { ExportButton } from "@/features/admin/components/export-button";
import { FilterBar } from "@/features/admin/components/filter-bar";
import { Pagination } from "@/features/admin/components/pagination";
import { exportRowsAsCSV, formatCOP, paginate } from "@/features/admin/helpers";

type Order = {
  id: string;
  fullId: string;
  date: string;
  tableOrType: string;
  customer: string;
  status: string;
  paymentMethod: string;
  total: number;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d: { orders: Order[] }) => setOrders(d.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statuses = useMemo(
    () => [...new Set(orders.map((o) => o.status))],
    [orders],
  );

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchQuery = `${o.id}${o.customer}${o.tableOrType}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchStatus = !statusFilter || o.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [orders, query, statusFilter]);

  const paged = paginate(filtered, page, 10);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-stone-400">
        Cargando pedidos…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <FilterBar>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por ID, cliente o mesa"
          className="min-w-56 rounded-xl border border-[var(--admin-border,#f1cfd4)] px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-[var(--admin-border,#f1cfd4)] px-3 py-2 text-sm"
        >
          <option value="">Estado</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <ExportButton
          onClick={() =>
            exportRowsAsCSV(
              "pedidos.csv",
              filtered.map((o) => ({
                id: o.id,
                fecha: new Date(o.date).toLocaleString("es-CO"),
                mesa: o.tableOrType,
                cliente: o.customer,
                estado: o.status,
                pago: o.paymentMethod,
                total: o.total,
              })),
            )
          }
        />
      </FilterBar>

      <DataTable
        rows={paged}
        rowKey={(r) => r.fullId}
        columns={[
          { key: "id", label: "ID pedido" },
          {
            key: "date",
            label: "Fecha/Hora",
            render: (r) => new Date(String(r.date)).toLocaleString("es-CO"),
          },
          { key: "tableOrType", label: "Mesa" },
          { key: "customer", label: "Cliente" },
          { key: "status", label: "Estado" },
          { key: "paymentMethod", label: "Método pago" },
          {
            key: "total",
            label: "Total",
            render: (r) => formatCOP(Number(r.total)),
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
